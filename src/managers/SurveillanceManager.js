import { CAMERAS } from '../config.js';
import { BACK_OPENS_MONITOR, FACING } from '../kitchen/kitchenConfig.js';

// Estado exclusivamente visual. No contiene IA, noche, energía ni progresión.
export class SurveillanceManager {
  constructor() {
    this.monitorOpen = false;
    this.lightOn = false;
    this.doorClosed = false;
    this.camera = CAMERAS[0].key;
    // El cocinero empieza mirando a la cocina; la espalda es la oficina con el monitor.
    this.facing = FACING.KITCHEN;
  }

  get inKitchen() { return this.facing === FACING.KITCHEN; }

  // Darse la vuelta: cocina <-> espalda (oficina/cámaras). Al volver a la cocina se baja el monitor y la linterna.
  turnAround() {
    if (this.inKitchen) {
      this.facing = FACING.BACK;
      this.monitorOpen = BACK_OPENS_MONITOR;
    } else {
      this.facing = FACING.KITCHEN;
      this.monitorOpen = false;
    }
    this.lightOn = false;
  }

  toggleLight() {
    if (!this.inKitchen && !this.monitorOpen) this.lightOn = !this.lightOn;
  }

  toggleDoor() {
    if (!this.inKitchen && !this.monitorOpen) this.doorClosed = !this.doorClosed;
  }

  toggleMonitor() {
    if (this.inKitchen) return; // El monitor está a la espalda: primero hay que darse la vuelta.
    this.monitorOpen = !this.monitorOpen;
    this.lightOn = false;
  }

  selectCamera(key) {
    if (!this.inKitchen && this.monitorOpen && CAMERAS.some((camera) => camera.key === key)) this.camera = key;
  }
}