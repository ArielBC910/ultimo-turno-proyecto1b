import { SCARE_MAX, SCARE_PER_MISSED_CUSTOMER } from '../kitchen/kitchenConfig.js';

// Barra de susto: se llena cada vez que un cliente zombie no es atendido. Lógica pura (sin Phaser ni DOM).
export class ScareManager {
  constructor({ max = SCARE_MAX, perMissedCustomer = SCARE_PER_MISSED_CUSTOMER } = {}) {
    this.max = Math.max(1, max);
    this.perMissedCustomer = perMissedCustomer;
    this.value = 0;
  }

  get ratio() { return this.value / this.max; }

  get isFull() { return this.value >= this.max; }

  // Suma susto (por defecto, el de un cliente sin atender). Devuelve true si con esta suma la barra se acaba de llenar.
  add(amount = this.perMissedCustomer) {
    const wasFull = this.isFull;
    this.value = Math.min(this.max, Math.max(0, this.value + amount));
    return !wasFull && this.isFull;
  }

  reset() { this.value = 0; }
}
