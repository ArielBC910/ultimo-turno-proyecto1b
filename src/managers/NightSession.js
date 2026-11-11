import { MonsterManager } from './MonsterManager.js';

export const NIGHT_DURATION = 6 * 60 * 1000;

export class NightSession {
  constructor(random = Math.random) {
    this.monster = new MonsterManager(random);
    this.elapsed = 0;
    this.result = null;
  }

  get clock() {
    const gameMinutes = Math.min(360, Math.floor(this.elapsed / 1000));
    return { hours: Math.floor(gameMinutes / 60) || 12, minutes: gameMinutes % 60 };
  }

  update(delta, doorClosed) {
    if (this.result || !Number.isFinite(delta) || delta <= 0) return [];
    const step = Math.min(delta, NIGHT_DURATION - this.elapsed);
    const events = this.monster.update(step, doorClosed, this.elapsed / NIGHT_DURATION);
    const kill = events.find((event) => event.type === 'kill');
    if (kill && this.elapsed + kill.atMs < NIGHT_DURATION) {
      this.elapsed += kill.atMs;
      this.result = 'lost';
      return [...events.filter((event) => event.atMs <= kill.atMs), { type: 'lost' }];
    }
    this.elapsed += step;
    if (this.elapsed >= NIGHT_DURATION) {
      this.result = 'won';
      return [...events.filter((event) => event.type !== 'kill'), { type: 'won' }];
    }
    return events;
  }
}
