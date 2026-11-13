// Lógica pura de la atención al cliente (sin Phaser ni DOM, para poder probarla con node --test).

// Seguimiento de un pedido: cada producto del pedido se entrega por separado y se marca como hecho.
// Los productos pueden repetirse (dos hamburguesas = dos entregas), por eso se lleva un estado por posición.
export class OrderProgress {
  constructor(order) {
    this.items = [...order.items];
    this.done = this.items.map(() => false);
  }

  // Posición del primer producto pendiente que coincide con productId, o -1 si ese producto no hace falta.
  pendingIndex(productId) {
    return this.items.findIndex((id, index) => id === productId && !this.done[index]);
  }

  needs(productId) { return this.pendingIndex(productId) >= 0; }

  get complete() { return this.done.every(Boolean); }

  // Entrega un producto. Devuelve { accepted, index, complete }; si no hacía falta, no cambia nada.
  deliver(productId) {
    const index = this.pendingIndex(productId);
    if (index < 0) return { accepted: false, index: -1, complete: this.complete };
    this.done[index] = true;
    return { accepted: true, index, complete: this.complete };
  }

  // Un texto por producto: el emoji si sigue pendiente, la marca si ya se entregó.
  labels(emojiOf, doneMark = '✅') {
    return this.items.map((id, index) => (this.done[index] ? doneMark : emojiOf(id)));
  }
}

// Elige el cliente sobre el que se soltó la comida. `targets` son { id, x, y, w, h } en píxeles.
// Si varios rectángulos contienen el punto, gana el de centro horizontal más cercano.
export function dropTargetAt(x, y, targets) {
  let best = null;
  let bestDistance = Infinity;
  for (const target of targets) {
    if (x < target.x || x > target.x + target.w || y < target.y || y > target.y + target.h) continue;
    const distance = Math.abs(x - (target.x + target.w / 2));
    if (distance < bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return best;
}
