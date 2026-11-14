import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomNavigation, ROOM, solid } from '../src/room/navigation.js';
import { SurveillanceManager } from '../src/managers/SurveillanceManager.js';
import { CameraSignal } from '../src/managers/CameraSignal.js';
import { MonsterManager } from '../src/managers/MonsterManager.js';

test('las posturas permanecen al menos 15 segundos al principio y final de la noche', () => {
  for (const random of [() => 0, () => .9999]) {
    const monster = new MonsterManager(random);
    for (const progress of [0, .5, 1]) {
      const duration = monster.nextDuration(progress);
      assert.ok(duration >= 30000 && duration <= 44000);
      assert.ok(duration / 2 >= 15000);
    }
  }
});

test('corte de 2500 ms solo en cámara abandonada; cambiar de canal no reinicia el corte', () => {
  const signal = new CameraSignal();
  signal.departure('cam01', 1000);
  assert.equal(signal.isLost('cam01', 1000), true);
  assert.equal(signal.isLost('cam02', 1100), false);
  assert.equal(signal.isLost('cam01', 3499), true);
  assert.equal(signal.isLost('cam01', 3500), false);
  signal.departure('door', 4000);
  assert.equal(signal.isLost('door', 4001), false);
});

test('WASD mueve de verdad, normaliza diagonales y bloquea paredes incluso con un frame lento', () => {
  const forward = new RoomNavigation(), diagonal = new RoomNavigation();
  const start = { x: forward.x, y: forward.y };
  forward.move(1, 0, 0, 80); diagonal.move(1, 1, 0, 80);
  assert.ok(forward.y < start.y);
  assert.ok(Math.abs(Math.hypot(diagonal.x-start.x, diagonal.y-start.y) - Math.hypot(forward.x-start.x, forward.y-start.y)) < .00001);
  for (let i=0; i<200; i++) forward.move(1, 0, 0, 1000);
  assert.ok(forward.y >= -ROOM.halfDepth + .18);
  assert.equal(solid(forward.x, forward.y), false);
});

test('sala compacta: puerta al frente, cocina detrás; la orientación y cercanía activan los controles', () => {
  const player = new RoomNavigation();
  assert.equal(player.station(), null);
  player.y = -.8;
  assert.equal(player.station().view, 'door');
  player.angle = 0;
  assert.equal(player.station(), null);
  player.x=0; player.y=.8; player.angle=Math.PI/2;
  assert.equal(player.station().view, 'kitchen');
  player.turnAround();
  assert.equal(player.station(), null);
  player.x=.9; player.y=0; player.angle=0;
  for(let i=0;i<50;i++) player.move(1,0,0,80);
  assert.ok(player.x <= 1.1-.18);
  assert.ok(ROOM.halfDepth*2 < 4 && ROOM.halfWidth*2 < 4);
});

test('monitor portátil disponible en cocina y caminando, sin girar ni apagar la vista de cocina', () => {
  const state=new SurveillanceManager({roomMode:true});
  state.station='kitchen';
  state.toggleMonitor();
  state.selectCamera('cam04');
  assert.equal(state.monitorOpen,true);
  assert.equal(state.camera,'cam04');
  assert.equal(state.inKitchen,true);
  assert.equal(state.walking,true);
  state.toggleLight(); state.toggleDoor();
  assert.equal(state.lightOn,false);
  assert.equal(state.doorClosed,false);
  state.station='door';
  state.toggleLight(); state.toggleDoor();
  assert.equal(state.lightOn,true);
  assert.equal(state.doorClosed,true);
  state.toggleMonitor();
  assert.equal(state.monitorOpen,false);
  assert.equal(state.lightOn,true);
});
