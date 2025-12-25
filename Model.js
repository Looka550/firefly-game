import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";
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
        normalTexture = null
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
        this.gltfPath = gltfPath;

        this.providesNormals = false;

        this.mesh = null;
        this.loadMesh(texture, normalTexture, sampler, blankTextureView);
    }

    async loadMesh(texture, normalTexture, sampler, blankTextureView) {
        const structure = await this.createMesh(); // wait for GLTF

        this.mesh = new Mesh({
            structure,
            sampler,
            texture,
            normalTexture,
            blankTextureView
        });
    }

    async createMesh(){
        const gltfLoader = new GLTFLoader();
        await gltfLoader.load(new URL(this.gltfPath, import.meta.url));

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

        return {
            "vertices": vertices,
            "indices": indices
        };

        //console.log(this.mesh.vertices);
        //console.log(this.mesh.indices);
    }
}