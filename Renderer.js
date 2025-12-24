import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    Engine,
} from './SceneUtils.js';
import { quat, mat4, vec3 } from './glm.js';
import { GameObject } from './GameObject.js';
import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { Camera } from './Camera.js';

import { Light } from './Light.js';

export class Renderer{
    constructor(
        device,
        scene,
        context,
        camera,
        module,
        format,
        canvas
    ){
        this.device = device;
        this.scene = scene;
        this.context = context;
        this.camera = camera;
        this.module = module;


        // Create the pipeline
        const vertexBufferLayout = {
            arrayStride: 52,
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x4', // position
                },
                {
                    shaderLocation: 1,
                    offset: 16,
                    format: 'float32x4', // color
                },
                {
                    shaderLocation: 2,
                    offset: 32,
                    format: 'float32x2', // texcoords
                },
                {
                    shaderLocation: 3,
                    offset: 40,
                    format: 'float32x3', // normal
                },
            ],
        };

        const pipeline = device.createRenderPipeline({
            vertex: {
                module,
                buffers: [vertexBufferLayout],
            },
            fragment: {
                module,
                targets: [{ format }],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
            layout: 'auto',
        });

        Engine.device = device;
        Engine.pipeline = pipeline;
        this.pipeline = pipeline;

        // Create the depth texture
        this.depthTexture = this.createDepthTexture(canvas.width, canvas.height);

        // resize system
        new ResizeSystem({ canvas, resize: this.resize.bind(this) }).start();

        this.gpuLights = new Map(); // shrani uniform buffer + bind group za vsako luč

    }

    newScene(newScene){
        this.scene = newScene;
    }

    render() {
        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: 'clear',
                clearValue: [0.7, 0.8, 0.9, 1],
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });

        renderPass.setPipeline(this.pipeline);

        const viewMatrix = getGlobalViewMatrix(this.camera);
        const projectionMatrix = getProjectionMatrix(this.camera);

        // --- Find the first 2 lights in the scene ---
        const lightNodes = this.scene.filter(node => node.getComponentOfType?.(Light)).slice(0, 2);

        let lightBindGroup = null;

        if (lightNodes.length > 0) {
            // Create uniform buffers if not yet created
            lightNodes.forEach((lightNode, index) => {
                if (!this.gpuLights.has(lightNode)) {
                    const lightUniformBuffer = this.device.createBuffer({
                        size: 16, // vec3 + float ambient
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    });

                    this.gpuLights.set(lightNode, { lightUniformBuffer });
                }
            });

            // Collect the buffers for bind group
            const entries = lightNodes.map((lightNode, i) => {
                const { lightUniformBuffer } = this.gpuLights.get(lightNode);

                // Write light data to the buffer
                const lightComponent = lightNode.getComponentOfType(Light);
                const lightMatrix = getGlobalModelMatrix(lightNode);
                const lightPosition = vec3.create();
                mat4.getTranslation(lightPosition, lightMatrix);

                this.device.queue.writeBuffer(lightUniformBuffer, 0, lightPosition);
                this.device.queue.writeBuffer(lightUniformBuffer, 12, new Float32Array([lightComponent.ambient]));

                return { binding: i, resource: { buffer: lightUniformBuffer } };
            });

            // Create the bind group for exactly 2 lights
            lightBindGroup = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(3),
                entries: entries
            });
        }


        // --- Render scene ---
        this.scene.traverse(node => {
            if (node instanceof GameObject && node.mesh) {
                const modelMatrix = getGlobalModelMatrix(node);
                const viewProjMatrix = mat4.create().multiply(projectionMatrix).multiply(viewMatrix);

                const normalMatrix = mat4.create();
                mat4.copy(normalMatrix, modelMatrix);
                mat4.invert(normalMatrix, normalMatrix);
                mat4.transpose(normalMatrix, normalMatrix);

                this.device.queue.writeBuffer(node.modelBuffer, 0, modelMatrix);
                this.device.queue.writeBuffer(node.viewProjBuffer, 0, viewProjMatrix);
                this.device.queue.writeBuffer(node.normalBuffer, 0, normalMatrix);

                renderPass.setBindGroup(0, node.bindGroup);

                // --- Nastavimo bind group za luč ---
                if (lightBindGroup) renderPass.setBindGroup(3, lightBindGroup); // light0

                renderPass.setVertexBuffer(0, node.mesh.vertexBuffer);
                renderPass.setIndexBuffer(node.mesh.indexBuffer, 'uint32');
                renderPass.drawIndexed(node.mesh.indexCount);
            }
        });

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    resize({ displaySize: { width, height }}) {
        this.camera.getComponentOfType(Camera).aspect = width / height;
        this.depthTexture = this.createDepthTexture(width, height);
    }

    createDepthTexture(width, height) {
        return this.device.createTexture({
            size: [width, height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }
}