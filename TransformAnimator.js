import { GameObject } from "./GameObject.js";
import { Transform } from "./Transform.js";
import { vec3, quat } from "./glm.js";

export class TransformAnimator extends GameObject {
    constructor({
        gameObject,
        startTransform,
        endTransform,
        frames = 120,
        loop = false
    } = {}) {
        super();

        this.gameObject = gameObject;
        this.frames = frames;
        this.loop = loop;
        this.startTransformOriginal = startTransform;
        this.endTransformOriginal = endTransform;

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

            quat.slerp( // slerp for rotation
                transform.rotation,
                this.startTransform.rotation,
                this.endTransform.rotation,
                t
            );

            this.progress++;
        }
        else if(this.progress == this.frames){
            this.progress++;

            if(this.loop){
                const temp = new Transform();
                vec3.copy(temp.translation, this.startTransformOriginal.translation);
                quat.copy(temp.rotation, this.startTransformOriginal.rotation);
                vec3.copy(temp.scale, this.startTransformOriginal.scale);

                vec3.copy(this.startTransformOriginal.translation, this.endTransformOriginal.translation);
                quat.copy(this.startTransformOriginal.rotation, this.endTransformOriginal.rotation);
                vec3.copy(this.startTransformOriginal.scale, this.endTransformOriginal.scale);

                vec3.copy(this.endTransformOriginal.translation, temp.translation);
                quat.copy(this.endTransformOriginal.rotation, temp.rotation);
                vec3.copy(this.endTransformOriginal.scale, temp.scale);

                this.init();
            }
        }
    }
}
