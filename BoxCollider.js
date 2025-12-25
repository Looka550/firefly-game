import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine, getGlobalModelMatrix } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";
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
        scale = [1, 3, 1],
        dynamic = false,
        normalTexture = null,
        gravity = false
    } = {}) {
        super({euler: euler, translation: translation, scale: scale, name: name});
        this.scale = scale;
        this.gravity = gravity;

        this.dontRender = !debug;
        this.dynamic = dynamic;

        this.min = vec3.create();
        this.max = vec3.create();

        const structure = this.createMesh();
        this.mesh = new Mesh({
            structure: structure,
            sampler: sampler,
            texture: texture,
            normalTexture: normalTexture,
            blankTextureView: blankTextureView
        });
    }

    update(){
        if(this.gravity){
            this.velocity ??= [0, 0, 0]; // initialize if not present
            this.velocity[1] -= 0.981 * 0.016; // gravity per frame
            this.transform.translation[1] += this.velocity[1] * 0.016;
 
            // check collisions with planes
            const collisions = physics.checkCollisions(this);

            collisions.forEach(col => {
                if(col instanceof PlaneCollider){
                    // find the Y position of the plane at this X,Z
                    const modelMatrix = getGlobalModelMatrix(col);
                    const planeCenter = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];

                    // assuming rotation around X-axis only
                    const rotX = col.euler[0] * Math.PI / 180;
                    const localZ = this.transform.translation[2] - planeCenter[2];
                    const planeY = planeCenter[1] + Math.tan(rotX) * localZ;

                    // if below plane, snap up
                    if(this.transform.translation[1] < planeY){
                        this.transform.translation[1] = planeY;
                        this.velocity[1] = 0;
                    }
                }
            });
        }
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
        this.localMin = vec3.clone(this.mesh.localMin);
        this.localMax = vec3.clone(this.mesh.localMax);
        
        const parentMatrix = getGlobalModelMatrix(this.gameObject);

        const scaleMatrix = mat4.create();
        mat4.fromScaling(scaleMatrix, this.scale);

        // combine parent matrix with collider scale
        const modelMatrix = mat4.create();
        mat4.multiply(modelMatrix, parentMatrix, scaleMatrix);

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

        // make box smaller if its rotated (because rotated boxes have a larger hitbox)
        const rot = this.gameObject.transform.getEuler();
        if(rot != [0, 0, 0]){
            const size = vec3.sub(vec3.create(), this.max, this.min);
            const marginFactor = 0.04; // % of size
            const margin = vec3.scale(vec3.create(), size, marginFactor);

            this.min[0] += margin[0];
            this.min[1] += margin[1];
            this.min[2] += margin[2];

            this.max[0] -= margin[0];
            this.max[1] -= margin[1];
            this.max[2] -= margin[2];
        }
        //console.log("rotated: " + rot);
        //console.log("min: " + this.min);
        //console.log("max: " + this.max);
        //console.log("modelMatrix: " + modelMatrix);
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

        return {
            "vertices": vertices,
            "indices": indices
        };
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
