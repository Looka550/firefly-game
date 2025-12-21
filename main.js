import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import { initInput, parseInput } from './PlayerInput.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    Engine
} from './SceneUtils.js';

import { GameObject } from './GameObject.js';
import { Cube } from './Cube.js';

// Initialize WebGPU
const adapter = await navigator.gpu.requestAdapter();
export const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device, format });

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

// Create the depth texture
const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// Fetch and compile shaders
const code = await fetch('shader.wgsl').then(response => response.text());
const module = device.createShaderModule({ code });

// texture - vaje 4
const imageBitmap = await fetch('bricks.png')
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));

const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    format: 'rgba8unorm',
    usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_DST,
});

device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]);

const sampler = device.createSampler();


// Create the pipeline
const vertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        },
        {
            shaderLocation: 1,
            offset: 16,
            format: 'float32x4',
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



// Create scene objects
const scene = new Node();

const cube1 = new Cube({ translation: [0, 0, 0], scale: [10, 1, 10], euler: [0, 0, 0] });
const cube2 = new Cube({ translation: [0, 5, 0], scale: [1, 1, 1], euler: [0, 100, 0] });
//const cube3 = new Cube({ translation: [-1,0,0], rotationSpeed: [0.2, 0.3] });

scene.addChild(cube1);
scene.addChild(cube2);
//scene.addChild(cube3);

// input
initInput(canvas);

// camera

const camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({
    translation: [0, 0, 5]
}));

camera.addComponent({
    update (){
        parseInput(camera);
    }
})

scene.addChild(camera);

// Update all components
function update() {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.();
        }
    });
}

function render() {
    // Render
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0.7, 0.8, 0.9, 1],
            storeOp: 'store',
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'discard',
        },
    });
    renderPass.setPipeline(pipeline);


    // Get the required matrices
    const viewMatrix = getGlobalViewMatrix(camera);
    const projectionMatrix = getProjectionMatrix(camera);

    scene.traverse(node => {
        if(node instanceof GameObject){
            const modelMatrix = getGlobalModelMatrix(node);
            const matrix = mat4.create()
                .multiply(projectionMatrix)
                .multiply(viewMatrix)
                .multiply(modelMatrix);

            device.queue.writeBuffer(node.uniformBuffer, 0, matrix);
            renderPass.setBindGroup(0, node.bindGroup);

            renderPass.setVertexBuffer(0, node.mesh.vertexBuffer);
            renderPass.setIndexBuffer(node.mesh.indexBuffer, 'uint32');
            renderPass.drawIndexed(node.mesh.indexCount);
        }
    });

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}

function frame() {
    update();
    render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
