import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";
import { GLTFLoader } from "./webgpu/engine/loaders/GLTFLoader.js";
import { Model as GLTFModel} from './webgpu/engine/core/core.js';

export class Model extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Model",
        gltfPath,
        texture,
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
            update: () => {
                const t = performance.now() / 1000;
                const transform = this.getComponentOfType(Transform);
                const rotation = transform.rotation;
            }
        });
        this.textureRenderer = new TextureRenderer();
        
        // model matrix
        this.modelBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // view projection matrix
        this.viewProjBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });


        this.normalBuffer = Engine.device.createBuffer({
            size: 64, // 4x4 matrix
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // bind group
        this.bindGroup = Engine.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.modelBuffer } },
                { binding: 1, resource: { buffer: this.viewProjBuffer } },
                { binding: 2, resource: texture.createView() },
                { binding: 3, resource: sampler },
                { binding: 4, resource: { buffer: this.normalBuffer } },
            ]
        });

        this.providesNormals = false;
    }

    async createMesh(path){
        const gltfLoader = new GLTFLoader();
        await gltfLoader.load(new URL(path, import.meta.url));

        const gtlfScene = gltfLoader.loadScene(gltfLoader.defaultScene);


        const modelEntity = gtlfScene.find(e => e.getComponentOfType(GLTFModel));
        const model = modelEntity.getComponentOfType(GLTFModel);

        let vertices = new Float32Array([

        ]);

        let indices = new Uint32Array([

        ]);

        let i = 0;
        let vertexCount = 0;
        model.primitives.forEach((primitive) => {
            const mesh = primitive.mesh;
            vertexCount = mesh.vertices.length;

            vertices = new Float32Array(vertexCount * 13);
            for (const v of mesh.vertices) {
                // position
                vertices[i++] = v.position[0];
                vertices[i++] = v.position[1];
                vertices[i++] = v.position[2];
                vertices[i++] = 1.0;

                // color
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;

                // texcoords
                vertices[i++] = v.texcoords[0];
                vertices[i++] = v.texcoords[1];

                // normal
                if(v.normal){
                    console.log("model provides normals")
                    vertices[i++] = v.normal[0];
                    vertices[i++] = v.normal[1];
                    vertices[i++] = v.normal[2];
                    this.providesNormals = true;
                }
                else{
                    vertices[i++] = 0.0;
                    vertices[i++] = 0.0;
                    vertices[i++] = 0.0;
                }
            }
            indices = new Uint32Array(mesh.indices);
        });

        if(!this.providesNormals){
            const normals = this.calculateNormals(vertices, indices);
            for (let i = 0; i < vertexCount; i++) {
                vertices[i * 13 + 10] = normals[i * 3 + 0];
                vertices[i * 13 + 11] = normals[i * 3 + 1];
                vertices[i  *13 + 12] = normals[i * 3 + 2];
            }
        }

        this.mesh = new Mesh(vertices, indices);
        //console.log(vertices);
        //console.log(indices);
    }

    calculateNormals(vertices, indices){
        const vertexCount = vertices.length / 13; // 13 floats per vertex
        const normals = new Float32Array(vertexCount * 3);

        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];

            // formula: n = normalize(cross(b-a, c-a))

            // get vertexes
            const v0 = [vertices[i0 * 13], vertices[i0 * 13 + 1], vertices[i0 * 13 + 2]];
            const v1 = [vertices[i1 * 13], vertices[i1 * 13 + 1], vertices[i1 * 13 + 2]];
            const v2 = [vertices[i2 * 13], vertices[i2 * 13 + 1], vertices[i2 * 13 + 2]];

            // triangle vectors
            const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

            // cross product
            const nx = e1[1] * e2[2] - e1[2] * e2[1];
            const ny = e1[2] * e2[0] - e1[0] * e2[2];
            const nz = e1[0] * e2[1] - e1[1] * e2[0];
            
            normals[i0 * 3] += nx;
            normals[i0 * 3 + 1] += ny;
            normals[i0 * 3 + 2] += nz;

            normals[i1 * 3] += nx;
            normals[i1 * 3 + 1] += ny;
            normals[i1 * 3 + 2] += nz;

            normals[i2 * 3] += nx;
            normals[i2 * 3 + 1] += ny;
            normals[i2 * 3 + 2] += nz;
        }

        // normalize
        for(let i = 0; i < vertexCount; i++){
            const x = normals[i * 3];
            const y = normals[i * 3 + 1];
            const z = normals[i * 3 + 2];

            let len = Math.hypot(x, y, z) || 1.0;
            if(len == 0 || len == null){
                len = 1.0;
            }

            normals[i * 3] = x / len;
            normals[i * 3 + 1] = y / len;
            normals[i * 3 + 2] = z / len;
        }

        return normals;
    }
}