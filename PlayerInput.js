import { Transform } from './Transform.js';
import { getForward, getRight } from './SceneUtils.js';
import { quat } from './glm.js';
import { lamp, net, moon, assistLight1, playerCol } from "./main.js";
const keys = {};
let mouseMove = [0, 0];
let oldAvg = 1;

export let lightY = 63.8; // 30
export let near = -9.38; // 0.1
export let far = 78.6; // 50

// settings
const speed = 0.2;
const sensitivity = 0.0015;
let yaw = 0, pitch = 0;

// gravity
let verticalVelocity = 0;
let grounded = true;
const gravity = -0.015;
const jumpVelocity = 0.35;

export function trueGrounded(){
    verticalVelocity = 0;
    grounded = true;
}


export function testConfig(){
    if(keys["v"]){
        lamp.swing();
    }
    if(keys["b"]){
        net.swing();
    }
    if(keys["c"]){
        lamp.release();
    }
    if(keys["u"]){
        assistLight1.move({x: 0.2});
    }
    if(keys["j"]){
        assistLight1.move({x: -0.2});
    }
    if(keys["i"]){
        assistLight1.move({y: 0.2});
    }
    if(keys["k"]){
        assistLight1.move({y: -0.2});
    }
    if(keys["o"]){
        assistLight1.move({z: 0.2});
    }
    if(keys["l"]){
        assistLight1.move({z: -0.2});
    }
    //console.log("move: " + assistLight1.transform.translation);
}

export function rotateConfig(){
    if(keys["u"]){
        playerCol.move({x: 0.2});
    }
    if(keys["j"]){
        playerCol.move({x: -0.2});
    }
    if(keys["i"]){
        playerCol.move({y: 0.2});
    }
    if(keys["k"]){
        playerCol.move({y: -0.2});
    }
    if(keys["o"]){
        playerCol.move({z: 0.2});
    }
    if(keys["l"]){
        playerCol.move({z: -0.2});
    }
    //console.log("playerCol: " + playerCol.transform.translation);
}


export function lightConfig(){
    return;
    if(keys["u"]){
        lightY += 0.2;
    }
    if(keys["j"]){
        lightY -= 0.2;
    }
    if(keys["i"]){
        near += 0.2;
    }
    if(keys["k"]){
        near -= 0.2;
    }
    if(keys["o"]){
        far += 0.2;
    }
    if(keys["l"]){
        far -= 0.2;
    }
    console.log(lightY + " : " + near + " : " + far);
}

export function netConfig(){
    return;
    let change = 0;
    if(keys["5"]){
        net.swing();
    }
    if(keys["r"]){
        lamp.swing();
    }
    if(keys["e"]){
        lamp.release();
    }
    if(keys["t"]){
        change = 0.2;
        if(keys["u"]){
            lamp.top.move({x: change});
        }
        if(keys["i"]){
            lamp.top.move({y: change});
        }
        if(keys["o"]){
            lamp.top.move({z: change});
        }
        if(keys["j"]){
            lamp.top.rotate({x: change});
        }
        if(keys["k"]){
            lamp.top.rotate({y: change});
        }
        if(keys["l"]){
            lamp.top.rotate({z: change});
        }
        if(keys["b"]){
            lamp.top.rescale({x: change});
        }
        if(keys["n"]){
            lamp.top.rescale({y: change});
        }
        if(keys["m"]){
            lamp.top.rescale({z: change});
        }
    }
    else{
        change = -0.2;
        if(keys["u"]){
            lamp.top.move({x: change});
        }
        if(keys["i"]){
            lamp.top.move({y: change});
        }
        if(keys["o"]){
            lamp.top.move({z: change});
        }
        if(keys["j"]){
            lamp.top.rotate({x: change});
        }
        if(keys["k"]){
            lamp.top.rotate({y: change});
        }
        if(keys["l"]){
            lamp.top.rotate({z: change});
        }
        if(keys["b"]){
            lamp.top.rescale({x: change});
        }
        if(keys["n"]){
            lamp.top.rescale({y: change});
        }
        if(keys["m"]){
            lamp.top.rescale({z: change});
        }
    }
    //console.log("translation: " + lamp.top.transform.translation + ", rotation: " + lamp.top.transform.getEuler() + ", scale: " + lamp.top.transform.scale);
}


export function initInput(canvas){
    document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
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

export function parseInput(playerWrapper, player, flight = false){
    const wrapperTransform = playerWrapper.getComponentOfType(Transform);
    const transform = player.getComponentOfType(Transform);
    const forward = getForward(pitch, yaw);
    const right   = getRight(yaw);
    let move = [0, 0, 0];

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

    move[0] *= speed;
    move[1] *= speed;
    move[2] *= speed;
    

    if(keys[" "]){
        move[1] += speed;
    }
    if(keys["shift"]){
        move[1] -= speed;
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
            wrapperTransform.translation[1] += verticalVelocity;
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


    mouseMove = [0, 0];
}