import { quat, mat4 } from './glm.js';

export class Transform {
    constructor({
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        euler = [0, 0, 0]
    } = {}) {
        this.translation = translation;
        this.scale = scale;

        this.rotation = quat.create();
        quat.fromEuler(this.rotation, euler[0], euler[1], euler[2]);
    }

    get matrix() {
        return mat4.fromRotationTranslationScale(mat4.create(),
            this.rotation, this.translation, this.scale);
    }

}
