import { GameObject } from "./GameObject.js";
import { Engine } from "./SceneUtils.js";
import { Mesh } from "./Mesh.js";
import { getGlobalModelMatrix } from "./SceneUtils.js";
import { vec3, mat4 } from "./glm.js";

export class BoxCollider {
    constructor({
        size = [1, 1, 1],
        offset = [0, 0, 0],
        debug = true,
    } = {}) {
        
    }

    onAttach(gameObject) {
        this.gameObject = gameObject;
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
