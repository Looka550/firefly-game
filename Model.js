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

        // view-projection matrix
        this.viewProjBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // light position
        this.lightBuffer = Engine.device.createBuffer({
            size: 16, // vec3 needs 16-byte alignment
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
                { binding: 4, resource: { buffer: this.lightBuffer } },
            ]
        });

        Engine.device.queue.writeBuffer(
            this.lightBuffer,
            0,
            new Float32Array([0, 5, 0]) // example light position
        );
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
        model.primitives.forEach((primitive) => {
            const mesh = primitive.mesh;
            let vertexCount = mesh.vertices.length;

            vertices = new Float32Array(vertexCount * 13);
            for (const v of mesh.vertices) {
                // position
                vertices[i++] = v.position[0];
                vertices[i++] = v.position[1];
                vertices[i++] = v.position[2];
                vertices[i++] = 1;

                // color
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;
                vertices[i++] = 1.0;

                // texcoords
                vertices[i++] = v.texcoords[0];
                vertices[i++] = v.texcoords[1];

                // normal
                vertices[i++] = v.normal[0];
                vertices[i++] = v.normal[1];
                vertices[i++] = v.normal[2];
            }
            indices = new Uint32Array(mesh.indices);
        });

        this.mesh = new Mesh(vertices, indices);
        console.log(vertices);
        //console.log(indices);
    }
}