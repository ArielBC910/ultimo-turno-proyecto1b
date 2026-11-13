// Configuración y cálculos puros de la cocina (sin Phaser ni DOM, para poder probarlos con node --test).

// Hacia dónde mira el cocinero: la cocina (clientes) o la espalda (oficina + cámaras).
export const FACING = Object.freeze({ KITCHEN: 'kitchen', BACK: 'back' });

// true  = "darse la vuelta" lleva directamente a las cámaras.
// false = lleva a la oficina (office.png) y el monitor se abre con el botón CÁMARAS o la tecla C.
export const BACK_OPENS_MONITOR = false;

// Cantidad máxima de productos que un cliente puede pedir (cada pedido lleva de 1 a este número).
export const MAX_ITEMS_PER_ORDER = 3;

// Tiempo (ms) que un cliente espera su pedido desde que llega a la ventana. Al llegar a 0 se va.
export const CUSTOMER_PATIENCE_MS = 20000;

// Cuántos clientes pueden estar a la vez en la ventana.
export const MAX_CUSTOMERS_AT_WINDOW = 2;

// Eventos que emite la escena para que otras partes (jumpscare, barra de susto) reaccionen.
export const KITCHEN_EVENTS = Object.freeze({
  // Se emite cuando se agota la espera de un cliente sin ser atendido. Recibe el cliente como argumento.
  CUSTOMER_TIMEOUT: 'kitchen:customer-timeout',
  // Se emite una vez cuando la barra de susto llega al máximo.
  SCARE_FULL: 'kitchen:scare-full',
  // Se emite al entregar un pedido completo. Recibe el cliente.
  ORDER_SERVED: 'kitchen:order-served',
  // Se emite cuando el jugador suelta la comida y esta cae al suelo. Recibe el id del producto.
  FOOD_DROPPED: 'kitchen:food-dropped',
});

// Barra de susto: cada cliente que se cansa de esperar sin ser atendido la llena SCARE_PER_MISSED_CUSTOMER
// puntos, hasta SCARE_MAX (con 100 y 25, a la cuarta falla se llena).
export const SCARE_MAX = 100;
export const SCARE_PER_MISSED_CUSTOMER = 25;

export const KITCHEN_PATH = 'assets/images/kitchen/';

// Imágenes de la cocina. width/height solo se usan para generar el marcador de posición
// cuando el archivo todavía no existe en public/assets/images/kitchen/.
export const KITCHEN_ASSETS = Object.freeze([
  { key: 'kitchen-stall', file: 'kitchen-stall.png', kind: 'stall', width: 1672, height: 941 },
  { key: 'customer-01', file: 'customer-01.png', kind: 'customer', width: 420, height: 840 },
  { key: 'customer-02', file: 'customer-02.png', kind: 'customer', width: 420, height: 840 },
  { key: 'customer-03', file: 'customer-03.png', kind: 'customer', width: 420, height: 840 },
  { key: 'customer-04', file: 'customer-04.png', kind: 'customer', width: 420, height: 840 },
  { key: 'customer-05', file: 'customer-05.png', kind: 'customer', width: 420, height: 840 },
]);

export const STALL_KEY = 'kitchen-stall';
export const CUSTOMER_KEYS = Object.freeze(KITCHEN_ASSETS.filter((a) => a.kind === 'customer').map((a) => a.key));

export function isKitchenAsset(key) {
  return KITCHEN_ASSETS.some((asset) => asset.key === key);
}

// Vano de atención, en fracciones (0–1) de la imagen kitchen-stall.png.
// Ajústalo hasta que coincida con el hueco de tu ilustración (abre el juego con ?debugKitchen).
export const WINDOW_RECT = Object.freeze({ x: 0.35, y: 0.122, w: 0.42, h: 0.5 });

// Recorrido del cliente. "feet" es la altura de los pies y "height" la altura del sprite,
// ambas en múltiplos de la altura del vano. Con feet > 1 los pies quedan tras el mostrador.
export const CUSTOMER_PATH = Object.freeze({
  far: { feet: 0.62, height: 0.4 },
  near: { feet: 1.55, height: 1.2 },
});

const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (value) => Math.max(0, Math.min(1, value));

// Convierte el rectángulo normalizado en píxeles según dónde y a qué escala está dibujada la imagen.
export function windowToPixels(image, rect = WINDOW_RECT) {
  const left = image.x - image.width / 2;
  const top = image.y - image.height / 2;
  return { x: left + rect.x * image.width, y: top + rect.y * image.height, w: rect.w * image.width, h: rect.h * image.height };
}

// Posición y tamaño de un cliente para un progreso p (0 = lejos, 1 = en el vano).
// xr (0–1) es su posición horizontal dentro del vano.
export function customerPose(p, xr, win, path = CUSTOMER_PATH) {
  const t = clamp01(p);
  const feet = lerp(path.far.feet, path.near.feet, t);
  const height = lerp(path.far.height, path.near.height, t);
  // Leve balanceo al caminar; se apaga al llegar.
  const sway = Math.sin(t * 55) * 0.006 * win.h * (1 - t);
  return { x: win.x + win.w * xr, y: win.y + win.h * feet + sway, displayHeight: win.h * height };
}

// Escala del globo de pedido: la natural, reducida si no cabe bajo el contador (nunca por debajo de minFactor).
export function fitBubbleScale(natural, unscaledHeight, availableHeight, minFactor = 0.6) {
  return Math.max(natural * minFactor, Math.min(natural, availableHeight / unscaledHeight));
}

// Posiciones horizontales (fracción del vano) donde se colocan los clientes, repartidas entre min y max para que
// los globos de varios clientes a la vez no se solapen. Con un solo cliente se usa el centro.
export function customerLanes(count, min = 0.3, max = 0.7) {
  if (count <= 1) return [(min + max) / 2];
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}
