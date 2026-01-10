import { Transform } from './Transform.js';
import { getForward, getRight } from './SceneUtils.js';
import { quat } from './glm.js';
import { lamp, net, moon, playerCol, assistLight1, renderer, secondaryCamera, generator, particle } from "./main.js";
const keys = {};
const mouseButtons = {
    left: false,
    right: false
};
let mouseMove = [0, 0];
let oldAvg = 1;

export let lightY = 65.8; // 30
export let near = -14.78; // 0.1
export let far = 54; // 50

// settings
const speed = 0.2;
const sensitivity = 0.0022;
let yaw = 0, pitch = 0;

// gravity
let verticalVelocity = 0;
let grounded = true;
let groundedBefore = true;
const gravity = -0.015;
const jumpVelocity = 0.35;

export function trueGrounded(){
    verticalVelocity = 0;
    grounded = true;
}


export function getActions(){
    if(mouseButtons.right){
        if(lamp.collectedAll && lamp.lampOn){
            lamp.release();
        }
        else{
            lamp.swing();
        }
    }
    if(mouseButtons.left){
        net.swing();
    }
}


export function initInput(canvas){
    document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener("mousedown", (e) => {
        if(e.button === 0){
            mouseButtons.left = true;
        }
        if(e.button === 2){
            mouseButtons.right = true;
        }
    });

    canvas.addEventListener("mouseup", (e) => {
        if(e.button === 0){
            mouseButtons.left = false;
        }
        if(e.button === 2){
            mouseButtons.right = false;
        }
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    canvas.addEventListener("mousemove", (e) => {
        if(document.pointerLockElement !== canvas){
            return;
        }

        let moveX = e.movementX;
        let moveY = e.movementY;

        // spike filtering
        const avg = oldAvg;
        const spike = 4 * avg;

        if(Math.abs(moveX) > spike){
            moveX = spike * Math.sign(moveX);
        }
        if(Math.abs(moveY) > spike){
            moveY = spike * Math.sign(moveY);
        }

        // EMA smoothing (exponential moving average)
        const SMOOTH = 0.6;
        oldAvg = oldAvg * SMOOTH + (Math.abs(moveX) + Math.abs(moveY)) * 0.5 * (1 - SMOOTH);

        mouseMove[0] += moveX;
        mouseMove[1] += moveY;
    });
}

export function parseInput(playerWrapper, player, flight = false, dt = 1 / 60){
    const wrapperTransform = playerWrapper.getComponentOfType(Transform);
    const transform = player.getComponentOfType(Transform);
    const forward = getForward(pitch, yaw);
    const right   = getRight(yaw);
    let move = [0, 0, 0];

    if(!groundedBefore && grounded){
        generator.spawnParticle();
    }

    // movement
    if(keys["w"]){
        move[0] += forward[0];
        move[1] += forward[1];
        move[2] += forward[2];
    }
    if(keys["s"]){
        move[0] -= forward[0];
        move[1] -= forward[1];
        move[2] -= forward[2];
    }
    if(keys["a"]){
        move[0] += right[0];
        move[1] += right[1];
        move[2] += right[2];
    }
    if(keys["d"]){
        move[0] -= right[0];
        move[1] -= right[1];
        move[2] -= right[2];
    }

    const len = Math.hypot(move);
    if(len > 0){
        move[0] /= len;
        move[1] /= len;
        move[2] /= len;
    }

    move[0] *= speed * dt;
    move[1] *= speed * dt;
    move[2] *= speed * dt;
    

    if(keys[" "]){
        move[1] += speed * dt;
    }
    if(keys["shift"]){
        move[1] -= speed * dt;
    }

    if(!flight){
        move[1] = 0;
    }

    if(!flight){
        if(keys[" "] && grounded){
            verticalVelocity = jumpVelocity;
            grounded = false;
        }
        if(!grounded){
            verticalVelocity += gravity;
            wrapperTransform.translation[1] += verticalVelocity * dt;
        }
    }


    wrapperTransform.translation[0] += move[0];
    wrapperTransform.translation[1] += move[1];
    wrapperTransform.translation[2] += move[2];

    // looking
    yaw += -mouseMove[0] * sensitivity;
    pitch += -mouseMove[1] * sensitivity;

    // prevent 360 spin
    if(pitch > Math.PI/2){
        pitch = Math.PI/2;
    }
    if(pitch < -Math.PI/2){
        pitch = -Math.PI/2;
    }
    quat.identity(transform.rotation);
    quat.rotateY(transform.rotation, transform.rotation, yaw);
    quat.rotateX(transform.rotation, transform.rotation, pitch);

    groundedBefore = grounded;
    mouseMove = [0, 0];
}