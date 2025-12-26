export class Light {
    constructor({
        ambient = 0.1,
        attenuation = 0.02,
        intensity = 1.0
    } = {}) {
        this.ambient = ambient;
        this.attenuation = attenuation;
        this.intensity = intensity;
    }
}