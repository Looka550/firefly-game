export class TextureRenderer {
    constructor({
        rgb = [255, 0, 0, 255],
        texture = null
    } = {}) {
        this.color = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3] / 255];
        
    }
}