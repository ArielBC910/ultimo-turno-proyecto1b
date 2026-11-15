import * as THREE from 'three';
import { CharacterActor } from './CharacterActor.js';

export const ATTACK_DURATION = 1450;
export function attackPose(ms,reduced=false) {
  const t=Math.max(0,Math.min(1,ms/ATTACK_DURATION));
  const rush=1-(1-Math.min(1,t/.32))**3;
  const impact=Math.max(0,1-(t-.32)/.55);
  return {z:-3.8+rush*3.12,y:-2.1-rush*.42,scale:1+rush*.24,
    x:reduced?.24:.24+Math.sin(t*97)*.028*impact,
    roll:reduced?0:Math.sin(t*83)*.035*impact,
    black:t===1?1:Math.max(0,(t-.78)/.22),done:t>=1};
}

export class WendigoAttack {
  constructor(room) {
    this.room=room;this.elapsed=0;
    room.releaseMouseLock();room.keys.clear();room.hand.visible=false;
    this.actor=new CharacterActor(room.creature.body.material.map,{monster:true});
    this.actor.body.material.dispose();
    this.actor.body.material=new THREE.MeshBasicMaterial({map:room.creature.body.material.map,transparent:true,alphaTest:.12,depthTest:false,depthWrite:false,color:'#d9cbbb'});
    this.actor.body.material.color.setScalar(2.5);
    this.actor.body.renderOrder=200;
    room.camera.add(this.actor);
    this.shade=document.createElement('div');this.shade.className='wendigo-blackout';document.querySelector('#surveillance').append(this.shade);
    document.querySelector('#surveillance').classList.add('wendigo-attack');
  }
  update(delta) {
    this.elapsed+=Math.max(0,delta);
    const p=attackPose(this.elapsed,this.room.reducedMotion);
    this.actor.position.set(p.x,p.y,p.z);this.actor.scale.setScalar(p.scale);this.actor.rotation.z=p.roll;
    this.shade.style.opacity=String(p.black);
    this.room.renderer.render(this.room.world,this.room.camera);
    return p.done;
  }
  destroy(){this.actor.removeFromParent();this.actor.dispose();this.shade.remove();document.querySelector('#surveillance').classList.remove('wendigo-attack');}
}
