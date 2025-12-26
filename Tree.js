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
        this.getTrunk();
        this.getBranchCircle({n: 6});
        this.getLeavesCircle({n: 6});
    }

    getTrunk(){
        // trunk
        this.trunk = new Cylinder({
            translation: [0, 0, 0],
            scale: [2, 10, 2],
            euler: [0, 0, 0],
            texture: this.texture,
            color: [0.278, 0.227, 0.227, 1],
        });
        this.addChild(this.trunk);
    }

    getLeavesCircle({n = 3, offset = [12, 22, -6], euler = [45, 120, 0], scale = [10, 10, 10]}){
        this.branches = new GameObject();

        for (let i = 0; i < n; i++){
            const angle = (360 / n) * i;

            const branch = new Sphere({
                translation: offset,
                scale: scale,
                euler: euler,
                texture: this.texture,
                color: [0.051, 0.451, 0.02, 1],
            });

            const wrapper = new GameObject();
            wrapper.addChild(branch);
            wrapper.setRotation([0, angle, 0]);

            this.branches.addChild(wrapper);
        }

        this.addChild(this.branches);
    }

    getBranchCircle({n = 3, offset = [6, 14, -3], euler = [45, 120, 0], scale = [1, 10, 1]}){
        this.branches = new GameObject();

        for (let i = 0; i < n; i++) {
            const angle = (360 / n) * i;

            const branch = new Cylinder({
                translation: offset,
                scale: scale,
                euler: euler,
                texture: this.texture,
                color: [0.278, 0.227, 0.227, 1],
            });

            const wrapper = new GameObject();
            wrapper.addChild(branch);
            wrapper.setRotation([0, angle, 0]);

            this.branches.addChild(wrapper);
        }

        this.addChild(this.branches);
    }
}