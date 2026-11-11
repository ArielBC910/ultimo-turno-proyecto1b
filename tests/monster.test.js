import test from 'node:test';
import assert from 'node:assert/strict';
import { MonsterManager, ROOM_GRAPH, SAFE_ROOMS } from '../src/managers/MonsterManager.js';
import { NightSession, NIGHT_DURATION } from '../src/managers/NightSession.js';
import { CAMERAS, getSurveillanceTexture } from '../src/config.js';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

test('la criatura solo aparece en su sala y la puerta la oculta en la oficina', () => {
  assert.deepEqual(CAMERAS.map(({ key }) => getSurveillanceTexture({ monitorOpen: true, camera: key }, 'cam02')),
    ['cam01', 'cam02-wendigo', 'cam03', 'cam04']);
  const state = { monitorOpen: false, doorClosed: false, lightOn: false };
  assert.equal(getSurveillanceTexture(state, 'door'), 'office-wendigo-dark');
  state.lightOn = true;
  assert.equal(getSurveillanceTexture(state, 'door'), 'office-wendigo-light');
  state.doorClosed = true;
  assert.equal(getSurveillanceTexture(state, 'door'), 'office-closed-light');
});

test('las decisiones son aleatorias, contiguas y tienen sesgo de aproximación', () => {
  const choices = new Set();
  let toward = 0;
  for (let seed = 1; seed <= 2000; seed++) {
    const monster = new MonsterManager(seeded(seed));
    monster.enter('cam02', 0);
    const next = monster.chooseNext(0);
    assert.ok(ROOM_GRAPH.cam02.includes(next));
    choices.add(next);
    if (next === 'cam04') toward++;
  }
  assert.ok(choices.size >= 3);
  assert.ok(toward > 1000, 'el movimiento hacia el pasillo debe ser más probable');
});

test('no mata antes de 15 segundos de exposición y solo mata una vez', () => {
  const monster = new MonsterManager(() => 0);
  monster.enter('door', 0);
  assert.deepEqual(monster.update(14999, false), []);
  assert.equal(monster.update(1, false)[0].type, 'kill');
  assert.deepEqual(monster.update(30000, false), []);
});

test('cerrar bloquea el ataque, espera entre 5 y 15 s y retira a una sala lejana', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const monster = new MonsterManager(seeded(seed));
    monster.enter('door', 0);
    assert.deepEqual(monster.update(1, true), []);
    const wait = monster.retreatAfter;
    assert.ok(wait >= 5000 && wait <= 15000);
    assert.deepEqual(monster.update(wait - 2, true), []);
    const [event] = monster.update(1, true);
    assert.equal(event.type, 'retreat');
    assert.ok(SAFE_ROOMS.includes(event.to));
    assert.notEqual(event.to, 'cam04');
    assert.notEqual(event.to, 'door');
  }
});

test('reabrir no reinicia la exposición abierta acumulada ni conserva la espera cerrada', () => {
  const monster = new MonsterManager(() => 0);
  monster.enter('door', 0);
  monster.update(14000, false);
  monster.update(4000, true);
  assert.deepEqual(monster.update(999, false), []);
  assert.equal(monster.blockedElapsed, 0);
  assert.equal(monster.retreatAfter, null);
  assert.equal(monster.update(1, false)[0].type, 'kill');
});

test('volver a cerrar exige un nuevo intervalo continuo de puerta cerrada', () => {
  const monster = new MonsterManager(() => 0);
  monster.enter('door', 0);
  monster.update(4000, true);
  monster.update(10, false);
  assert.deepEqual(monster.update(4999, true), []);
  assert.equal(monster.update(1, true)[0].type, 'retreat');
});

test('una noche completa dura exactamente 360000 ms y acaba a las 6 AM', () => {
  const night = new NightSession(seeded(42));
  night.update(NIGHT_DURATION - 1, true);
  assert.equal(night.result, null);
  assert.deepEqual(night.clock, { hours: 5, minutes: 59 });
  const events = night.update(1, true);
  assert.equal(night.result, 'won');
  assert.equal(night.elapsed, 360000);
  assert.deepEqual(night.clock, { hours: 6, minutes: 0 });
  assert.equal(events.at(-1).type, 'won');
  night.update(60000, true);
  assert.equal(night.elapsed, 360000);
});

test('cada minuto real equivale a una hora y el reloj empieza a medianoche', () => {
  const night = new NightSession(seeded(4));
  assert.deepEqual(night.clock, { hours: 12, minutes: 0 });
  night.update(60000, true);
  assert.deepEqual(night.clock, { hours: 1, minutes: 0 });
});

test('derrota usa el instante de ataque y reiniciar restaura el estado', () => {
  const night = new NightSession(() => 0);
  night.monster.enter('door', 0);
  night.update(20000, false);
  assert.equal(night.result, 'lost');
  assert.equal(night.elapsed, 15000);
  const fresh = new NightSession(() => 0);
  assert.equal(fresh.result, null);
  assert.equal(fresh.elapsed, 0);
  assert.equal(fresh.monster.location, 'cam03');
});

test('el amanecer tiene prioridad si el ataque coincide exactamente con las 6 AM', () => {
  const night = new NightSession(() => 0);
  night.elapsed = NIGHT_DURATION - 15000;
  night.monster.enter('door', 0);
  night.update(15000, false);
  assert.equal(night.result, 'won');
});

test('simulación larga: 100 noches conservan ubicación única, tiempos y victoria con puerta cerrada', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const night = new NightSession(seeded(seed));
    let retreats = 0;
    while (!night.result) {
      const events = night.update(1000, true);
      for (const event of events) {
        if (event.type === 'move') assert.ok(ROOM_GRAPH[event.from].includes(event.to));
        if (event.type === 'retreat') { retreats++; assert.ok(SAFE_ROOMS.includes(event.to)); }
      }
      assert.ok(['cam01', 'cam02', 'cam03', 'cam04', 'door'].includes(night.monster.location));
    }
    assert.equal(night.result, 'won');
    assert.ok(retreats >= 1, 'la IA debe alcanzar la puerta durante la simulación');
  }
});
