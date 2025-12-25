import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { TextureRenderer } from './TextureRenderer.js';
import { Engine } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";

export class Sphere extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Sphere",
        texture,
        normalTexture = null,
        color = [1, 1, 1, 1]
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.color = color;
        const structure = this.createMesh();
        this.mesh = new Mesh({
            structure: structure,
            sampler: sampler,
            texture: texture,
            normalTexture: normalTexture,
            blankTextureView: blankTextureView
        });
    }

    createMesh() {
        const radius = 1;
        const segments = 16; // ↑ more = smoother

        const vertices = [];
        const indices = [];
        let indexOffset = 0;

        const faces = [
            [ 1,  0,  0],
            [-1,  0,  0],
            [ 0,  1,  0],
            [ 0, -1,  0],
            [ 0,  0,  1],
            [ 0,  0, -1],
        ];

        for (const face of faces) {
            const [fx, fy, fz] = face;

            for (let y = 0; y <= segments; y++) {
                for (let x = 0; x <= segments; x++) {
                    const u = x / segments * 2 - 1;
                    const v = y / segments * 2 - 1;

                    let px = fx ? fx : u;
                    let py = fy ? fy : v;
                    let pz = fz ? fz : (fx ? u : v);

                    // normalize → sphere
                    const len = Math.hypot(px, py, pz);
                    px = px / len * radius;
                    py = py / len * radius;
                    pz = pz / len * radius;

                    // position
                    vertices.push(px, py, pz, 1);

                    // color
                    vertices.push(this.color[0], this.color[1], this.color[2], this.color[3]);

                    // uv (simple planar)
                    vertices.push(x / segments, y / segments);

                    // normal
                    vertices.push(px / radius, py / radius, pz / radius);
                }
            }

            for (let y = 0; y < segments; y++) {
                for (let x = 0; x < segments; x++) {
                    const a = indexOffset + y * (segments + 1) + x;
                    const b = a + 1;
                    const c = a + (segments + 1);
                    const d = c + 1;

                    indices.push(a, c, b);
                    indices.push(b, c, d);
                }
            }

            indexOffset += (segments + 1) * (segments + 1);
        }
        

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint32Array(indices),
        };
    }

}