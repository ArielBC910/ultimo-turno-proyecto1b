export const RABBIT_SOUNDS = ['cloth', 'knock', 'snap', 'breath', 'impact'];

export class RabbitAudio {
  constructor(sound) {
    this.sound = sound;
    this.phase = null;
  }

  update(phase, remainingMs, now) {
    if (phase !== this.phase) {
      this.stop();
      this.phase = phase;
      if (phase === 0 || phase === 2) {
        this.loop = this.sound.add(phase === 0 ? 'rabbit-cloth' : 'rabbit-breath', {
          loop: true, volume: phase === 0 ? 0.21 : 0.43,
        });
        this.loop.play();
      }
      this.nextKnock = now;
    }
    if (phase === 1 && now >= this.nextKnock) {
      this.clearCue();
      this.cue = this.sound.add('rabbit-knock', { volume: 0.54 });
      this.cue.play();
      this.nextKnock = now + 440 + 410 * Math.max(0, Math.min(1, (remainingMs - 10000) / 5000));
    }
  }

  snap() {
    this.clearCue();
    this.cue = this.sound.add('rabbit-snap', { volume: 0.62 });
    this.cue.play();
  }

  clearCue() {
    this.cue?.destroy();
    this.cue = null;
  }

  stop() {
    this.loop?.destroy();
    this.loop = null;
    this.clearCue();
    this.phase = null;
  }
}
