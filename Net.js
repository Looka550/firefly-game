import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";
import { Sphere } from "./Sphere.js";
import { Cube } from "./Cube.js";
import { LinearAnimator } from "./webgpu/engine/animators/LinearAnimator.js";
import { quat, vec3 } from "./glm.js";
import { RotateAroundPointAnimator } from "./RotateAroundPointAnimator.js";
import { Cylinder } from "./Cylinder.js";
import { Cone } from "./Cone.js";
import { BoxCollider } from "./BoxCollider.js";

export class Net extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Bug Net",
        texture
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.texture = texture

        this.build();
    }

    build(){
        const rod = new Cylinder({ translation: [0, 0, 0], scale: [0.3, 2, 0.3], euler: [90, 0, 0], texture: this.texture, color: [0.78, 0.757, 0.757, 1] });
        this.addChild(rod);
        const basket = new Cone({ translation: [0, 0, -2.3], scale: [1, 1, 1], euler: [0, 0, 0], texture: this.texture, color: [0.941, 0.941, 0.941, 1], open: true });
        this.addChild(basket);

        const col = new BoxCollider({ translation: [0, 0, 0], scale: [0.7, 0.8, 0.7], texture: this.texture, debug: false, dynamic: true, name: "bug net" });
        col.addComponent({
            update(){
                col.collides();
            }
        });
        basket.addComponent(col);
    }
}