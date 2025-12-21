import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';

export class Cube extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Cube"
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
            update: () => {
                const t = performance.now() / 1000;
                const transform = this.getComponentOfType(Transform);
                const rotation = transform.rotation;
            }
        });
        this.textureRenderer = new TextureRenderer();
        this.mesh = this.createMesh();
    }

    createMesh(){
        const r = this.textureRenderer.color[0];
        const g = this.textureRenderer.color[1];
        const b = this.textureRenderer.color[2];
        const a = this.textureRenderer.color[3];
        const vertices = new Float32Array([
            // x, y, z, w, r, g, b, a
            -1, -1, -1,  1,      r,  g,  b,  a,   //   0
            -1, -1,  1,  1,      r,  g,  b,  a,   //   1
            -1,  1, -1,  1,      r,  g,  b,  a,   //   2
            -1,  1,  1,  1,      r,  g,  b,  a,   //   3
             1, -1, -1,  1,      r,  g,  b,  a,   //   4
             1, -1,  1,  1,      r,  g,  b,  a,   //   5
             1,  1, -1,  1,      r,  g,  b,  a,   //   6
             1,  1,  1,  1,      r,  g,  b,  a,   //   7
        ]);

        const indices = new Uint32Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        const mesh = new Mesh(vertices, indices);
        return mesh;
    }
}


/* // spinning
export class Cube extends GameObject {
    constructor({
        rotationSpeed = [0.6, 0.7],
        translation = [0,0,0] } = {}
    ){
        super({
            transformOptions: { translation },
            updateFunction: () => {
                const t = performance.now() / 1000;
                const transform = this.getComponentOfType(Transform);
                const rotation = transform.rotation;

                quat.identity(rotation);
                quat.rotateX(rotation, rotation, t * 0.5);
                quat.rotateY(rotation, rotation, t * 0.5);
            }
        });
    }
}
    */