import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { Engine, getGlobalModelMatrix, getWorldTranslation } from "./SceneUtils.js";
import { sampler, blankTextureView, scene, playerWrapper, firefliesCount, animationSpeed } from "./main.js";
import { Sphere } from "./Sphere.js";
import { Cube } from "./Cube.js";
import { LinearAnimator } from "./webgpu/engine/animators/LinearAnimator.js";
import { quat, vec3, mat4 } from "./glm.js";
import { RotateAroundPointAnimator } from "./RotateAroundPointAnimator.js";
import { Cylinder } from "./Cylinder.js";
import { Cone } from "./Cone.js";
import { BoxCollider } from "./BoxCollider.js";
import { TransformPipelineAnimator } from './TransformPipelineAnimator.js';
import { Firefly } from "./Firefly.js";
import { Light } from "./Light.js";

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

        this.fireflies = [];
        this.assistLights = [];
        this.swinging = false;
        this.playerLit = false;
        this.collectedAll = false;

        this.originalTransformOn = {
            translation: vec3.fromValues(-4, -5+8, -5-7),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            scale: vec3.fromValues(1, 1, 1),
        };

        this.originalTransformOff = {
            translation: vec3.fromValues(-17.2, -14.2+8, -5.2-7),
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

        this.top = new GameObject();
        const lamp = this;
        this.top.addComponent({
            onAnimationEnd(){
                lamp.firefliesOut();
            }
        });
        this.addChild(this.top);

        const topCyl = new Cylinder({ translation: [0, 4.8, 0], scale: [2, 0.4, 2], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.top.addChild(topCyl);
        const rod = new Cylinder({ translation: [0, 6.1, 0], scale: [0.4, 1, 0.4], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.top.addChild(rod);
        const ball = new Sphere({ translation: [0, 7.2, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.top.addChild(ball);
        const arm = new Cube({ translation: [-3.5, 6, 3.5], scale: [0.6, 6, 0.6], euler: [80, -50, 40], texture: this.texture, color: [1, 0.925, 0.745, 1] });
        this.top.addChild(arm);
    }

    firefliesOut(){
        this.fireflies.forEach(firefly => {
            let transformA = new Transform();
            vec3.copy(transformA.translation, firefly.transform.translation);
            quat.copy(transformA.rotation, firefly.transform.rotation);
            vec3.copy(transformA.scale, firefly.transform.scale);

            let transformB = new Transform();
            vec3.copy(transformB.translation, [firefly.transform.translation[0], firefly.transform.translation[1] + 3, firefly.transform.translation[2]]);
            quat.copy(transformB.rotation, firefly.transform.rotation);
            vec3.copy(transformB.scale, firefly.transform.scale);

            const animator = new TransformPipelineAnimator({
                gameObject: firefly,
                transforms: [
                    transformA,
                    transformB,
                ],
                frames: Math.round(100 / animationSpeed),
                loop: false
            });

            firefly.stage++;
            firefly.addComponent(animator);
        });
    }

    release(){
        if(this.swinging || !this.lampOn || !this.collectedAll){
            return;
        }

        this.swinging = true;

        const transformC = {
            translation: vec3.fromValues(0, 0+8, 0-7),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformA = {
            translation: vec3.fromValues(2.4, 2.4+8, -0.6-7),
            rotation: quat.fromEuler(quat.create(), 27.2, -43, 21),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformB = {
            translation: vec3.fromValues(2.4, 5.2+8, -0.6-7),
            rotation: quat.fromEuler(quat.create(), 52.2, -32, 35.4),
            scale: vec3.fromValues(1, 1, 1),
        };

        const animator = new TransformPipelineAnimator({
            gameObject: this.top,
            transforms: [
                transformC,
                transformA,
                transformB,
            ],
            frames: Math.round(100 / animationSpeed),
            loop: false
        });

        this.top.addComponent(animator);
    }
    
    swing(){
        if(this.swinging){
            return;
        }
        this.swinging = true;

        const transformA = {
            translation: vec3.fromValues(-4, -5+8, -5-7),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformB = {
            translation: vec3.fromValues(-8.2, -7.2+8, -5.2-7),
            rotation: quat.fromEuler(quat.create(), -3.2, -6.6, -56),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformC = {
            translation: vec3.fromValues(-17.2, -14.2+8, -5.2-7),
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
                frames: Math.round(30 / animationSpeed),
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
                frames: Math.round(30 / animationSpeed),
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

    addFirefly(){
        const r = 1;
        let offsetX = rand(0, r);
        let offsetZ = rand(0, (r - offsetX));
        let offsetY = rand(0, r);
        if(coinFlip()){
            offsetX *= -1;
        }
        if(coinFlip()){
            offsetZ *= -1;
        }
        if(coinFlip()){
            offsetY *= -1;
        }

        const firefly = new Firefly({texture: this.texture, scale: [0.1, 0.1, 0.1], translation: [offsetX, offsetZ, offsetY], addCollider: false, stage: 1, intensit: 10.0 });

        this.cage.addChild(firefly);
        this.fireflies.push(firefly);

        if(this.fireflies.length == firefliesCount){
            this.collectedAll = true;
        }

        if(!this.playerLit){ // assist lights
            console.log("adding assist lights");
            const assistLightPositions = [[-1.6, 0, 19.6], [8.8, 0, 18.6], [17.4, 0, 8]]; // [[19.4, -0.2+8, 26.4-7], [-18.8, -0.2+8, 26.4-7], [0, -0.2+8, 26.4-7]];
            for(let i = 0; i < assistLightPositions.length; i++){
                const assistLight = new GameObject({name: "Assist light"});
                assistLight.addComponent(new Transform({
                    translation: assistLightPositions[i]
                }));
                assistLight.addComponent(new Light({
                    ambient: 0,
                    intensity: 1.0
                }));
                playerWrapper.addChild(assistLight);
                this.assistLights.push(assistLight);
            }

            this.playerLit = true;
        }
        else{
            for(let i = 0; i < this.assistLights.length; i++){
                this.assistLights[i].intensity = this.fireflies.length;
            }
        }
    }
}

function rand(min, max){
    return Math.random() * (max - min) + min;
}

function coinFlip(){
    return Math.random() < 0.5;
}