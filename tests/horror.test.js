import test from 'node:test';
import assert from 'node:assert/strict';
import {attackPose,ATTACK_DURATION} from '../src/room/WendigoAttack.js';
import {AudioManager} from '../src/audio/AudioManager.js';

test('embestida termina antes del resultado y reduce temblores con movimiento reducido',()=>{
 const start=attackPose(0),impact=attackPose(480),end=attackPose(ATTACK_DURATION);
 assert.ok(impact.z>start.z);assert.equal(attackPose(ATTACK_DURATION-1).done,false);
 assert.equal(end.done,true);assert.equal(end.black,1);
 for(let ms=0;ms<=ATTACK_DURATION;ms+=13){const p=attackPose(ms,true);assert.equal(p.roll,0);assert.equal(p.x,.24);assert.ok(p.black>=0&&p.black<=1);}
});
test('audio Foxy no se duplica ni se corta en transición; reinicio sí lo detiene',()=>{
 let adds=0,plays=0,stops=0,loops=0;const sound={isPlaying:false,play(){plays++;this.isPlaying=true;}};
 const audio=Object.create(AudioManager.prototype);
 audio.game={sound:{stopAll(){stops++;sound.isPlaying=false;},add(key,options){assert.equal(key,'foxy-jumpscare');assert.equal(options.rate,1);adds++;return sound;}}};
 audio.loops={ambient:{stop(){loops++;}}};
 audio.defeat();audio.defeat();assert.equal(plays,1);assert.equal(adds,1);
 audio.stop(true);assert.equal(sound.isPlaying,true);assert.equal(loops,1);assert.equal(stops,1);
 audio.stop();assert.equal(sound.isPlaying,false);audio.defeat();assert.equal(plays,2);assert.equal(adds,1);
});
