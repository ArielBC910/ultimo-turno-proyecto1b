export const ROOM = Object.freeze({ halfWidth: 1.7, halfDepth: 1.8, height: 2.65 });
export const OBSTACLES = Object.freeze([
  { x1: -1.62, x2: 1.62, y1: -1.62, y2: -1.05 },
  { x1: -1.7, x2: -1.08, y1: .4, y2: 1.8 },
  { x1: 1.1, x2: 1.7, y1: -.3, y2: 1.8 },
  { x1: -1.08, x2: 1.1, y1: 1.22, y2: 1.8 },
]);

export function solid(x, y, radius = 0) {
  return Math.abs(x) + radius > ROOM.halfWidth || Math.abs(y) + radius > ROOM.halfDepth ||
    OBSTACLES.some(o => x + radius > o.x1 && x - radius < o.x2 && y + radius > o.y1 && y - radius < o.y2);
}

export class RoomNavigation {
  constructor() { this.x = 0; this.y = 0; this.angle = -Math.PI / 2; }
  move(forward, strafe, turn, delta) {
    const seconds = Math.min(Math.max(delta, 0), 80) / 1000;
    this.angle = (this.angle + turn * seconds * 1.8) % (Math.PI * 2);
    const step = seconds * 1.55 / Math.max(1, Math.hypot(forward, strafe));
    const dx = (Math.cos(this.angle) * forward - Math.sin(this.angle) * strafe) * step;
    const dy = (Math.sin(this.angle) * forward + Math.cos(this.angle) * strafe) * step;
    if (!solid(this.x + dx, this.y, .18)) this.x += dx;
    if (!solid(this.x, this.y + dy, .18)) this.y += dy;
  }
  station() {
    if (Math.abs(this.x) < 1.05 && this.y < -.62 && Math.sin(this.angle) < -.55) return { view: 'door', name: 'ACCESO FRONTAL' };
    if (Math.abs(this.x) < 1.08 && this.y > .5 && Math.sin(this.angle) > .55) return { view: 'kitchen', name: 'COCINA / ATENCIÓN' };
    return null;
  }
  turnAround() { this.angle += Math.PI; }
}
