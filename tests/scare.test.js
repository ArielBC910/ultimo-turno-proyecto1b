import test from 'node:test';
import assert from 'node:assert/strict';
import { ScareManager } from '../src/managers/ScareManager.js';
import { SCARE_MAX, SCARE_PER_MISSED_CUSTOMER } from '../src/kitchen/kitchenConfig.js';

test('la barra empieza vacía', () => {
  const scare = new ScareManager();
  assert.equal(scare.value, 0);
  assert.equal(scare.ratio, 0);
  assert.equal(scare.isFull, false);
});

test('cada cliente sin atender suma el susto configurado', () => {
  const scare = new ScareManager();
  scare.add();
  assert.equal(scare.value, SCARE_PER_MISSED_CUSTOMER);
  assert.equal(scare.ratio, SCARE_PER_MISSED_CUSTOMER / SCARE_MAX);
});

test('add avisa solo la vez que la barra se llena y nunca pasa del máximo', () => {
  const scare = new ScareManager({ max: 100, perMissedCustomer: 40 });
  assert.equal(scare.add(), false); // 40
  assert.equal(scare.add(), false); // 80
  assert.equal(scare.add(), true); // 100 (tope)
  assert.equal(scare.value, 100);
  assert.equal(scare.isFull, true);
  assert.equal(scare.add(), false); // ya estaba llena
  assert.equal(scare.value, 100);
});

test('reset vacía la barra y la cantidad por cliente se puede indicar en cada add', () => {
  const scare = new ScareManager();
  scare.add(10);
  assert.equal(scare.value, 10);
  scare.reset();
  assert.equal(scare.value, 0);
  scare.add(-50);
  assert.equal(scare.value, 0);
});

test('con las constantes por defecto la barra se llena con un número entero de fallos', () => {
  const scare = new ScareManager();
  let misses = 0;
  while (!scare.isFull) { scare.add(); misses += 1; }
  assert.ok(misses >= 1 && misses <= 10);
});
