import { GameObject } from "./GameObject.js";
import { Engine, getGlobalModelMatrix } from "./SceneUtils.js";
import { sampler } from "./main.js";
import { physics } from "./main.js";
import { vec3 } from './glm.js';
import { Mesh } from './Mesh.js';

export class PlaneCollider extends GameObject {
    constructor({
        offset = [0, 0, 0],
        texture,
        name = "Plane Collider",
        debug = true,
        euler = [0, 0, 0],
        translation = [0, 0, 0],
        scale = [10, 1, 10],
        dynamic = false,
        axis = "y"
    } = {}) {
        super({ euler, translation, scale, name });

        this.mesh = this.createMesh();
        this.dontRender = !debug;
        this.dynamic = dynamic;
        this.axis = axis;
        physics.addCollider(this);

        // model matrix
        this.modelBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.viewProjBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.normalBuffer = Engine.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // bind group
        this.bindGroup = Engine.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.modelBuffer } },
                { binding: 1, resource: { buffer: this.viewProjBuffer } },
                { binding: 2, resource: texture.createView() },
                { binding: 3, resource: sampler },
                { binding: 4, resource: { buffer: this.normalBuffer } },
            ]
        });

        this.localMin = vec3.clone(this.mesh.localMin);
        this.localMax = vec3.clone(this.mesh.localMax);

        this.min = vec3.create();
        this.max = vec3.create();
    }


    AABBcollision(box) {
        box.getBoundaries();

        const modelMatrix = getGlobalModelMatrix(this);

        // plane normal
        const normal = vec3.transformMat4(vec3.create(), [0, 1, 0], modelMatrix);
        vec3.normalize(normal, normal);
        const planePos = [modelMatrix[12], modelMatrix[13], modelMatrix[14]];

        // project box min and max on plane normal
        const boxMinProj = vec3.dot(box.min, normal);
        const boxMaxProj = vec3.dot(box.max, normal);
        const planeProj = vec3.dot(planePos, normal);

        if(boxMinProj <= planeProj && boxMaxProj >= planeProj){
            return true;
        }
        else{
            return false;
        }
    }




    createMesh(){
        const vertices = new Float32Array([
            // position     color    uv   normal
            -1, 0, -1, 1,   0, 1, 0, 1,   0, 0,    0, 1, 0,
             1, 0, -1, 1,   0, 1, 0, 1,   1, 0,    0, 1, 0,
             1, 0,  1, 1,   0, 1, 0, 1,   1, 1,    0, 1, 0,
            -1, 0,  1, 1,   0, 1, 0, 1,   0, 1,    0, 1, 0,
        ]);
        const indices = new Uint32Array([0,1,2, 0,2,3]);

        const mesh = new Mesh(vertices, indices);
        return mesh;
    }
}
