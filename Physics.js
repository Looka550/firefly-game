import { BoxCollider } from "./BoxCollider.js";

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
            if(col instanceof BoxCollider){
                console.log(`box collider: ${col.name} : ${other.name}`);
                if(col.AABBcollision(other)){
                    console.log(`COLLISION: ${col.transform.translation} : ${other.transform.translation}`);
                    collisions.push(other);
                }
            }
            else if(col instanceof PlaneCollider){
                console.log(`plane collider: ${col.name} : ${other.name}`);
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