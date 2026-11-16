import { customerPortrait } from './customerDistortion.js';

const KNOCK_TIMES = [360, 680, 1170];
const ease = (value) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

export function updateTwinsFrame(scene, customer, stage, elapsed, visible) {
  if (stage === 2) {
    while (KNOCK_TIMES[customer.twinsKnocks ?? 0] <= elapsed) {
      customer.twinsKnocks = (customer.twinsKnocks ?? 0) + 1;
      if (visible && scene.cache.audio.exists('door-bang')) {
        scene.sound.play('door-bang', { volume: 0.16, rate: 1.35 });
      }
    }
  }
  const duration = [900, 1420, 1060][stage - 1];
  const frame = customer.reducedMotion ? 24 : Math.round(Math.min(1, elapsed / duration) * 24);
  const key = `twins-reaction-${stage}-${frame}`;
  if (customer.sprite.texture.key === key) return false;
  if (!scene.textures.exists(key)) {
    const source = scene.textures.get(customerPortrait(scene.textures, customer.key)).getSourceImage();
    const texture = scene.textures.createCanvas(key, source.width, source.height);
    const ctx = texture.getContext();
    const time = frame * duration / 24;
    const sx = source.width / 592;
    const sy = source.height / 880;
    const tap = (at) => ease(1 - Math.abs(time - at + 100) / 100);
    const turn = stage === 3 ? ease((time - 790) / 130) : 0;
    const poses = [
      { left: 0, right: 308, neck: 249, center: 211, hand: 123,
        tilt: stage === 1 ? 9 * ease(time / 350) : 9 * (1 - turn),
        lean: stage === 3 ? 0.09 * ease(time / 480) : 0,
        lift: stage === 2 ? 36 * (tap(1170) + 0.25 * ease(1 - Math.abs(time - 1170) / 140)) : 0 },
      { left: 308, right: 592, neck: 218, center: 412, hand: 509,
        tilt: stage === 1 ? 9 * ease((time - 500) / 350) : 9 * (1 - turn),
        lean: stage === 3 ? 0.19 * ease(time / 790) : 0,
        lift: stage === 2 ? 44 * (tap(360) + tap(680)) : 0 },
    ];
    ctx.scale(sx, sy);
    for (const pose of poses) {
      // Deforma franjas de la ilustración original alrededor del cuello y la mano.
      for (let y = 0; y < 880; y += 2) {
        const head = y < pose.neck ? 1 : ease(1 - (y - pose.neck) / 80);
        const lean = y < pose.neck ? 0 : pose.lean * Math.sin(Math.PI * ease((y - pose.neck) / (546 - pose.neck)));
        for (let x = pose.left; x < pose.right; x += 4) {
          const width = Math.min(4, pose.right - x);
          const arm = ease(1 - Math.abs(x - pose.hand) / 37) * ease(1 - Math.abs(y - 507) / 102);
          const angle = pose.tilt * head * Math.PI / 180;
          const dx = (x - pose.center) * (Math.cos(angle) - 1 + lean) - (y - pose.neck) * Math.sin(angle);
          const dy = (x - pose.center) * Math.sin(angle) + (y - pose.neck) * (Math.cos(angle) - 1)
            - 115 * (lean + pose.lean * head) - pose.lift * arm;
          ctx.drawImage(source, x * sx, y * sy, width * sx, 2 * sy,
            x + dx, y + dy, width * (1 + lean) + 0.7, 2.8);
        }
      }
    }
    ctx.globalCompositeOperation = 'source-atop';
    if (stage === 3) {
      ctx.fillStyle = 'rgba(178, 197, 102, 0.75)';
      for (const [x, y] of [[210, 157], [254, 163], [389, 112], [436, 113]]) {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    texture.refresh();
  }
  customer.sprite.setTexture(key);
  return true;
}
