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
import { BoxCollider } from './BoxCollider.js';
import { Physics } from './Physics.js';

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

// Fetch and compile shaders
const code = await fetch('shader.wgsl').then(response => response.text());
const module = device.createShaderModule({ code });

// textures

const monkeyNormal = await loadTexture(new URL("./webgpu/models/monkey/normal.webp", import.meta.url));

const bricksTexture = await loadTexture(new URL("./bricks.png", import.meta.url));
const blankTexture = await loadTexture(new URL("./blank.png", import.meta.url));
const monkeyTexture = await loadTexture(new URL("./webgpu/models/monkey/base.png", import.meta.url));
const catTexture = await loadTexture(new URL("./webgpu/models/cat/base.avif", import.meta.url));
export const blankTextureView = blankTexture.createView();

export const sampler = device.createSampler({
    minFilter : 'linear',
    magFilter : 'linear',
    mipmapFilter : 'linear',
    addressModeU : 'clamp-to-edge',
    addressModeV : 'clamp-to-edge',
    addressModeW : 'clamp-to-edge',
    maxAnisotropy : 1,
});







// Create scene objects
const scene = new Node();
export const physics = new Physics();

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

import { Renderer } from './Renderer.js';
const renderer = new Renderer(device, scene, context, camera, module, format, canvas);

let pathcat = "./webgpu/models/cat/cat.gltf";
let pathmon = "./webgpu/models/monkey/monkey.gltf";

const cat = new Model({ translation: [2, 5, 2], scale: [1, 1, 1], euler: [0, 0, 0], texture: catTexture, gltfPath: pathcat });
await cat.createMesh(pathcat);
scene.addChild(cat);

const mon = new Model({ translation: [2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: monkeyTexture, gltfPath: pathmon });
await mon.createMesh(pathmon);
scene.addChild(mon);

//const cube3 = new Cube({ translation: [-2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: bricksTexture });
//scene.addChild(cube3);


const ambient = 0.2;


import { Light } from './Light.js';
const light = new GameObject({
    name: "Light",
});

const lightPosition = [2, 7, -2];

// dodamo transformacijo (položaj luči)
light.addComponent(new Transform({
    translation: lightPosition,
}));

// dodamo komponento luči (ambientni faktor)
light.addComponent(new Light({
    ambient: ambient, // lahko prilagodiš svetlost ambienta
}));
scene.addChild(light);

const lightMarker = new Model({ translation: lightPosition, scale: [0.1, 0.1, 0.1], texture: blankTexture, gltfPath: pathmon });
await lightMarker.createMesh(pathmon);
// Uporabi teksturo ali material, ki je svetel, npr. rumena barva
scene.addChild(lightMarker);




const light2 = new GameObject({
    name: "Light",
});

const lightPosition2 = [2, 3, -2];

// dodamo transformacijo (položaj luči)
light2.addComponent(new Transform({
    translation: lightPosition2,
}));

// dodamo komponento luči (ambientni faktor)
light2.addComponent(new Light({
    ambient: 0, // lahko prilagodiš svetlost ambienta
}));
scene.addChild(light2);

const lightMarker2 = new Model({ translation: lightPosition2, scale: [0.1, 0.1, 0.1], texture: blankTexture, gltfPath: pathmon });
await lightMarker2.createMesh(pathmon);
// Uporabi teksturo ali material, ki je svetel, npr. rumena barva
scene.addChild(lightMarker2);


const light3 = new GameObject({
    name: "Light",
});

const lightPosition3 = [2, 5, 4];

// dodamo transformacijo (položaj luči)
light3.addComponent(new Transform({
    translation: lightPosition3,
}));

// dodamo komponento luči (ambientni faktor)
light3.addComponent(new Light({
    ambient: 0, // lahko prilagodiš svetlost ambienta
}));
scene.addChild(light3);

const lightMarker3 = new Model({ translation: lightPosition3, scale: [0.1, 0.1, 0.1], texture: blankTexture, gltfPath: pathmon });
await lightMarker3.createMesh(pathmon);
// Uporabi teksturo ali material, ki je svetel, npr. rumena barva
scene.addChild(lightMarker3);

const cube1 = new Cube({ translation: [0, 0, 0], scale: [10, 1, 10], euler: [0, 0, 0], texture: bricksTexture });
const cube2 = new Cube({ translation: [0, 5, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: blankTexture });

scene.addChild(cube1);
scene.addChild(cube2);


// collisions
const col = new BoxCollider({ texture: blankTexture, debug: true, dynamic: true, name: "monkey" });
mon.addComponent(col);

const col2 = new BoxCollider({ texture: blankTexture, debug: true, dynamic: true, name: "cat" });
cat.addComponent(col2);


const mon2 = new Model({ translation: [0, 5, 2], scale: [1, 1, 1], euler: [0, 0, 0], texture: monkeyTexture, gltfPath: pathmon, normalTexture: monkeyNormal });
await mon2.createMesh(pathmon);
scene.addChild(mon2);

import { PlaneCollider } from './PlaneCollider.js';

const plane = new PlaneCollider({ texture: blankTexture, debug: true, name: "plane" });
scene.addChild(plane);

plane.move({y:3});

mon.setTransform({ scale: [1, 1, 1], translation: [1, 5, 3], euler: [0, 0, 0] });
mon.setPosition([1, 5, 4]);
mon.setRotation([45, 0, 0]);

plane.setRotation([20, 0, 0])

mon.move({x : -0.1, z: -2.4, y: 6.4});
cat.move({y: 0.6});

mon2.move({z: -5, x: 2});

col.collides();
col2.collides();

// input
initInput(canvas);

// camera


// Update all components
function update() {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.();
        }
    });
}


function frame() {
    update();
    renderer.render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);