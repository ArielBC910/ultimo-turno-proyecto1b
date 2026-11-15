import { KITCHEN_ASSETS, KITCHEN_PATH, WINDOW_RECT } from './kitchenConfig.js';


export function preloadKitchenAssets(scene) {
  for (const asset of KITCHEN_ASSETS) scene.load.image(asset.key, KITCHEN_PATH + asset.file);
}

export function ensureKitchenTextures(scene) {
  const missing = [];
  for (const asset of KITCHEN_ASSETS) {
    if (scene.textures.exists(asset.key)) continue;
    const texture = scene.textures.createCanvas(asset.key, asset.width, asset.height);
    const ctx = texture.getContext();
    if (asset.kind === 'stall') drawStall(ctx, asset);
    else drawCustomer(ctx, asset, missing.length);
    texture.refresh();
    missing.push(asset.file);
  }
  if (missing.length) console.warn('[cocina] Usando marcadores de posición para: ' + missing.join(', '));
  return missing;
}

function drawStall(ctx, { width: w, height: h }) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#060a12');
  sky.addColorStop(1, '#16202a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Calle visible a través del vano.
  const win = { x: WINDOW_RECT.x * w, y: WINDOW_RECT.y * h, w: WINDOW_RECT.w * w, h: WINDOW_RECT.h * h };
  const street = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
  street.addColorStop(0, '#0b1018');
  street.addColorStop(0.55, '#1c2631');
  street.addColorStop(1, '#10161d');
  ctx.fillStyle = street;
  ctx.fillRect(win.x, win.y, win.w, win.h);
  // Pared del puesto alrededor del vano (se pinta por tiras para no tapar la calle).
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(0, 0, w, win.y);
  ctx.fillRect(0, win.y, win.x, win.h);
  ctx.fillRect(win.x + win.w, win.y, w - win.x - win.w, win.h);
  // Mostrador.
  const counterTop = win.y + win.h;
  ctx.fillStyle = '#3b2b1d';
  ctx.fillRect(0, counterTop, w, h - counterTop);
  ctx.fillStyle = '#58412b';
  ctx.fillRect(0, counterTop, w, 14);
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 6;
  ctx.strokeRect(win.x, win.y, win.w, win.h);
  ctx.fillStyle = '#b9a98a';
  ctx.font = '28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MARCADOR · public/assets/images/kitchen/kitchen-stall.png', w / 2, h - 40);
}

function drawCustomer(ctx, { width: w, height: h }, index) {
  const colors = ['#5d6b78', '#6d5a63', '#58705f'];
  ctx.fillStyle = colors[index % colors.length];
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.13, w * 0.17, 0, Math.PI * 2); // cabeza
  ctx.fill();
  ctx.fillRect(w * 0.22, h * 0.26, w * 0.56, h * 0.46); // torso
  ctx.fillRect(w * 0.28, h * 0.72, w * 0.16, h * 0.28); // pierna izquierda
  ctx.fillRect(w * 0.56, h * 0.72, w * 0.16, h * 0.28); // pierna derecha
}
