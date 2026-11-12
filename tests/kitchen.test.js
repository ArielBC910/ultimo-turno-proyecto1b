import test from 'node:test';
import assert from 'node:assert/strict';
import { SurveillanceManager } from '../src/managers/SurveillanceManager.js';
import {
  BACK_OPENS_MONITOR, CUSTOMER_KEYS, FACING, KITCHEN_ASSETS, WINDOW_RECT,
  customerPose, isKitchenAsset, windowToPixels,
} from '../src/kitchen/kitchenConfig.js';

test('el cocinero empieza en la cocina y el monitor, la puerta y la linterna no responden allí', () => {
  const state = new SurveillanceManager();
  assert.equal(state.facing, FACING.KITCHEN);
  state.toggleMonitor();
  state.toggleDoor();
  state.toggleLight();
  state.selectCamera('cam03');
  assert.equal(state.monitorOpen, false);
  assert.equal(state.doorClosed, false);
  assert.equal(state.lightOn, false);
  assert.equal(state.camera, 'cam01');
});

test('darse la vuelta alterna cocina y espalda, y al volver a la cocina baja el monitor', () => {
  const state = new SurveillanceManager();
  state.turnAround();
  assert.equal(state.facing, FACING.BACK);
  assert.equal(state.monitorOpen, BACK_OPENS_MONITOR);
  state.turnAround();
  assert.equal(state.inKitchen, true);
  assert.equal(state.monitorOpen, false);
  assert.equal(state.lightOn, false);
});

test('a la espalda siguen funcionando la puerta, la linterna y el monitor existentes', () => {
  const state = new SurveillanceManager();
  state.turnAround();
  state.toggleMonitor(); // cerrar monitor -> oficina
  assert.equal(state.monitorOpen, false);
  state.toggleDoor();
  state.toggleLight();
  assert.equal(state.doorClosed, true);
  assert.equal(state.lightOn, true);
  state.toggleMonitor();
  state.selectCamera('cam04');
  assert.equal(state.camera, 'cam04');
});

test('la puerta cerrada se conserva mientras el cocinero atiende en la cocina', () => {
  const state = new SurveillanceManager();
  state.turnAround();
  state.toggleMonitor();
  state.toggleDoor();
  state.turnAround();
  assert.equal(state.doorClosed, true);
});

test('el catálogo de cocina tiene claves únicas, un puesto y clientes', () => {
  const keys = KITCHEN_ASSETS.map((asset) => asset.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes('kitchen-stall'));
  assert.ok(CUSTOMER_KEYS.length >= 1);
  assert.ok(CUSTOMER_KEYS.every(isKitchenAsset));
  assert.equal(isKitchenAsset('office'), false);
});

test('el vano se escala con la imagen y se mantiene dentro de ella', () => {
  const image = { x: 800, y: 450, width: 1600, height: 900 };
  const win = windowToPixels(image);
  assert.equal(win.x, WINDOW_RECT.x * 1600);
  assert.equal(win.w, WINDOW_RECT.w * 1600);
  assert.ok(win.x >= 0 && win.y >= 0 && win.x + win.w <= 1600 && win.y + win.h <= 900);
  const double = windowToPixels({ x: 1600, y: 900, width: 3200, height: 1800 });
  assert.equal(double.w, win.w * 2);
});

test('el cliente crece y se acerca al mostrador de forma monótona', () => {
  const win = { x: 100, y: 50, w: 400, h: 300 };
  let previous = customerPose(0, 0.5, win);
  for (let p = 0.1; p <= 1.0001; p += 0.1) {
    const pose = customerPose(p, 0.5, win);
    assert.ok(pose.displayHeight > previous.displayHeight);
    previous = pose;
  }
  const far = customerPose(0, 0.5, win);
  const near = customerPose(1, 0.5, win);
  assert.ok(far.y < near.y);
  assert.equal(near.x, win.x + win.w * 0.5);
  assert.deepEqual(customerPose(-5, 0.5, win), customerPose(0, 0.5, win));
  assert.deepEqual(customerPose(9, 0.5, win), customerPose(1, 0.5, win));
});
