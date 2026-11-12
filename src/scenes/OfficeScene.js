import Phaser from 'phaser';
import { SurveillanceManager } from '../managers/SurveillanceManager.js';
import { SurveillanceUI } from '../ui/SurveillanceUI.js';
import { getSurveillanceTexture } from '../config.js';
import { NightSession } from '../managers/NightSession.js';
import { CameraInterference } from '../ui/CameraInterference.js';
import { FanEffect } from '../objects/FanEffect.js';
import { KitchenView } from '../objects/KitchenView.js';
import { ScareManager } from '../managers/ScareManager.js';
import { ScareMeterUI } from '../ui/ScareMeterUI.js';
import { KITCHEN_EVENTS } from '../kitchen/kitchenConfig.js';
import { triggerJumpscare } from '../kitchen/jumpscare.js';

export class OfficeScene extends Phaser.Scene {
  constructor() { super('Office'); }

  create() {
    document.querySelector('#surveillance').className = 'office-mode';
    this.finished = false;
    this.session = new NightSession();
    this.lastTick = performance.now();
    this.backdrop = this.add.image(0, 0, 'office').setOrigin(0.5);
    this.outgoing = this.add.image(0, 0, 'office').setOrigin(0.5).setAlpha(0);
    this.fan = new FanEffect(this);
    this.kitchen = new KitchenView(this);
    this.scare = new ScareManager();
    this.scareUI = new ScareMeterUI(this.scare);
    this.events.on(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, this.onCustomerTimeout, this);
    this.state = new SurveillanceManager();
    this.monster = this.session.monster;
    this.registry.get('audio').start();
    this.interference = new CameraInterference(document.querySelector('#surveillance'));
    this.ui = new SurveillanceUI(this.state, (state) => this.renderView(state),
      () => this.scene.start('Menu'),
      (kind, value) => this.registry.get('audio').interaction(kind, value));
    this.updateClock();
    this.fitBackground();
    this.scale.on('resize', this.fitBackground, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fitBackground, this);
      this.ui.destroy();
      this.interference.destroy();
      this.fan.destroy();
      this.kitchen.destroy();
      this.events.off(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, this.onCustomerTimeout, this);
      this.scareUI.destroy();
      this.registry.get('audio').stop();
    });
    document.querySelector('#loading').hidden = true;
  }

  // Un cliente zombie se cansó de esperar sin ser atendido: sube el susto y se dispara el jumpscare.
  onCustomerTimeout(customer) {
    if (this.finished) return;
    const justFilled = this.scare.add();
    this.scareUI.sync();
    triggerJumpscare(this, customer); // espacio reservado: lo implementan los compañeros
    // Qué ocurre al llenarse la barra aún no está definido: quien lo decida escucha este evento.
    if (justFilled) this.events.emit(KITCHEN_EVENTS.SCARE_FULL);
  }

  renderView(state) {
    // La cocina y la espalda (oficina/cámaras) son vistas excluyentes.
    this.kitchen.setVisible(state.inKitchen);
    this.backdrop.setVisible(!state.inKitchen);
    this.outgoing.setVisible(!state.inKitchen);
    this.fan.setVisible(!state.inKitchen && !state.monitorOpen);
    this.registry.get('audio').setMonitor(state.monitorOpen);
    // En la cocina no se cambia la textura de fondo; al volver se recalcula con el estado vigente.
    if (state.inKitchen) return;
    const next = getSurveillanceTexture(state, this.monster.location);
    if (next === this.backdrop.texture.key) return;
    if (state.monitorOpen) this.interference.pulse();
    // Fundido breve entre imágenes; cancelar el anterior permite pulsaciones rápidas.
    this.tweens.killTweensOf(this.outgoing);
    this.outgoing.setTexture(this.backdrop.texture.key).setAlpha(1);
    this.backdrop.setTexture(next);
    this.fitBackground();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.outgoing.setAlpha(0);
    } else {
      this.tweens.add({ targets: this.outgoing, alpha: 0, duration: 280, ease: 'Sine.easeOut' });
    }
  }

  update(_time, delta) {
    if (this.finished) return;
    this.fan.update(delta);
    // Reloj monotónico: la duración no depende de los FPS ni de la limitación de delta de Phaser.
    const now = performance.now();
    const elapsed = Math.max(0, now - this.lastTick);
    this.lastTick = now;
    const events = this.session.update(elapsed, this.state.doorClosed);
    this.updateClock();
    if (this.session.result) {
      this.finished = true;
      this.registry.get('progress').record(this.session.result, this.session.elapsed);
      this.scene.start('Result', { result: this.session.result, elapsed: this.session.elapsed });
      return;
    }
    for (const event of events) {
      if (event.type === 'retreat') this.registry.get('audio').retreat();
      if (this.state.monitorOpen) this.interference.pulse();
    }
    if (events.length) this.renderView(this.state);
  }

  updateClock() {
    const clock = this.session.clock;
    const label = clock.hours + ':' + String(clock.minutes).padStart(2, '0');
    if (label === this.clockLabel) return;
    this.clockLabel = label;
    document.querySelector('#clock-hours').textContent = String(clock.hours);
    document.querySelector('#clock-minutes').textContent = String(clock.minutes).padStart(2, '0');
  }

  fitBackground() {
    const { width, height } = this.scale;
    // Las dos capas comparten encuadre, incluso durante un cambio de resolución.
    for (const layer of [this.backdrop, this.outgoing]) {
      const image = layer.texture.getSourceImage();
      // En un móvil vertical se conserva la sala completa para no recortar al monstruo.
      const portraitMonitor = this.state?.monitorOpen && width < height;
      const scale = portraitMonitor ? width / image.width : Math.max(width / image.width, height / image.height);
      layer.setPosition(width / 2, portraitMonitor ? height * 0.34 : height / 2).setScale(scale);
    }
    this.fan.fit(this.backdrop);
    this.kitchen.fit();
  }
}

