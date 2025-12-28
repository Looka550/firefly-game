import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { sampler, blankTextureView, scene } from "./main.js";
import { Sphere } from "./Sphere.js";
import { Cube } from "./Cube.js";
import { LinearAnimator } from "./webgpu/engine/animators/LinearAnimator.js";
import { quat, vec3 } from "./glm.js";
import { RotateAroundPointAnimator } from "./RotateAroundPointAnimator.js";
import { BoxCollider } from "./BoxCollider.js";
import { Light } from "./Light.js";
import { Engine, getGlobalModelMatrix, getWorldTranslation } from "./SceneUtils.js";
import { TransformPipelineAnimator } from "./TransformPipelineAnimator.js";

export class Firefly extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Firefly",
        texture,
        addCollider = true,
        stage = 0,
        intensity = 1.0
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.texture = texture;
        this.addCollider = addCollider;
        this.stage = stage;
        this.destroyed = false;

        this.intensity = intensity;
        this.scaleOriginal = vec3.clone(scale);

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

        const light = new GameObject({ name: "Light", translation: [-2, 5, -2] });

        light.addComponent(new Light({
            ambient: 0,
            intensity: this.intensity
        }));
        this.tail.addChild(light);

        if(this.addCollider){
            const col = new BoxCollider({ translation: [0, 0, 0], scale: [2, 0.4, 2], texture: this.texture, debug: false, dynamic: true, name: "firefly" });
            this.body.addComponent(col);
        }

        this.animateMovement();
    }

    animateMovement(){
        if(this.stage != 0){
            return;
        }

        let t = getWorldTranslation(this);
        const hinge = [t.translation[0] + 2, t.translation[1], t.translation[2]];
        const anim = new RotateAroundPointAnimator({startRotation: [0, 0, 0], endRotation: [0, 360, 0], point: hinge, gameObject: this, frames: 300, loop: false});
        this.addComponent(anim);
    }

    onRotateAnimationEnd(){
        this.animateMovement();
    }

    animateWings(){
        const hinge = [-1.91, 5, -2];
        const animR = new RotateAroundPointAnimator({startRotation: [0, 0, -30], endRotation: [0, 0, 30], point: hinge, gameObject: this.wingR, frames: 50, loop: true});
        this.wingR.addComponent(animR);
        const animL = new RotateAroundPointAnimator({startRotation: [0, 0, 30], endRotation: [0, 0, -30], point: hinge, gameObject: this.wingL, frames: 50, loop: true});
        this.wingL.addComponent(animL);
    }

    onAnimationEnd(){
        console.log("current stage: " + this.stage);
        if(this.stage == 0){

        }
        else if(this.stage == 2){
            let t = getWorldTranslation(this);
            let transformA = new Transform({translation: t.translation, scale: [0.1, 0.1, 0.1]});

            let offsetX = rand(3, 8);
            let offsetZ = rand(3, 8);
            let offsetY = rand(18, 26);
            if(coinFlip()){
                offsetX *= -1;
            }
            if(coinFlip()){
                offsetZ *= -1;
            }

            let transformB = new Transform({translation: [t.translation[0] + offsetX, t.translation[1] + offsetY, t.translation[2] + offsetZ], scale: this.scaleOriginal});

            let transformC = new Transform({translation: [t.translation[0] + (offsetX * 3), t.translation[1] + (offsetY * 4), t.translation[2] + (offsetZ * 3)], scale: this.scaleOriginal});

            const animator = new TransformPipelineAnimator({
                gameObject: this,
                transforms: [
                    transformA,
                    transformB,
                    transformC
                ],
                frames: 300,
                loop: false
            });

            this.parent.removeChild(this);
            scene.addChild(this);
            this.stage++;

            this.addComponent(animator);
        }
        else if(this.stage == 3){
            this.destroyed = true;
            scene.removeChild(this);
        }
        else{
            console.log("unknown stage: " + this.stage);
        }
    }
}

function rand(min, max){
    return Math.random() * (max - min) + min;
}

function coinFlip(){
    return Math.random() < 0.5;
}