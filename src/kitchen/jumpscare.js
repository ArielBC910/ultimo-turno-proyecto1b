const ATTACKS = {
  'customer-09': { cause: 'void', entrance: [0.74, 0, 0, 150], sound: 'void-impact', showFullFrame: true },
  'customer-08': { cause: 'hermit', entrance: [0.81, 0.06, -4, 210], sound: 'hermit-impact', showFullFrame: true },
  'customer-07': { cause: 'smile', entrance: [0.66, -0.06, 7, 280], sound: 'smile-impact', showFullFrame: true },
  'customer-06': { cause: 'mutant', entrance: [0.64, 0.1, -8, 240], sound: 'mutant-impact' },
  'customer-05': { cause: 'beast', entrance: [0.68, 0, 0, 180], sound: 'beast-impact' },
  'customer-01': { cause: 'rabbit', entrance: [0.77, 0, -6, 215], sound: 'rabbit-impact' },
  'customer-03': { cause: 'customers', texture: 'customer-03', entrance: [0.78, 0, 0, 220], sound: 'wendigo-scream' },
  'customer-04': { cause: 'twins', entrance: [0.71, -0.07, 4, 255], sound: 'twins-impact' },
  'customer-02': { cause: 'doll', entrance: [0.84, 0.09, 10, 190], sound: 'doll-impact' },
};
export function triggerJumpscare(scene, customer, fatal) {
  const attack = ATTACKS[customer.key];
  if (!attack) return false;
  if (scene.closeCustomerScare && !fatal) return true;
  scene.closeCustomerScare?.();
  if (fatal) scene.finished = true;
  scene.input.enabled = false;
  const elapsed = scene.session.elapsed;
  const root = document.querySelector('#surveillance');
  root.classList.add('rabbit-attack');
  const matte = scene.add.graphics().setDepth(99);
  const frame = scene.add.image(0, 0, attack.texture ?? `${attack.cause}-phase-3`).setDepth(100);
  const [startScale, drift, angle, duration] = attack.entrance;
  const motion = { progress: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0 };
  const fit = () => {
    const { width, height } = scene.scale;
    matte.clear().fillStyle(0x000000).fillRect(0, 0, width, height);
    const fitScale = attack.showFullFrame ? Math.min : Math.max;
    const remaining = 1 - motion.progress;
    const scale = fitScale(width / frame.width, height / frame.height);
    frame.setPosition(width * (0.5 + drift * remaining), height / 2)
      .setAngle(angle * remaining)
      .setScale(scale * (1 - (1 - startScale) * remaining));
  };
  fit();
  const entrance = motion.progress === 0 ? scene.tweens.add({
    targets: motion, progress: 1, duration, ease: 'Cubic.easeOut', onUpdate: fit,
  }) : null;
  scene.scale.on('resize', fit);
  const close = () => {
    scene.events.off('shutdown', close);
    timer.remove();
    frame.destroy();
    entrance?.remove();
    matte.destroy();
    scene.closeCustomerScare = null;
    root.classList.remove('rabbit-attack');
    scene.scale.off('resize', fit);
    scene.input.enabled = true;
  };
  scene.closeCustomerScare = close;
  scene.events.once('shutdown', close);
  if (fatal) scene.registry.get('audio').stop();
  scene.sound.play(attack.sound, { volume: 1 });
  const timer = scene.time.delayedCall(1000, () => {
    close();
    if (!fatal) return;
    scene.registry.get('progress').record('lost', elapsed);
    scene.session.result = 'lost';
    scene.defeatCause = attack.cause;
    scene.showResult(true);
  });
  return true;
}
