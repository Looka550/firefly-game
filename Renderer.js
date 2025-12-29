import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    Engine,
} from "./SceneUtils.js";
import { quat, mat4, vec3 } from "./glm.js";
import { GameObject } from "./GameObject.js";
import { ResizeSystem } from "engine/systems/ResizeSystem.js";
import { Camera } from "./Camera.js";
import { shadowModule } from "./main.js";
import { Light } from "./Light.js";
import { lightY, near, far } from "./PlayerInput.js";

export class Renderer{
    constructor(
        device,
        scene,
        context,
        mainCamera,
        module,
        format,
        canvas,
        secondaryCamera
    ){
        this.device = device;
        this.scene = scene;
        this.context = context;
        this.mainCamera = mainCamera;
        this.module = module;
        this.secondaryCamera = secondaryCamera;

        this.currentCamera = this.mainCamera;


        // pipeline
        const vertexBufferLayout = {
            arrayStride: 52,
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x4", // position
                },
                {
                    shaderLocation: 1,
                    offset: 16,
                    format: "float32x4", // color
                },
                {
                    shaderLocation: 2,
                    offset: 32,
                    format: "float32x2", // texcoords
                },
                {
                    shaderLocation: 3,
                    offset: 40,
                    format: "float32x3", // normal
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
                targets: [{
                    format,
                    blend: {
                        color: {
                            srcFactor: "src-alpha",
                            dstFactor: "one-minus-src-alpha",
                            operation: "add",
                        },
                        alpha: {
                            srcFactor: "one",
                            dstFactor: "one-minus-src-alpha",
                            operation: "add",
                        },
                    },
                }],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
            layout: "auto",
        });


        Engine.device = device;
        Engine.pipeline = pipeline;

        // initial depth texture
        this.depthTexture = this.createDepthTexture(canvas.width, canvas.height);

        // resize system
        new ResizeSystem({ canvas, resize: this.resize.bind(this) }).start();

        this.maxLights = 32;

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

        // shadows
        

        this.shadowSize = 1024;

        this.shadowDepthTexture = device.createTexture({
            size: [this.shadowSize, this.shadowSize],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.shadowSampler = device.createSampler({
            compare: "less",
            minFilter: "linear",
            magFilter: "linear",
        });

        this.lightMatrixBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.lightMatrixBindGroup = this.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: this.shadowDepthTexture.createView() },
                { binding: 1, resource: this.shadowSampler },
                { binding: 2, resource: { buffer: this.lightMatrixBuffer } },
            ],
        });

        this.shadowPipeline = device.createRenderPipeline({
            vertex: {
                module: shadowModule,
                entryPoint: "vertex",
                buffers: [vertexBufferLayout],
            },
            fragment: {
                module: shadowModule,
                entryPoint: "fragment",
                targets: [],
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less",
            },
            layout: "auto",
        });


        this.shadowBindGroup = this.device.createBindGroup({
            layout: Engine.pipeline.getBindGroupLayout(2),
            entries: [
                {
                    binding: 0,
                    resource: this.shadowDepthTexture.createView(),
                },
                {
                    binding: 1,
                    resource: this.shadowSampler,
                },
                {
                    binding: 2,
                    resource: { buffer: this.lightMatrixBuffer },
                },
            ],
        });

    }

    render(){
        const commandEncoder = this.device.createCommandEncoder();

        // shadow render pass
        const lightView = mat4.lookAt(
            mat4.create(),
            [0, lightY, 0], // light position
            [0, 0, 0], // look at
            [0, 0, -1] // -z vector
        );

        const lightProj = mat4.ortho( // map size
            mat4.create(),
            -600, 600,
            -600, 600,
            near, far
        );

        const lightViewProj = mat4.multiply(
            mat4.create(),
            lightProj,
            lightView
        );


        const shadowPass = commandEncoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.shadowDepthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
        });

        shadowPass.setPipeline(this.shadowPipeline);

        this.scene.traverse(node => {
            if(node instanceof GameObject && node.mesh && !node.dontRender){
                node.mesh.shadowBindGroup = this.device.createBindGroup({
                    layout: this.shadowPipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: node.mesh.modelBuffer } },
                        { binding: 1, resource: { buffer: this.lightMatrixBuffer } },
                    ],
                });

                this.device.queue.writeBuffer(node.mesh.modelBuffer, 0, getGlobalModelMatrix(node));


                shadowPass.setBindGroup(0, node.mesh.shadowBindGroup);
                shadowPass.setVertexBuffer(0, node.mesh.vertexBuffer);
                shadowPass.setIndexBuffer(node.mesh.indexBuffer, "uint32");
                shadowPass.drawIndexed(node.mesh.indexCount);
            }
        });

        this.device.queue.writeBuffer(this.lightMatrixBuffer, 0, lightViewProj);

        shadowPass.end();

        // main render pass

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: [0.165, 0.161, 0.2, 1],
                storeOp: "store",
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: "clear",
                depthStoreOp: "discard",
            },
        });

        renderPass.setPipeline(Engine.pipeline);

        const viewMatrix = getGlobalViewMatrix(this.currentCamera);
        const projectionMatrix = getProjectionMatrix(this.currentCamera);

        // camera uniforms
        const cameraMatrix = getGlobalModelMatrix(this.currentCamera);
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

        const lightData = new Float32Array(this.maxLights * 12); // 12 floats per light

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
            
            lightData[base + 5] = light.intensity;
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

        this.device.queue.writeBuffer(this.lightsBuffer, this.maxLights * 48, new Uint32Array([lightObjects.length]));


        // traverse scene
        const transparents = [];
        this.scene.traverse(node => {
            if(node instanceof GameObject && node.mesh && !node.dontRender){
                if(node.transparent){
                    transparents.push(node);
                    return;
                }
                const modelMatrix = getGlobalModelMatrix(node);

                let viewProjMatrix = null;
                try{
                    viewProjMatrix = mat4.create().multiply(projectionMatrix).multiply(viewMatrix);
                }catch (error){
                    console.log("projection: " + projectionMatrix);
                    console.log("view: " + viewMatrix);
                    return;
                }


                const normalMatrix = mat4.create();
                mat4.copy(normalMatrix, modelMatrix);
                mat4.invert(normalMatrix, normalMatrix);
                mat4.transpose(normalMatrix, normalMatrix);

                this.device.queue.writeBuffer(node.mesh.modelBuffer, 0, modelMatrix);
                this.device.queue.writeBuffer(node.mesh.viewProjBuffer, 0, viewProjMatrix);
                this.device.queue.writeBuffer(node.mesh.normalBuffer, 0, normalMatrix);

                renderPass.setBindGroup(0, node.mesh.bindGroup);    
                renderPass.setBindGroup(2, this.shadowBindGroup);

                renderPass.setBindGroup(3, this.lightsBindGroup);
                renderPass.setBindGroup(1, this.cameraBindGroup);

                renderPass.setVertexBuffer(0, node.mesh.vertexBuffer);
                renderPass.setIndexBuffer(node.mesh.indexBuffer, "uint32");
                renderPass.drawIndexed(node.mesh.indexCount);
            }
        });

        transparents.forEach(node => { // render transparents last
            const modelMatrix = getGlobalModelMatrix(node);

            let viewProjMatrix = null;
            try{
                viewProjMatrix = mat4.create().multiply(projectionMatrix).multiply(viewMatrix);
            }catch (error){
                console.log("projection: " + projectionMatrix);
                console.log("view: " + viewMatrix);
                return;
            }


            const normalMatrix = mat4.create();
            mat4.copy(normalMatrix, modelMatrix);
            mat4.invert(normalMatrix, normalMatrix);
            mat4.transpose(normalMatrix, normalMatrix);

            this.device.queue.writeBuffer(node.mesh.modelBuffer, 0, modelMatrix);
            this.device.queue.writeBuffer(node.mesh.viewProjBuffer, 0, viewProjMatrix);
            this.device.queue.writeBuffer(node.mesh.normalBuffer, 0, normalMatrix);

            renderPass.setBindGroup(0, node.mesh.bindGroup);    
            renderPass.setBindGroup(2, this.shadowBindGroup);

            renderPass.setBindGroup(3, this.lightsBindGroup);
            renderPass.setBindGroup(1, this.cameraBindGroup);

            renderPass.setVertexBuffer(0, node.mesh.vertexBuffer);
            renderPass.setIndexBuffer(node.mesh.indexBuffer, "uint32");
            renderPass.drawIndexed(node.mesh.indexCount);
        });

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    resize({ displaySize: { width, height }}) {
        this.currentCamera.getComponentOfType(Camera).aspect = width / height;
        this.depthTexture = this.createDepthTexture(width, height);
    }

    createDepthTexture(width, height) {
        return this.device.createTexture({
            size: [width, height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }
}