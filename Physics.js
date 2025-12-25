import { BoxCollider } from "./BoxCollider.js";
import { PlaneCollider } from "./PlaneCollider.js";

export class Physics{
    constructor({

    } = {}) {
        this.colliders = [];
        this.dynamics = [];
    }

    addCollider(col){
        this.colliders.push(col);
        if(col.dynamic){
            this.dynamics.push(col);
        }
    }

    removeCollider(){

    }

    checkCollisions(col){
        const collisions = [];

        this.colliders.forEach(other => {
            if(col === other){
                return;
            }
            if(other instanceof BoxCollider){
                //console.log(`testing box collider: ${col.name} : ${other.name}`);
                if(col.AABBcollision(other)){
                    console.log(`COLLISION: ${col.name} : ${other.name}`);
                    collisions.push(other);
                }
            }
            else if(other instanceof PlaneCollider){
                //console.log(`testing plane collider: ${col.name} : ${other.name}`);
                if(other.AABBcollision(col)){
                    console.log(`PLANE COLLISION: ${col.name} : ${other.name}`);
                    collisions.push(other);
                }

            }
            else{
                console.log(`unknown collider: ${col.name} : ${other.name}`);
            }
        });

        return collisions;
    }

    boxCollision(){

    }

    planeCollision(){

    }
}