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


        // pipeline
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

        // initial depth texture
        this.depthTexture = this.createDepthTexture(canvas.width, canvas.height);

        // resize system
        new ResizeSystem({ canvas, resize: this.resize.bind(this) }).start();

        this.maxLights = 16;

        this.lightsBuffer = this.device.createBuffer({
            size: this.maxLights * 48 + 32,

            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.lightsBindGroup = this.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(3),
            entries: [
                { binding: 0, resource: { buffer: this.lightsBuffer } },
            ],
        });

        this.cameraBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.cameraBindGroup = this.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: this.cameraBuffer } },
            ],
        });
    }

    render(){
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

        renderPass.setPipeline(Engine.pipeline);

        const viewMatrix = getGlobalViewMatrix(this.camera);
        const projectionMatrix = getProjectionMatrix(this.camera);

        // camera uniforms
        const cameraMatrix = getGlobalModelMatrix(this.camera);
        const cameraPosition = vec3.create();
        mat4.getTranslation(cameraPosition, cameraMatrix);

        const cameraData = new Float32Array([
            cameraPosition[0],
            cameraPosition[1],
            cameraPosition[2],
            0.0,
        ]);

        this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData);


        // render lights
        const lightObjects = [];
        this.scene.traverse(node => {
            if(node.getComponentOfType?.(Light)){
                lightObjects.push(node);
            }
        });

        if(lightObjects.length > this.maxLights){
            console.log("TOO MANY LIGHTS");
        }

        const lightData = new Float32Array(16 * 12); // 12 floats per light

        for(let i = 0; i < lightObjects.length; i++){
            const lightObject = lightObjects[i];
            const light = lightObject.getComponentOfType(Light);

            const lightMatrix = getGlobalModelMatrix(lightObject);
            const pos = vec3.create();
            mat4.getTranslation(pos, lightMatrix);

            const base = i * 12;

            // position (vec3 + padding)
            lightData[base + 0] = pos[0];
            lightData[base + 1] = pos[1];
            lightData[base + 2] = pos[2];
            // ambient
            lightData[base + 3] = light.ambient

            // attenuation
            if(light.attenuation){
                lightData[base + 4]  = light.attenuation;
            }
            else{
                lightData[base + 4]  = 0.02;
            }
            
            lightData[base + 5] = 0.0;
            lightData[base + 6] = 0.0;
            lightData[base + 7] = 0.0;
            lightData[base + 8] = 0.0;
            lightData[base + 9]  = 0.0;
            lightData[base + 10] = 0.0;
            lightData[base + 11] = 0.0;

            // 0.0 = padding
        }

        // write lights buffers
        this.device.queue.writeBuffer(this.lightsBuffer, 0, lightData);

        this.device.queue.writeBuffer(this.lightsBuffer, 16 * 48, new Uint32Array([lightObjects.length]));


        // traverse scene
        this.scene.traverse(node => {
            if(node instanceof GameObject && node.mesh && !node.dontRender){
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