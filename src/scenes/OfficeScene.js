import { WendigoAttack } from '../room/WendigoAttack.js';
import Phaser from 'phaser';
import { ShiftSimulation } from '../managers/ShiftSimulation.js';
import { PowerUI } from '../ui/PowerUI.js';
import { SurveillanceUI } from '../ui/SurveillanceUI.js';
import { getSurveillanceTexture, getMonsterPose } from '../config.js';
import { CameraInterference } from '../ui/CameraInterference.js';
import { FanEffect } from '../objects/FanEffect.js';
import { KitchenView } from '../objects/KitchenView.js';
import { ScareManager } from '../managers/ScareManager.js';
import { ScareMeterUI } from '../ui/ScareMeterUI.js';
import { KITCHEN_EVENTS } from '../kitchen/kitchenConfig.js';
import { triggerJumpscare } from '../kitchen/jumpscare.js';
import { WalkRoomView } from '../objects/WalkRoomView.js';
import { CameraSignal } from '../managers/CameraSignal.js';
import { FACING } from '../kitchen/kitchenConfig.js';
import { PauseManager } from '../managers/PauseManager.js';
import { PauseUI } from '../ui/PauseUI.js';

export class OfficeScene extends Phaser.Scene {
  constructor() { super('Office'); }

  create() {
    document.querySelector('#surveillance').className = 'office-mode';
    this.finished = false;
    this.attack = null;
    this.shift = new ShiftSimulation();
    this.session = this.shift.night;
    this.state = this.shift.state;
    this.clockLabel = null;
    this.defeatCause = null;
    this.powerUI = new PowerUI(this.shift.power, this.state);
    this.lastTick = performance.now();
    this.backdrop = this.add.image(0, 0, 'office').setOrigin(0.5);
    this.outgoing = this.add.image(0, 0, 'office').setOrigin(0.5).setAlpha(0);
    this.fan = new FanEffect(this);
    this.kitchen = new KitchenView(this);
    this.scare = new ScareManager();
    this.scareUI = new ScareMeterUI(this.scare);
    this.events.on(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, this.onCustomerTimeout, this);
    this.monster = this.session.monster;
    this.signal = new CameraSignal();
    this.room = new WalkRoomView(this);
    this.registry.get('audio').start();
    this.interference = new CameraInterference(document.querySelector('#surveillance'));
    this.ui = new SurveillanceUI(this.state, (state) => this.renderView(state),
      () => this.scene.start('Menu'),
      (kind, value) => kind === 'cursor-release' ? this.room.releaseMouseLock() : this.registry.get('audio').interaction(kind, value),
      () => this.returnToRoom());
    this.updateClock();
    this.fitBackground();
    // Pausa: no se puede durante la derrota ni el resultado. Al ocultar la pestaña se pausa sola, porque el
    // reloj de la noche usa performance.now() y seguiría contando mientras el navegador detiene el juego.
    this.pauseControl = new PauseManager({ canPause: () => !this.finished && !this.attack && !this.session.result });
    this.pauseControl.subscribe((paused) => (paused ? this.freeze() : this.unfreeze()));
    this.pauseUI = new PauseUI(this.pauseControl, { onMenu: () => this.quitToMenu() });
    this.autoPause = () => this.pauseControl.pause();
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.autoPause);
    this.scale.on('resize', this.fitBackground, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fitBackground, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.autoPause);
      this.pauseControl.reset();
      this.pauseUI.destroy();
      this.ui.destroy();
      this.interference.destroy();
      this.fan.destroy();
      this.attack?.destroy();
      this.room.destroy();
      this.powerUI.destroy();
      this.kitchen.destroy();
      this.events.off(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, this.onCustomerTimeout, this);
      this.scareUI.destroy();
      this.registry.get('audio').stop(Boolean(this.attack));
    });
    document.querySelector('#loading').hidden = true;
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('qaRoom')) {
      window.__shiftQA = this;
      this.events.once('shutdown', () => { delete window.__shiftQA; });
    }
  }

  // Pausa: Phaser detiene la escena (actualización, temporizadores y tweens); el audio y la sala 3D se avisan aparte.
  freeze() {
    this.scene.pause();
    this.registry.get('audio').pause();
    this.room.releaseInput();
  }

  unfreeze() {
    this.lastTick = performance.now(); // el tiempo en pausa no cuenta para la noche
    this.scene.resume();
    this.registry.get('audio').resume();
  }

  quitToMenu() {
    this.pauseControl.resume();
    this.scene.start('Menu');
  }

  openStation(view) {
    this.state.walking = false;
    this.state.facing = view === 'kitchen' ? FACING.KITCHEN : FACING.BACK;
    this.state.monitorOpen = view === 'monitor';
    this.state.lightOn = false;
    this.ui.sync();
  }

  returnToRoom() {
    if (this.state.roomMode) { this.room.turnAround(); return; }
    this.state.walking = true;
    this.state.monitorOpen = false;
    this.state.lightOn = false;
    this.ui.sync();
  }

  // Un cliente zombie se cansó de esperar sin ser atendido: sube el susto y se dispara el jumpscare.
  onCustomerTimeout(customer) {
    if (this.finished) return;
    const justFilled = this.scare.add();
    this.scareUI.sync();
    triggerJumpscare(this, customer);
    if (justFilled) {
      this.events.emit(KITCHEN_EVENTS.SCARE_FULL);
      this.defeatCause = 'customers';
      this.time.delayedCall(900, () => { if (!this.finished) this.session.result = 'lost'; });
    }
  }

  renderView(state) {
    if (state.roomMode) {
      this.room.setVisible(!state.monitorOpen);
      this.kitchen.setVisible(false);
      this.backdrop.setVisible(state.monitorOpen);
      this.outgoing.setVisible(false);
      this.fan.setVisible(false);
      this.currentPose = getMonsterPose(this.monster);
      this.registry.get('audio').setMonitor(state.monitorOpen);
      this.interference.setLost(state.monitorOpen && this.signal.isLost(state.camera, this.session.elapsed));
      if (state.monitorOpen) {
        const texture = getSurveillanceTexture(state, this.monster.location, this.currentPose);
        if (texture !== this.backdrop.texture.key) {
          this.backdrop.setTexture(texture);
          this.interference.pulse();
        }
        this.fitBackground();
      }
      return;
    }
    this.room.setVisible(state.walking);
    this.interference.setLost(state.monitorOpen && this.signal.isLost(state.camera, this.session.elapsed));
    // La cocina y la espalda (oficina/cámaras) son vistas excluyentes.
    this.kitchen.setVisible(!state.walking && state.inKitchen);
    this.backdrop.setVisible(!state.walking && !state.inKitchen);
    this.outgoing.setVisible(!state.walking && !state.inKitchen);
    this.fan.setVisible(!state.walking && !state.inKitchen && !state.monitorOpen);
    this.registry.get('audio').setMonitor(state.monitorOpen);
    this.currentPose = getMonsterPose(this.monster);
    // En la cocina no se cambia la textura de fondo; al volver se recalcula con el estado vigente.
    if (state.walking || state.inKitchen) return;
    const next = getSurveillanceTexture(state, this.monster.location, this.currentPose);
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
    if (this.attack) { if (this.attack.update(delta)) this.showResult(true); return; }
    if (this.finished) return;
    this.fan.update(delta);
    // Reloj monotónico: la duración no depende de los FPS ni de la limitación de delta de Phaser.
    const now = performance.now();
    const elapsed = Math.max(0, now - this.lastTick);
    this.lastTick = now;
    this.kitchen.cooking.update(elapsed);
    const events = this.shift.update(elapsed);
    this.room.update(delta);
    this.powerUI.update();
    this.updateClock();
    if (this.session.result) {
      this.finished = true;
      this.state.controlsLocked = true;
      this.registry.get('progress').record(this.session.result, this.session.elapsed);
      if (this.session.result === 'lost' && this.defeatCause !== 'customers') {
        this.state.monitorOpen = false; this.ui.sync();
        this.attack = new WendigoAttack(this.room);
        this.registry.get('audio').defeat();
      } else this.showResult(false);
      return;
    }
    for (const event of events) {
      if (event.type === 'retreat') { this.registry.get('audio').retreat(); this.powerUI.event('retreat'); }
      if (event.type === 'move' && event.to === 'door') { this.powerUI.event('arrival'); this.registry.get('audio').arrival(); }
      if (event.type.startsWith('power-')) {
        this.powerUI.event(event.type);
        this.registry.get('audio').powerWarning(event.type);
        if (event.type === 'power-empty') { this.room.releaseMouseLock(); this.ui.sync(); }
      }
      if (event.type === 'move') this.signal.departure(event.from, this.session.elapsed - elapsed + event.atMs);
    }
    this.interference.setLost(this.state.monitorOpen && this.signal.isLost(this.state.camera, this.session.elapsed));
    if (events.length || this.currentPose !== getMonsterPose(this.monster)) this.renderView(this.state);
  }

  showResult(attackPlayed) {
    this.scene.start('Result', { result: this.session.result, elapsed: this.session.elapsed, cause: this.defeatCause, served: this.kitchen.cooking.served, attackPlayed });
  }

  updateClock() {
    const label = this.session.clockLabel;
    if (label === this.clockLabel) return;
    this.clockLabel = label;
    document.querySelector('#clock-hours').textContent = label;
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
    this.room?.fit();
  }
}
