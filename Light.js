export class Light {
    constructor({
        ambient = 0.1,
        attenuation = 0.02,
    } = {}) {
        this.ambient = ambient;
        this.attenuation = attenuation;
    }
}