import { quat, mat4, vec3 } from './glm.js';

export class Transform {
    constructor({
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        euler = [0, 0, 0]
    } = {}) {

        this.calculateTransform({ translation, scale, euler });
    }

    calculateTransform({ translation, scale, euler }){
        this.translation = translation;
        this.scale = scale;

        this.rotation = quat.create();
        quat.fromEuler(this.rotation, euler[0], euler[1], euler[2]);
    }

    get matrix() {
        return mat4.fromRotationTranslationScale(mat4.create(),
            this.rotation, this.translation, this.scale);
    }

    getEuler(){ // get euler from quaternion
        const m = mat4.create();
        mat4.fromQuat(m, this.rotation);

        const euler = vec3.create();

        euler[1] = Math.asin(-m[2]); // pitch y

        if (Math.cos(euler[1]) > 0.0001) {
            euler[0] = Math.atan2(m[6], m[10]); // roll x
            euler[2] = Math.atan2(m[1], m[0]); // yaw z
        }
        else{
            // gimbal lock
            euler[0] = Math.atan2(-m[9], m[5]);
            euler[2] = 0;
        }

        // radians to degrees
        euler[0] *= 180 / Math.PI;
        euler[1] *= 180 / Math.PI;
        euler[2] *= 180 / Math.PI;

        return euler;
    }

}
