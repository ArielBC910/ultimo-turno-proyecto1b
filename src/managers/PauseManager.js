// Estado de pausa (lógica pura, sin Phaser ni DOM, para poder probarla con node --test).
// Quien necesite reaccionar (la escena, la interfaz) se suscribe y recibe `true` al pausar y `false` al reanudar.
export class PauseManager {
  constructor({ canPause = () => true } = {}) {
    this.canPause = canPause; // p. ej. no se puede pausar durante una derrota o el resultado final
    this.paused = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Devuelven true solo si realmente cambió el estado (pausar dos veces seguidas no repite nada).
  pause() {
    if (this.paused || !this.canPause()) return false;
    return this.change(true);
  }

  resume() {
    if (!this.paused) return false;
    return this.change(false);
  }

  toggle() { return this.paused ? this.resume() : this.pause(); }

  // Vuelve al estado normal sin avisar a nadie (al cerrar la escena).
  reset() { this.paused = false; }

  change(paused) {
    this.paused = paused;
    for (const listener of this.listeners) listener(paused);
    return true;
  }
}
