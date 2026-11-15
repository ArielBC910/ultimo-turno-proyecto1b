import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ITEMS_PER_ORDER } from '../src/kitchen/kitchenConfig.js';
import { PRODUCTS, PRODUCT_IDS, REJECT_EMOJI, createOrder, orderEmojis } from '../src/kitchen/orders.js';

// Generador determinista que devuelve los valores dados en ciclo.
const sequence = (...values) => { let i = 0; return () => values[i++ % values.length]; };

test('el máximo de productos por pedido es una constante positiva', () => {
   assert.ok(Number.isInteger(MAX_ITEMS_PER_ORDER) && MAX_ITEMS_PER_ORDER >= 1);
});

test('todo pedido lleva entre 1 y MAX_ITEMS_PER_ORDER productos válidos', () => {
   for (let i = 0; i < 2000; i += 1) {
      const { items } = createOrder();
      assert.ok(items.length >= 1 && items.length <= MAX_ITEMS_PER_ORDER);
      assert.ok(items.every((id) => PRODUCT_IDS.includes(id)));
   }
});

test('createOrder respeta el máximo indicado, incluso con valores extremos del generador', () => {
   assert.equal(createOrder(() => 0, 5).items.length, 1);
   assert.equal(createOrder(() => 0.999999, 5).items.length, 5);
   assert.equal(createOrder(() => 1, 4).items.length, 4);
   assert.equal(createOrder(() => 0.5, 0).items.length, 1);
   assert.equal(createOrder(() => 0.5, -3).items.length, 1);
});

test('con un generador fijo el pedido es reproducible', () => {
   // 0.5 con maxItems 3 -> 2 productos; luego 0 -> primer producto, 0.99 -> último.
   const order = createOrder(sequence(0.5, 0, 0.99), 3);
   assert.deepEqual(order.items, [PRODUCT_IDS[0], PRODUCT_IDS[PRODUCT_IDS.length - 1]]);
});

test('con muchas repeticiones aparecen todos los productos y todas las cantidades', () => {
   const seen = new Set();
   const sizes = new Set();
   for (let i = 0; i < 2000; i += 1) {
      const { items } = createOrder();
      sizes.add(items.length);
      items.forEach((id) => seen.add(id));
   }
   assert.deepEqual([...seen].sort(), [...PRODUCT_IDS].sort());
   assert.equal(sizes.size, MAX_ITEMS_PER_ORDER);
});

test('orderEmojis devuelve un emoji por producto y todos son distintos entre productos', () => {
   assert.deepEqual(orderEmojis({ items: ['burger', 'fries', 'burger'] }), ['🍔', '🍟', '🍔']);
   const emojis = Object.values(PRODUCTS).map((product) => product.emoji);
   assert.equal(new Set(emojis).size, emojis.length);
   assert.ok(!emojis.includes(REJECT_EMOJI));
});