// Aspas independientes: la carcasa y el encuadre de la foto permanecen fijos.
export class FanEffect {
  constructor(scene) {
    this.scene = scene;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const backing = scene.add.ellipse(0, 0, 236, 245, 0x17130e, 0.58);
    this.rotor = scene.add.image(0, 0, 'fan-rotor').setOrigin(0.489, 0.519)
      .setDisplaySize(286, 286).setAlpha(0.7);
    const grille = scene.add.graphics();
    grille.lineStyle(1.15, 0x8c6b48, 0.57);
    for (const radius of [33, 54, 77, 100, 121]) grille.strokeEllipse(0, 0, radius * 2, radius * 2.06);
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      grille.lineBetween(Math.cos(angle) * 16, Math.sin(angle) * 17, Math.cos(angle) * 122, Math.sin(angle) * 126);
    }
    grille.fillStyle(0x241c13, 0.95).fillCircle(0, 0, 17);
    grille.lineStyle(1.5, 0x715336, 0.85).strokeCircle(0, 0, 17);
    this.container = scene.add.container(0, 0, [backing, this.rotor, grille]);
  }

  fit(backdrop) {
    const source = backdrop.texture.getSourceImage();
    const width = source.width * backdrop.scaleX;
    const height = source.height * backdrop.scaleY;
    const scale = width / 1672;
    this.container.setPosition(
      backdrop.x - width / 2 + width * 0.877,
      backdrop.y - height / 2 + height * 0.513,
    ).setScale(scale);
  }

  setVisible(visible) { this.container.setVisible(visible); }

  update(delta) {
    if (!this.reducedMotion.matches && this.container.visible) {
      this.rotor.rotation = (this.rotor.rotation + Math.min(delta, 100) * 0.024) % (Math.PI * 2);
    }
  }

  destroy() { this.container.destroy(); }
}
