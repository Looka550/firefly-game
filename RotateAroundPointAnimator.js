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
import { scene } from "./main.js";

export class RotateAroundPointAnimator extends GameObject{
    constructor({
        startRotation,
        endRotation,
        point,
        gameObject,
        frames,
        loop
    } = {}){
        super();
        this.startRotation= startRotation;
        this.endRotation = endRotation;
        this.point = point;
        this.gameObject = gameObject;
        this.frames = frames;
        this.loop = loop;

        this.gameObject.setRotation(this.startRotation);
        this.init();
    }

    init(){
        this.progress = 0;
        const distance = [
            this.endRotation[0] - this.startRotation[0],
            this.endRotation[1] - this.startRotation[1],
            this.endRotation[2] - this.startRotation[2],
        ];
        this.piece = [distance[0] / this.frames, distance[1] / this.frames, distance[2] / this.frames];
    }

    update(){
        if(this.progress < this.frames){
            this.rotateAroundPoint(this.gameObject, this.point, this.piece);
            this.progress++;
        }
        else if(this.progress == this.frames){
            this.gameObject.setRotation(this.endRotation);
            this.progress++;

            if(this.loop){
                const temp = this.startRotation;
                this.startRotation = this.endRotation;
                this.endRotation = temp;

                this.init();
            }
            else{
                if(this.gameObject.onRotateAnimationEnd){
                    this.gameObject.onRotateAnimationEnd();
                }
                else{
                    for(const component of this.gameObject.components){
                        component.onRotateAnimationEnd?.();
                    }
                }
                this.gameObject.removeComponent(this);
                this.destroyed = true;
                return;
            }
        }
    }

    rotateAroundPoint(gameObject, point, euler){
        const transform = gameObject.getComponentOfType(Transform);
        
        // euler to quat
        const rotationQuat = quat.create();
        quat.fromEuler(rotationQuat, ...euler);
        
        // distance to point
        const distance = vec3.create();
        vec3.subtract(distance, transform.translation, point);

        // rotate distance
        const rotatedDistance = vec3.create();
        vec3.transformQuat(rotatedDistance, distance, rotationQuat);

        // set new pos
        vec3.add(transform.translation, point, rotatedDistance);

        // rotate object
        quat.multiply(transform.rotation, rotationQuat, transform.rotation);
    }

}