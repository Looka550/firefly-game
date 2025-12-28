import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler, blankTextureView, animationSpeed } from "./main.js";
import { Sphere } from "./Sphere.js";
import { Cube } from "./Cube.js";
import { LinearAnimator } from "./webgpu/engine/animators/LinearAnimator.js";
import { quat, vec3 } from "./glm.js";
import { RotateAroundPointAnimator } from "./RotateAroundPointAnimator.js";
import { Cylinder } from "./Cylinder.js";
import { Cone } from "./Cone.js";
import { BoxCollider } from "./BoxCollider.js";
import { TransformPipelineAnimator } from './TransformPipelineAnimator.js';
import { lamp, scene } from "./main.js";
import { Lamp } from "./Lamp.js";

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

        this.swinging = false;

        this.originalTransform = new Transform();
        vec3.copy(this.originalTransform.translation, this.transform.translation);
        quat.copy(this.originalTransform.rotation, this.transform.rotation);
        vec3.copy(this.originalTransform.scale, this.transform.scale);

        this.build();
    }

    build(){
        const rod = new Cylinder({ translation: [0, -2, 0], scale: [0.3, 7, 0.3], euler: [90, 0, 0], texture: this.texture, color: [0.78, 0.757, 0.757, 1] });
        this.addChild(rod);
        const basket = new Cone({ translation: [0, -2, -7.2], scale: [3, 3, 3], euler: [0, 0, 0], texture: this.texture, color: [0.941, 0.941, 0.941, 1], open: true });
        this.addChild(basket);

        const col = new BoxCollider({ translation: [0, 0, 0], scale: [1, 0.4, 2], texture: this.texture, debug: false, dynamic: true, name: "bug net" });
        const net = this;
        col.addComponent({
            update(){
                const collisions = col.collides();
                collisions.forEach(col => {
                    if(col.name == "firefly" && net.swinging){
                        lamp.addFirefly();
                        col.destroyed = true;
                        scene.removeChild(col.gameObject.parent);
                    }
                });
            }
        });
        basket.addComponent(col);
    }

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
            translation: vec3.fromValues(8, 14-20+8, 12.2-7),
            rotation: quat.fromEuler(quat.create(), -14.4, -7.8, 31),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformC = {
            translation: vec3.fromValues(4.8, 17.6-20+8, 4.6-7),
            rotation: quat.fromEuler(quat.create(), -120, 9.4, -165.6),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformD = {
            translation: vec3.fromValues(3.8, 17-20+8, -1.14-7),
            rotation: quat.fromEuler(quat.create(), 7.9, -21.7, 95.8),
            scale: vec3.fromValues(1, 1, 1),
        };

        const transformE = {
            translation: vec3.fromValues(-0.2, 16.4-20+8, 9.7-7),
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
            frames: 10,
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
}