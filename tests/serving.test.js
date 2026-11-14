import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderProgress, dropTargetAt } from '../src/kitchen/serving.js';

const emoji = (id) => id;

test('un pedido se completa al entregar todos sus productos, incluidos los repetidos', () => {
  const progress = new OrderProgress({ items: ['burger', 'burger', 'drink'] });
  assert.equal(progress.complete, false);
  assert.deepEqual(progress.deliver('burger'), { accepted: true, index: 0, complete: false });
  assert.deepEqual(progress.deliver('burger'), { accepted: true, index: 1, complete: false });
  assert.equal(progress.deliver('burger').accepted, false); // ya no hacen falta más hamburguesas
  assert.deepEqual(progress.deliver('drink'), { accepted: true, index: 2, complete: true });
});

test('un producto que no se pidió se rechaza y no cambia el pedido', () => {
  const progress = new OrderProgress({ items: ['fries'] });
  assert.equal(progress.needs('hotdog'), false);
  assert.equal(progress.deliver('hotdog').accepted, false);
  assert.equal(progress.complete, false);
  assert.deepEqual(progress.labels(emoji), ['fries']);
});

test('las etiquetas marcan lo entregado', () => {
  const progress = new OrderProgress({ items: ['burger', 'drink'] });
  progress.deliver('drink');
  assert.deepEqual(progress.labels(emoji, 'OK'), ['burger', 'OK']);
});

test('dropTargetAt devuelve null fuera de los clientes y el más cercano si se solapan', () => {
  const targets = [{ id: 'a', x: 0, y: 0, w: 100, h: 100 }, { id: 'b', x: 80, y: 0, w: 100, h: 100 }];
  assert.equal(dropTargetAt(300, 50, targets), null);
  assert.equal(dropTargetAt(50, 200, targets), null);
  assert.equal(dropTargetAt(20, 50, targets).id, 'a');
  assert.equal(dropTargetAt(95, 50, targets).id, 'b'); // dentro de ambos: centro de b (130) vs a (50) -> 45 vs 35
});
