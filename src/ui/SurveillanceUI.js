import { CAMERAS } from '../config.js';

export class SurveillanceUI {
  constructor(state, render, onMenu, onControl = () => { }, onRoom = null) {
    this.state = state;
    this.render = render;
    this.onControl = onControl;
    this.onRoom = onRoom;
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
    this.monitor.addEventListener('click', () => this.toggleMonitor(), options);
    this.turn.addEventListener('click', () => this.leaveStation(), options);
    for (const button of document.querySelectorAll('[data-camera]')) {
      button.addEventListener('click', () => { state.selectCamera(button.dataset.camera); this.sync(); }, options);
    }
    window.addEventListener('keydown', (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (state.walking && !state.roomMode) return;
      if (event.code === 'KeyF') this.perform('toggleLight');
      else if (event.code === 'KeyX') this.perform('toggleDoor');
      else if (event.code === 'KeyV') this.leaveStation();
      else if (event.code === 'Escape') {
        if (state.roomMode) { if (state.monitorOpen) this.toggleMonitor(); }
        else this.leaveStation();
      }
      else if (event.code === 'KeyC') this.toggleMonitor();
      else if (state.monitorOpen && /^[1-4]$/.test(event.key)) state.selectCamera(CAMERAS[Number(event.key) - 1].key);
      else return;
      event.preventDefault();
      this.sync();
    }, options);
    this.sync();
  }

  toggleMonitor() {
    if (this.state.roomMode) { this.state.toggleMonitor(); if(this.state.monitorOpen)this.onControl('cursor-release'); this.sync(); return; }
    if (this.state.walking && !this.state.roomMode) return;
    if (this.onRoom && this.state.monitorOpen) { this.onRoom(); return; }
    this.state.toggleMonitor(); this.sync();
  }

  leaveStation() {
    if (this.state.roomMode && this.state.monitorOpen) { this.toggleMonitor(); return; }
    if (this.onRoom) this.onRoom();
    else { this.state.turnAround(); this.sync(); }
  }

  perform(action) {
    if (this.state.roomMode && this.state.monitorOpen) return;
    if (this.state.walking && !this.state.roomMode) return;
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
    if (state.roomMode) {
      this.root.classList.add('room-3d-mode');
      this.root.classList.toggle('walk-mode', !state.monitorOpen);
      this.root.classList.toggle('monitor-mode', state.monitorOpen);
      this.root.classList.remove('portable-open', 'kitchen-mode', 'office-mode');
      document.querySelector('#camera-view').hidden = !state.monitorOpen;
      this.light.disabled = this.door.disabled = state.monitorOpen || state.station !== 'door';
      this.monitor.disabled = false;
      this.light.setAttribute('aria-pressed', String(state.lightOn));
      this.door.setAttribute('aria-pressed', String(state.doorClosed));
      this.monitor.setAttribute('aria-expanded', String(state.monitorOpen));
      document.querySelector('#door-label').textContent = state.doorClosed ? 'ABRIR PUERTA' : 'CERRAR PUERTA';
      document.querySelector('#door-state').textContent = state.doorClosed ? 'PUERTA FRONTAL CERRADA' : 'PUERTA FRONTAL ABIERTA';
      document.querySelector('#light-state').textContent = state.monitorOpen ? 'NO DISPONIBLE EN MONITOR' : state.lightOn ? 'LUZ FRONTAL ENCENDIDA' : 'LUZ FRONTAL APAGADA';
      document.querySelector('#monitor-label').textContent = state.monitorOpen ? 'VOLVER A LA HABITACIÓN' : 'CÁMARAS';
      document.querySelector('#monitor-state').textContent = state.monitorOpen ? 'CERRAR MONITOR / C' : 'ABRIR MONITOR / C';
      document.querySelector('#turn-label').textContent = 'VOLVER A LA HABITACIÓN';
      document.querySelector('#turn-state').textContent = 'C / ESC · CERRAR MONITOR';
      document.querySelector('#feed-id').textContent = 'CAM ' + camera.number;
      document.querySelector('#feed-name').textContent = camera.name;
      for (const button of document.querySelectorAll('[data-camera]')) {
        const selected = button.dataset.camera === state.camera;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      document.querySelector('#view-status').textContent = state.station === 'kitchen' ? 'COCINA / ATENCIÓN ACTIVA' : state.station === 'door' ? 'ACCESO / CONTROLES ACTIVOS' : 'SALA DE SEGURIDAD';
      this.render(state);
      return;
    }
    this.root.classList.toggle('walk-mode', Boolean(state.walking));
    this.root.classList.toggle('kitchen-mode', !state.walking && state.inKitchen);
    this.root.classList.toggle('monitor-mode', state.monitorOpen);
    this.root.classList.toggle('office-mode', !state.walking && !state.inKitchen && !state.monitorOpen);
    this.root.classList.toggle('light-on', state.lightOn);
    document.querySelector('#camera-view').hidden = !state.monitorOpen;
    this.light.disabled = state.walking || state.monitorOpen || state.inKitchen;
    this.door.disabled = state.walking || state.monitorOpen || state.inKitchen;
    this.door.setAttribute('aria-pressed', String(state.doorClosed));
    document.querySelector('#door-label').textContent = state.doorClosed ? 'ABRIR PUERTA' : 'CERRAR PUERTA';
    document.querySelector('#door-state').textContent = state.doorClosed ? 'PUERTA FRONTAL CERRADA' : 'PUERTA FRONTAL ABIERTA';
    this.light.setAttribute('aria-pressed', String(state.lightOn));
    this.monitor.disabled = state.walking || state.inKitchen;
    document.querySelector('#turn-label').textContent = this.onRoom ? 'VOLVER A LA HABITACIÓN' : state.inKitchen ? 'DARSE LA VUELTA' : 'ATENDER CLIENTES';
    document.querySelector('#turn-state').textContent = this.onRoom ? 'ESC / V · LEVANTARSE' : state.inKitchen ? 'IR A LAS CÁMARAS' : 'VOLVER A LA COCINA';
    this.monitor.setAttribute('aria-expanded', String(state.monitorOpen));
    document.querySelector('#light-state').textContent = state.lightOn ? 'LUZ FRONTAL ENCENDIDA' : state.monitorOpen ? 'NO DISPONIBLE EN MONITOR' : 'LUZ FRONTAL APAGADA';
    document.querySelector('#monitor-label').textContent = state.monitorOpen ? 'VOLVER A OFICINA' : 'CÁMARAS';
    document.querySelector('#monitor-state').textContent = state.monitorOpen ? 'CERRAR MONITOR' : 'ABRIR MONITOR';
    document.querySelector('#feed-id').textContent = 'CAM ' + camera.number;
    document.querySelector('#feed-name').textContent = camera.name;
    document.querySelector('#view-status').textContent = state.walking ? 'SALA / EXPLORANDO' : state.inKitchen ? 'COCINA / ATENDIENDO EN LA VENTANA' : state.monitorOpen ? 'MONITOR / CAM ' + camera.number : (state.doorClosed ? 'PUERTA CERRADA' : 'PUERTA ABIERTA') + (state.lightOn ? ' / LINTERNA ACTIVA' : ' / LUZ APAGADA');
    for (const button of document.querySelectorAll('[data-camera]')) {
      const selected = button.dataset.camera === state.camera;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    this.render(state);
  }

  destroy() { this.abort.abort(); }
}
