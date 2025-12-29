import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
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
import { Firefly } from "./Firefly.js";
import { Tree } from "./Tree.js";

export class WorldGenerator extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "World Generator",
        texture,
        minX,
        maxX,
        minZ,
        maxZ,
        checkpoints = [],
        leavesTexture,
        trunkTexture,
        fireflyTexture
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.texture = texture;

        this.minX = minX;
        this.maxX = maxX;
        this.minZ = minZ;
        this.maxZ = maxZ;
        this.makeCheckpoints(checkpoints);
        this.leavesTexture = leavesTexture;
        this.trunkTexture = trunkTexture;
        this.fireflyTexture = fireflyTexture;

        this.trees = [];
        this.fireflies = [];
    }

    generateTrees(n, radius = 20){ // radius = distance between trees
        for(let i = 0; i < n; i++){
            const x = rand(this.minX, this.maxX);
            const z = rand(this.minZ, this.maxZ);
            let y = 0;
            for(let i = 0; i < this.offsets.length; i++){
                const offset = this.offsets[i];
                if(z >= offset.min && z <= offset.max){
                    y += offset.height;
                }
            }
            
            let tooClose = false;
            for(const tree of this.trees){
                const diffX = tree.x - x;
                const diffZ = tree.z - z;
                const dist = (diffX * diffX + diffZ * diffZ);
                if(dist < (radius * radius)){
                    tooClose = true;
                    break;
                }
            }

            if(tooClose){
                i--;
                continue;
            }

            const R = rand(-0.03, 0.2);
            const G = rand(-0.3, 0.4);
            const B = rand(-0.01, 0.2);
            const leavesColor = [0.051 + R, 0.451 + G, 0.02 + B, 1]

            const leaves = rand(3, 9);

            const tree = { x, y, z };
            this.trees.push(tree);
            const treeObject = new Tree({trunkTexture: this.trunkTexture, leavesTexture: this.leavesTexture, texture: this.texture, scale: [1, 1, 1], translation: [x, y, z], leavesColor: leavesColor, leaves: leaves});
            scene.addChild(treeObject);

        }
    }

    generateFireflies(n, treeRadius = 20, fireflyRadius = 5){
        for(let i = 0; i < n; i++){
            const x = rand(this.minX, this.maxX);
            const z = rand(this.minZ, this.maxZ);
            let y = 0;
            for(let i = 0; i < this.offsets.length; i++){
                const offset = this.offsets[i];
                if(z >= offset.min && z <= offset.max){
                    y += offset.height;
                }
            }
            
            let tooClose = false;
            for(const tree of this.trees){
                const diffX = tree.x - x;
                const diffZ = tree.z - z;
                const dist = (diffX * diffX + diffZ * diffZ);
                if(dist < (treeRadius * treeRadius)){
                    tooClose = true;
                    break;
                }
            }

            if(tooClose){
                i--;
                continue;
            }

            tooClose = false;
            for(const firefly of this.fireflies){
                const diffX = firefly.x - x;
                const diffZ = firefly.z - z;
                const dist = (diffX * diffX + diffZ * diffZ);
                if(dist < (fireflyRadius * fireflyRadius)){
                    tooClose = true;
                    break;
                }
            }

            if(tooClose){
                i--;
                continue;
            }

            const offsetY = rand(-2, 0);

            const firefly = { x, y, z };
            this.fireflies.push(firefly);
            const fireflyObject = new Firefly({texture: this.fireflyTexture, scale: [1, 1, 1], translation: [x, y + 5 + offsetY, z], intensity: 3});
            scene.addChild(fireflyObject);

        }
    }

    makeCheckpoints(checkpoints){
        this.offsets = [];
        let max = 0;
        let min = 0;
        let previousMax = 0;
        for(let i = 0; i < checkpoints.length; i++){
            let point = checkpoints[i];
            if(i == 0){
                min = this.minZ;
                max = point[1];
            }
            else{
                min = previousMax;
                max = point[1];
            }
            this.offsets.push({
                "height": point[0],
                "min": min,
                "max": max
            });
            previousMax = max;
        };
    }
}

function rand(min, max){
    return Math.random() * (max - min) + min;
}