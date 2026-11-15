// Barra de susto (abajo a la izquierda). Solo pinta el estado del ScareManager; sync() la actualiza.
export class ScareMeterUI {
  constructor(scare) {
    this.scare = scare;
    this.root = document.querySelector('#scare-meter');
    this.fill = document.querySelector('#scare-fill');
    this.sync();
  }

  sync() {
    const percent = Math.round(this.scare.ratio * 100);
    this.fill.style.width = `${percent}%`;
    this.root.setAttribute('aria-valuenow', String(percent));
    this.root.classList.toggle('scare-high', this.scare.ratio >= 0.75);
  }

  destroy() {
    this.fill.style.width = '0%';
    this.root.classList.remove('scare-high');
  }
}
