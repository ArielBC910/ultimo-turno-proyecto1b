// Porcentaje por segundo real. Un único presupuesto para los tres sistemas.
export const POWER = Object.freeze({ capacity: 100, low: 25, critical: 10,
  rates: Object.freeze({ lightOn: .12, monitorOpen: .18, doorClosed: .52 }) });

export class PowerManager {
  constructor(charge = POWER.capacity) {
    this.charge = Number.isFinite(charge) ? Math.max(0, Math.min(POWER.capacity, charge)) : POWER.capacity;
    this.notified = new Set();
  }
  get available() { return this.charge > 0; }
  rate(state) { return Object.entries(POWER.rates).reduce((sum,[key,rate]) => sum + (state[key] ? rate : 0), 0); }
  timeToEmpty(state) { const rate=this.rate(state); return rate ? this.charge / rate * 1000 : Infinity; }
  enforce(state) {
    state.powerAvailable = this.available;
    if (!this.available) state.lightOn = state.monitorOpen = state.doorClosed = false;
  }
  update(delta, state) {
    if (!Number.isFinite(delta) || delta < 0) return [];
    this.charge = Math.max(0, Math.min(POWER.capacity, this.charge - this.rate(state) * delta / 1000));
    if (this.charge < 1e-9) this.charge = 0;
    this.enforce(state);
    const events=[];
    // Si un frame atraviesa varios umbrales, comunicar solamente el más urgente.
    for (const [type,threshold] of [['power-empty',0],['power-critical',POWER.critical],['power-low',POWER.low]]) {
      if(this.charge <= threshold && !this.notified.has(type)) {
        this.notified.add(type);
        if(!events.length) events.push({type});
      }
    }
    return events;
  }
}
