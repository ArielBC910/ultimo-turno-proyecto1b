const ATTACKS = {
  'customer-09': { cause: 'void', sound: 'void-impact', showFullFrame: true },
  'customer-08': { cause: 'hermit', sound: 'hermit-impact', showFullFrame: true },
  'customer-07': { cause: 'smile', sound: 'smile-impact', showFullFrame: true },
  'customer-06': { cause: 'mutant', sound: 'mutant-impact' },
  'customer-05': { cause: 'beast', sound: 'beast-impact' },
  'customer-01': { cause: 'rabbit', sound: 'rabbit-impact' },
  'customer-04': { cause: 'twins', sound: 'twins-impact' },
  'customer-02': { cause: 'doll', sound: 'doll-impact' },
};
export function triggerJumpscare(scene, customer) {
  const attack = ATTACKS[customer.key];
  if (!attack) return false;
  scene.finished = true;
  scene.input.enabled = false;
  const elapsed = scene.session.elapsed;
  const root = document.querySelector('#surveillance');
  root.classList.add('rabbit-attack');
  const matte = attack.showFullFrame ? scene.add.graphics().setDepth(99) : null;
  const frame = scene.add.image(0, 0, `${attack.cause}-phase-3`).setDepth(100);
  const fit = () => {
    const { width, height } = scene.scale;
    matte?.clear().fillStyle(0x000000).fillRect(0, 0, width, height);
    const fitScale = attack.showFullFrame ? Math.min : Math.max;
    frame.setPosition(width / 2, height / 2).setScale(fitScale(width / frame.width, height / frame.height));
  };
  fit();
  scene.scale.on('resize', fit);
  scene.events.once('shutdown', () => {
    root.classList.remove('rabbit-attack');
    scene.scale.off('resize', fit);
    scene.input.enabled = true;
  });
  scene.registry.get('audio').stop();
  scene.sound.play(attack.sound, { volume: 1 });
  scene.time.delayedCall(1000, () => {
    scene.registry.get('progress').record('lost', elapsed);
    scene.scene.start('Result', { result: 'lost', elapsed, cause: attack.cause });
  });
  return true;
}
