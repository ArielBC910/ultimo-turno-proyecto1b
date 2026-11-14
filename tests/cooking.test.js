import test from 'node:test';
import assert from 'node:assert/strict';
import { CookingStation, PREPARE_MS } from '../src/kitchen/CookingStation.js';
import { DoorMotion } from '../src/room/DoorMotion.js';
import { MonsterManager } from '../src/managers/MonsterManager.js';
import { SurveillanceUI } from '../src/ui/SurveillanceUI.js';
import { SurveillanceManager } from '../src/managers/SurveillanceManager.js';

test('preparación secuencial conserva sobrante de tiempo y no entrega comida sin terminar',()=>{
  const c=new CookingStation();c.prepare('burger');c.prepare('drink');
  c.update(PREPARE_MS.burger-1);
  assert.deepEqual(c.tray,[]);assert.ok(c.progress>.9);
  assert.equal(c.serve({items:['burger','drink']},true),'preparing');
  c.update(2);assert.deepEqual(c.tray,['burger']);assert.equal(c.elapsed,1);
  c.update(PREPARE_MS.drink-1);assert.equal(c.serve({items:['drink','burger']},true),'served');
  assert.equal(c.served,1);assert.deepEqual(c.tray,[]);
  assert.equal(c.serve({items:['burger','drink']},true),'empty');
});

test('entrega exige cantidades exactas, cliente esperando y no consume un pedido incorrecto',()=>{
  const c=new CookingStation();c.prepare('burger');c.prepare('burger');c.prepare('fries');c.update(10000);
  assert.equal(c.serve({items:['burger','fries']},true),'wrong');
  assert.deepEqual(c.tray,['burger','burger','fries']);
  assert.equal(c.serve({items:['burger','burger','fries']},false),'not-ready');
  assert.equal(c.served,0);
  assert.equal(c.serve({items:['fries','burger','burger']},true),'served');
});

test('límite de bandeja cuenta cola y comida lista; vaciar cancela preparación',()=>{
  const c=new CookingStation();assert.equal(c.prepare('invalid'),false);
  for(const id of ['burger','hotdog','fries'])assert.equal(c.prepare(id),true);
  assert.equal(c.prepare('drink'),false);c.update(PREPARE_MS.burger);
  assert.equal(c.prepare('drink'),false);c.clear();c.update(10000);
  assert.deepEqual(c.tray,[]);assert.deepEqual(c.queue,[]);assert.equal(c.progress,0);
  assert.equal(c.prepare('drink'),true);c.update(Infinity);assert.deepEqual(c.tray,[]);
});

test('el cierre físico protege después de la animación y la reapertura deja de proteger enseguida',()=>{
  const door=new DoorMotion(), monster=new MonsterManager(()=>0);monster.enter('door',0);
  door.update(100,true);assert.equal(door.sealed,false);
  monster.update(100,door.sealed);assert.equal(monster.openExposure,100);
  for(let i=0;i<6;i++)door.update(100,true);
  assert.equal(door.sealed,true);monster.update(100,door.sealed);assert.equal(monster.blockedElapsed,100);
  door.update(16,false);assert.equal(door.sealed,false);
  monster.update(16,door.sealed);assert.equal(monster.openExposure,116);assert.equal(monster.blockedElapsed,0);
});

test('botones y atajos de UI permiten puerta y linterna en sala 3D, sin bloquearlos por caminar',()=>{
  const ui=Object.create(SurveillanceUI.prototype);
  ui.state=new SurveillanceManager({roomMode:true});ui.state.station='door';
  const sounds=[];ui.onControl=(kind,value)=>sounds.push([kind,value]);ui.sync=()=>{};
  ui.perform('toggleDoor');ui.perform('toggleLight');
  assert.equal(ui.state.doorClosed,true);assert.equal(ui.state.lightOn,true);
  assert.deepEqual(sounds,[['door',true],['light',true]]);
  ui.state.station='kitchen';ui.perform('toggleDoor');
  assert.equal(ui.state.doorClosed,true);assert.equal(sounds.length,2);
});
