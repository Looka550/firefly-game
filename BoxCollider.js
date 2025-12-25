import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";

export class BoxCollider extends GameObject{
    constructor({
        offset = [0, 0, 0],
        texture,
        name = "Box Collider",
        debug = false,
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
    } = {}) {
        super({euler: euler, translation: translation, scale: scale, name: name});

        this.mesh = this.createMesh();
        this.dontRender = !debug;
        
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
            -1, -1,  1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
             1, -1,  1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
             1,  1,  1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
            -1,  1,  1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,

            // BACK
             1, -1, -1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
            -1, -1, -1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
            -1,  1, -1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
             1,  1, -1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,

            // LEFT
            -1, -1, -1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
            -1, -1,  1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
            -1,  1,  1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
            -1,  1, -1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,

            // RIGHT
             1, -1,  1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
             1, -1, -1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
             1,  1, -1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
             1,  1,  1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,

            // TOP
            -1,  1,  1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
             1,  1,  1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
             1,  1, -1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
            -1,  1, -1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,

            // BOTTOM
            -1, -1, -1, 1,   1, 0, 0, 1,    0, 0,   1, 1, 1,
             1, -1, -1, 1,   1, 0, 0, 1,    1, 0,   1, 1, 1,
             1, -1,  1, 1,   1, 0, 0, 1,    1, 1,   1, 1, 1,
            -1, -1,  1, 1,   1, 0, 0, 1,    0, 1,   1, 1, 1,
        ]);

        const indices = new Uint32Array([
            0,  1,  2,   0,  2,  3,    // front
            4,  5,  6,   4,  6,  7,    // back
            8,  9, 10,   8, 10, 11,    // left
            12, 13, 14,  12, 14, 15,   // right
            16, 17, 18,  16, 18, 19,   // top
            20, 21, 22,  20, 22, 23,   // bottom
        ]);

        const mesh = new Mesh(vertices, indices);
        return mesh;
    }

    onAttach(gameObject){
        gameObject.addChild(this);
    }
/*
    update() {
        this.updateAABB();
    }


    updateAABB() {
        const modelMatrix = getGlobalModelMatrix(this.gameObject);

        const center = vec3.create();
        mat4.getTranslation(center, modelMatrix);

        vec3.add(center, center, this.offset);

        const half = vec3.scale(vec3.create(), this.size, 0.5);

        vec3.sub(this.min, center, half);
        vec3.add(this.max, center, half);
    }
*/
}
