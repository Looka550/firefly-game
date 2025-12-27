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

        this.swinging = false;

        this.originalTransform = new Transform();
        vec3.copy(this.originalTransform.translation, this.transform.translation);
        quat.copy(this.originalTransform.rotation, this.transform.rotation);
        vec3.copy(this.originalTransform.scale, this.transform.scale);

        this.build();
    }

    build(){
        const bottom = new Cylinder({ translation: [0, -0.01, 0], scale: [2, 0.4, 2], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(bottom);
        const glass = new Cylinder({ translation: [0, 2.4, 0], scale: [2, 2, 2], euler: [0, 0, 0], texture: this.texture, color: [1, 1, 1, 0.2] });
        this.addChild(glass);
        const top = new Cylinder({ translation: [0, 4.8, 0], scale: [2, 0.4, 2], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(top);
        const rod = new Cylinder({ translation: [0, 6.1, 0], scale: [0.4, 1, 0.4], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(rod);
        const ball = new Sphere({ translation: [0, 7.2, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: this.texture, color: [0.212, 0.208, 0.208, 1] });
        this.addChild(ball);
        const arm = new Cube({ translation: [-3.5, 6, 3.5], scale: [0.6, 6, 0.6], euler: [80, -50, 40], texture: this.texture, color: [1, 0.925, 0.745, 1] });
        this.addChild(arm);
    }
    /*
    swing(){
        if(this.swinging){
            return;
        }
        this.swinging = true;

        let transformA = new Transform();
        vec3.copy(transformA.translation, this.transform.translation);
        quat.copy(transformA.rotation, this.transform.rotation);
        vec3.copy(transformA.scale, this.transform.scale);

        let transformAOffset = new Transform();
        vec3.copy(transformAOffset.translation, [this.transform.translation[0], this.transform.translation[1] - 20, this.transform.translation[2]]);
        quat.copy(transformAOffset.rotation, this.transform.rotation);
        vec3.copy(transformAOffset.scale, this.transform.scale);

        const transformB = {
            translation: vec3.fromValues(8, 14-20, 12.2),
            rotation: quat.fromEuler(quat.create(), -14.4, -7.8, 31),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformC = {
            translation: vec3.fromValues(4.8, 17.6-20, 4.6),
            rotation: quat.fromEuler(quat.create(), -120, 9.4, -165.6),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformD = {
            translation: vec3.fromValues(3.8, 17-20, -1.14),
            rotation: quat.fromEuler(quat.create(), 7.9, -21.7, 95.8),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformE = {
            translation: vec3.fromValues(-0.2, 16.4-20, 9.7),
            rotation: quat.fromEuler(quat.create(), 87, -21.7, 91),
            scale: vec3.fromValues(1, 1, 1),
        };



        const animator = new TransformPipelineAnimator({
            gameObject: this,
            transforms: [
                transformA,
                transformB,
                transformC,
                transformD,
                transformE,
                transformAOffset,
                transformA,
            ],
            frames: 40,
            loop: false
        });
        this.addComponent(animator);
    }

    onAnimationEnd(){
        this.swinging = false;
        vec3.copy(this.transform.translation, this.originalTransform.translation); // reallign to original position
        quat.copy(this.transform.rotation, this.originalTransform.rotation);
        vec3.copy(this.transform.scale, this.originalTransform.scale);
    }
    */
}