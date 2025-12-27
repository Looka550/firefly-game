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
import { BoxCollider } from "./BoxCollider.js";

export class Firefly extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Firefly",
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
        this.animateWings();

    }

    build(){
        this.body = new Sphere({ translation: [-2, 5, -2], scale: [1, 1, 2], euler: [0, 0, 0], texture: this.texture, color: [0.329, 0.29, 0.29, 1] });
        this.addChild(this.body);
        this.head = new Sphere({ translation: [-2, 5, -1], scale: [1, 1, 1], euler: [0, 0, 0], texture: this.texture, color: [0.229, 0.19, 0.19, 1] });
        this.addChild(this.head);
        this.tail = new Sphere({ translation: [-2, 5, -3.5], scale: [0.7, 0.7, 1.3], euler: [0, 0, 0], texture: this.texture, color: [1, 0.859, 0.141, 1] });
        this.addChild(this.tail);
        this.eyeL = new Sphere({ translation: [-1.6, 5, 0], scale: [0.3, 0.3, 0.3], euler: [0, 0, 0], texture: this.texture, color: [0, 0, 0, 1] });
        this.addChild(this.eyeL);
        this.eyeR = new Sphere({ translation: [-2.4, 5, 0], scale: [0.3, 0.3, 0.3], euler: [0, 0, 0], texture: this.texture, color: [0, 0, 0, 1] });
        this.addChild(this.eyeR);
        this.wingL = new Cube({ translation: [-0.4, 6, -2], scale: [1.5, 0.2, 0.5], euler: [0, 0, 0], texture: this.texture, color: [0.71, 0.867, 1, 1] });
        this.addChild(this.wingL);
        this.wingR = new Cube({ translation: [-3.4, 6, -2], scale: [1.5, 0.2, 0.5], euler: [0, 0, 0], texture: this.texture, color: [0.71, 0.867, 1, 1] });
        this.addChild(this.wingR);

        const col = new BoxCollider({ translation: [0, 0, 0], scale: [2, 0.4, 2], texture: this.texture, debug: false, dynamic: true, name: "firefly" });
        this.body.addComponent(col);
    }

    animateWings(){
        const hinge = [-1.91, 5, -2];
        const animR = new RotateAroundPointAnimator({startRotation: [0, 0, -30], endRotation: [0, 0, 30], point: hinge, gameObject: this.wingR, frames: 50, loop: true});
        this.wingR.addComponent(animR);
        const animL = new RotateAroundPointAnimator({startRotation: [0, 0, 30], endRotation: [0, 0, -30], point: hinge, gameObject: this.wingL, frames: 50, loop: true});
        this.wingL.addComponent(animL);
    }
}