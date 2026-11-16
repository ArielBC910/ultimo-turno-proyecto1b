import { customerPortrait } from './customerDistortion.js';

const THREAD = '#71332a';
const clamp = (value) => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function stroke(ctx, color, width, points) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function drawBear(ctx, x, y, gap, swing, hanging) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  const fur = ctx.createLinearGradient(-25, 0, 25, 0);
  fur.addColorStop(0, '#9e7852');
  fur.addColorStop(1, '#463226');
  oval(ctx, -22, 19, 9, 16, fur);
  oval(ctx, 22, 19, 9, 16, fur);
  oval(ctx, -13, 48, 11, 13, fur);
  oval(ctx, 13, 48, 11, 13, fur);
  oval(ctx, 0, 25, 24, 30, fur);
  for (const offset of hanging ? [0] : [-5, 4]) {
    stroke(ctx, THREAD, 2, [[offset, 1], [offset + 4, -gap / 2], [offset, -gap - 3]]);
  }
  oval(ctx, -17, -gap - 23, 8, 8, fur);
  oval(ctx, 17, -gap - 23, 8, 8, fur);
  oval(ctx, 0, -gap - 13, 22, 17, fur);
  oval(ctx, 0, -gap - 7, 10, 7, '#ac8a65');
  oval(ctx, 0, -gap - 10, 4, 3, '#32231d');
  oval(ctx, -9, -gap - 17, 3, 3, '#221a16');
  oval(ctx, 9, -gap - 17, 3, 3, '#221a16');
  ctx.restore();
}

export function updateDollFrame(textures, customer, stage, elapsed) {
  const duration = [950, 330, 780][stage - 1];
  const frame = customer.reducedMotion ? 14 : Math.round(clamp(elapsed / duration) * 14);
  const key = `doll-reaction-${stage}-${frame}`;
  if (customer.sprite.texture.key === key) return false;
  if (!textures.exists(key)) {
    const source = textures.get(customerPortrait(textures, customer.key)).getSourceImage();
    const texture = textures.createCanvas(key, source.width, source.height);
    const ctx = texture.getContext();
    ctx.scale(source.width / 460, source.height / 1024);
    ctx.drawImage(source, 0, 0, 460, 1024);
    const t = frame / 14;
    const lift = stage === 1 ? 1 - (1 - t) ** 2 : 1;
    const pull = stage === 2 ? clamp(t * 4) : Number(stage === 3);
    const gap = stage === 1 ? 3 + 6 * t : 9 + 15 * pull;
    const y = mix(530, 340, lift) - (stage === 3 ? 32 * t : 0);
    const swing = stage === 3 && !customer.reducedMotion ? Math.sin(t * 14) * (1 - t) * 0.4 : 0;

    const release = stage === 3 ? clamp(t * 3) : 0;
    const hands = [
      [mix(mix(76, 164, lift), 100, release), mix(y + 24, 500, release)],
      [mix(316, 209, lift), y - gap - 13],
    ];
    const sleeves = [[74, 436], [306, 436]];
    hands.forEach((hand, i) => {
      if (!lift) return;
      stroke(ctx, '#3c2d23', 28, [sleeves[i], hand]);
      stroke(ctx, '#876848', 18, [sleeves[i], hand]);
    });
    drawBear(ctx, 190, y, gap, swing, release > 0.7);
    hands.forEach(([x, handY], i) => {
      if (!lift) return;
      const cropX = i ? 291 : 53;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, handY, 12, 16, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(source, cropX * source.width / 460, 540 * source.height / 1024,
        44 * source.width / 460, 67 * source.height / 1024, x - 14, handY - 18, 28, 36);
      ctx.restore();
    });
    texture.refresh();
  }
  customer.sprite.setTexture(key);
  return true;
}
