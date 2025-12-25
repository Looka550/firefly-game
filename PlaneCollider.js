import { GameObject } from "./GameObject.js";
import { Engine, getGlobalModelMatrix } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";
import { physics } from "./main.js";
import { vec3, mat4 } from './glm.js';
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


    AABBcollision(box){
        box.getBoundaries();
        //console.log("Box min:", box.min, "Box max:", box.max);

        const modelMatrix = getGlobalModelMatrix(this);

        // plane normal
        const rotationMatrix = mat4.create();
        mat4.fromRotationTranslation(rotationMatrix, this.transform.rotation, [0,0,0]);

        const normal = vec3.transformMat4(vec3.create(), [0,1,0], rotationMatrix);
        vec3.normalize(normal, normal);

        const planePos = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];

        //console.log("Plane normal:", normal, "Plane position:", planePos);

        // project box min and max on plane normal
        const boxMinProj = vec3.dot(box.min, normal);
        const boxMaxProj = vec3.dot(box.max, normal);
        const planeProj = vec3.dot(planePos, normal);

        //console.log("Box proj min/max:", boxMinProj, boxMaxProj, "Plane proj:", planeProj);

        if(boxMinProj <= planeProj && boxMaxProj >= planeProj){
            return true;
        }
        else{
            //console.log("no coll");
            return false;
        }
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
