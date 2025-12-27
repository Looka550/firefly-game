import { Transform } from './Transform.js';
import { getForward, getRight } from './SceneUtils.js';
import { quat } from './glm.js';
//import { net } from "./main.js";
const keys = {};
let mouseMove = [0, 0];
let oldAvg = 1;

export let lightY = 54.6; // 30
export let near = 3.64; // 0.1
export let far = 64.4; // 50

// settings
const speed = 0.2;
const sensitivity = 0.0015;
let yaw = 0, pitch = 0;

/*
export function netConfig(){
    let change = 0;
    if(keys["r"]){
        net.swing();
    }
    if(keys["t"]){
        change = 0.2;
        if(keys["u"]){
            net.move({x: change});
        }
        if(keys["i"]){
            net.move({y: change});
        }
        if(keys["o"]){
            net.move({z: change});
        }
        if(keys["j"]){
            net.rotate({x: change});
        }
        if(keys["k"]){
            net.rotate({y: change});
        }
        if(keys["l"]){
            net.rotate({z: change});
        }
        if(keys["b"]){
            net.rescale({x: change});
        }
        if(keys["n"]){
            net.rescale({y: change});
        }
        if(keys["m"]){
            net.rescale({z: change});
        }
    }
    else{
        change = -0.2;
        if(keys["u"]){
            net.move({x: change});
        }
        if(keys["i"]){
            net.move({y: change});
        }
        if(keys["o"]){
            net.move({z: change});
        }
        if(keys["j"]){
            net.rotate({x: change});
        }
        if(keys["k"]){
            net.rotate({y: change});
        }
        if(keys["l"]){
            net.rotate({z: change});
        }
        if(keys["b"]){
            net.rescale({x: change});
        }
        if(keys["n"]){
            net.rescale({y: change});
        }
        if(keys["m"]){
            net.rescale({z: change});
        }
    }
    //console.log("translation: " + net.transform.translation + ", rotation: " + net.transform.getEuler() + ", scale: " + net.transform.scale);
}
*/

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

export function parseInput(player, flight=true){
    const transform = player.getComponentOfType(Transform)
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

    //move[1] = 0;

    transform.translation[0] += move[0];
    transform.translation[1] += move[1];
    transform.translation[2] += move[2];

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