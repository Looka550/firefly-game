import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine, getGlobalModelMatrix } from "./SceneUtils.js";
import { sampler } from "./main.js";
import { physics } from "./main.js";
import { quat, mat4, vec3 } from './glm.js';

export class BoxCollider extends GameObject{
    constructor({
        offset = [0, 0, 0],
        texture,
        name = "Box Collider",
        debug = false,
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        dynamic = false
    } = {}) {
        super({euler: euler, translation: translation, scale: scale, name: name});

        this.mesh = this.createMesh();
        this.dontRender = !debug;
        this.dynamic = dynamic;
        
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

        this.localMin = vec3.clone(this.mesh.localMin);
        this.localMax = vec3.clone(this.mesh.localMax);

        this.min = vec3.create();
        this.max = vec3.create();
    }

    onAttach(gameObject){
        gameObject.addChild(this);
        this.gameObject = gameObject;
        physics.addCollider(this);
    }

    collides(){
        physics.checkCollisions(this);
    }

    getBoundaries() {
        const modelMatrix = getGlobalModelMatrix(this.gameObject);

        const corners = [
            [this.localMin[0], this.localMin[1], this.localMin[2]],
            [this.localMax[0], this.localMin[1], this.localMin[2]],
            [this.localMin[0], this.localMax[1], this.localMin[2]],
            [this.localMax[0], this.localMax[1], this.localMin[2]],
            [this.localMin[0], this.localMin[1], this.localMax[2]],
            [this.localMax[0], this.localMin[1], this.localMax[2]],
            [this.localMin[0], this.localMax[1], this.localMax[2]],
            [this.localMax[0], this.localMax[1], this.localMax[2]],
        ];

        this.min = vec3.fromValues(Infinity, Infinity, Infinity);
        this.max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for(const c of corners){ // get min and max in world coords
            const world = vec3.transformMat4(vec3.create(), c, modelMatrix);

            this.min[0] = Math.min(this.min[0], world[0]);
            this.min[1] = Math.min(this.min[1], world[1]);
            this.min[2] = Math.min(this.min[2], world[2]);

            this.max[0] = Math.max(this.max[0], world[0]);
            this.max[1] = Math.max(this.max[1], world[1]);
            this.max[2] = Math.max(this.max[2], world[2]);
        }
    }

    AABBcollision(other){
        this.getBoundaries();
        other.getBoundaries();

        // no overlap on x
        if(this.max[0] < other.min[0] || this.min[0] > other.max[0]){
            return false;
        }

        // no overlap on y
        if(this.max[1] < other.min[1] || this.min[1] > other.max[1]){
            return false;
        }

        // no overlap on z
        if(this.max[2] < other.min[2] || this.min[2] > other.max[2]){
            return false;
        }

        // overlap on all 3
        return true;
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
