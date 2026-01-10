import { quat, mat4, vec3 } from './glm.js';
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
import { PlaneCollider } from './PlaneCollider.js';
import { Sphere } from './Sphere.js';
import { Firefly } from './Firefly.js';
import { Cylinder } from './Cylinder.js';
import { Tree } from './Tree.js';
import { Light } from './Light.js';
import { TransformAnimator } from './TransformAnimator.js';
import { Net } from "./Net.js";
import { Lamp } from './Lamp.js';
import { Renderer } from './Renderer.js';
import { WorldGenerator } from './WorldGenerator.js';
import { trueGrounded, getActions } from './PlayerInput.js';

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

// shaders
const code = await fetch("shader.wgsl").then(response => response.text());
const module = device.createShaderModule({ code });
export const shadowModule = device.createShaderModule({
    code: await fetch('./shadow.wgsl').then(r => r.text()),
});

// textures

const blankTexture = await loadTexture(new URL("./blank.png", import.meta.url));
const grassNor = await loadTexture(new URL("./assets/grass/normal.png", import.meta.url));

const grassTexture = await loadTexture(new URL("./assets/grass2/grass.jpg", import.meta.url));
const leavesTexture = await loadTexture(new URL("./assets/leaves/leaves.jpg", import.meta.url));
const trunkTexture = await loadTexture(new URL("./assets/trunk/trunk.jpg", import.meta.url));
const moonTexture = await loadTexture(new URL("./assets/moon/textures/base.png", import.meta.url));
const moonNormal = await loadTexture(new URL("./assets/moon/textures/normal.jpg", import.meta.url));

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

// initialization
export let animationSpeed = 1;

// PARAMETERS
const ambient = 0.05;
export const firefliesCount = 2;
const treesCount = 40;
export const globalDebugMode = false;

// Create scene objects
export const scene = new Node("scene");
export const physics = new Physics();
export const playerWrapper = new GameObject();

const camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({
    translation: [0, 8, 2]
}));

camera.addComponent({
    update(dt){
        parseInput(playerWrapper, player, false, dt);
    }
})


export const secondaryCamera = new GameObject({ translation: [-368, 46, -35], euler: [174, -90, -180]});
secondaryCamera.addComponent(new Camera());

export const renderer = new Renderer(device, scene, context, camera, module, format, canvas, secondaryCamera);

const ambientLight = new GameObject({name: "Ambient Light"});
ambientLight.addComponent(new Light({
    ambient: ambient,
    intensity: 0
}));
scene.addChild(ambientLight);

const moonY = 100;
export const moon = new Sphere({ translation: [0, 400 - moonY, 0], scale: [50, 50, 50], euler: [90, 0, 0], texture: moonTexture, normalTexture: moonNormal, color: [0.251, 0.208, 0.208, 1]});
scene.addChild(moon);

const moonAssistPositions = [[0, 335 - moonY, 0], [0, 335 - moonY, -40]];
for(let i = 0; i < moonAssistPositions.length; i++){
    const moonAssist = new GameObject({name: "Moon Assist Light"});
    moonAssist.addComponent(new Transform({
        translation: moonAssistPositions[i]
    }));
    moonAssist.addComponent(new Light({
        ambient: 0,
        intensity: 40
    }));
    scene.addChild(moonAssist);
}


// world building

const plane1 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNor, translation: [-10, -10, 0], scale: [300, 0, 30], name: "flat grass1", tags: ["flat"] });
scene.addChild(plane1);

const slope1 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNor, debug: true, translation: [-10, -3, -55], scale: [300, 0, 30], euler: [14.5, 0, 0], name: "big slope", tags: ["slope"] });
scene.addChild(slope1);

const slope2 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNor, debug: true, translation: [-10, -7, 52], scale: [300, 0, 30], euler: [173, 0, 0], name: "small slope", tags: ["slope"] });
scene.addChild(slope2);

const plane2 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNor, debug: true, translation: [-10, -3.344, 111.5], scale: [300, 0, 32], name: "flat grass2", tags: ["flat"] }); // [-10, -3.344, 111.5]
scene.addChild(plane2);

const plane3 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNor, debug: true, translation: [-10, -3.344, 171.5], scale: [300, 0, 28], name: "flat grass3", tags: ["flat"] }); // [-10, -3.344, 171.5]
scene.addChild(plane3);

const plane4 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNor, translation: [-10, 4.503, -114], scale: [300, 0, 32], name: "flat grass-1", tags: ["flat"] });
scene.addChild(plane4);

const plane5 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNor, translation: [-10, 4.503, -174], scale: [300, 0, 28], name: "flat grass-2", tags: ["flat"] });
scene.addChild(plane5);


// NORTH WORLD BORDER
const borderN = new GameObject({ translation: [0, 15, -198], texture: blankTexture});
const colN = new BoxCollider({ scale: [300, 30, 1], texture: blankTexture, debug: globalDebugMode, dynamic: false, name: "border north", tags: ["border", "north"] });
borderN.addComponent(colN);
scene.addChild(borderN);
// SOUTH WORLD BORDER
const borderS = new GameObject({ translation: [0, 15, 198], texture: blankTexture});
const colS = new BoxCollider({ scale: [300, 30, 1], texture: blankTexture, debug: globalDebugMode, dynamic: false, name: "border south", tags: ["border", "south"] });
borderS.addComponent(colS);
scene.addChild(borderS);
// EAST WORLD BORDER
const borderE = new GameObject({ translation: [286, 15, 0], texture: blankTexture});
const colE = new BoxCollider({ scale: [1, 30, 205], texture: blankTexture, debug: globalDebugMode, dynamic: false, name: "border east", tags: ["border", "east"] });
borderE.addComponent(colE);
scene.addChild(borderE);
//WEST WORLD BORDER
const borderW = new GameObject({ translation: [-286, 15, 0], texture: blankTexture});
const colW = new BoxCollider({ scale: [1, 30, 205], texture: blankTexture, debug: globalDebugMode, dynamic: false, name: "border west", tags: ["border", "west"] });
borderW.addComponent(colW);
scene.addChild(borderW);

export const player = new GameObject({translation: [0, 0, 0]});
player.addChild(camera);
scene.addChild(secondaryCamera);

//console.log("spawned particle at: translation - " + playerWrapper.transform.translation + ", euler - " + player.transform.getEuler());
export const particle = new Cube({ texture: blankTexture, translation: [0, 0, -9]});
player.addChild(particle);

export const playerCol = new BoxCollider({ translation: [0, 0, 0], scale: [1, 3, 1], texture: blankTexture, debug: true, dynamic: false, name: "player", gravity: false });
playerWrapper.addComponent(playerCol);


export const generator = new WorldGenerator({ texture: blankTexture, leavesTexture: leavesTexture, trunkTexture: trunkTexture, fireflyTexture: blankTexture, particleTexture: moonTexture, minX: -310, maxX: 280, minZ: -200, maxZ: 200, checkpoints: [[14, -84], [0, -25], [0, 27], [0, 81.5], [6, 200]]});
generator.generateTrees(treesCount, 20);
generator.generateFireflies(firefliesCount, 5, 5);

playerCol.addComponent({
    update(dt){
        playerWrapper.nextMove ??= [0.05, -0.20, 0.05]; // non-jumping gravity

        playerWrapper.move({y: playerWrapper.nextMove[1]});
        let onSlope = false;

        const collisions = playerCol.collides();

        collisions.forEach(col => {
            if(col instanceof PlaneCollider) {
                if(col.tags.includes("slope")){
                    onSlope = true;
                    trueGrounded();
                }
                else if(col.tags.includes("flat")){
                    playerWrapper.move({y: -playerWrapper.nextMove[1]});
                    trueGrounded();
                }
                else{
                    console.log("none of these");
                }

            }
            else{
                if(col.tags.includes("border")){
                    //console.log(playerCol.transform.translation + " : " + playerCol.transform.scale);
                    if(col.tags.includes("north")){
                        physics.pushBorder(playerWrapper, playerCol, [0, 0, playerWrapper.nextMove[2]]);
                    }
                    if(col.tags.includes("south")){
                        physics.pushBorder(playerWrapper, playerCol, [0, 0, -playerWrapper.nextMove[2]]);
                    }
                    if(col.tags.includes("east")){
                        physics.pushBorder(playerWrapper, playerCol, [-playerWrapper.nextMove[0], 0, 0]);
                    }
                    if(col.tags.includes("west")){
                        physics.pushBorder(playerWrapper, playerCol, [playerWrapper.nextMove[0], 0, 0]);
                    }
                }
            }
        });

        if(onSlope){
            physics.climbSlope(playerWrapper, playerCol);
        }

        
    }
});


// collisions

export const net = new Net({texture: blankTexture, scale: [1, 1, 1], translation: [8, 2, -9], euler: [45, 10, 0]}); // on player
player.addChild(net);

export let assistLight1 = new GameObject({name: "Player Assist Light"});
/*
assistLight1.addComponent(new Transform({
    translation: [0, 0, 0]
}));
assistLight1.addComponent(new Light({
    ambient: 0,
    intensity: 2
}));
playerWrapper.addChild(assistLight1);
*/
player.addComponent({
    update(){
        getActions();
    }
});

export const lamp = new Lamp({texture: blankTexture, scale: [1, 1, 1], translation: [-4, 3, -12]});
player.addChild(lamp);

const playerBody = new GameObject({ translation: [0, 8, 14] });
player.addChild(playerBody);

const head = new Sphere({texture: blankTexture, scale: [2, 2, 1], translation: [0, 0, 0], euler: [0, 0, 0]});
playerBody.addChild(head);
const neck = new Sphere({texture: blankTexture, scale: [2, 4, 1], translation: [0, -4, 0], euler: [0, 0, 0]});
playerBody.addChild(neck);
const body = new Cube({texture: blankTexture, scale: [4, 10, 1], translation: [0, -12, 0], euler: [0, 0, 0]});
playerBody.addChild(body);
const armL1 = new Cube({texture: blankTexture, scale: [4, 0.75, 1], translation: [-8, -9, 0], euler: [0, 0, -10]});
playerBody.addChild(armL1);
const armL2 = new Cube({texture: blankTexture, scale: [1, 0.75, 6.5], translation: [-12, -9, -5.5], euler: [0, 0, 0]});
playerBody.addChild(armL2);

playerWrapper.addChild(player);
scene.addChild(playerWrapper);

// input
initInput(canvas);


// Update all components
function update(dt = 1) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(dt);
        }
    });
}



let lastTime = performance.now();

function frame(time) {
    const factor = 150;
    const dt = (time - lastTime) / 1000 * factor; // seconds
    lastTime = time;
    //console.log("dt: " + dt);
    animationSpeed = Math.abs(dt);

    update(dt);
    renderer.render();

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);