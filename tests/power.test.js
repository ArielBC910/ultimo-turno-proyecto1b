import test from 'node:test';
import assert from 'node:assert/strict';
import { PowerManager, POWER } from '../src/managers/PowerManager.js';
import { ShiftSimulation } from '../src/managers/ShiftSimulation.js';
import { NIGHT_DURATION } from '../src/managers/NightSession.js';
import { SurveillanceUI } from '../src/ui/SurveillanceUI.js';

const seeded = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const all = () => ({lightOn:true,monitorOpen:true,doorClosed:true,powerAvailable:true});
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('consumo simultáneo suma los tres dispositivos y respeta 0–100',()=>{
  const p=new PowerManager(120),s=all();assert.equal(p.charge,100);
  near(p.rate(s),.82);p.update(10000,s);near(p.charge,91.8);
  p.update(1e6,s);assert.equal(p.charge,0);
  assert.deepEqual(s,{lightOn:false,monitorOpen:false,doorClosed:false,powerAvailable:false});
  p.update(1e6,s);assert.equal(p.charge,0);
  assert.equal(new PowerManager(-2).charge,0);
  p.update(NaN,s);assert.equal(p.charge,0);
});

test('mismo consumo a 15, 30, 60 y 144 FPS y en un frame largo',()=>{
  for(const fps of [15,30,60,144]){
    const p=new PowerManager(),s=all();
    for(let i=0;i<fps*60;i++)p.update(1000/fps,s);
    near(p.charge,50.8);
  }
  const p=new PowerManager();p.update(60000,all());near(p.charge,50.8);
});

test('avisos de umbral se emiten una vez; agotamiento no repite avisos',()=>{
  const p=new PowerManager(),s=all();const events=[];
  for(let i=0;i<200;i++)events.push(...p.update(1000,s));
  assert.deepEqual(events.map(e=>e.type),['power-low','power-critical','power-empty']);
});

test('sin batería, modelos y controles UI rechazan puerta, luz y monitor; giro disponible',()=>{
  const sim=new ShiftSimulation();sim.state.station='door';sim.power.charge=0;sim.update(1);
  const ui=Object.create(SurveillanceUI.prototype);ui.state=sim.state;ui.sync=()=>{};ui.onControl=()=>assert.fail('No debe sonar');
  for(let i=0;i<20;i++){
    ui.perform('toggleDoor');ui.perform('toggleLight');ui.toggleMonitor();
    sim.state.toggleDoor();sim.state.toggleLight();sim.state.toggleMonitor();
  }
  assert.equal(sim.state.doorClosed,false);assert.equal(sim.state.lightOn,false);assert.equal(sim.state.monitorOpen,false);
  const facing=sim.state.facing;sim.state.turnAround();assert.notEqual(sim.state.facing,facing);
});

test('agotamiento divide el frame: puerta pierde protección sin muerte instantánea',()=>{
  const sim=new ShiftSimulation(()=>0);sim.night.monster.enter('door',0);
  sim.state.doorClosed=true;sim.door.closed=1;sim.power.charge=POWER.rates.doorClosed;
  sim.update(2000);
  assert.equal(sim.power.charge,0);assert.equal(sim.state.doorClosed,false);
  near(sim.night.monster.openExposure,1000);assert.equal(sim.night.result,null);
  sim.update(13999);assert.equal(sim.night.result,null);
  sim.update(1);assert.equal(sim.night.result,'lost');
});

test('cierre físico y consumo independientes de FPS con amenaza en la puerta',()=>{
  for(const step of [1000/144,1000/60,1000/15,4000]){
    const sim=new ShiftSimulation(()=>.99);sim.night.monster.enter('door',0);sim.state.doorClosed=true;
    let remaining=4000;
    while(remaining>1e-7){const dt=Math.min(step,remaining);sim.update(dt);remaining-=dt;}
    near(sim.night.monster.openExposure,650);near(sim.power.charge,97.92);assert.equal(sim.door.sealed,true);
  }
});

test('horas exactas, victoria a 6 AM y ningún consumo ni ataque después',()=>{
  const sim=new ShiftSimulation(()=>0);
  for(const [time,label] of [[0,'12 AM'],[59999,'12 AM'],[60000,'1 AM'],[120000,'2 AM'],[180000,'3 AM'],[240000,'4 AM'],[300000,'5 AM']]){
    sim.night.elapsed=time;assert.equal(sim.night.clockLabel,label);
  }
  sim.night.elapsed=NIGHT_DURATION-1000;sim.state.lightOn=true;
  sim.night.monster.enter('door',0);sim.night.monster.openExposure=14000;
  sim.update(5000);assert.equal(sim.night.result,'won');assert.equal(sim.night.clockLabel,'6 AM');near(sim.power.charge,99.88);
  const charge=sim.power.charge,exposure=sim.night.monster.openExposure;
  sim.update(100000);assert.equal(sim.power.charge,charge);assert.equal(sim.night.monster.openExposure,exposure);
});

test('derrota cobra solo hasta el ataque y nueva partida restablece todo',()=>{
  const sim=new ShiftSimulation(()=>0);sim.state.lightOn=true;sim.night.monster.enter('door',0);sim.update(60000);
  assert.equal(sim.night.result,'lost');near(sim.power.charge,98.2);assert.equal(sim.state.controlsLocked,true);
  const fresh=new ShiftSimulation();assert.equal(fresh.power.charge,100);assert.equal(fresh.night.elapsed,0);
  assert.equal(fresh.night.clockLabel,'12 AM');assert.equal(fresh.night.monster.location,'cam03');
  assert.equal(fresh.night.result,null);assert.equal(fresh.door.closed,0);
  assert.equal(fresh.state.lightOn||fresh.state.monitorOpen||fresh.state.doorClosed,false);
});

test('todo encendido y puerta permanente no duran hasta el amanecer',()=>{
  const p=new PowerManager(),s=all();near(p.timeToEmpty(s),100/.82*1000);
  p.update(p.timeToEmpty(s),s);assert.equal(p.charge,0);
  const door=new PowerManager();assert.ok(door.timeToEmpty({doorClosed:true})<NIGHT_DURATION);
  for(let seed=1;seed<=100;seed++){
    const sim=new ShiftSimulation(seeded(seed));sim.state.doorClosed=true;
    while(!sim.night.result)sim.update(1000);
    assert.equal(sim.power.charge,0);assert.equal(sim.night.result,'lost',`puerta permanente: ${seed}`);
  }
});

test('100 noches con reacción de 4 s, cámaras al 50 % y luz al 25 % conservan margen',()=>{
  let minimum=100;
  for(let seed=1;seed<=100;seed++){
    const sim=new ShiftSimulation(seeded(seed));let response=0, reopenDelay=0;
    while(!sim.night.result){
      const threat=sim.night.monster.location==='door';response=threat?response+100:0;
      reopenDelay=Math.max(0,reopenDelay-100);
      sim.state.doorClosed=(threat && response>=4000)||reopenDelay>0;
      sim.state.monitorOpen=sim.night.elapsed%12000<6000;
      sim.state.lightOn=sim.night.elapsed%12000<3000;
      const events=sim.update(100);
      if(events.some(e=>e.type==='retreat'))reopenDelay=3000;
    }
    assert.equal(sim.night.result,'won');minimum=Math.min(minimum,sim.power.charge);
    assert.ok(sim.power.charge>25,`margen insuficiente: ${sim.power.charge}`);
  }
  console.log(`Margen mínimo en 100 estrategias: ${minimum.toFixed(2)} %`);
});

test('ignorar el acceso termina en ataque incluso con rutas aleatorias adversas',()=>{
  for(const random of [()=>0,()=>.999999,seeded(42)]){
    const sim=new ShiftSimulation(random);sim.update(NIGHT_DURATION);assert.equal(sim.night.result,'lost');
  }
});
