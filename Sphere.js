import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
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

    createMesh(n_slices = 32, n_stacks = 16){ // basic uv sphere algoritem (brez optimizacij)
        const vertices = [];
        const indices = [];

        let index = 0;

        const radius = 1;

        // add top vertex
        vertices.push(0, radius, 0, 1); // position
        vertices.push(...this.color); // color
        vertices.push(0.5, 0); // uv
        vertices.push(0, 1, 0); // normal
        index++;

        // add vertices for each stack
        for (let i = 0; i < n_stacks - 1; i++) {
            const phi = Math.PI * (i + 1) / n_stacks;

            for (let j = 0; j < n_slices; j++) {
                const theta = 2 * Math.PI * j / n_slices;

                const x = Math.sin(phi) * Math.cos(theta) * radius;
                const y = Math.cos(phi) * radius;
                const z = Math.sin(phi) * Math.sin(theta) * radius;

                // position
                vertices.push(x, y, z, 1);
                // color
                vertices.push(...this.color);
                // uv
                const u = i / n_slices;
                const v = j / n_stacks;
                vertices.push(u, v);
                // normal (SPHERICAL)
                vertices.push(x / radius, y / radius, z / radius);
                index++;
            }
        }

        // add bottom vertex
        vertices.push(0, -radius, 0, 1); // position
        vertices.push(...this.color); // color
        vertices.push(0.5, 1); // uv
        vertices.push(0, -1, 0); // normal
        index++;

        const topIndex = 0;
        const bottomIndex = index - 1;

        // top triangles
        for (let i = 0; i < n_slices; ++i) {
            let i0 = i + 1;
            let i1 = (i + 1) % n_slices + 1;
            indices.push(topIndex, i1, i0);

            i0 = i + n_slices * (n_stacks - 2) + 1;
            i1 = (i + 1) % n_slices + n_slices * (n_stacks - 2) + 1;
            indices.push(bottomIndex, i0, i1);

        }



        // quads for middle stacks
        for (let j = 0; j < n_stacks - 2; j++) {
            const j0 = j * n_slices + 1;
            const j1 = (j + 1) * n_slices + 1;
            for (let i = 0; i < n_slices; i++) {
                const i0 = j0 + i;
                const i1 = j0 + (i + 1) % n_slices;
                const i2 = j1 + (i + 1) % n_slices;
                const i3 = j1 + i;

                indices.push(i0, i1, i2);
                indices.push(i0, i2, i3);
            }
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint32Array(indices)
        };
    }

}