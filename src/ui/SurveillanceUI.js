import { CAMERAS } from '../config.js';

export class SurveillanceUI {
  constructor(state, render, onMenu, onControl = () => { }) {
    this.state = state;
    this.render = render;
    this.onControl = onControl;
    this.root = document.querySelector('#surveillance');
    this.light = document.querySelector('#light-button');
    this.door = document.querySelector('#door-button');
    this.monitor = document.querySelector('#cameras-button');
    this.turn = document.querySelector('#turn-button');
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    document.querySelector('#return-menu').addEventListener('click', onMenu, options);
    this.light.addEventListener('click', () => this.perform('toggleLight'), options);
    this.door.addEventListener('click', () => this.perform('toggleDoor'), options);
    this.monitor.addEventListener('click', () => { state.toggleMonitor(); this.sync(); }, options);
    this.turn.addEventListener('click', () => { state.turnAround(); this.sync(); }, options);
    for (const button of document.querySelectorAll('[data-camera]')) {
      button.addEventListener('click', () => { state.selectCamera(button.dataset.camera); this.sync(); }, options);
    }
    window.addEventListener('keydown', (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.code === 'KeyF') this.perform('toggleLight');
      else if (event.code === 'KeyD') this.perform('toggleDoor');
      else if (event.code === 'KeyV') state.turnAround();
      else if (event.code === 'KeyC' || (event.code === 'Escape' && state.monitorOpen)) state.toggleMonitor();
      else if (state.monitorOpen && /^[1-4]$/.test(event.key)) state.selectCamera(CAMERAS[Number(event.key) - 1].key);
      else return;
      event.preventDefault();
      this.sync();
    }, options);
    this.sync();
  }

  perform(action) {
    const previousDoor = this.state.doorClosed;
    const previousLight = this.state.lightOn;
    this.state[action]();
    // Solo suena una acción efectiva; nunca por actualizar imágenes o pulsar un control bloqueado.
    if (previousDoor !== this.state.doorClosed) this.onControl('door', this.state.doorClosed);
    if (previousLight !== this.state.lightOn) this.onControl('light', this.state.lightOn);
    this.sync();
  }

  sync() {
    const state = this.state;
    const camera = CAMERAS.find((item) => item.key === state.camera);
    this.root.classList.toggle('kitchen-mode', state.inKitchen);
    this.root.classList.toggle('monitor-mode', state.monitorOpen);
    this.root.classList.toggle('office-mode', !state.inKitchen && !state.monitorOpen);
    this.root.classList.toggle('light-on', state.lightOn);
    document.querySelector('#camera-view').hidden = !state.monitorOpen;
    this.light.disabled = state.monitorOpen || state.inKitchen;
    this.door.disabled = state.monitorOpen || state.inKitchen;
    this.door.setAttribute('aria-pressed', String(state.doorClosed));
    document.querySelector('#door-label').textContent = state.doorClosed ? 'ABRIR PUERTA' : 'CERRAR PUERTA';
    document.querySelector('#door-state').textContent = state.doorClosed ? 'PUERTA FRONTAL CERRADA' : 'PUERTA FRONTAL ABIERTA';
    this.light.setAttribute('aria-pressed', String(state.lightOn));
    this.monitor.disabled = state.inKitchen;
    document.querySelector('#turn-label').textContent = state.inKitchen ? 'DARSE LA VUELTA' : 'ATENDER CLIENTES';
    document.querySelector('#turn-state').textContent = state.inKitchen ? 'IR A LAS CÁMARAS' : 'VOLVER A LA COCINA';
    this.monitor.setAttribute('aria-expanded', String(state.monitorOpen));
    document.querySelector('#light-state').textContent = state.lightOn ? 'LUZ FRONTAL ENCENDIDA' : state.monitorOpen ? 'NO DISPONIBLE EN MONITOR' : 'LUZ FRONTAL APAGADA';
    document.querySelector('#monitor-label').textContent = state.monitorOpen ? 'VOLVER A OFICINA' : 'CÁMARAS';
    document.querySelector('#monitor-state').textContent = state.monitorOpen ? 'CERRAR MONITOR' : 'ABRIR MONITOR';
    document.querySelector('#feed-id').textContent = 'CAM ' + camera.number;
    document.querySelector('#feed-name').textContent = camera.name;
    document.querySelector('#view-status').textContent = state.inKitchen ? 'COCINA / ATENDIENDO EN LA VENTANA' : state.monitorOpen ? 'MONITOR / CAM ' + camera.number : (state.doorClosed ? 'PUERTA CERRADA' : 'PUERTA ABIERTA') + (state.lightOn ? ' / LINTERNA ACTIVA' : ' / LUZ APAGADA');
    for (const button of document.querySelectorAll('[data-camera]')) {
      const selected = button.dataset.camera === state.camera;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    this.render(state);
  }

  destroy() { this.abort.abort(); }
}
