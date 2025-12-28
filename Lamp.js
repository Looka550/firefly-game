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
import { TransformPipelineAnimator } from './TransformPipelineAnimator.js';
import { Firefly } from "./Firefly.js";

export class Lamp extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Lamp",
        texture
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.texture = texture
        this.lampOn = true;

        this.swinging = false;

        this.originalTransformOn = {
            translation: vec3.fromValues(-4, -5, -5),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            scale: vec3.fromValues(1, 1, 1),
        };

        this.originalTransformOff = {
            translation: vec3.fromValues(-17.2, -14.2, -5.2),
            rotation: quat.fromEuler(quat.create(), -2.8, -20.4, -65.2),
            scale: vec3.fromValues(1, 1, 1),
        };

        this.build();
    }

    build(){
        const bottom = new Cylinder({ translation: [0, -0.01, 0], scale: [2, 0.4, 2], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(bottom);
        const glass = new Cylinder({ translation: [0, 2.4, 0], scale: [2, 2, 2], euler: [0, 0, 0], texture: this.texture, color: [1, 1, 1, 0.2] });
        glass.transparent = true;
        this.addChild(glass);
        this.cage = new GameObject({ translation: [0.15, -0.4, 0.15], scale: [0.7, 0.9, 0.7] });
        glass.addChild(this.cage);
        const top = new Cylinder({ translation: [0, 4.8, 0], scale: [2, 0.4, 2], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(top);
        const rod = new Cylinder({ translation: [0, 6.1, 0], scale: [0.4, 1, 0.4], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(rod);
        const ball = new Sphere({ translation: [0, 7.2, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(ball);
        const arm = new Cube({ translation: [-3.5, 6, 3.5], scale: [0.6, 6, 0.6], euler: [80, -50, 40], texture: this.texture, color: [1, 0.925, 0.745, 1] });
        this.addChild(arm);
    }
    
    swing(){
        if(this.swinging){
            return;
        }

        this.swinging = true;

        const transformA = {
            translation: vec3.fromValues(-4, -5, -5),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformB = {
            translation: vec3.fromValues(-8.2, -7.2, -5.2),
            rotation: quat.fromEuler(quat.create(), -3.2, -6.6, -56),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformC = {
            translation: vec3.fromValues(-17.2, -14.2, -5.2),
            rotation: quat.fromEuler(quat.create(), -2.8, -20.4, -65.2),
            scale: vec3.fromValues(1, 1, 1),
        };

        let animator = null;
        if(this.lampOn){
            animator = new TransformPipelineAnimator({
                gameObject: this,
                transforms: [
                    transformA,
                    transformB,
                    transformC,
                ],
                frames: 30,
                loop: false
            });
        }
        else{
            animator = new TransformPipelineAnimator({
                gameObject: this,
                transforms: [
                    transformC,
                    transformB,
                    transformA,
                ],
                frames: 30,
                loop: false
            });
        }
        this.addComponent(animator);
    }

    onAnimationEnd(){
        if(this.lampOn){
            vec3.copy(this.transform.translation, this.originalTransformOff.translation); // reallign to original position
            quat.copy(this.transform.rotation, this.originalTransformOff.rotation);
            vec3.copy(this.transform.scale, this.originalTransformOff.scale);
        }
        else{
            vec3.copy(this.transform.translation, this.originalTransformOn.translation); // reallign to original position
            quat.copy(this.transform.rotation, this.originalTransformOn.rotation);
            vec3.copy(this.transform.scale, this.originalTransformOn.scale);
        }

        this.swinging = false;
        this.lampOn = !this.lampOn;
    }

    update(){
        this.addFirefly();
    }

    addFirefly(){
        const r = 1;
        let offsetX = this.rand(0, r);
        let offsetZ = this.rand(0, (r - offsetX));
        let offsetY = this.rand(0, r);
        if(this.coinFlip()){
            offsetX *= -1;
        }
        if(this.coinFlip()){
            offsetZ *= -1;
        }
        if(this.coinFlip()){
            offsetY *= -1;
        }

        const firefly = new Firefly({texture: this.texture, scale: [0.1, 0.1, 0.1], translation: [offsetX, offsetZ, offsetY], addCollider: false });
        this.cage.addChild(firefly);
    }

    rand(min, max){
        return Math.random() * (max - min) + min;
    }

    coinFlip(){
        return Math.random() < 0.5;
    }
}