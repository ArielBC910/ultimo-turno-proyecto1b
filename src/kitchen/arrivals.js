// Ritmo de llegada de clientes a lo largo de la noche (lógica pura, sin Phaser).
import { ARRIVAL_END_MS, ARRIVAL_JITTER, ARRIVAL_START_MS, clamp01 } from './kitchenConfig.js';

// Tiempo medio entre llegadas para un progreso de la noche (0 = 12:00 AM, 1 = 6:00 AM).
export function arrivalInterval(progress) {
  return ARRIVAL_START_MS + (ARRIVAL_END_MS - ARRIVAL_START_MS) * clamp01(progress);
}

// Espera hasta la siguiente llegada: el intervalo medio con una variación aleatoria. rng se inyecta para probarlo.
export function nextArrivalDelay(progress, rng = Math.random) {
  const jitter = 1 + (rng() * 2 - 1) * ARRIVAL_JITTER;
  return arrivalInterval(progress) * jitter;
}
