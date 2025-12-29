import { GameObject } from "./GameObject.js";
import { Transform } from './Transform.js';
import { Mesh } from './Mesh.js';
import { Engine } from "./SceneUtils.js";
import { sampler, blankTextureView } from "./main.js";

export class Cone extends GameObject {
    constructor({
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        name = "Cone",
        texture,
        normalTexture = null,
        color = [1, 1, 1, 1],
        open = false
    } = {}){
        super({
            euler,
            translation,
            scale,
            name,
        });
        this.color = color;
        this.open = open;
        const structure = this.createMesh();
        this.mesh = new Mesh({
            structure: structure,
            sampler: sampler,
            texture: texture,
            normalTexture: normalTexture,
            blankTextureView: blankTextureView
        });
    }

    createMesh(n = 32){
        this.index = 0;

        // top circle
        let points = this.circlePoints(n, true)
        points.push(0, 1, 0, 1, ...this.color, 0.5, 0.5, 0, 1, 0); // center
        let vertices = points;
        
        let indices = [];
        if(!this.open){
            indices = this.makeCircleIndices(n, true);
        }

        // bottom circle
        vertices.push(0, -1, 0, 1, ...this.color, 0.5, 0.5, 0, -1, 0); // center


        // cylinder side
        const sideBase = vertices.length / 13;

        for(let i = 0; i < n; i++){
            const a = (i / n) * Math.PI * 2;
            const x = Math.cos(a);
            const z = Math.sin(a);

            const u = i / n;

            // top vertex
            vertices.push(x, 1, z, 1, ...this.color, u, 1, x, 0, z);

            // bottom vertex
            vertices.push(x, -1, z, 1, ...this.color,u, 0, x, 0, z);
        }

        for(let i = 0; i < n; i++){
            const next = (i + 1) % n;

            const top0 = sideBase + i * 2;
            const top1 = sideBase + next * 2;

            indices.push(top0, n + 1, top1);
        }


        return {
            "vertices": new Float32Array(vertices),
            "indices": new Uint32Array(indices)
        };
    }


        makeCircleIndices(n, top){
            const start = this.index;
            const end = n + this.index;
            const initialIndex = this.index;
            const out = [];
            const center = start + n; // last vertex is the center

            for (let i = start; i < end; i++) {
                const next = (i + 1) % n + initialIndex;
                if(top){
                    out.push(i, next, center);
                    this.index++;
                }
                else{
                    if(i == n || next == n){ // weird error
                        continue;
                    }
                    out.push(next, i, center);
                    this.index++;
                }
            }

            return out;
        }

        circlePoints(n, top){
            const points = [];
            const step = (2 * Math.PI) / n;

            for (let i = 0; i < n; i++) {
                const angle = i * step;

                const x = Math.cos(angle);
                const z = Math.sin(angle);
                const u = 0.5 + x * 0.5
                const v = 0.5 + z * 0.5
                if(top){
                    points.push(x, 1, z, 1, ...this.color, u, v, 0, 1, 0);
                }
                else{
                    points.push(x, -1, z, 1, ...this.color, u, v, 0, -1, 0);
                }
            }

            return points;
        }

}