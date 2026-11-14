import Phaser from 'phaser';
import { CustomerPicker } from '../kitchen/customerPicker.js';
import { PRODUCTS, createOrder, REJECT_EMOJI } from '../kitchen/orders.js';
import { OrderProgress, dropTargetAt } from '../kitchen/serving.js';
import { ServingTrays } from './ServingTrays.js';
import { nextArrivalDelay } from '../kitchen/arrivals.js';
import { formatWait, isWaitWarning } from '../kitchen/patience.js';
import {
  ARRIVAL_RETRY_MS, FIRST_ARRIVAL_MS, CUSTOMER_KEYS, CUSTOMER_PATIENCE_MS, KITCHEN_EVENTS, MAX_CUSTOMERS_AT_WINDOW, STALL_KEY, WINDOW_RECT,
  customerLanes, customerPose, fitBubbleScale, windowToPixels,
} from '../kitchen/kitchenConfig.js';

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
// Globo de pedido: el emoji mide EMOJI_RATIO de la altura del cliente; se dibuja a FONT_PX y se escala.
// screenMargin: distancia mínima (px) entre lo más alto del globo (con su reloj) y el borde superior de la pantalla.
const BUBBLE = { fontPx: 64, pad: 14, tail: 14, emojiRatio: 0.12, gapRatio: 0.03, minShrink: 0.6, screenMargin: 8 };
// Reloj de espera: píldora con el tiempo restante, apilada encima del globo (comparte su escala).
const WAIT_STYLE = { fontPx: 28, pad: 12, gap: 8, clock: '🕒' };
// Colores del cliente: normal, y al arrastrar comida sobre él (acepta / no la necesita).
// `shadow` es la silueta oscura con la que se acercan: aún no se les puede dar su pedido.
const TINT = { shadow: 0x0b0f17, idle: 0xa9b8cf, accepts: 0xffffff, rejects: 0xff9a9a };
// Duración del paso de sombra a color cuando el cliente llega y empieza su reloj.
const REVEAL_MS = 450;
// Pausa antes de que un cliente satisfecho se vaya, para que se vea el pedido completo.
const SERVED_LEAVE_MS = 500;
// El área de entrega llega hasta un poco por debajo del vano (el mostrador), medida en alturas del vano.
const DROP_BELOW_WINDOW = 0.45;

// Un carril por cliente simultáneo, para que cada globo con su reloj quede separado de los demás.
const LANES = customerLanes(MAX_CUSTOMERS_AT_WINDOW);

export class KitchenView {
  // getProgress devuelve el avance de la noche (0–1); con él los clientes llegan cada vez más seguido.
  constructor(scene, getProgress = () => 0) {
    this.scene = scene;
    this.customers = [];
    this.picker = new CustomerPicker(CUSTOMER_KEYS);
    this.visible = false;
    this.win = { x: 0, y: 0, w: 0, h: 0 };

    this.stall = scene.add.image(0, 0, STALL_KEY).setOrigin(0.5);
    // La forma de la máscara no se añade a la escena: solo define la zona visible.
    this.maskShape = scene.make.graphics({ add: false });
    this.mask = this.maskShape.createGeometryMask();
    this.trays = new ServingTrays(scene, {
      onHover: (productId, x, y) => this.highlightCustomer(productId, x, y),
      onRelease: (productId, x, y) => this.serve(productId, x, y),
      onDrop: (productId) => scene.events.emit(KITCHEN_EVENTS.FOOD_DROPPED, productId),
    });
    this.debug = new URLSearchParams(window.location.search).has('debugKitchen')
      ? scene.add.graphics().setDepth(10) : null;

    // Los clientes llegan cada vez más seguido a medida que avanza la noche (ver kitchen/arrivals.js).
    this.getProgress = getProgress;
    this.scheduleArrival(FIRST_ARRIVAL_MS);
    this.setVisible(false);
  }

  // Programa la siguiente llegada. Si la ventana está llena, reintenta pronto en vez de saltarse el turno.
  scheduleArrival(delay) {
    this.arrival = this.scene.time.delayedCall(delay, () => {
      const spawned = this.spawnCustomer();
      this.scheduleArrival(spawned ? nextArrivalDelay(this.getProgress()) : ARRIVAL_RETRY_MS);
    });
  }

  setVisible(visible) {
    this.visible = visible;
    this.stall.setVisible(visible);
    this.debug?.setVisible(visible);
    this.trays.setVisible(visible);
    for (const customer of this.customers) {
      customer.sprite.setVisible(visible);
      customer.bubble.setVisible(visible && customer.arrived); // el pedido solo se muestra tras llegar
    }
  }

  // Un cliente camina desde lejos hasta el vano; al llegar espera y se va.
  // Sin `key`, el zombie lo elige el CustomerPicker: salen todos antes de que se repita alguno.
  spawnCustomer(key = null, order = createOrder()) {
    if (this.customers.length >= MAX_CUSTOMERS_AT_WINDOW) return null;
    const textureKey = key ?? this.picker.next(this.customers.map((customer) => customer.key));
    const sprite = this.scene.add.image(0, 0, textureKey).setOrigin(0.5, 1).setTint(TINT.shadow).setMask(this.mask);
    sprite.setVisible(this.visible);
    // Cada cliente ocupa un carril libre (se separan unos de otros). Un pelín de variación evita que se vea rígido.
    const free = LANES.map((_, i) => i).filter((i) => !this.customers.some((c) => c.lane === i));
    const lane = Phaser.Utils.Array.GetRandom(free);
    const bubble = this.createBubble(order);
    const customer = {
      key: textureKey, sprite, order, bubble, hud: bubble.getData('hud'), lane, p: 0,
      progress: new OrderProgress(order), arrived: false, revealing: false, served: false,
      xr: LANES[lane] + Phaser.Math.FloatBetween(-0.02, 0.02), dead: false,
    };
    bubble.setVisible(false); // el pedido aparece cuando el cliente llega y empieza su reloj
    this.customers.push(customer);
    this.layout(customer);
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: 9000, ease: 'Sine.easeOut',
      onUpdate: (tween) => { customer.p = tween.getValue(); this.layout(customer); },
      onComplete: () => this.startWaiting(customer), // al llegar al vano empieza a contar su espera
    });
    return customer;
  }

  // Al llegar, el cliente sale de la sombra: el color indica que ya se le puede atender.
  reveal(customer) {
    customer.revealing = true;
    const from = Phaser.Display.Color.IntegerToColor(TINT.shadow);
    const to = Phaser.Display.Color.IntegerToColor(TINT.idle);
    const finish = () => { customer.revealing = false; if (!customer.dead) customer.sprite.setTint(TINT.idle); };
    this.scene.tweens.addCounter({
      from: 0, to: 100, duration: REVEAL_MS, ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        if (customer.dead) return;
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, tween.getValue());
        customer.sprite.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
      onComplete: finish,
    });
  }

  // Empieza la cuenta atrás de la espera del cliente. Al llegar a 0 se agota su paciencia.
  startWaiting(customer) {
    if (customer.dead) return;
    customer.arrived = true; // desde aquí se le puede entregar comida
    this.reveal(customer);
    customer.bubble.setAlpha(0).setVisible(this.visible);
    this.scene.tweens.add({ targets: customer.bubble, alpha: 1, duration: REVEAL_MS, ease: 'Sine.easeOut' });
    customer.hud.setVisible(true); // el reloj (ya creado sobre el globo) aparece al llegar
    this.updateWaitHud(customer, CUSTOMER_PATIENCE_MS);
    customer.wait = this.scene.tweens.addCounter({
      from: 0, to: 1, duration: CUSTOMER_PATIENCE_MS, ease: 'Linear',
      onUpdate: (tween) => this.updateWaitHud(customer, CUSTOMER_PATIENCE_MS * (1 - tween.getValue())),
      onComplete: () => { customer.wait = null; this.expire(customer); },
    });
  }

  // El cliente se cansó de esperar sin ser atendido.
  // reason: 'timeout' (se agotó la espera) o 'wrong' (le dieron un producto que no pidió). Ambos cuentan igual.
  expire(customer, reason = 'timeout') {
    if (customer.dead || customer.served) return;
    // GANCHO JUMPSCARE / BARRA DE SUSTO: quien necesite reaccionar escucha este evento:
    //   scene.events.on(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, (customer) => { ... })
    this.scene.events.emit(KITCHEN_EVENTS.CUSTOMER_TIMEOUT, customer, reason);
    this.dismiss(customer);
  }

  dismiss(customer) {
    if (customer.dead) return;
    customer.dead = true;
    customer.wait?.stop();
    customer.wait = null; // el reloj y el globo se desvanecen juntos
    this.scene.tweens.add({
      targets: [customer.sprite, customer.bubble], alpha: 0, duration: 400,
      onComplete: () => {
        customer.sprite.destroy();
        customer.bubble.destroy();
        this.customers = this.customers.filter((item) => item !== customer);
      },
    });
  }

  layout(customer) {
    const pose = customerPose(customer.p, customer.xr, this.win);
    // Los clientes más cercanos se dibujan delante de los lejanos.
    customer.sprite.setPosition(pose.x, pose.y).setDepth(1 + customer.p)
      .setScale(pose.displayHeight / customer.sprite.height);
    // El globo va sobre la cabeza y crece o se encoge con el cliente.
    // El conjunto globo + reloj se reduce un poco si no cabe antes de salirse por arriba de la pantalla.
    const bubbleBottom = pose.y - pose.displayHeight * (1 + BUBBLE.gapRatio);
    const free = bubbleBottom - BUBBLE.screenMargin;
    const natural = (pose.displayHeight * BUBBLE.emojiRatio) / BUBBLE.fontPx;
    customer.bubble
      .setPosition(pose.x, bubbleBottom)
      .setScale(fitBubbleScale(natural, customer.bubble.getData('height'), free, BUBBLE.minShrink))
      .setDepth(3 + customer.p);
  }

  // Globo con los emojis del pedido y, encima, el reloj de espera (oculto hasta que el cliente llega).
  // El contenedor tiene su origen en la punta de la flecha del globo.
  createBubble(order) {
    const { fontPx, pad, tail } = BUBBLE;
    const text = this.scene.add.text(0, -tail - pad, new OrderProgress(order).labels((id) => PRODUCTS[id].emoji).join(' '), { fontFamily: EMOJI_FONT, fontSize: `${fontPx}px` })
      .setOrigin(0.5, 1);
    const w = text.width + pad * 2;
    const h = text.height + pad * 2;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xf4f1e8, 1).fillRoundedRect(-w / 2, -tail - h, w, h, 16);
    bg.lineStyle(4, 0x1b1b1b, 1).strokeRoundedRect(-w / 2, -tail - h, w, h, 16);
    bg.fillStyle(0xf4f1e8, 1).fillTriangle(-tail * 0.8, -tail - 2, tail * 0.8, -tail - 2, 0, 0);
    const hud = this.createWaitHud(-tail - h);
    const bubble = this.scene.add.container(0, 0, [bg, text, hud]);
    // Altura total sin escalar (globo + reloj), usada para ajustar la escala en layout().
    return bubble.setData({ height: h + tail + WAIT_STYLE.gap + hud.getData('h'), hud, text });
  }

  // Píldora con el reloj y el tiempo restante, situada justo encima del cuerpo del globo (bodyTop).
  createWaitHud(bodyTop) {
    const { fontPx, pad, gap, clock } = WAIT_STYLE;
    const text = this.scene.add.text(0, 0, `${clock} ${formatWait(CUSTOMER_PATIENCE_MS)}`, { fontFamily: EMOJI_FONT, fontSize: `${fontPx}px`, fontStyle: 'bold' })
      .setOrigin(0.5);
    const w = text.width + pad * 2;
    const h = text.height + pad;
    const bg = this.scene.add.graphics();
    return this.scene.add.container(0, bodyTop - gap - h / 2, [bg, text])
      .setData({ w, h, text, bg, warning: null })
      .setVisible(false);
  }

  updateWaitHud(customer, remainingMs) {
    const hud = customer.hud;
    const label = `${WAIT_STYLE.clock} ${formatWait(remainingMs)}`;
    const text = hud.getData('text');
    if (text.text !== label) text.setText(label);
    const warning = isWaitWarning(remainingMs);
    if (hud.getData('warning') === warning) return;
    hud.setData('warning', warning);
    text.setColor(warning ? '#ff6b6b' : '#f4f1e8');
    const w = hud.getData('w');
    const h = hud.getData('h');
    hud.getData('bg').clear()
      .fillStyle(0x0d0d0d, 0.88).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
      .lineStyle(3, warning ? 0xff3b3b : 0x8a8a7a, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  }

  // Zonas donde se puede soltar comida: el cuerpo visible de cada cliente que ya llegó y espera su pedido.
  dropTargets() {
    return this.customers.filter((c) => c.arrived && !c.dead && !c.served).map((customer) => {
      const bounds = customer.sprite.getBounds();
      // Limitado al vano (más el mostrador): la parte del sprite fuera de la máscara no cuenta.
      return { customer, x: bounds.x, y: this.win.y, w: bounds.width, h: this.win.h * (1 + DROP_BELOW_WINDOW) };
    });
  }

  // Resalta al cliente bajo el puntero: claro si necesita ese producto, rojizo si no. productId null = sin arrastre.
  highlightCustomer(productId, x, y) {
    const target = productId ? dropTargetAt(x, y, this.dropTargets()) : null;
    for (const customer of this.customers) {
      if (customer.dead || !customer.arrived || customer.revealing) continue; // en sombra o revelándose: no se toca
      const tint = customer !== target?.customer ? TINT.idle
        : customer.progress.needs(productId) ? TINT.accepts : TINT.rejects;
      customer.sprite.setTint(tint);
    }
  }

  // El jugador suelta `productId` en (x, y). Devuelve true si algún cliente lo aceptó; si no, la comida cae.
  serve(productId, x, y) {
    const target = dropTargetAt(x, y, this.dropTargets());
    if (!target) return false;
    const customer = target.customer;
    const result = customer.progress.deliver(productId);
    if (!result.accepted) {
      this.showReject(customer);
      this.expire(customer, 'wrong'); // mismo castigo que agotar la espera: susto y jumpscare
      return false; // la comida equivocada también cae
    }
    this.refreshBubble(customer);
    if (result.complete) this.finishOrder(customer);
    return true;
  }

  refreshBubble(customer) {
    customer.bubble.getData('text').setText(customer.progress.labels((id) => PRODUCTS[id].emoji).join(' '));
  }

  // Pedido completo: se detiene su espera y se va contento (sin disparar CUSTOMER_TIMEOUT ni el susto).
  finishOrder(customer) {
    customer.served = true;
    customer.wait?.stop();
    customer.wait = null;
    customer.hud.setVisible(false);
    this.scene.events.emit(KITCHEN_EVENTS.ORDER_SERVED, customer);
    this.scene.time.delayedCall(SERVED_LEAVE_MS, () => this.dismiss(customer));
  }

  // Marca 🚫 sobre el cliente que no pidió ese producto.
  showReject(customer) {
    const mark = this.scene.add.text(customer.sprite.x, customer.bubble.y, REJECT_EMOJI, {
      fontFamily: EMOJI_FONT, fontSize: '56px',
    }).setOrigin(0.5).setDepth(25);
    this.scene.tweens.add({
      targets: mark, y: mark.y - 40, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => mark.destroy(),
    });
  }

  // Clientes actuales con su pedido, para que otras partes (servir, paciencia) los consulten.
  getCustomers() {
    return this.customers.filter((customer) => !customer.dead);
  }

  // Misma idea de encuadre que OfficeScene.fitBackground: cubrir la pantalla, o ver el puesto entero en vertical.
  fit() {
    const { width, height } = this.scene.scale;
    const source = this.stall.texture.getSourceImage();
    const portrait = width < height;
    const scale = portrait ? width / source.width : Math.max(width / source.width, height / source.height);
    this.stall.setPosition(width / 2, portrait ? height * 0.45 : height / 2).setScale(scale);
    this.win = windowToPixels({
      x: this.stall.x, y: this.stall.y, width: source.width * scale, height: source.height * scale,
    }, WINDOW_RECT);
    this.maskShape.clear().fillStyle(0xffffff).fillRect(this.win.x, this.win.y, this.win.w, this.win.h);
    this.debug?.clear().lineStyle(2, 0x00ff66, 1).strokeRect(this.win.x, this.win.y, this.win.w, this.win.h);
    for (const customer of this.customers) this.layout(customer);
    // Las bandejas ocupan la franja del mostrador bajo el vano, sin invadir los botones inferiores.
    const winBottom = this.win.y + this.win.h;
    const bottom = Math.min(height - 100, winBottom + this.win.h * 0.5);
    const top = Math.min(winBottom + 8, bottom - 70);
    this.trays.fit({ x: width * 0.15, y: top, w: width * 0.7, h: bottom - top });
  }

  destroy() {
    this.trays.destroy();
    this.arrival?.remove();
    for (const customer of this.customers) {
      customer.sprite.destroy();
      customer.bubble.destroy();
    }
    this.customers = [];
    this.stall.destroy();
    this.debug?.destroy();
    this.maskShape.destroy();
  }
}