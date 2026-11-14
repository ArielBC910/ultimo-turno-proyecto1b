export class DoorMotion {
  constructor() { this.closed = 0; }
  update(delta, requestedClosed) {
    const change = Math.min(100, Math.max(0, delta)) / 650;
    this.closed = Math.max(0, Math.min(1, this.closed + (requestedClosed ? change : -change)));
  }
  get sealed() { return this.closed >= .995; }
}
