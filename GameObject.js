import { Node } from "./Node.js";
import { Transform } from './Transform.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";

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
}
