import { NightSession, NIGHT_DURATION } from './NightSession.js';
import { PowerManager } from './PowerManager.js';
import { SurveillanceManager } from './SurveillanceManager.js';
import { DoorMotion, DOOR_TRAVEL_MS } from '../room/DoorMotion.js';

// Único reloj para IA, energía y cierre físico. Divide exactamente el frame en
// agotamiento/cierre/amanecer; nunca cobra energía después de una derrota.
export class ShiftSimulation {
  constructor(random = Math.random) {
    this.night = new NightSession(random);
    this.power = new PowerManager();
    this.state = new SurveillanceManager({roomMode:true});
    this.door = new DoorMotion();
  }
  update(delta) {
    if (this.night.result || !Number.isFinite(delta) || delta <= 0) return [];
    const events=[];
    let remaining=Math.min(delta,NIGHT_DURATION-this.night.elapsed), offset=0;
    this.power.enforce(this.state);
    while(remaining > 1e-7 && !this.night.result) {
      const closed=this.state.doorClosed && this.power.available;
      const untilSealed=closed && !this.door.sealed ? (1-this.door.closed)*DOOR_TRAVEL_MS : Infinity;
      const step=Math.min(remaining,untilSealed,this.power.timeToEmpty(this.state));
      const before=this.night.elapsed;
      const nightEvents=this.night.update(step,closed && this.door.sealed);
      const used=this.night.elapsed-before;
      this.door.update(used,closed);
      events.push(...nightEvents.map(e=>({...e,atMs:offset+(e.atMs??used)})));
      events.push(...this.power.update(used,this.state).map(e=>({...e,atMs:offset+used})));
      remaining-=used;offset+=used;
      if(used<=0)break;
    }
    if(this.night.result) this.state.controlsLocked=true;
    return events;
  }
}
