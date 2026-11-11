import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const root = document.querySelector('#surveillance');
    const menu = document.querySelector('#start-menu');
    root.className = 'menu-mode';
    menu.hidden = false;
    document.querySelector('#camera-view').hidden = true;
    document.querySelector('#loading').hidden = true;
    this.registry.get('audio').stop();
    const progress = this.registry.get('progress').data;
    const seconds = Math.floor(progress.bestSurvivalMs / 1000);
    document.querySelector('#menu-best').textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    document.querySelector('#menu-wins').textContent = String(progress.wins);
    this.background = this.add.image(0, 0, 'cam04-wendigo').setOrigin(0.5);
    const fit = () => {
      const source = this.background.texture.getSourceImage();
      this.background.setPosition(this.scale.width / 2, this.scale.height / 2)
        .setScale(Math.max(this.scale.width / source.width, this.scale.height / source.height));
    };
    fit();
    this.scale.on('resize', fit);
    const abort = new AbortController();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      menu.hidden = true;
      root.className = 'office-mode';
      this.scene.start('Office');
    };
    document.querySelector('#start-button').addEventListener('click', start, { signal: abort.signal });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Enter' && !['SUMMARY', 'BUTTON'].includes(event.target.tagName) && !event.repeat) {
        event.preventDefault();
        start();
      }
    }, { signal: abort.signal });
    document.querySelector('#start-button').focus({ preventScroll: true });
    this.events.once('shutdown', () => {
      abort.abort();
      this.scale.off('resize', fit);
      menu.hidden = true;
    });
  }
}
