import { device } from './main.js';
import { quat, mat4, vec3 } from './glm.js';

export class Mesh{
    constructor(vertices, indices, hasNormals = false){
        this.vertices = vertices;
        this.indices = indices;
        
        if(!hasNormals){
            //console.log("model does not provide normals")
            this.calculateNormals();
        }
        else{
            //console.log("model provides normals");
        }
        
        this.setBuffers();

        this.localMin = vec3.fromValues(Infinity, Infinity, Infinity);
        this.localMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for (let i = 0; i < this.vertices.length; i += 13) {
            const x = this.vertices[i + 0];
            const y = this.vertices[i + 1];
            const z = this.vertices[i + 2];

            this.localMin[0] = Math.min(this.localMin[0], x);
            this.localMin[1] = Math.min(this.localMin[1], y);
            this.localMin[2] = Math.min(this.localMin[2], z);

            this.localMax[0] = Math.max(this.localMax[0], x);
            this.localMax[1] = Math.max(this.localMax[1], y);
            this.localMax[2] = Math.max(this.localMax[2], z);
        }
    }

    setBuffers(){
        this.vertexBuffer = device.createBuffer({
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

        this.indexBuffer = device.createBuffer({
            size: this.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.indexBuffer, 0, this.indices);

        this.indexCount = this.indices.length;
    }

    calculateNormals(){
        const vertexCount = this.vertices.length / 13; // 13 floats per vertex
        const normals = new Float32Array(vertexCount * 3);

        for (let i = 0; i < this.indices.length; i += 3) {
            const i0 = this.indices[i];
            const i1 = this.indices[i + 1];
            const i2 = this.indices[i + 2];

            // formula: n = normalize(cross(b-a, c-a))

            // get vertexes
            const v0 = [this.vertices[i0 * 13], this.vertices[i0 * 13 + 1], this.vertices[i0 * 13 + 2]];
            const v1 = [this.vertices[i1 * 13], this.vertices[i1 * 13 + 1], this.vertices[i1 * 13 + 2]];
            const v2 = [this.vertices[i2 * 13], this.vertices[i2 * 13 + 1], this.vertices[i2 * 13 + 2]];

            // triangle vectors
            const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

            // cross product
            const nx = e1[1] * e2[2] - e1[2] * e2[1];
            const ny = e1[2] * e2[0] - e1[0] * e2[2];
            const nz = e1[0] * e2[1] - e1[1] * e2[0];
            
            normals[i0 * 3] += nx;
            normals[i0 * 3 + 1] += ny;
            normals[i0 * 3 + 2] += nz;

            normals[i1 * 3] += nx;
            normals[i1 * 3 + 1] += ny;
            normals[i1 * 3 + 2] += nz;

            normals[i2 * 3] += nx;
            normals[i2 * 3 + 1] += ny;
            normals[i2 * 3 + 2] += nz;
        }

        // normalize vectors
        for(let i = 0; i < vertexCount; i++){
            const x = normals[i * 3];
            const y = normals[i * 3 + 1];
            const z = normals[i * 3 + 2];

            let len = Math.hypot(x, y, z) || 1.0;
            if(len == 0 || len == null){
                len = 1.0;
            }

            normals[i * 3] = x / len;
            normals[i * 3 + 1] = y / len;
            normals[i * 3 + 2] = z / len;
        }

        // set normals to vertex array
        for (let i = 0; i < vertexCount; i++) {
            this.vertices[i * 13 + 10] = normals[i * 3 + 0];
            this.vertices[i * 13 + 11] = normals[i * 3 + 1];
            this.vertices[i  *13 + 12] = normals[i * 3 + 2];
        }
    }
}