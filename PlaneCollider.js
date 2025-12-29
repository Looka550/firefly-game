import { GameObject } from "./GameObject.js";
import { Engine, getGlobalModelMatrix } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";
import { physics } from "./main.js";
import { vec3, mat4, quat } from './glm.js';
import { Mesh } from './Mesh.js';

export class PlaneCollider extends GameObject {
    constructor({
        offset = [0, 0, 0],
        texture,
        name = "Plane Collider",
        debug = true,
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [10, 1, 10],
        dynamic = false,
        axis = "y",
        normalTexture = null,
        tags = []
    } = {}) {
        super({ euler, translation, scale, name });
        this.tags = tags;
        this.dontRender = !debug;
        this.dynamic = dynamic;
        this.axis = axis;
        physics.addCollider(this);

        const structure = this.createMesh();
        this.mesh = new Mesh({
            structure: structure,
            sampler: sampler,
            texture: texture,
            normalTexture: normalTexture,
            blankTextureView: blankTextureView
        });


        this.localMin = vec3.clone(this.mesh.localMin);
        this.localMax = vec3.clone(this.mesh.localMax);

        this.min = vec3.create();
        this.max = vec3.create();
    }


    planeCollision(box){
        box.getBoundaries();

        const modelMatrix = getGlobalModelMatrix(this);

        const rotationMatrix = mat4.create();

        let planeRotation = null;
        if(this.transform.getEuler()[0] > 90){ // bug fix for 90...180 rotation slopes
            planeRotation = quat.create();
            quat.fromEuler(planeRotation, this.transform.getEuler()[0] - 180, this.transform.getEuler()[1], this.transform.getEuler()[2]);
        }
        else{
            planeRotation = this.transform.rotation;
        }

        mat4.fromRotationTranslation(rotationMatrix, planeRotation, [0,0,0]);

        const normal = vec3.transformMat4(vec3.create(), [0,1,0], rotationMatrix);
        vec3.normalize(normal, normal);
        

        const planePos = [
            modelMatrix[12],
            modelMatrix[13],
            modelMatrix[14]
        ];

        // height test
        const boxMinProj = vec3.dot(box.min, normal);
        const boxMaxProj = vec3.dot(box.max, normal);
        const planeProj = vec3.dot(planePos, normal);

        if(!(boxMinProj <= planeProj && boxMaxProj >= planeProj)){
            return false;
        }

        // plane local axes
        const right = vec3.transformMat4(vec3.create(), [1,0,0], rotationMatrix);
        const forward = vec3.transformMat4(vec3.create(), [0,0,1], rotationMatrix);

        vec3.normalize(right, right);
        vec3.normalize(forward, forward);

        // box center
        const boxCenter = vec3.scale(
            vec3.create(),
            vec3.add(vec3.create(), box.min, box.max),
            0.5
        );

        const toBox = vec3.subtract(vec3.create(), boxCenter, planePos);

        const distX = vec3.dot(toBox, right);
        const distZ = vec3.dot(toBox, forward);

        if(Math.abs(distX) > this.transform.scale[0]){
            return false;
        }
        if(Math.abs(distZ) > this.transform.scale[2]){
            return false;
        }

        return true;
    }


    createMesh(){
        const vertices = new Float32Array([
            // position     color    uv   normal
            -1, 0, -1, 1,   0, 1, 0, 1,   0, 0,    0, 1, 0,
             1, 0, -1, 1,   0, 1, 0, 1,   1, 0,    0, 1, 0,
             1, 0,  1, 1,   0, 1, 0, 1,   1, 1,    0, 1, 0,
            -1, 0,  1, 1,   0, 1, 0, 1,   0, 1,    0, 1, 0,
        ]);
        const indices = new Uint32Array([0,1,2, 0,2,3]);

        return {
            "vertices": vertices,
            "indices": indices
        };
    }
}
