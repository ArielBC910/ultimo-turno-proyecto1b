// Utilidades del tiempo de espera (lógica pura).
import { CUSTOMER_PATIENCE_MS } from './kitchenConfig.js';

// Por debajo de esta fracción del tiempo total el contador pasa a modo aviso.
export const WAIT_WARNING_RATIO = 0.25;

// 29001 ms -> "0:30": se redondea hacia arriba para que "0:00" signifique que ya se acabó.
export function formatWait(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function isWaitWarning(remainingMs, totalMs = CUSTOMER_PATIENCE_MS) {
  return remainingMs / totalMs <= WAIT_WARNING_RATIO;
}