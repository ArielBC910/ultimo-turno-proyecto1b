import { PRODUCT_IDS } from './orders.js';

export const PREPARE_MS = Object.freeze({ burger: 2800, hotdog: 2200, fries: 1800, drink: 650 });

// La preparación continúa aunque el jugador se gire o consulte el monitor.
export class CookingStation {
  constructor() { this.queue = []; this.tray = []; this.elapsed = 0; this.served = 0; }
  prepare(product) {
    if (!PRODUCT_IDS.includes(product) || this.queue.length + this.tray.length >= 3) return false;
    this.queue.push(product); return true;
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0 || !this.queue.length) return;
    this.elapsed += delta;
    while (this.queue.length && this.elapsed >= PREPARE_MS[this.queue[0]]) {
      this.elapsed -= PREPARE_MS[this.queue[0]];
      this.tray.push(this.queue.shift());
    }
    if (!this.queue.length) this.elapsed = 0;
  }
  get progress() { return this.queue.length ? Math.min(1, this.elapsed / PREPARE_MS[this.queue[0]]) : 0; }
  serve(order, waiting) {
    if (!waiting) return 'not-ready';
    if (this.queue.length) return 'preparing';
    if (!this.tray.length) return 'empty';
    const expected = [...order.items].sort().join(',');
    if ([...this.tray].sort().join(',') !== expected) return 'wrong';
    this.tray = []; this.served++; return 'served';
  }
  clear() { this.queue = []; this.tray = []; this.elapsed = 0; }
}
