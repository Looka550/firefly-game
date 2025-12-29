export class ResizeSystem {
    constructor(canvas, onResize){
        this.canvas = canvas;
        this.onResize = onResize;
        this.lastWidth = 0;
        this.lastHeight = 0;

        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this._resize);
        this.resize(); // initial resize
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.round(rect.width * window.devicePixelRatio);
        const height = Math.round(rect.height * window.devicePixelRatio);

        if(width !== this.lastWidth || height !== this.lastHeight){
            this.lastWidth = width;
            this.lastHeight = height;

            this.canvas.width = width;
            this.canvas.height = height;

            if(this.onResize){
                this.onResize({ width, height });
            }
        }
    }

    stop(){
        window.removeEventListener("resize", this._resize);
    }
}
