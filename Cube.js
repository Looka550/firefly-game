import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";

export class Cube extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Cube",
        texture
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
        this.mesh = this.createMesh();

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
    }

    createMesh(){
        const vertices = new Float32Array([
            // position    color   uv
            // FRONT
            -1, -1,  1, 1,   0, 1, 0, 1,    0, 0,   1, 1, 1,
             1, -1,  1, 1,   1, 0, 1, 1,    1, 0,   1, 1, 1,
             1,  1,  1, 1,   0, 0, 0, 1,    1, 1,   1, 1, 1,
            -1,  1,  1, 1,   1, 1, 1, 1,    0, 1,   1, 1, 1,

            // BACK
             1, -1, -1, 1,   0, 1, 1, 1,    0, 0,   1, 1, 1,
            -1, -1, -1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
            -1,  1, -1, 1,   0, 0, 1, 1,    1, 1,   1, 1, 1,
             1,  1, -1, 1,   1, 1, 0, 1,    0, 1,   1, 1, 1,

            // LEFT
            -1, -1, -1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
            -1, -1,  1, 1,   0, 1, 0, 1,    1, 0,   1, 1, 1,
            -1,  1,  1, 1,   1, 1, 1, 1,    1, 1,   1, 1, 1,
            -1,  1, -1, 1,   0, 0, 1, 1,    0, 1,   1, 1, 1,

            // RIGHT
            1, -1,  1, 1,   1, 0, 1, 1,    0, 0,   1, 1, 1,
            1, -1, -1, 1,   0, 1, 1, 1,    1, 0,   1, 1, 1,
            1,  1, -1, 1,   1, 1, 0, 1,    1, 1,   1, 1, 1,
            1,  1,  1, 1,   0, 0, 0, 1,    0, 1,   1, 1, 1,

            // TOP
            -1,  1,  1, 1,   1, 1, 1, 1,    0, 0,   1, 1, 1,
             1,  1,  1, 1,   0, 0, 0, 1,    1, 0,   1, 1, 1,
             1,  1, -1, 1,   1, 1, 0, 1,    1, 1,   1, 1, 1,
            -1,  1, -1, 1,   0, 0, 1, 1,    0, 1,   1, 1, 1,

            // BOTTOM
            -1, -1, -1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
             1, -1, -1, 1,   0, 1, 1, 1,    1, 0,   1, 1, 1,
             1, -1,  1, 1,   1, 0, 1, 1,    1, 1,   1, 1, 1,
            -1, -1,  1, 1,   0, 1, 0, 1,    0, 1,   1, 1, 1,
        ]);

        const indices = new Uint32Array([
            0,  1,  2,   0,  2,  3,    // front
            4,  5,  6,   4,  6,  7,    // back
            8,  9, 10,   8, 10, 11,    // left
            12, 13, 14,  12, 14, 15,   // right
            16, 17, 18,  16, 18, 19,   // top
            20, 21, 22,  20, 22, 23,   // bottom
            // defectove
            24, 24,24
        ]);

        const mesh = new Mesh(vertices, indices);
        return mesh;
    }
}


/* // spinning
export class Cube extends GameObject {
    constructor({
        rotationSpeed = [0.6, 0.7],
        translation = [0,0,0] } = {}
    ){
        super({
            transformOptions: { translation },
            updateFunction: () => {
                const t = performance.now() / 1000;
                const transform = this.getComponentOfType(Transform);
                const rotation = transform.rotation;

                quat.identity(rotation);
                quat.rotateX(rotation, rotation, t * 0.5);
                quat.rotateY(rotation, rotation, t * 0.5);
            }
        });
    }
}
    */