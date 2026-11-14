import Phaser from 'phaser';
import { PRODUCTS, PRODUCT_IDS } from '../kitchen/orders.js';

import { foodIcon, MENU_ACTIVE, MENU_FONT, MENU_INK } from '../kitchen/menuStyle.js';
const DEPTH_TRAY = 8;
const DEPTH_HELD = 30;

// Cuatro bandejas (una por producto) sobre el mostrador. El jugador arrastra la comida desde la bandeja hacia
// un cliente. Esta clase solo se ocupa de las bandejas y del arrastre; las reglas de entrega las decide quien
// la usa mediante dos callbacks:
//   onHover(productId, x, y)    -> mientras se arrastra (para resaltar al cliente bajo el puntero)
//   onRelease(productId, x, y)  -> al soltar; devuelve true si la comida fue aceptada. Si no, la comida cae.
export class ServingTrays {
  constructor(scene, { onHover = () => {}, onRelease = () => false, onDrop = () => {}, onSelect = () => {} } = {}) {
    this.scene = scene;
    this.onHover = onHover;
    this.onRelease = onRelease;
    this.onDrop = onDrop;
    this.onSelect = onSelect;
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
    const icon = foodIcon(this.scene, id).setDepth(DEPTH_TRAY + 1);
    const label = this.scene.add.text(0, 0, product.label.toUpperCase(), {
      fontFamily: MENU_FONT, fontSize: '16px', fontStyle: 'bold', color: '#dfcaa1',
    }).setOrigin(0.5, 0).setDepth(DEPTH_TRAY + 1);
    const zone = this.scene.add.zone(0, 0, 10, 10).setInteractive({ useHandCursor: true }).setDepth(DEPTH_TRAY + 2);
    const slot = { id, base, icon, label, zone, size: 100, height: 62, hovered: false };
    zone.on('pointerover', () => { slot.hovered = true; this.paintSlot(slot); });
    zone.on('pointerout', () => { slot.hovered = false; this.paintSlot(slot); });
    zone.on('pointerdown', (pointer) => this.startDrag(slot, pointer));
    return slot;
  }

  setVisible(visible) {
    this.visible = visible;
    if (!visible) this.cancelDrag();
    for (const slot of this.slots) {
      slot.base.setVisible(visible);
      slot.icon.setVisible(visible);
      slot.label.setVisible(visible);
      slot.zone.setVisible(visible);
    }
  }

  // Reparte las bandejas en una fila sobre el mostrador. `area` es { x, y, w, h } en píxeles.
  fit(area) {
    const gap = Math.max(10, area.w * 0.02);
    const size = Math.min(130, (area.w - gap * (this.slots.length - 1)) / this.slots.length, area.h);
    const total = size * this.slots.length + gap * (this.slots.length - 1);
    const left = area.x + (area.w - total) / 2;
    const height = size * 0.64;
    const top = area.y + (area.h - height) / 2;
    this.slots.forEach((slot, index) => {
      const x = left + index * (size + gap);
      slot.size = size;
      slot.height = height;
      slot.icon.setPosition(x + size / 2, top + height * 0.38).setDisplaySize(height * 0.65, height * 0.65);
      slot.label.setPosition(x + size / 2, top + height * 0.69).setFontSize(Math.max(7, Math.round(size * 0.115)));
      slot.zone.setPosition(x + size / 2, top + height / 2).setSize(size, height);
      this.paintSlot(slot);
    });
  }

  paintSlot(slot) {
    const active = slot.hovered || this.held?.slot === slot;
    const { size, height, zone } = slot;
    const x = zone.x - size / 2;
    const y = zone.y - height / 2;
    slot.base.clear()
      .fillStyle(0x000000, 0.46).fillRoundedRect(x, y + 3, size, height, 4)
      .fillStyle(active ? 0x271b0d : 0x151613, 0.96).fillRoundedRect(x, y, size, height, 4)
      .lineStyle(1, active ? MENU_ACTIVE : 0x76654b, active ? 1 : 0.8).strokeRoundedRect(x, y, size, height, 4);
    slot.icon.setTint(active ? MENU_ACTIVE : MENU_INK);
  }

  startDrag(slot, pointer) {
    if (!this.visible || this.held) return;
    const size = slot.height * 0.82;
    const sprite = foodIcon(this.scene, slot.id, pointer.x, pointer.y)
      .setDisplaySize(size, size).setTint(MENU_ACTIVE).setDepth(DEPTH_HELD).setAngle(-6);
    this.held = { productId: slot.id, sprite, pointerId: pointer.id, startX: pointer.x, startY: pointer.y, moved: false, slot };
    this.paintSlot(slot);
    slot.icon.setAlpha(0.3); // la bandeja queda "vacía" mientras la comida está en la mano
  }

  handleMove(pointer) {
    if (!this.held || pointer.id !== this.held.pointerId) return;
    const held = this.held;
    held.moved ||= Math.hypot(pointer.x - held.startX, pointer.y - held.startY) > 8;
    held.sprite.setPosition(pointer.x, pointer.y);
    this.onHover(this.held.productId, pointer.x, pointer.y);
  }

  handleUp(pointer) {
    if (!this.held || pointer.id !== this.held.pointerId) return;
    const { productId, sprite, slot, moved, startX, startY } = this.held;
    this.held = null;
    slot.icon.setAlpha(1);
    this.paintSlot(slot);
    this.onHover(null, -1, -1); // quita cualquier resaltado
    if (!moved && Math.hypot(pointer.x - startX, pointer.y - startY) <= 8) {
      sprite.destroy();
      this.onSelect(productId);
      return;
    }
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
    slot.icon.setAlpha(1);
    this.paintSlot(slot);
    this.onHover(null, -1, -1);
    this.fall(sprite, productId);
  }

  fall(sprite, productId) {
    this.onDrop(productId);
    const floor = this.scene.scale.height + sprite.displayHeight;
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
      slot.icon.destroy();
      slot.label.destroy();
      slot.zone.destroy();
    }
  }
}
