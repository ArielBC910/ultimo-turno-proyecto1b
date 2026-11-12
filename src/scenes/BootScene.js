import Phaser from 'phaser';
import { CAMERAS, OFFICE_VIEWS } from '../config.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { isKitchenAsset } from '../kitchen/kitchenConfig.js';
import { ensureKitchenTextures, preloadKitchenAssets } from '../kitchen/kitchenAssets.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.failed = false;
    for (const key of Object.values(OFFICE_VIEWS)) this.load.image(key, 'assets/images/' + key + '.png');
    for (const camera of CAMERAS) this.load.image(camera.key, 'assets/images/' + camera.file);
    for (const camera of CAMERAS) this.load.image(camera.key + '-wendigo', 'assets/images/' + camera.key + '-wendigo.png');
    this.load.image('office-wendigo-dark', 'assets/images/office-wendigo-dark.png');
    this.load.image('office-wendigo-light', 'assets/images/office-wendigo-light.png');
    this.load.image('fan-rotor', 'assets/images/fan-rotor.png');
    preloadKitchenAssets(this);
    this.load.audio('door-bang', 'assets/audio/door-bang.ogg');
    this.load.audio('wendigo-scream', 'assets/audio/wendigo-scream.ogg');
    this.load.audio('night-ambient', 'assets/audio/night-ambient.wav');
    this.load.audio('night-music', 'assets/audio/night-music.wav');
    this.load.audio('fan-loop', 'assets/audio/fan-loop.wav');
    this.load.audio('night-crickets', 'assets/audio/night-crickets.wav');
    this.load.audio('flashlight-click', 'assets/audio/flashlight-click.wav');
    this.load.audio('door-close', 'assets/audio/door-close.wav');
    this.load.audio('door-open', 'assets/audio/door-open.wav');
    this.load.on('loaderror', (file) => {
      // Una imagen de cocina ausente no detiene el juego: create() dibuja un marcador de posición.
      if (isKitchenAsset(file.key)) return;
      this.failed = true;
      document.querySelector('#loading').textContent = 'No se pudo cargar ' + file.key + '. Recarga la página.';
    });
  }

  create() {
    if (!this.failed) {
      ensureKitchenTextures(this);
      const progress = new ProgressManager();
      this.registry.set('progress', progress);
      this.registry.set('audio', new AudioManager(this.game, progress));
      this.scene.start('Menu');
    }
  }
}