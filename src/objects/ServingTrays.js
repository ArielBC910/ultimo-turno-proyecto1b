import Phaser from 'phaser';
import { PRODUCTS, PRODUCT_IDS } from '../kitchen/orders.js';

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const DEPTH_TRAY = 8;
const DEPTH_HELD = 30;

// Cuatro bandejas (una por producto) sobre el mostrador. El jugador arrastra la comida desde la bandeja hacia
// un cliente. Esta clase solo se ocupa de las bandejas y del arrastre; las reglas de entrega las decide quien
// la usa mediante dos callbacks:
//   onHover(productId, x, y)    -> mientras se arrastra (para resaltar al cliente bajo el puntero)
//   onRelease(productId, x, y)  -> al soltar; devuelve true si la comida fue aceptada. Si no, la comida cae.
// Es un placeholder: bandejas y comida se dibujan con formas simples y emojis, sin imágenes.
export class ServingTrays {
  constructor(scene, { onHover = () => {}, onRelease = () => false, onDrop = () => {} } = {}) {
    this.scene = scene;
    this.onHover = onHover;
    this.onRelease = onRelease;
    this.onDrop = onDrop;
    this.visible = false;
    this.held = null; // { productId, sprite, pointerId, slot }
    this.slots = PRODUCT_IDS.map((id) => this.createSlot(id));

    this.move = (pointer) => this.handleMove(pointer);
    this.up = (pointer) => this.handleUp(pointer);
    scene.input.on('pointermove', this.move);
    scene.input.on('pointerup', this.up);
    scene.input.on('pointerupoutside', this.up);
    this.setVisible(false);
  }

  createSlot(id) {
    const product = PRODUCTS[id];
    const base = this.scene.add.graphics().setDepth(DEPTH_TRAY);
    const emoji = this.scene.add.text(0, 0, product.emoji, { fontFamily: EMOJI_FONT, fontSize: '64px' })
      .setOrigin(0.5).setDepth(DEPTH_TRAY + 1);
    const label = this.scene.add.text(0, 0, product.label.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#e8e2cf',
    }).setOrigin(0.5, 0).setDepth(DEPTH_TRAY + 1);
    const zone = this.scene.add.zone(0, 0, 10, 10).setInteractive({ useHandCursor: true }).setDepth(DEPTH_TRAY + 2);
    const slot = { id, base, emoji, label, zone, size: 100 };
    zone.on('pointerdown', (pointer) => this.startDrag(slot, pointer));
    return slot;
  }

  setVisible(visible) {
    this.visible = visible;
    if (!visible) this.cancelDrag();
    for (const slot of this.slots) {
      slot.base.setVisible(visible);
      slot.emoji.setVisible(visible);
      slot.label.setVisible(visible);
      slot.zone.setVisible(visible);
    }
  }

  // Reparte las bandejas en una fila sobre el mostrador. `area` es { x, y, w, h } en píxeles.
  fit(area) {
    const gap = Math.max(10, area.w * 0.02);
    const size = Math.max(64, Math.min(130, (area.w - gap * (this.slots.length - 1)) / this.slots.length, area.h));
    const total = size * this.slots.length + gap * (this.slots.length - 1);
    const left = area.x + (area.w - total) / 2;
    const top = area.y + (area.h - size) / 2;
    this.slots.forEach((slot, index) => {
      const x = left + index * (size + gap);
      slot.size = size;
      slot.base.clear()
        .fillStyle(0x000000, 0.35).fillRoundedRect(x + 4, top + 6, size, size, 14)
        .fillStyle(0x9aa3a6, 1).fillRoundedRect(x, top, size, size, 14)
        .fillStyle(0x4b5457, 1).fillRoundedRect(x + size * 0.07, top + size * 0.07, size * 0.86, size * 0.86, 10)
        .lineStyle(3, 0xd9dfe0, 1).strokeRoundedRect(x, top, size, size, 14);
      slot.emoji.setPosition(x + size / 2, top + size * 0.38).setFontSize(Math.round(size * 0.42));
      slot.label.setPosition(x + size / 2, top + size * 0.74).setFontSize(Math.max(10, Math.round(size * 0.13)));
      slot.zone.setPosition(x + size / 2, top + size / 2).setSize(size, size);
    });
    if (this.held) this.held.sprite.setFontSize(Math.round(this.held.slot.size * 0.7));
  }

  startDrag(slot, pointer) {
    if (!this.visible || this.held) return;
    const sprite = this.scene.add.text(pointer.x, pointer.y, PRODUCTS[slot.id].emoji, {
      fontFamily: EMOJI_FONT, fontSize: Math.round(slot.size * 0.7) + 'px',
    }).setOrigin(0.5).setDepth(DEPTH_HELD).setAngle(-6);
    this.held = { productId: slot.id, sprite, pointerId: pointer.id, slot };
    slot.emoji.setAlpha(0.3); // la bandeja queda "vacía" mientras la comida está en la mano
  }

  handleMove(pointer) {
    if (!this.held || pointer.id !== this.held.pointerId) return;
    this.held.sprite.setPosition(pointer.x, pointer.y);
    this.onHover(this.held.productId, pointer.x, pointer.y);
  }

  handleUp(pointer) {
    if (!this.held || pointer.id !== this.held.pointerId) return;
    const { productId, sprite, slot } = this.held;
    this.held = null;
    slot.emoji.setAlpha(1);
    this.onHover(null, -1, -1); // quita cualquier resaltado
    // Si la comida cae, el último punto conocido es el del puntero al soltar.
    sprite.setPosition(pointer.x, pointer.y);
    if (this.onRelease(productId, pointer.x, pointer.y)) sprite.destroy();
    else this.fall(sprite, productId);
  }

  // Soltar fuera de un cliente (o cambiar de vista a mitad de arrastre): la comida cae al suelo.
  cancelDrag() {
    if (!this.held) return;
    const { productId, sprite, slot } = this.held;
    this.held = null;
    slot.emoji.setAlpha(1);
    this.onHover(null, -1, -1);
    this.fall(sprite, productId);
  }

  fall(sprite, productId) {
    this.onDrop(productId);
    const floor = this.scene.scale.height + sprite.height;
    const spin = Phaser.Math.Between(-1, 1) || 1;
    this.scene.tweens.add({
      targets: sprite,
      y: floor,
      x: sprite.x + spin * Phaser.Math.Between(10, 40),
      angle: sprite.angle + spin * Phaser.Math.Between(60, 150),
      duration: Math.max(250, (floor - sprite.y) * 0.9),
      ease: 'Quad.easeIn', // acelera como un objeto en caída libre
      onComplete: () => sprite.destroy(),
    });
  }

  destroy() {
    this.scene.input.off('pointermove', this.move);
    this.scene.input.off('pointerup', this.up);
    this.scene.input.off('pointerupoutside', this.up);
    this.held?.sprite.destroy();
    this.held = null;
    for (const slot of this.slots) {
      slot.base.destroy();
      slot.emoji.destroy();
      slot.label.destroy();
      slot.zone.destroy();
    }
  }
}
