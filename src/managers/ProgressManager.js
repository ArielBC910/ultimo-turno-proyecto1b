const KEY = 'ultimo-turno.progress.v1';

export class ProgressManager {
  constructor() {
    this.data = { muted: false, bestSurvivalMs: 0, wins: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && typeof saved === 'object') {
        this.data.muted = saved.muted === true;
        for (const key of ['bestSurvivalMs', 'wins']) {
          if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) this.data[key] = saved[key];
        }
        this.data.bestSurvivalMs = Math.min(360000, this.data.bestSurvivalMs);
      }
    } catch { /* Almacenamiento bloqueado: conservar progreso durante la sesión. */ }
  }

  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* Sin almacenamiento, el juego continúa. */ } }

  record(result, elapsed) {
    this.data.bestSurvivalMs = Math.max(this.data.bestSurvivalMs, Math.min(360000, Math.floor(elapsed)));
    if (result === 'won') this.data.wins++;
    this.save();
  }

  toggleMute() { this.data.muted = !this.data.muted; this.save(); return this.data.muted; }
}
