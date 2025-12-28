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
        export const shadowModule = device.createShaderModule({
            code: await fetch('./shadow.wgsl').then(r => r.text()),
        });

// textures

const monkeyNormal = await loadTexture(new URL("./webgpu/models/monkey/normal.webp", import.meta.url));

const bricksTexture = await loadTexture(new URL("./bricks.png", import.meta.url));
const blankTexture = await loadTexture(new URL("./blank.png", import.meta.url));
const monkeyTexture = await loadTexture(new URL("./webgpu/models/monkey/base.png", import.meta.url));
const catTexture = await loadTexture(new URL("./webgpu/models/cat/base.avif", import.meta.url));
const grassTex = await loadTexture(new URL("./assets/grass/base.jpg", import.meta.url));
const grassNor = await loadTexture(new URL("./assets/grass/normal.png", import.meta.url));

const grassTexture = await loadTexture(new URL("./assets/grass2/grass.jpg", import.meta.url));
const leavesTexture = await loadTexture(new URL("./assets/leaves/leaves.jpg", import.meta.url));
const trunkTexture = await loadTexture(new URL("./assets/trunk/trunk.jpg", import.meta.url));
const grassNormal = await loadTexture(new URL("./assets/grass2/normal.avif", import.meta.url));
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







// Create scene objects
export const scene = new Node("scene");
export const physics = new Physics();

const camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({
    translation: [0, 0, 9]
}));

camera.addComponent({
    update(){
        parseInput(player, true);
    }
})


//scene.addChild(camera);

const renderer = new Renderer(device, scene, context, camera, module, format, canvas);

let pathcat = "./webgpu/models/cat/cat.gltf";
let pathmon = "./webgpu/models/monkey/monkey.gltf";


//const cube3 = new Cube({ translation: [-2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: bricksTexture });
//scene.addChild(cube3);


const ambient = 0.5;

/*
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
*/

const light3 = new GameObject({
    name: "Light",
});

const lightPosition3 = [0, 200, 0];

export const moon = new Sphere({ translation: [0, 400, 0], scale: [50, 50, 50], euler: [90, 0, 0], texture: moonTexture, normalTexture: moonNormal, color: [0.251, 0.208, 0.208, 1]});
scene.addChild(moon);

const assistIntensity = 100;

const moonAssist1 = new GameObject({name: "Light"});
moonAssist1.addComponent(new Transform({
    translation: [0, 400, 100]
}));
moonAssist1.addComponent(new Light({
    ambient: 0,
    intensity: assistIntensity
}));
scene.addChild(moonAssist1);

const moonAssist2 = new GameObject({name: "Light"});
moonAssist2.addComponent(new Transform({
    translation: [0, 400, -100]
}));
moonAssist2.addComponent(new Light({
    ambient: 0,
    intensity: assistIntensity
}));
scene.addChild(moonAssist2);

const moonAssist3 = new GameObject({name: "Light"});
moonAssist3.addComponent(new Transform({
    translation: [100, 400, 0]
}));
moonAssist3.addComponent(new Light({
    ambient: 0,
    intensity: assistIntensity
}));
scene.addChild(moonAssist3);

const moonAssist4 = new GameObject({name: "Light"});
moonAssist4.addComponent(new Transform({
    translation: [-100, 400, 0]
}));
moonAssist4.addComponent(new Light({
    ambient: 0,
    intensity: assistIntensity
}));
scene.addChild(moonAssist4);

const moonAssist5 = new GameObject({name: "Light"});
moonAssist5.addComponent(new Transform({
    translation: [0, 300, 0]
}));
moonAssist5.addComponent(new Light({
    ambient: 0,
    intensity: assistIntensity * 15
}));
scene.addChild(moonAssist5);


/*
// dodamo transformacijo (položaj luči)
light3.addComponent(new Transform({
    translation: lightPosition3,
}));

// dodamo komponento luči (ambientni faktor)
light3.addComponent(new Light({
    ambient: 0.05, // lahko prilagodiš svetlost ambienta
    intensity: 400.0
}));
scene.addChild(light3);

const lightMarker3 = new Model({ translation: [lightPosition3[0], lightPosition3[1] + 5, lightPosition3[2]], scale: [1, 1, 1], texture: blankTexture, gltfPath: pathmon });
await lightMarker3.createMesh(pathmon);
// Uporabi teksturo ali material, ki je svetel, npr. rumena barva
scene.addChild(lightMarker3);
*/
const cube1 = new Cube({ translation: [0, 0, 0], scale: [10, 1, 10], euler: [0, 0, 0], texture: bricksTexture });
const cube2 = new Cube({ translation: [0, 5, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: blankTexture });

scene.addChild(cube1);
scene.addChild(cube2);

// world building

const plane1 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNormal, translation: [-10, -10, 0], scale: [300, 0, 30], name: "flat grass1", tags: ["flat"] });
scene.addChild(plane1);

const slope1 = new PlaneCollider({ texture: grassTexture, debug: true, translation: [-10, -3, -55], scale: [300, 0, 30], euler: [14.5, 0, 0], name: "big slope", tags: ["slope"] });
scene.addChild(slope1);

const slope2 = new PlaneCollider({ texture: grassTexture, debug: true, translation: [-10, -7, 52], scale: [300, 0, 30], euler: [173, 0, 0], name: "small slope", tags: ["slope"] });
scene.addChild(slope2);

const plane2 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNormal, debug: true, translation: [-10, -3.344, 111.5], scale: [300, 0, 30], name: "flat grass2", tags: ["flat"] }); // [-10, -3.344, 111.5]
scene.addChild(plane2);

const plane3 = new PlaneCollider({ texture: grassTexture, normalTexture: grassNormal, debug: true, translation: [-10, -3.344, 171.5], scale: [300, 0, 30], name: "flat grass3", tags: ["flat"] }); // [-10, -3.344, 171.5]
scene.addChild(plane3);

const plane4 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNormal, translation: [-10, 4.503, -114], scale: [300, 0, 30], name: "flat grass-1", tags: ["flat"] });
scene.addChild(plane4);

const plane5 = new PlaneCollider({ texture: grassTexture, debug: true, normalTexture: grassNormal, translation: [-10, 4.503, -174], scale: [300, 0, 30], name: "flat grass-2", tags: ["flat"] });
scene.addChild(plane5);


// NORTH WORLD BORDER
const borderN = new GameObject({ translation: [0, 15, -204], texture: blankTexture});
const colN = new BoxCollider({ scale: [300, 30, 1], texture: blankTexture, debug: false, dynamic: false, name: "border north", tags: ["border", "north"] });
borderN.addComponent(colN);
scene.addChild(borderN);
// SOUTH WORLD BORDER
const borderS = new GameObject({ translation: [0, 15, 201.5], texture: blankTexture});
const colS = new BoxCollider({ scale: [300, 30, 1], texture: blankTexture, debug: false, dynamic: false, name: "border south", tags: ["border", "south"] });
borderS.addComponent(colS);
scene.addChild(borderS);
// EAST WORLD BORDER
const borderE = new GameObject({ translation: [286, 15, 0], texture: blankTexture});
const colE = new BoxCollider({ scale: [1, 30, 205], texture: blankTexture, debug: false, dynamic: false, name: "border east", tags: ["border", "east"] });
borderE.addComponent(colE);
scene.addChild(borderE);
//WEST WORLD BORDER
const borderW = new GameObject({ translation: [-286, 15, 0], texture: blankTexture});
const colW = new BoxCollider({ scale: [1, 30, 205], texture: blankTexture, debug: false, dynamic: false, name: "border west", tags: ["border", "west"] });
borderW.addComponent(colW);
scene.addChild(borderW);

const player = new GameObject();
player.addChild(camera);
const playerCol = new BoxCollider({ scale: [1, 3, 1], texture: blankTexture, debug: false, dynamic: false, name: "player", gravity: false });
player.addComponent(playerCol);

/*
const A = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [280, 1, 200]});
scene.addChild(A);
const B = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [-310, 1, 200]});
scene.addChild(B);
const C = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [-310, 1, -200]});
scene.addChild(C);
const D = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [280, 1, -200]});
scene.addChild(D);

const E = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [0, 14, -84]});
scene.addChild(E);
const F = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [0, 0, -25]});
scene.addChild(F);
const G = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [0, 0, 27]});
scene.addChild(G);
const H = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [0, 6, 81.5]});
scene.addChild(H);
*/

const generator = new WorldGenerator({ texture: blankTexture, leavesTexture: leavesTexture, trunkTexture: trunkTexture, fireflyTexture: blankTexture, minX: -310, maxX: 280, minZ: -200, maxZ: 200, checkpoints: [[14, -84], [7, -25], [0, 27], [3, 81.5], [6, 200]]});
generator.generateTrees(20, 20);
generator.generateFireflies(20, 5, 5);


playerCol.addComponent({
    update(){
        player.nextMove ??= [0.05, -0.00, 0.05]; // -0.05 = gravity

        player.move({y: player.nextMove[1]});
        let onSlope = false;

        const collisions = playerCol.collides();

        collisions.forEach(col => {
            if(col instanceof PlaneCollider) {
                if(col.tags.includes("slope")){
                    onSlope = true;
                }
                else if(col.tags.includes("flat")){
                    player.move({y: -player.nextMove[1]});
                }
                else{
                    console.log("none of these");
                }
                console.log(col.name + " : " + "player");
            }
            else{
                if(col.tags.includes("border")){
                    if(col.tags.includes("north")){
                        physics.pushBorder(player, playerCol, [0, 0, player.nextMove[2]]);
                    }
                    if(col.tags.includes("south")){
                        physics.pushBorder(player, playerCol, [0, 0, -player.nextMove[2]]);
                    }
                    if(col.tags.includes("east")){
                        physics.pushBorder(player, playerCol, [-player.nextMove[0], 0, 0]);
                    }
                    if(col.tags.includes("west")){
                        physics.pushBorder(player, playerCol, [player.nextMove[0], 0, 0]);
                    }
                }
            }
        });

        if(onSlope){
            physics.climbSlope(player, playerCol);
        }
    }
});

// world objects
/*
const pathfirefly = "./assets/firefly2/scene.gltf";
const fireflyTexture = await loadTexture(new URL("./assets/firefly2/textures/Firefly_baseColor.png", import.meta.url));
const f = new Model({ translation: [-1, 5, -1], scale: [1, 1, 1], euler: [0, 0, 0], texture: fireflyTexture, gltfPath: pathfirefly });
await f.createMesh(pathfirefly);
scene.addChild(f);
*/
const firefly = new Firefly({texture: blankTexture, scale: [0.3, 0.3, 0.3]});
scene.addChild(firefly);
const firefly2 = new Firefly({translation: [-12, 5.5, 177], texture: blankTexture, scale: [0.6, 0.6, 0.6]});
scene.addChild(firefly2);

const lightObj = new GameObject({translation: [-25, 5.5, 177], texture: blankTexture, scale: [0.6, 0.6, 0.6]});
const lightTest = new Light({intensity: 3.0});
lightObj.addComponent(lightTest);
scene.addChild(lightObj);


const s = new Sphere({ translation: [-5, 5, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: blankTexture});
scene.addChild(s);
/*
const tree = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [-20, 1, 0]});
scene.addChild(tree);
const tree2 = new Tree({texture: blankTexture, scale: [1, 1, 1], translation: [-50, 1, -40]});
scene.addChild(tree2);*/
/*
const transparent = new Cube({ translation: [0, 5, -14], scale: [1, 3, 1], euler: [0, 0, 0], texture: blankTexture, color: [1, 1, 1, 0.3] });
transparent.transparent = true; // transparent materials have to be created LAST
scene.addChild(transparent);

//const c = new Cylinder({ translation: [-3, 5, 0], scale: [1, 1, 1], euler: [0, 0, 0], texture: blankTexture});
//scene.addChild(c);
*/

// collisions


import { netConfig, lightConfig, rotateConfig } from './PlayerInput.js';

export const net = new Net({texture: blankTexture, scale: [1, 1, 1], translation: [8, 14-20, -2], euler: [45, 10, 0]}); // on player // y+20
//const net = new Net({texture: blankTexture, translation: [10, 10, 0]}); // in world
player.addChild(net);

player.addComponent({
    update(){
        //console.log(player.transform.translation);
        rotateConfig();
        netConfig();
        lightConfig();
    }
});


const fakePlayer = new GameObject();
scene.addChild(fakePlayer);
//export const lamp = new Lamp({texture: blankTexture, scale: [1, 1, 1], translation: [-17.2, -14.2, -5.2], euler: [-2.8, -20.4, -65.2]});
export const lamp = new Lamp({texture: blankTexture, scale: [1, 1, 1], translation: [-4, -5, -5]});

//export const lamp = new Lamp({texture: blankTexture, scale: [1, 1, 1], translation: [-4, 10, -5]});
lamp.addFirefly();

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





//net.addComponent(animator);







/*
playerCol.addComponent({
    update(){
        player.nextMove ??= [0, -0.00, 0]; // -0.05 = gravity

        player.move({y: player.nextMove[1]});
        let onSlope = false;

        const collisions = playerCol.collides();

        collisions.forEach(plane => {
            if(plane instanceof PlaneCollider) {
                if(plane.tags.includes("slope")){
                    onSlope = true;
                }
                else if(plane.tags.includes("flat")){
                    player.move({y: -player.nextMove[1]});
                }
                else{
                    console.log("none of these");
                }
                console.log(plane.name + " : " + "player");
            }
        });

        if(onSlope){
            physics.climbSlope(player, playerCol);
        }
    }
});
*/


scene.addChild(player);

const cat = new Model({ translation: [2, 5, 2], scale: [1, 1, 1], euler: [0, 0, 0], texture: catTexture, gltfPath: pathcat });
await cat.createMesh(pathcat);
scene.addChild(cat);

const mon = new Model({ translation: [2, 5, -2], scale: [1, 1, 1], euler: [0, 0, 0], texture: monkeyTexture, gltfPath: pathmon });
await mon.createMesh(pathmon);
scene.addChild(mon);

const col = new BoxCollider({ texture: blankTexture, debug: true, dynamic: true, name: "monkey", gravity: true });
mon.addComponent(col);
col.addComponent({
    update(){
        col.nextMove ??= [0, -0.05, 0];

        col.gameObject.move({y: col.nextMove[1]});

        const collisions = col.collides();

        collisions.forEach(plane => {
            if(plane instanceof PlaneCollider) {
                col.gameObject.move({y: -col.nextMove[1]});
            }
        });
    }
});



const col2 = new BoxCollider({ texture: blankTexture, debug: true, dynamic: true, name: "cat" });
cat.addComponent(col2);


const mon2 = new Model({ translation: [0, 5, 2], scale: [1, 1, 1], euler: [0, 0, 0], texture: monkeyTexture, gltfPath: pathmon, normalTexture: monkeyNormal });
await mon2.createMesh(pathmon);
scene.addChild(mon2);



mon.setTransform({ scale: [1, 1, 1], translation: [1, 5, 3], euler: [0, 0, 0] });
mon.setPosition([1, 5, 4]);
mon.setRotation([45, 0, 0]);


mon.move({x : -0.1, z: -2.4, y: 6.4});
cat.move({y: 0.6});

mon.move({y: -0, z: 10});

mon2.move({z: -5, x: 2});

col.collides();
//col2.collides();




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