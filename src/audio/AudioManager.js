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
    // El ventilador permanece en la oficina, más tenue al concentrarse en el monitor.
    this.loops?.['fan-loop']?.setVolume(open ? 0.17 : 0.31);
    this.loops?.['night-crickets']?.setVolume(open ? 0.12 : 0.19);
  }

  setRoomPose(x, z, angle) {
    const fan = this.loops?.['fan-loop'];
    if (!fan) return;
    const dx = 1.04 - x, dz = -1.2 - z;
    const distance = Math.hypot(dx, dz);
    fan.setPan(Math.max(-1, Math.min(1, (-Math.sin(angle) * dx + Math.cos(angle) * dz) / Math.max(.5, distance))));
    fan.setVolume(.31 / (1 + distance * .25));
  }

  interaction(kind, value) {
    if (kind === 'light') this.game.sound.play('flashlight-click', { volume: 0.52 });
    if (kind === 'door') this.game.sound.play(value ? 'door-close' : 'door-open', { volume: value ? 0.55 : 0.43 });
  }

  arrival() { this.game.sound.play('door-bang', { volume: .42, rate: .7, pan: 0 }); }

  powerWarning(type) { this.game.sound.play('flashlight-click', { volume: type === 'power-empty' ? .65 : .35, rate: .65 }); }

  retreat() {
    this.game.sound.play('door-bang', { volume: 0.8 });
    this.game.sound.play('wendigo-scream', { volume: 0.43, rate: 0.84, delay: 0.12 });
  }

  defeat() {
    if (this.defeatSound?.isPlaying) return;
    this.game.sound.stopAll();
    this.defeatSound ??= this.game.sound.add('foxy-jumpscare', { volume: .8, rate: 1 });
    this.defeatSound.play();
  }

  // Pausa: congela todos los sonidos donde están y los retoma al continuar.
  pause() { this.game.sound.pauseAll(); }

  resume() { this.game.sound.resumeAll(); }

  stop(preserveDefeat = false) {
    if (preserveDefeat) { for (const loop of Object.values(this.loops ?? {})) loop.stop(); }
    else this.game.sound.stopAll();
  }
}

