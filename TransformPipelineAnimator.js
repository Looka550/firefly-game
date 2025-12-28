import { GameObject } from "./GameObject.js";
import { Transform } from "./Transform.js";
import { vec3, quat } from "./glm.js";

export class TransformPipelineAnimator extends GameObject {
    constructor({
        gameObject,
        transforms,
        frames = 120,
        loop = false
    } = {}) {
        super();

        this.gameObject = gameObject;
        this.transforms = transforms;
        this.frames = frames;
        this.loop = loop;
        this.destroyed = false;

        this.currentIndex = 0;

        this.startTransformOriginal = this.transforms[0];
        this.endTransformOriginal = this.transforms[1];

        this.init();
    }

    init(){
        this.progress = 0;

        this.startTransform = {
            translation: vec3.clone(this.startTransformOriginal.translation),
            rotation: quat.clone(this.startTransformOriginal.rotation),
            scale: vec3.clone(this.startTransformOriginal.scale),
        };

        this.endTransform = {
            translation: vec3.clone(this.endTransformOriginal.translation),
            rotation: quat.clone(this.endTransformOriginal.rotation),
            scale: vec3.clone(this.endTransformOriginal.scale),
        };

        const transform = this.gameObject.transform;
        vec3.copy(transform.translation, this.startTransform.translation);
        quat.copy(transform.rotation, this.startTransform.rotation);
        vec3.copy(transform.scale, this.startTransform.scale);
    }

    update(){
        if(this.destroyed){
            return;
        }
        const transform = this.gameObject.transform;

        if(this.progress < this.frames){
            const t = this.progress / this.frames;

            vec3.lerp(
                transform.translation,
                this.startTransform.translation,
                this.endTransform.translation,
                t
            );

            vec3.lerp(
                transform.scale,
                this.startTransform.scale,
                this.endTransform.scale,
                t
            );

            quat.slerp(
                transform.rotation,
                this.startTransform.rotation,
                this.endTransform.rotation,
                t
            );

            this.progress++;
        }
        else if(this.progress == this.frames){
            this.progress++;

            this.currentIndex++;

            if(this.currentIndex >= this.transforms.length - 1){
                if(this.loop){
                    this.currentIndex = 0;
                }
                else{
                    if(this.gameObject.onAnimationEnd){
                        this.gameObject.onAnimationEnd();
                    }
                    else{
                        for(const component of this.gameObject.components){
                            component.onAnimationEnd?.();
                        }
                    }
                    this.gameObject.removeComponent(this);
                    this.destroyed = true;
                    return;
                }
            }

            this.startTransformOriginal = this.transforms[this.currentIndex];
            this.endTransformOriginal = this.transforms[this.currentIndex + 1];

            this.init();
        }
    }
}
