import Phaser from 'phaser';
import { NIGHT_DURATION } from '../managers/NightSession.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create({ result, elapsed = 0 } = {}) {
    const won = result === 'won';
    const root = document.querySelector('#surveillance');
    const panel = document.querySelector('#result-screen');
    root.className = 'result-mode' + (won ? ' victory-mode' : ' defeat-mode');
    panel.hidden = false;
    document.querySelector('#camera-view').hidden = true;
    document.querySelector('#result-eyebrow').textContent = won ? 'TURNO COMPLETADO' : 'SEÑAL PERDIDA';
    document.querySelector('#result-title').textContent = won ? '6:00 AM' : 'NO LLEGASTE AL AMANECER';
    document.querySelector('#result-message').textContent = won ? 'La noche terminó. Sigues aquí.' : 'El wendigo entró por el acceso frontal.';
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor(elapsed / 1000) % 60;
    document.querySelector('#result-time').textContent = 'SOBREVIVISTE ' + minutes + ':' + String(seconds).padStart(2, '0') + ' / 6:00';
    document.querySelector('#result-progress').style.width = Math.min(100, elapsed / NIGHT_DURATION * 100) + '%';
    this.backdrop = this.add.image(0, 0, won ? 'office' : 'office-wendigo-light').setOrigin(0.5);
    const fit = () => {
      const image = this.backdrop.texture.getSourceImage();
      this.backdrop.setPosition(this.scale.width / 2, this.scale.height / 2).setScale(Math.max(this.scale.width / image.width, this.scale.height / image.height));
    };
    fit();
    this.scale.on('resize', fit);
    const audio = this.registry.get('audio');
    if (!won) audio.defeat();
    const abort = new AbortController();
    let leaving = false;
    const go = (scene) => {
      if (leaving) return;
      leaving = true;
      panel.hidden = true;
      audio.stop();
      root.className = scene === 'Menu' ? 'menu-mode' : 'office-mode';
      this.scene.start(scene);
    };
    document.querySelector('#retry-button').addEventListener('click', () => go('Office'), { signal: abort.signal });
    document.querySelector('#result-menu-button').addEventListener('click', () => go('Menu'), { signal: abort.signal });
    document.querySelector('#retry-button').focus({ preventScroll: true });
    this.events.once('shutdown', () => {
      abort.abort();
      panel.hidden = true;
      this.scale.off('resize', fit);
    });
  }
}
