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

export class Tree extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Tree",
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
        this.trunk = new Cylinder({ translation: [-2, 5, -2], scale: [2, 5, 2], euler: [0, 0, 0], texture: this.texture, color: [0.278, 0.227, 0.227, 1] });
        this.addChild(this.trunk);
        this.ball = new Sphere({ translation: [-2, 14, -2], scale: [5, 5, 5], euler: [0, 0, 0], texture: this.texture, color: [0.067, 1, 0, 1] });
        this.addChild(this.ball);
    }
}