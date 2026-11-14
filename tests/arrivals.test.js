import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalInterval, nextArrivalDelay } from '../src/kitchen/arrivals.js';
import { ARRIVAL_END_MS, ARRIVAL_JITTER, ARRIVAL_START_MS } from '../src/kitchen/kitchenConfig.js';

test('el intervalo medio baja de forma continua durante la noche', () => {
  assert.equal(arrivalInterval(0), ARRIVAL_START_MS);
  assert.equal(arrivalInterval(1), ARRIVAL_END_MS);
  assert.ok(arrivalInterval(0.25) > arrivalInterval(0.5));
  assert.ok(arrivalInterval(0.5) > arrivalInterval(0.75));
  assert.equal(arrivalInterval(5), ARRIVAL_END_MS); // fuera de rango se limita
});

test('la variación aleatoria respeta el margen y es neutra con rng = 0.5', () => {
  assert.equal(nextArrivalDelay(0, () => 0.5), ARRIVAL_START_MS);
  assert.ok(Math.abs(nextArrivalDelay(0, () => 0) - ARRIVAL_START_MS * (1 - ARRIVAL_JITTER)) < 1e-6);
  assert.ok(Math.abs(nextArrivalDelay(0, () => 1) - ARRIVAL_START_MS * (1 + ARRIVAL_JITTER)) < 1e-6);
});

test('al final de la noche llegan más seguido que al principio incluso en el peor caso aleatorio', () => {
  assert.ok(nextArrivalDelay(1, () => 1) < nextArrivalDelay(0, () => 0));
});
