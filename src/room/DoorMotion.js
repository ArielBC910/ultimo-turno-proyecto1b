export const DOOR_TRAVEL_MS = 650;
export class DoorMotion {
  constructor() { this.closed = 0; }
  update(delta, requestedClosed) {
    if (!Number.isFinite(delta)) return;
    const change = Math.max(0, delta) / DOOR_TRAVEL_MS;
    this.closed = Math.max(0, Math.min(1, this.closed + (requestedClosed ? change : -change)));
  }
  get sealed() { return this.closed >= 1 - 1e-9; }
}
