// El corte pertenece a la cámara abandonada, aunque se cambie de canal.
export class CameraSignal {
  constructor(duration = 2500) {
    this.duration = duration;
    this.until = new Map();
  }

  departure(camera, now) {
    if (/^cam0[1-4]$/.test(camera)) this.until.set(camera, now + this.duration);
  }

  isLost(camera, now) { return now < (this.until.get(camera) ?? 0); }
}
