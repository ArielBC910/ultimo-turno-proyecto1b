import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerPicker } from '../src/kitchen/customerPicker.js';

const KEYS = ['a', 'b', 'c', 'd'];

test('en cada ronda salen todos los zombies exactamente una vez', () => {
   const picker = new CustomerPicker(KEYS);
   for (let round = 0; round < 50; round += 1) {
      const drawn = KEYS.map(() => picker.next());
      assert.deepEqual([...drawn].sort(), [...KEYS].sort());
   }
});

test('al empezar una ronda nueva no sale primero el mismo con el que acabó la anterior', () => {
   const picker = new CustomerPicker(KEYS);
   let previous = null;
   for (let i = 0; i < 400; i += 1) {
      const key = picker.next();
      assert.notEqual(key, previous);
      previous = key;
   }
});

test('con un solo zombie siempre sale ese; sin zombies avisa con un error claro', () => {
   const picker = new CustomerPicker(['solo']);
   assert.deepEqual([picker.next(), picker.next(), picker.next()], ['solo', 'solo', 'solo']);
   assert.throws(() => new CustomerPicker([]), /al menos una imagen/);
});

test('evita los que ya están en pantalla, pero no se pierde ninguno de la ronda', () => {
   const picker = new CustomerPicker(KEYS);
   const onScreen = [];
   const drawn = [];
   for (let i = 0; i < KEYS.length; i += 1) {
      const key = picker.next(onScreen.slice(-2));
      drawn.push(key);
      onScreen.push(key);
      assert.ok(!onScreen.slice(-3, -1).includes(key));
   }
   assert.deepEqual([...drawn].sort(), [...KEYS].sort());
});

test('si todos los que quedan ya están en pantalla, se acepta repetir en vez de bloquearse', () => {
   const picker = new CustomerPicker(['a', 'b']);
   const first = picker.next();
   const second = picker.next([first, 'b', 'a']);
   assert.ok(['a', 'b'].includes(second));
});

test('con un generador fijo el orden es reproducible', () => {
   const make = () => new CustomerPicker(KEYS, () => 0.3);
   const one = make();
   const two = make();
   assert.deepEqual(KEYS.map(() => one.next()), KEYS.map(() => two.next()));
});

test('los zombies nuevos que se añadan al catálogo entran en la bolsa en la siguiente ronda', () => {
   const keys = ['a', 'b'];
   const picker = new CustomerPicker(keys);
   picker.next(); picker.next();
   picker.keys.push('c'); // simula ampliar el catálogo
   const round = [picker.next(), picker.next(), picker.next()];
   assert.deepEqual([...round].sort(), ['a', 'b', 'c']);
});