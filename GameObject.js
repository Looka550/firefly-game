import { Node } from "./Node.js";
import { Transform } from './Transform.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";
import { quat, mat4, vec3 } from './glm.js';

export class GameObject extends Node{
    constructor({
        euler,
        translation,
        scale,
        name,
        update = null,
    } = {}) {
        super();
        this.name = name;

        this.addComponent(new Transform({ euler, translation, scale }));

        if(update){
            this.addComponent({ update: update });
        }
    }

    get transform() {
        return this.getComponentOfType(Transform);
    }

    setTransform({ translation, scale, euler }){
        const t = this.transform;
        t.calculateTransform({ translation: translation, scale: scale, euler: euler })
    }

    setScale(scale){
        const t = this.transform;
        this.setTransform({ translation: t.translation, scale: scale, euler: t.getEuler() })
    }

    setPosition(translation){
        const t = this.transform;
        this.setTransform({ translation: translation, scale: t.scale, euler: t.getEuler() })
    }

    setRotation(euler){
        const t = this.transform;
        this.setTransform({ translation: t.translation, scale: t.scale, euler: euler })
    }

    move({ x = 0, y = 0, z = 0}){
        const t = this.transform;
        const pos = t.translation;
        const newPos = vec3.fromValues(
            pos[0] + x,
            pos[1] + y,
            pos[2] + z
        );
        this.setPosition(newPos);
    }
}
