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

        this.maxLights = 16;

        this.lightsUniformBuffer = this.device.createBuffer({
            size: this.maxLights * 48 + 32, // = 784 -> zaokroženo na 800

            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.lightsBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(3),
            entries: [{
                binding: 0,
                resource: { buffer: this.lightsUniformBuffer },
            }],
        });

        this.cameraUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.cameraBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer },
            }],
        });


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

        // camera uniforms
        const cameraMatrix = getGlobalModelMatrix(this.camera);
        const cameraPosition = vec3.create();
        mat4.getTranslation(cameraPosition, cameraMatrix);

        this.device.queue.writeBuffer(
            this.cameraUniformBuffer,
            0,
            new Float32Array([
                cameraPosition[0],
                cameraPosition[1],
                cameraPosition[2],
                0.0,
            ])
        );


        // --- Collect lights (max 16) ---
        const lightNodes = [];
        this.scene.traverse(node => {
            if (node.getComponentOfType?.(Light)) {
                lightNodes.push(node);
            }
        });

        const lightCount = Math.min(lightNodes.length, this.maxLights);

        // Build CPU-side buffer
        const lightData = new Float32Array(16 * 12); // 12 floats per light

        for (let i = 0; i < lightCount; i++) {
            const lightNode = lightNodes[i];
            const light = lightNode.getComponentOfType(Light);

            const lightMatrix = getGlobalModelMatrix(lightNode);
            const pos = vec3.create();
            mat4.getTranslation(pos, lightMatrix);

            const base = i * 12;

            // position (vec3 + padding)
            lightData[base + 0] = pos[0];
            lightData[base + 1] = pos[1];
            lightData[base + 2] = pos[2];
            lightData[base + 3] = 0.0;

            // ambient
            lightData[base + 4] = light.ambient;
            lightData[base + 5] = 0.0;
            lightData[base + 6] = 0.0;
            lightData[base + 7] = 0.0;

            // attenuation
            lightData[base + 8]  = light.attenuation ?? 0.02;
            lightData[base + 9]  = 0.0;
            lightData[base + 10] = 0.0;
            lightData[base + 11] = 0.0;

            // base + 5..7 = padding
        }

        // Write lights array
        this.device.queue.writeBuffer(
            this.lightsUniformBuffer,
            0,
            lightData
        );

        this.device.queue.writeBuffer(
            this.lightsUniformBuffer,
            16 * 48, // <-- ZA LUČMI
            new Uint32Array([lightCount])
        );



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
                renderPass.setBindGroup(3, this.lightsBindGroup);
                renderPass.setBindGroup(1, this.cameraBindGroup);

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