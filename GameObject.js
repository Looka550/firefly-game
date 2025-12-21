import { Node } from "./Node.js";
import { Transform } from './Transform.js';
import { Engine } from "./SceneUtils.js";
import { sampler } from "./main.js";

export class GameObject extends Node{
    constructor({
        euler,
        translation,
        scale,
        name,
        update = null,
        texture
    } = {}) {
        super();
        this.name = name;

        this.addComponent(new Transform({ euler, translation, scale }));

        if(update){
            this.addComponent({ update: update });
        }

        // uniform buffer
        this.uniformBuffer = Engine.device.createBuffer({
            size: 16 * 4, // 4x4 matrix
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // bind group
        this.bindGroup = Engine.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: sampler },
            ]
        });
    }

    get transform() {
        return this.getComponentOfType(Transform);
    }
}
