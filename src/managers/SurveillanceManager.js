import { CAMERAS } from '../config.js';

// Estado exclusivamente visual. No contiene IA, noche, energía ni progresión.
export class SurveillanceManager {
  constructor() {
    this.monitorOpen = false;
    this.lightOn = false;
    this.doorClosed = false;
    this.camera = CAMERAS[0].key;
  }

  toggleLight() {
    if (!this.monitorOpen) this.lightOn = !this.lightOn;
  }

  toggleDoor() {
    if (!this.monitorOpen) this.doorClosed = !this.doorClosed;
  }

  toggleMonitor() {
    this.monitorOpen = !this.monitorOpen;
    this.lightOn = false;
  }

  selectCamera(key) {
    if (this.monitorOpen && CAMERAS.some((camera) => camera.key === key)) this.camera = key;
  }
}
