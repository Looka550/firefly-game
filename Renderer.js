import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    Engine,
} from './SceneUtils.js';
import { quat, mat4 } from './glm.js';
import { GameObject } from './GameObject.js';
import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { Camera } from './Camera.js';

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
            arrayStride: 40,
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
    }

    newScene(newScene){
        this.scene = newScene;
    }

    render() {
        // render
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


        // Get the required matrices
        const viewMatrix = getGlobalViewMatrix(this.camera);
        const projectionMatrix = getProjectionMatrix(this.camera);

        this.scene.traverse(node => {
            if(node instanceof GameObject && node.mesh){
                const modelMatrix = getGlobalModelMatrix(node);
                const matrix = mat4.create()
                    .multiply(projectionMatrix)
                    .multiply(viewMatrix)
                    .multiply(modelMatrix);

                this.device.queue.writeBuffer(node.uniformBuffer, 0, matrix);
                renderPass.setBindGroup(0, node.bindGroup);

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