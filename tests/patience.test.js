import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_PATH, CUSTOMER_PATIENCE_MS, MAX_CUSTOMERS_AT_WINDOW, customerLanes, customerPose, fitBubbleScale,
} from '../src/kitchen/kitchenConfig.js';
import { WAIT_WARNING_RATIO, formatWait, isWaitWarning } from '../src/kitchen/patience.js';

test('las constantes de espera son válidas', () => {
  assert.ok(CUSTOMER_PATIENCE_MS > 0);
  assert.ok(Number.isInteger(MAX_CUSTOMERS_AT_WINDOW) && MAX_CUSTOMERS_AT_WINDOW >= 1);
});

test('formatWait muestra m:ss y redondea hacia arriba', () => {
  assert.equal(formatWait(20000), '0:20');
  assert.equal(formatWait(19001), '0:20');
  assert.equal(formatWait(1), '0:01');
  assert.equal(formatWait(0), '0:00');
  assert.equal(formatWait(-500), '0:00');
  assert.equal(formatWait(65000), '1:05');
});

test('el aviso se activa en el último cuarto del tiempo', () => {
  assert.equal(isWaitWarning(CUSTOMER_PATIENCE_MS), false);
  assert.equal(isWaitWarning(CUSTOMER_PATIENCE_MS * WAIT_WARNING_RATIO), true);
  assert.equal(isWaitWarning(0), true);
  assert.equal(isWaitWarning(2500, 10000), true);
  assert.equal(isWaitWarning(2600, 10000), false);
});

test('los carriles de clientes quedan dentro del vano, ordenados y separados', () => {
  assert.deepEqual(customerLanes(1), [0.5]);
  assert.deepEqual(customerLanes(2), [0.3, 0.7]);
  for (const count of [2, 3, 4]) {
    const lanes = customerLanes(count);
    assert.equal(lanes.length, count);
    assert.ok(lanes.every((x) => x >= 0.3 - 1e-9 && x <= 0.7 + 1e-9));
    for (let i = 1; i < lanes.length; i += 1) assert.ok(lanes[i] - lanes[i - 1] >= 0.4 / (count - 1) - 1e-9);
  }
});

test('fitBubbleScale reduce el globo solo cuando no cabe y respeta el mínimo', () => {
  assert.equal(fitBubbleScale(1, 100, 500), 1); // cabe: escala natural
  assert.equal(fitBubbleScale(1, 100, 80), 0.8); // cabe reduciendo
  assert.equal(fitBubbleScale(1, 100, 10, 0.6), 0.6); // no cabe ni así: se queda en el mínimo
  assert.equal(fitBubbleScale(1, 100, -40, 0.6), 0.6); // espacio negativo
});

test('globo + reloj de un cliente que llega al vano no se salen por arriba de una ventana de 1000x600', () => {
  // Misma geometría que KitchenView.layout: ventana a ~17 % de una imagen que cubre la pantalla.
  const win = { x: 200, y: 130, w: 600, h: 250 };
  const margin = 8; const gapRatio = 0.03; const emojiRatio = 0.12; const fontPx = 64;
  const stackHeight = 125 + 14 + 8 + 48; // globo + flecha + hueco + reloj, sin escalar
  for (let p = 0; p <= 1.0001; p += 0.05) {
    const pose = customerPose(p, 0.3, win, CUSTOMER_PATH);
    const bottom = pose.y - pose.displayHeight * (1 + gapRatio);
    const natural = (pose.displayHeight * emojiRatio) / fontPx;
    const scale = fitBubbleScale(natural, stackHeight, bottom - margin);
    assert.ok(bottom - stackHeight * scale >= margin - 1e-6, `p=${p.toFixed(2)}`);
  }
});
