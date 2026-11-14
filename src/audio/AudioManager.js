export class AudioManager {
  constructor(game, progress) {
    this.game = game;
    this.progress = progress;
    game.sound.mute = progress.data.muted;
    this.abort = new AbortController();
    document.querySelector('#audio-button').addEventListener('click', () => {
      game.sound.mute = progress.toggleMute();
      this.sync();
    }, { signal: this.abort.signal });
    this.sync();
  }

  sync() {
    const button = document.querySelector('#audio-button');
    button.textContent = this.progress.data.muted ? 'ACTIVAR AUDIO' : 'AUDIO ACTIVADO';
    button.setAttribute('aria-pressed', String(!this.progress.data.muted));
  }

  start() {
    if (this.game.sound.locked) this.game.sound.unlock();
    this.loops ??= {};
    this.nightDucked = false;
    this.monitorOpen = false;
    const layers = [
      ['night-music', 0.28, 0],
      ['night-ambient', 0.055, 0],
      ['fan-loop', 0.31, 0.5],
      ['night-crickets', 0.19, -0.25],
    ];
    for (const [key, volume, pan] of layers) {
      this.loops[key] ??= this.game.sound.add(key, { volume, loop: true, pan });
      if (!this.loops[key].isPlaying) this.loops[key].play();
    }
  }

  setMonitor(open) {
    this.monitorOpen = open;
    this.setNightDuck(this.nightDucked);
  }

  setNightDuck(ducked) {
    this.nightDucked = ducked;
    const gain = ducked ? 0.08 : 1;
    const open = this.monitorOpen;
    this.loops?.['night-music']?.setVolume(0.28 * gain);
    this.loops?.['night-ambient']?.setVolume(0.055 * gain);
    // El ventilador permanece en la oficina, más tenue al concentrarse en el monitor.
    this.loops?.['fan-loop']?.setVolume((open ? 0.17 : 0.31) * gain);
    this.loops?.['night-crickets']?.setVolume((open ? 0.12 : 0.19) * gain);
  }

  interaction(kind, value) {
    if (kind === 'light') this.game.sound.play('flashlight-click', { volume: 0.52 });
    if (kind === 'door') this.game.sound.play(value ? 'door-close' : 'door-open', { volume: value ? 0.55 : 0.43 });
  }

  retreat() {
    this.game.sound.play('door-bang', { volume: 0.8 });
    this.game.sound.play('wendigo-scream', { volume: 0.43, rate: 0.84, delay: 0.12 });
  }

  defeat() { this.game.sound.play('wendigo-scream', { volume: 0.55, rate: 0.94 }); }

  stop() { this.game.sound.stopAll(); }
}
