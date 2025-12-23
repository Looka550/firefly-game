import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import { initInput, parseInput } from './PlayerInput.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    Engine,
    loadTexture
} from './SceneUtils.js';

import { GameObject } from './GameObject.js';
import { Cube } from './Cube.js';

import { Model } from './Model.js';
import { ResizeSystem } from 'engine/systems/ResizeSystem.js';

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
function createDepthTexture(width, height) {
    return device.createTexture({
        size: [width, height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
}

let depthTexture = createDepthTexture(canvas.width, canvas.height);

// Fetch and compile shaders
const code = await fetch('shader.wgsl').then(response => response.text());
const module = device.createShaderModule({ code });

// textures

const bricksTexture = await loadTexture(new URL("./bricks.png", import.meta.url));
const blankTexture = await loadTexture(new URL("./blank.png", import.meta.url));
const monkeyTexture = await loadTexture(new URL("./webgpu/models/monkey/base.png", import.meta.url));
const catTexture = await loadTexture(new URL("./webgpu/models/cat/base.avif", import.meta.url));

export const sampler = device.createSampler({
    minFilter : 'linear',
    magFilter : 'linear',
    mipmapFilter : 'linear',
    addressModeU : 'clamp-to-edge',
    addressModeV : 'clamp-to-edge',
    addressModeW : 'clamp-to-edge',
    maxAnisotropy : 1,
});





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



// Create scene objects
const scene = new Node();


let pathcat = "./webgpu/models/cat/cat.gltf";
let pathmon = "./webgpu/models/monkey/monkey.gltf";

const cat = new Model({ translation: [2, 5, 2], scale: [1, 1, 1], euler: [0, 0, 0], texture: catTexture, gltfPath: pathcat });
await cat.createMesh(pathcat);
scene.addChild(cat);

const mon = new Model({ translation: [2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: monkeyTexture, gltfPath: pathmon });
await mon.createMesh(pathmon);
scene.addChild(mon);

const cube3 = new Cube({ translation: [-2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: bricksTexture });
scene.addChild(cube3);



const cube1 = new Cube({ translation: [0, 0, 0], scale: [10, 1, 10], euler: [0, 0, 0], texture: bricksTexture });
const cube2 = new Cube({ translation: [0, 5, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: blankTexture });

scene.addChild(cube1);
scene.addChild(cube2);

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
        if(node instanceof GameObject && node.mesh){
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

// resize system
function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
    depthTexture = createDepthTexture(width, height);
}
new ResizeSystem({ canvas, resize }).start();