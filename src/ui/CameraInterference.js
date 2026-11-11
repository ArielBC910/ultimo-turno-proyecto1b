export class CameraInterference {
  constructor(root) {
    this.root = root;
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    const noise = context.createImageData(192, 192);
    let seed = 7181;
    for (let i = 0; i < noise.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = seed >>> 24;
      noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = value;
      noise.data[i + 3] = 255;
    }
    context.putImageData(noise, 0, 0);
    root.querySelector('.camera-noise').style.backgroundImage = 'url(' + canvas.toDataURL() + ')';
  }

  pulse() {
    clearTimeout(this.timeout);
    this.root.classList.add('signal-interference');
    this.timeout = setTimeout(() => this.root.classList.remove('signal-interference'), 420);
  }

  destroy() {
    clearTimeout(this.timeout);
    this.root.classList.remove('signal-interference');
  }
}
