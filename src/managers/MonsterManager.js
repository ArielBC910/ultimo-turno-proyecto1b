export const ROOM_GRAPH = Object.freeze({
  cam03: ['cam02', 'cam01'],
  cam02: ['cam03', 'cam01', 'cam04'],
  cam01: ['cam03', 'cam02', 'cam04'],
  cam04: ['cam01', 'cam02', 'door'],
  door: [],
});
const DISTANCE = { door: 0, cam04: 1, cam01: 2, cam02: 2, cam03: 3 };
export const SAFE_ROOMS = Object.freeze(['cam01', 'cam02', 'cam03']);

export class MonsterManager {
  constructor(random = Math.random) {
    this.random = random;
    this.location = 'cam03';
    this.previous = null;
    this.elapsed = 0;
    this.openExposure = 0;
    this.blockedElapsed = 0;
    this.retreatAfter = null;
    this.deadly = false;
    this.duration = this.nextDuration(0);
  }

  roll() { return Math.max(0, Math.min(0.999999999, this.random())); }
  // Cada postura dura al menos 15 s, incluso al final de la noche.
  nextDuration(progress) { return (34000 + this.roll() * 10000) * (1 - Math.min(1, progress) * 0.1); }

  chooseNext(progress) {
    const neighbors = ROOM_GRAPH[this.location];
    const weighted = neighbors.map((room) => ({
      room,
      weight: (DISTANCE[room] < DISTANCE[this.location] ? 4 + progress * 3 : 1.3) * (room === this.previous ? 0.7 : 1),
    }));
    let cursor = this.roll() * weighted.reduce((sum, entry) => sum + entry.weight, 0);
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor < 0) return entry.room;
    }
    return weighted.at(-1).room;
  }

  enter(room, progress) {
    this.previous = this.location;
    this.location = room;
    this.elapsed = 0;
    this.openExposure = 0;
    this.blockedElapsed = 0;
    this.retreatAfter = null;
    this.duration = room === 'door' ? Infinity : this.nextDuration(progress);
  }

  // Los eventos incluyen el instante dentro de delta: el reloj y la muerte comparten tiempo.
  update(delta, doorClosed, progress = 0) {
    if (this.deadly || delta <= 0) return [];
    const events = [];
    let remaining = delta;
    let offset = 0;
    while (remaining > 0) {
      if (this.location === 'door') {
        if (doorClosed) {
          if (this.retreatAfter === null) this.retreatAfter = 5000 + this.roll() * 10000;
          const step = Math.min(remaining, this.retreatAfter - this.blockedElapsed);
          this.blockedElapsed += step;
          remaining -= step;
          offset += step;
          if (this.blockedElapsed >= this.retreatAfter) {
            const room = SAFE_ROOMS[Math.floor(this.roll() * SAFE_ROOMS.length)];
            this.enter(room, progress);
            events.push({ type: 'retreat', from: 'door', to: room, atMs: offset });
          }
        } else {
          // Reabrir antes de la retirada cancela la espera de puerta cerrada.
          // La exposición abierta se acumula para impedir reiniciar el ataque pulsando D.
          this.blockedElapsed = 0;
          this.retreatAfter = null;
          const step = Math.min(remaining, 15000 - this.openExposure);
          this.openExposure += step;
          remaining -= step;
          offset += step;
          if (this.openExposure >= 15000) {
            this.deadly = true;
            events.push({ type: 'kill', atMs: offset });
            break;
          }
        }
      } else {
        const step = Math.min(remaining, this.duration - this.elapsed);
        this.elapsed += step;
        remaining -= step;
        offset += step;
        if (this.elapsed >= this.duration) {
          const from = this.location;
          const next = this.chooseNext(progress);
          this.enter(next, progress);
          events.push({ type: 'move', from, to: next, atMs: offset });
        }
      }
    }
    return events;
  }
}
