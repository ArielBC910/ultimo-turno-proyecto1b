import { MAX_ITEMS_PER_ORDER } from './kitchenConfig.js';

// Catálogo de productos. Para añadir uno nuevo basta con agregar una entrada aquí.
export const PRODUCTS = Object.freeze({
   burger: { id: 'burger', emoji: '🍔', label: 'Hamburguesa' },
   hotdog: { id: 'hotdog', emoji: '🌭', label: 'Hot dog' },
   fries: { id: 'fries', emoji: '🍟', label: 'Papas' },
   drink: { id: 'drink', emoji: '🥤', label: 'Bebida' },
});
export const PRODUCT_IDS = Object.freeze(Object.keys(PRODUCTS));

// Emoticón de rechazo: lo usará la lógica de servir (producto equivocado). Aquí solo se declara.
export const REJECT_EMOJI = '🚫';

// Crea un pedido de 1 a maxItems productos (se pueden repetir: dos hamburguesas son dos emojis).
// rng se inyecta para poder probarlo con valores fijos.
export function createOrder(rng = Math.random, maxItems = MAX_ITEMS_PER_ORDER) {
   const limit = Math.max(1, Math.floor(maxItems));
   const count = Math.min(limit, 1 + Math.floor(rng() * limit));
   const items = [];
   for (let i = 0; i < count; i += 1) {
      items.push(PRODUCT_IDS[Math.min(PRODUCT_IDS.length - 1, Math.floor(rng() * PRODUCT_IDS.length))]);
   }
   return { items };
}

export function orderEmojis(order) {
   return order.items.map((id) => PRODUCTS[id].emoji);
}