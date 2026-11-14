import Phaser from 'phaser';
import { RabbitAudio } from '../kitchen/rabbitAudio.js';
import { foodIcon, foodIconTexture, MENU_FONT } from '../kitchen/menuStyle.js';
import { customerPortrait, updateHorrorDetails } from '../kitchen/customerDistortion.js';
import { CustomerPicker } from '../kitchen/customerPicker.js';
import { createOrder, REJECT_EMOJI } from '../kitchen/orders.js';
import { OrderProgress, dropTargetAt } from '../kitchen/serving.js';
import { ServingTrays } from './ServingTrays.js';
import { nextArrivalDelay } from '../kitchen/arrivals.js';
import { formatWait, isWaitWarning } from '../kitchen/patience.js';
import {
  ARRIVAL_RETRY_MS, FIRST_ARRIVAL_MS, CUSTOMER_ENTRY_X, CUSTOMER_KEYS, CUSTOMER_PATIENCE_MS, KITCHEN_EVENTS, MAX_CUSTOMERS_AT_WINDOW, STALL_KEY, WINDOW_RECT,
  customerLanes, customerPose, windowToPixels,
} from '../kitchen/kitchenConfig.js';

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
// El ticket se ancla por su borde inferior y se ajusta al carril del cliente.
const TICKET = { iconSize: 50, slot: 64, pad: 10, header: 34, gapRatio: 0.03, screenMargin: 8 };
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
const WALK_DURATION_MS = 4500;
const RABBIT_KEY = 'customer-01';
const DOLL_KEY = 'customer-02';
const TWINS_KEY = 'customer-04';
const BEAST_KEY = 'customer-05';
const MUTANT_KEY = 'customer-06';
const SMILE_KEY = 'customer-07';
const HERMIT_KEY = 'customer-08';
const VOID_KEY = 'customer-09';
const REACTION_THRESHOLDS = [15000, 10000, 5000];
// Frecuencia, balanceo y giro de la silueta durante la entrada.
const ENTRANCES = [
  [2.8, 0.018, 2.8], [2.2, 0.009, 1.3],
  [1.7, 0.012, 1.8], [2.5, 0.013, 0.9],
  [3.1, 0.019, 2.0], [3.7, 0.016, 2.6],
  [2.9, 0.013, 2.3], [1.9, 0.009, 1.5],
  [1.6, 0.005, 0],
];
const CUSTOMER_HEIGHTS = [1.04, 0.81, 0.98, 0.78, 1.16, 1.02, 1.03, 1.07, 1.29];
const CUSTOMER_SIZE_MULTIPLIER = 1.22;
const CHILD_COUNTER_CROP = { 'customer-02': 0.44, 'customer-04': 0.58 };
const REACTIONS = {
  // [desplazamiento horizontal, vertical, giro, duración en ms]
  [RABBIT_KEY]: [[0, 0, -3, 0], [0, 0, -3, 0]],
  'customer-03': [[0, 0, -4, 500], [0, 0, -7, 400], [0.03, 0.025, -11, 300]],
  [MUTANT_KEY]: [[0, 0, 0, 0], [0, 0.02, 0, 0]],
};
const NEUTRAL_REACTION = [0, 0, 0, 0];
// Contorno superior de la vitrina en coordenadas relativas a kitchen-stall.png.
const DISPLAY_CASE_EDGE = [
  [0.182, 0.461], [0.257, 0.456], [0.292, 0.456], [0.309, 0.470],
  [0.330, 0.584], [0.342, 0.590],
];
// Faroles de la calle: centro de cada bombilla y zona iluminada, relativos a kitchen-stall.png.
const STREETLIGHTS = [
  { x: 0.71125, y: 0.10222, poolX: 0.7125, poolY: 0.576, spread: 0.062, reach: 0.050, strength: 0.68, delay: 3400 },
  { x: 0.5977, y: 0.2436, poolX: 0.525, poolY: 0.585, spread: 0.052, reach: 0.041, strength: 0.52, delay: 1800 },
  { x: 0.7843, y: 0.261, poolX: 0.755, poolY: 0.60, spread: 0.048, reach: 0.038, strength: 0.46, delay: 5200 },
];

export class KitchenView {
  // getProgress devuelve el avance de la noche (0–1); con él los clientes llegan cada vez más seguido.
  constructor(scene, getProgress = () => 0) {
    this.scene = scene;
    this.customers = [];
    this.picker = new CustomerPicker(CUSTOMER_KEYS);
    this.visible = false;
    this.win = { x: 0, y: 0, w: 0, h: 0 };

    this.stall = scene.add.image(0, 0, STALL_KEY).setOrigin(0.5);
    this.rabbitAudio = new RabbitAudio(scene.sound);
    this.beastShade = scene.add.graphics().setDepth(0.8).setVisible(false);
    this.hermitScratches = scene.add.graphics().setDepth(2.2).setVisible(false);
    this.smileScratches = scene.add.graphics().setDepth(2.2).setVisible(false);
    this.mutantClaws = scene.add.graphics().setDepth(2.2).setVisible(false);
    this.beastClaws = scene.add.graphics().setDepth(2.2).setVisible(false);
    this.rabbitScratches = scene.add.graphics().setDepth(2.2).setVisible(false);
    this.streetlights = STREETLIGHTS.map((lamp) => {
      const graphics = scene.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      const flicker = scene.tweens.add({
        targets: graphics, alpha: lamp.strength, duration: 320, ease: 'Sine.easeInOut', hold: 220,
        yoyo: true, repeat: -1, repeatDelay: () => Phaser.Math.Between(2800, 6400), delay: lamp.delay,
        onUpdate: () => this.updateCustomerLights(),
      });
      return { ...lamp, graphics, flicker, lightX: 0, lightY: 0, poolXpx: 0, poolYpx: 0 };
    });
    // La forma de la máscara no se añade a la escena: solo define la zona visible.
    this.maskShape = scene.make.graphics({ add: false });
    this.mask = this.maskShape.createGeometryMask();
    this.trays = new ServingTrays(scene, {
      onHover: (productId, x, y) => this.highlightCustomer(productId, x, y),
      onSelect: (productId) => this.serveSelected(productId),
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
    if (!visible) {
      this.rabbitAudio.stop();
      this.stopDollAudio();
      this.stopTwinsAudio();
      this.stopBeastAudio();
      this.stopMutantAudio();
      this.stopSmileEffects();
      this.stopHermitAudio();
      this.stopVoidEffects();
    }
    this.stall.setVisible(visible);
    this.hermitScratches.setVisible(visible && this.hermitLane !== undefined);
    this.smileScratches.setVisible(visible && this.smileLane !== undefined);
    this.mutantClaws.setVisible(visible && this.mutantClawLane !== undefined);
    this.beastShade.setVisible(visible && this.beastCritical);
    this.beastClaws.setVisible(visible && this.beastLane !== undefined);
    this.rabbitScratches.setVisible(visible && this.hasRabbitScratches);
    for (const lamp of this.streetlights) lamp.graphics.setVisible(visible);
    this.debug?.setVisible(visible);
    this.trays.setVisible(visible);
    for (const customer of this.customers) {
      customer.sprite.setVisible(visible);
      customer.lightReflection?.setVisible(visible);
      customer.handGlow?.setVisible(visible && (customer.p < 1 || customer.impatience === 1 && !customer.served));
      customer.bubble.setVisible(visible && customer.arrived);
    }
  }

  // Un cliente camina desde lejos hasta el vano; al llegar espera y se va.
  // Sin `key`, el zombie lo elige el CustomerPicker: salen todos antes de que se repita alguno.
  spawnCustomer(key = null, order = createOrder()) {
    if (this.customers.length >= MAX_CUSTOMERS_AT_WINDOW) return null;
    const textureKey = key ?? this.picker.next(this.customers.map((customer) => customer.key));
    const profileKey = textureKey + '-profile';
    const entryKey = this.scene.textures.exists(profileKey) ? profileKey : textureKey;
    const sprite = this.scene.add.image(0, 0, entryKey).setOrigin(0.5, 1).setTint(TINT.shadow).setMask(this.mask);
    sprite.setVisible(this.visible);
    const lightReflection = this.scene.add.image(0, 0, entryKey).setOrigin(0.5, 1)
      .setTint(0xffc982).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setMask(this.mask).setVisible(this.visible);
    // Cada cliente ocupa un carril libre (se separan unos de otros). Un pelín de variación evita que se vea rígido.
    const free = LANES.map((_, i) => i).filter((i) => !this.customers.some((c) => c.lane === i));
    const lane = Phaser.Utils.Array.GetRandom(free);
    const bubble = this.createTicket(order);
    const customer = {
      key: textureKey, sprite, lightReflection, order, bubble, hud: bubble.getData('hud'), lane, p: 0,
      entryKey,
      stepKey: this.scene.textures.exists(textureKey + '-step') ? textureKey + '-step' : entryKey,
      entrance: ENTRANCES[CUSTOMER_KEYS.indexOf(textureKey)] ?? ENTRANCES[0],
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      walkMs: 0,
      turn: 0,
      progress: new OrderProgress(order), arrived: false, revealing: false, served: false,
      impatience: 0,
      reactionProgress: 1,
      xr: LANES[lane] + Phaser.Math.FloatBetween(-0.02, 0.02), dead: false,
    };
    if (textureKey === 'customer-09' && !customer.reducedMotion) {
      customer.handGlow = this.scene.add.graphics().setMask(this.mask).setBlendMode(Phaser.BlendModes.ADD);
      customer.handGlow.setVisible(this.visible);
    }
    const stepImage = this.scene.textures.get(customer.stepKey).getSourceImage();
    customer.walkAspect = Math.max(sprite.width / sprite.height, stepImage.width / stepImage.height);
    bubble.setVisible(false);
    this.customers.push(customer);
    this.layout(customer);
    this.scene.tweens.addCounter({
      from: 0, to: WALK_DURATION_MS, duration: WALK_DURATION_MS,
      onUpdate: (tween) => {
        customer.walkMs = tween.getValue();
        customer.p = Phaser.Math.Easing.Sine.Out(customer.walkMs / WALK_DURATION_MS);
        this.layout(customer);
      },
      onComplete: () => this.turnToPlayer(customer),
    });
    return customer;
  }

  // Empieza la cuenta atrás cuando el cliente ya mira al jugador.
  turnToPlayer(customer) {
    customer.p = 1;
    const portraitKey = [RABBIT_KEY, DOLL_KEY, TWINS_KEY, BEAST_KEY, MUTANT_KEY, SMILE_KEY, HERMIT_KEY, VOID_KEY].includes(customer.key) ? customer.key : customerPortrait(this.scene.textures, customer.key);
    if (customer.reducedMotion || customer.sprite.texture.key === portraitKey) {
      this.startWaiting(customer);
      return;
    }
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: 340, ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        customer.turn = tween.getValue();
        if (customer.turn >= 0.5 && customer.sprite.texture.key !== portraitKey) {
          customer.sprite.setTexture(portraitKey);
        }
        this.layout(customer);
      },
      onComplete: () => this.startWaiting(customer),
    });
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
    customer.turn = 1;
    customer.p = 1;
    customer.sprite.setTexture([RABBIT_KEY, DOLL_KEY, TWINS_KEY, BEAST_KEY, MUTANT_KEY, SMILE_KEY, HERMIT_KEY, VOID_KEY].includes(customer.key) ? customer.key : customerPortrait(this.scene.textures, customer.key));
    this.layout(customer);
    customer.arrived = true; // desde aquí se le puede entregar comida
    this.reveal(customer);
    customer.bubble.setAlpha(0).setVisible(this.visible);
    this.scene.tweens.add({ targets: customer.bubble, alpha: 1, duration: REVEAL_MS, ease: 'Sine.easeOut' });
    customer.hud.setVisible(true); // el reloj (ya creado sobre el globo) aparece al llegar
    this.updateWaiting(customer, CUSTOMER_PATIENCE_MS);
    customer.wait = this.scene.tweens.addCounter({
      from: 0, to: 1, duration: CUSTOMER_PATIENCE_MS, ease: 'Linear',
      onUpdate: (tween) => this.updateWaiting(customer, CUSTOMER_PATIENCE_MS * (1 - tween.getValue())),
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
    if (customer.key === RABBIT_KEY) this.rabbitAudio.stop();
    if (customer.key === DOLL_KEY) this.stopDollAudio();
    if (customer.key === TWINS_KEY) this.stopTwinsAudio();
    if (customer.key === BEAST_KEY) this.clearBeastPresence();
    if (customer.key === MUTANT_KEY) this.stopMutantAudio();
    if (customer.key === SMILE_KEY) this.stopSmileEffects();
    if (customer.key === HERMIT_KEY) this.stopHermitAudio();
    if (customer.key === VOID_KEY) {
      this.stopVoidEffects();
      customer.handGlow?.setVisible(false);
    }
    customer.handGlow?.destroy();
    customer.handGlow = null;
    customer.wait?.stop();
    customer.wait = null; // el reloj y el globo se desvanecen juntos
    this.scene.tweens.add({
      targets: [customer.sprite, customer.lightReflection, customer.bubble], alpha: 0, duration: 400,
      onComplete: () => {
        customer.sprite.destroy();
        customer.lightReflection.destroy();
        customer.bubble.destroy();
        this.customers = this.customers.filter((item) => item !== customer);
      },
    });
  }

  layout(customer) {
    const pose = customerPose(customer.p, customer.xr, this.win, undefined, customer.walkAspect, this.entryX);
    const [frequency, lift, roll] = customer.entrance;
    const walking = customer.p < 1 && !customer.reducedMotion;
    // Una oscilación completa contiene dos pasos.
    const phase = customer.walkMs * frequency * Math.PI / 1000;
    // Las poses de zancada también acompañan el desplazamiento con movimiento reducido.
    if (customer.p < 1) {
      const step = Math.floor(customer.walkMs * frequency / 1000);
      const frame = step % 2 === 0 ? customer.entryKey : customer.stepKey;
      if (customer.sprite.texture.key !== frame) customer.sprite.setTexture(frame);
    }
    const weight = Phaser.Math.Clamp((1 - customer.p) * 5, 0, 1);
    const bob = walking ? (1 - Math.cos(phase * 2)) * 0.5 * pose.displayHeight * lift * weight : 0;
    const tilt = walking ? Math.sin(phase) * roll * weight : 0;
    // Mantiene el tamaño vertical y limita las siluetas anchas al espacio de su carril.
    const frontImage = this.scene.textures.get(customer.key).getSourceImage();
    const referenceAspect = frontImage.width / frontImage.height;
    const targetHeight = Math.min(
      this.win.h * (CUSTOMER_HEIGHTS[CUSTOMER_KEYS.indexOf(customer.key)] ?? 1),
      this.win.w * 0.43 / referenceAspect,
    ) * CUSTOMER_SIZE_MULTIPLIER * (CHILD_COUNTER_CROP[customer.key] !== undefined ? 1.08 : 1);
    const approach = customer.key === RABBIT_KEY ? [1, 1.06, 1.06][customer.impatience]
      : customer.key === DOLL_KEY && customer.impatience === 2 ? 1.12 : 1;
    const twinsLean = customer.key === TWINS_KEY ? [1, 1.04, 1.08][customer.impatience] : 1;
    const mutantLean = customer.key === MUTANT_KEY && customer.impatience === 2 ? 1.18 : 1;
    const hermitLean = customer.key === HERMIT_KEY && customer.impatience === 2 ? 1.08 : 1;
    const voidLean = customer.key === VOID_KEY && customer.impatience === 2 ? 1.1 : 1;
    const naturalScale = targetHeight * approach * twinsLean * mutantLean * hermitLean * voidLean / customer.sprite.height;
    const scale = customer.key === MUTANT_KEY && customer.impatience > 0
      ? Math.min(naturalScale, this.win.w * 0.61 / customer.sprite.width) : naturalScale;
    const reactions = REACTIONS[customer.key];
    const previous = reactions?.[customer.impatience - 2] ?? NEUTRAL_REACTION;
    const target = reactions?.[customer.impatience - 1] ?? NEUTRAL_REACTION;
    const [dx, dy, angle] = target.map((value, index) =>
      Phaser.Math.Linear(previous[index], value, customer.reactionProgress));
    const customerX = pose.x + dx * this.win.w;
    const offsetY = dy * this.win.h;
    const counterY = this.win.y + this.win.h;
    const spriteHeight = customer.sprite.height * scale;
    const crop = customer.key === TWINS_KEY && customer.impatience === 2 ? 0.50
      : customer.key === DOLL_KEY && customer.impatience === 2
      ? 0.50 : CHILD_COUNTER_CROP[customer.key] ?? 0.38;
    const baseY = counterY + spriteHeight * crop;
    // Los clientes más cercanos se dibujan delante de los lejanos.
    customer.sprite
      .setPosition(customerX, baseY + offsetY - bob)
      .setAngle(tilt + angle).setDepth(1 + customer.p)
      .setScale(scale);
    // Un duplicado aditivo conserva la silueta y recibe el pulso cálido de los faroles.
    const reflection = customer.lightReflection;
    if (reflection) {
      if (reflection.texture.key !== customer.sprite.texture.key) reflection.setTexture(customer.sprite.texture.key);
      reflection.setPosition(customer.sprite.x, customer.sprite.y).setAngle(customer.sprite.angle)
        .setScale(customer.sprite.scaleX, customer.sprite.scaleY).setDepth(customer.sprite.depth + 0.02);
      this.updateCustomerLight(customer);
    }
    if (customer.handGlow) {
      const sprite = customer.sprite;
      const radius = sprite.displayHeight * 0.025;
      const x = sprite.x + sprite.displayWidth * 0.37;
      const y = sprite.y - sprite.displayHeight * 0.74;
      customer.handGlow.clear().setDepth(sprite.depth + 0.01).setVisible(this.visible && walking);
      customer.handGlow.fillStyle(0xffcc86, (0.12 + 0.09 * Math.sin(phase)) * weight)
        .fillCircle(x, y, radius);
    }
    // El globo va sobre la cabeza y crece o se encoge con el cliente.
    // El conjunto globo + reloj se reduce un poco si no cabe antes de salirse por arriba de la pantalla.
    const { width, height } = this.scene.scale;
    const bubbleWidth = customer.bubble.getData('width');
    const bubbleHeight = customer.bubble.getData('height');
    const laneWidth = Math.min(this.win.w, width) / MAX_CUSTOMERS_AT_WINDOW;
    const scaleLimit = Math.max(1, laneWidth - 2 * TICKET.screenMargin) / bubbleWidth;
    const bubbleScale = Math.min(Phaser.Math.Clamp(spriteHeight / 420, 0.65, 0.95), scaleLimit);
    const halfWidth = bubbleWidth * bubbleScale / 2;
    const laneLeft = Phaser.Math.Clamp(this.win.x + (this.win.w - laneWidth * MAX_CUSTOMERS_AT_WINDOW) / 2,
      0, width - laneWidth * MAX_CUSTOMERS_AT_WINDOW) + customer.lane * laneWidth;
    const bubbleX = Phaser.Math.Clamp(customerX, laneLeft + halfWidth + TICKET.screenMargin,
      laneLeft + laneWidth - halfWidth - TICKET.screenMargin);
    const headY = baseY + offsetY - bob - spriteHeight;
    const bubbleBottom = Phaser.Math.Clamp(headY - spriteHeight * TICKET.gapRatio,
      TICKET.screenMargin + bubbleHeight * bubbleScale, height - 118);
    customer.bubble.setPosition(bubbleX, bubbleBottom).setScale(bubbleScale)
      .setDepth(3 + customer.p);
  }

  // Globo con los emojis del pedido y, encima, el reloj de espera (oculto hasta que el cliente llega).
  createTicket(order) {
    const { iconSize, slot, pad, header } = TICKET;
    const width = Math.max(154, order.items.length * slot + pad * 2);
    const height = header + slot + pad;
    const left = -width / 2;
    const top = -height;
    const rowTop = top + header;
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x000000, 0.45).fillRect(left + 3, top + 3, width, height);
    panel.fillStyle(0x211c15, 1).fillRect(left, top, width, height);
    panel.fillStyle(0x382d1d, 1).fillRect(left, top, width, header);
    panel.lineStyle(1, 0xa58a5e, 1).strokeRect(left, top, width, height);
    const cells = this.scene.add.graphics();
    const doneTexture = foodIconTexture(this.scene, 'done');
    const icons = order.items.map((id, index) => {
      const x = (index - (order.items.length - 1) / 2) * slot;
      cells.fillStyle(0x12120f, 1).fillRoundedRect(x - slot / 2 + 3, rowTop + 6, slot - 6, slot - 4, 3);
      return foodIcon(this.scene, id, x, rowTop + 6 + (slot - 4) / 2).setDisplaySize(iconSize, iconSize);
    });
    const title = this.scene.add.text(left + pad, top + 14, 'PEDIDO', {
      fontFamily: MENU_FONT, fontSize: '19px', fontStyle: 'bold', color: '#ead6ae',
    }).setOrigin(0, 0.5);
    const clock = this.scene.add.text(-left - pad, top + 14, formatWait(CUSTOMER_PATIENCE_MS), {
      fontFamily: MENU_FONT, fontSize: '20px', fontStyle: 'bold', color: '#ead6ae',
    }).setOrigin(1, 0.5);
    const meter = this.scene.add.graphics();
    const hud = this.scene.add.container(0, 0, [clock, meter]).setVisible(false);
    hud.setData({ clock, meter, left, width, y: rowTop - 4 });
    return this.scene.add.container(0, 0, [panel, cells, ...icons, title, hud]).setData({
      width: width + 6, height, hud, icons, doneTexture,
    });
  }

  updateWaitHud(customer, remainingMs) {
    const { clock, meter, left, width, y } = customer.hud.data.values;
    const label = formatWait(remainingMs);
    const warning = isWaitWarning(remainingMs);
    if (clock.text !== label) clock.setText(label).setColor(warning ? '#ffa187' : '#ead6ae');
    const fraction = Phaser.Math.Clamp(remainingMs / CUSTOMER_PATIENCE_MS, 0, 1);
    meter.clear().fillStyle(0x15120d, 1).fillRect(left + 1, y, width - 2, 3)
      .fillStyle(warning ? 0xc66a51 : 0xd6a251, 1).fillRect(left + 1, y, (width - 2) * fraction, 3);
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
    return this.deliver(target.customer, productId);
  }

  serveSelected(productId) {
    const matches = this.customers.filter((customer) =>
      customer.arrived && !customer.dead && !customer.served && customer.progress.needs(productId));
    if (matches.length === 1) this.deliver(matches[0], productId);
  }

  deliver(customer, productId) {
    const result = customer.progress.deliver(productId);
    if (!result.accepted) {
      this.showReject(customer);
      this.expire(customer, 'wrong'); // mismo castigo que agotar la espera: susto y jumpscare
      return false; // la comida equivocada también cae
    }
    customer.bubble.getData('icons')[result.index].setTexture(customer.bubble.getData('doneTexture')).setTint(0xb5c198);
    if (result.complete) this.finishOrder(customer);
    return true;
  }

  // Pedido completo: se detiene su espera y se va contento (sin disparar CUSTOMER_TIMEOUT ni el susto).
  finishOrder(customer) {
    customer.served = true;
    if (customer.key === RABBIT_KEY) this.rabbitAudio.stop();
    if (customer.key === DOLL_KEY) this.stopDollAudio();
    if (customer.key === TWINS_KEY) this.stopTwinsAudio();
    if (customer.key === BEAST_KEY) this.clearBeastPresence();
    if (customer.key === MUTANT_KEY) this.stopMutantAudio();
    if (customer.key === SMILE_KEY) this.stopSmileEffects();
    if (customer.key === HERMIT_KEY) this.stopHermitAudio();
    if (customer.key === VOID_KEY) {
      this.stopVoidEffects();
      customer.handGlow?.setVisible(false);
    }
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

  updateCustomerLight(customer) {
    const sprite = customer?.sprite;
    const reflection = customer?.lightReflection;
    if (!sprite || !reflection || customer.dead || !this.win.w || !this.win.h) return;
    const headX = sprite.x;
    const headY = sprite.y - sprite.displayHeight * 0.76;
    const glow = this.streetlights.reduce((total, lamp) => {
      const dx = (headX - lamp.poolXpx) / (this.win.w * 0.20);
      const dy = (headY - lamp.poolYpx) / (this.win.h * 0.60);
      const influence = Phaser.Math.Clamp(1 - Math.sqrt(dx * dx + dy * dy), 0, 1);
      return total + lamp.graphics.alpha * influence;
    }, 0);
    reflection.setAlpha(Phaser.Math.Clamp(glow * 0.40, 0, 0.38));
  }

  updateCustomerLights() {
    for (const customer of this.customers) this.updateCustomerLight(customer);
  }

  updateWaiting(customer, remainingMs) {
    const rabbit = customer.key === RABBIT_KEY;
    const doll = customer.key === DOLL_KEY;
    const twins = customer.key === TWINS_KEY;
    const beast = customer.key === BEAST_KEY;
    const mutant = customer.key === MUTANT_KEY;
    const smile = customer.key === SMILE_KEY;
    const hermit = customer.key === HERMIT_KEY;
    const voidEntity = customer.key === VOID_KEY;
    const thresholds = rabbit || doll || twins || beast || mutant || smile || hermit || voidEntity ? REACTION_THRESHOLDS.slice(0, 2) : REACTION_THRESHOLDS;
    const stage = thresholds.filter((threshold) => remainingMs <= threshold).length;
    const duration = doll || twins ? 0 : REACTIONS[customer.key]?.[stage - 1]?.[3] ?? 0;
    const threshold = thresholds[stage - 1];
    const frameChanged = (voidEntity && stage > 0 && this.updateVoidFrame(customer, stage))
      || (hermit && stage > 0 && this.updateHermitFrame(customer, stage))
      || (smile && stage > 0 && this.updateSmileFrame(customer, stage))
      || (mutant && stage > 0 && this.updateMutantFrame(customer, stage))
      || (beast && stage > 0 && this.updateBeastFrame(customer, stage))
      || (rabbit && this.updateRabbitFrame(customer, stage))
      || (doll && stage > 0 && this.updateDollFrame(customer, stage))
      || (twins && stage > 0 && this.updateTwinsFrame(customer, stage))
      || (!rabbit && !doll && !twins && !beast && !mutant && !smile && !hermit && !voidEntity && stage > 0 && updateHorrorDetails(this.scene.textures, customer, stage));
    if (rabbit && this.visible) {
      this.rabbitAudio.update(stage, remainingMs, this.scene.time.now);
      if (stage === 2 && frameChanged) this.rabbitAudio.snap();
    }
    if (voidEntity && this.visible) this.updateVoidEffects(customer, stage);
    if (hermit && this.visible) this.updateHermitAudio(stage);
    if (smile && this.visible) this.updateSmileEffects(customer, stage);
    if (mutant && this.visible) this.updateMutantAudio(stage);
    if (beast && this.visible) this.updateBeastAudio(stage);
    if (twins && this.visible) this.updateTwinsAudio(stage);
    if (doll && this.visible) this.updateDollAudio(stage, frameChanged);
    const progress = duration && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? Phaser.Math.Easing.Cubic.Out(Phaser.Math.Clamp((threshold - remainingMs) / duration, 0, 1))
      : 1;
    if (frameChanged || stage !== customer.impatience || progress !== customer.reactionProgress) {
      customer.impatience = stage;
      customer.reactionProgress = progress;
      this.layout(customer);
    }
    this.updateWaitHud(customer, remainingMs);
  }

  updateVoidFrame(customer, stage) {
    const key = `void-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    return true;
  }

  updateVoidEffects(customer, stage) {
    if (stage === 1 && customer.handGlow) {
      const { sprite, handGlow } = customer;
      const pulse = (1 + Math.sin(this.scene.time.now * 0.012)) / 2;
      const x = sprite.x + sprite.displayWidth * 0.16;
      const y = sprite.y - sprite.displayHeight * 0.74;
      const radius = sprite.displayHeight * (0.025 + 0.012 * pulse);
      handGlow.clear().setVisible(true).setDepth(sprite.depth + 0.03);
      handGlow.fillStyle(0xffd792, 0.08 + 0.12 * pulse).fillCircle(x, y, radius);
      handGlow.fillStyle(0xffe9bd, 0.12 + 0.2 * pulse).fillCircle(x, y, radius * 0.46);
    } else if (stage === 2) {
      customer.handGlow?.setVisible(false);
    }
    if (this.voidStage === stage) return;
    this.stopVoidEffects();
    const [sound, volume] = [['idle', 0.26], ['unease', 0.44], ['mutation', 0.67]][stage];
    this.voidStage = stage;
    this.voidLoop = this.scene.sound.add(`void-${sound}`, { loop: true, volume });
    this.voidLoop.play();
    if (stage === 2 && !customer.reducedMotion) {
      const pulse = () => this.scene.cameras.main.flash(420, 72, 110, 138);
      pulse();
      this.voidPulse = this.scene.time.addEvent({ delay: 1850, callback: pulse, loop: true });
    }
  }

  stopVoidEffects() {
    this.voidPulse?.remove();
    this.voidLoop?.destroy();
    this.voidPulse = null;
    this.voidLoop = null;
    this.voidStage = null;
  }

  updateHermitFrame(customer, stage) {
    const key = `hermit-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    this.hermitLane = customer.xr;
    this.paintHermitScratches();
    this.hermitScratches.setVisible(this.visible);
    if (stage === 2 && this.visible && !customer.reducedMotion) {
      this.scene.cameras.main.flash(420, 75, 91, 110);
    }
    return true;
  }

  paintHermitScratches() {
    const { x, y, w, h } = this.win;
    this.hermitScratches.clear().lineStyle(1.5, 0x20130f, 0.88);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const left = x + w * (this.hermitLane + side * (0.08 + i * 0.013));
        const top = y + h * (1.012 + i * 0.009);
        this.hermitScratches.lineBetween(left, top, left + side * w * 0.024, top + h * 0.034);
      }
    }
  }

  updateHermitAudio(stage) {
    if (this.hermitAudioStage === stage) return;
    this.stopHermitAudio();
    const [sound, volume] = [['idle', 0.18], ['unease', 0.35], ['mutation', 0.62]][stage];
    this.hermitAudioStage = stage;
    this.hermitLoop = this.scene.sound.add(`hermit-${sound}`, { loop: true, volume });
    this.hermitLoop.play();
  }

  stopHermitAudio() {
    this.hermitLoop?.destroy();
    this.hermitLoop = null;
    this.hermitAudioStage = null;
  }

  updateSmileFrame(customer, stage) {
    const key = `smile-face-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    const textures = this.scene.textures;
    if (!textures.exists(key)) {
      const base = textures.get(SMILE_KEY).getSourceImage();
      const face = textures.get(`smile-phase-${stage}`).getSourceImage();
      const texture = textures.createCanvas(key, base.width, base.height);
      const ctx = texture.getContext();
      ctx.drawImage(base, 0, 0);
      // Solo se superpone la región facial. Los ojos se alinean con el sprite base.
      const [x, y, rx, ry, eyeX, eyeY] = stage === 1
        ? [215, 171, 49, 67, 327, 266]
        : [229, 227, 61, 111, 322, 240];
      ctx.save();
      ctx.scale(base.width / 597, base.height / 893);
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-atop';
      const faceScale = 0.58;
      ctx.drawImage(face, 194 - eyeX * faceScale, 154 - eyeY * faceScale,
        1024 * faceScale, 1536 * faceScale);
      ctx.restore();
      texture.refresh();
    }
    customer.sprite.setTexture(key);
    this.smileLane = customer.xr;
    this.paintSmileScratches();
    this.smileScratches.setVisible(this.visible);
    return true;
  }

  paintSmileScratches() {
    const { x, y, w, h } = this.win;
    this.smileScratches.clear().lineStyle(3, 0x1a100e, 0.92);
    for (let i = 0; i < 4; i++) {
      const left = x + w * (this.smileLane - 0.065 + i * 0.022);
      const top = y + h * (1.019 + i * 0.005);
      this.smileScratches.lineBetween(left, top, left + w * 0.058, top + h * 0.044);
    }
  }

  updateSmileEffects(customer, stage) {
    if (this.smileAudioStage === stage) return;
    this.stopSmileEffects();
    const [sound, volume] = [['idle', 0.25], ['unease', 0.52], ['mutation', 0.74]][stage];
    this.smileAudioStage = stage;
    this.smileLoop = this.scene.sound.add(`smile-${sound}`, { loop: true, volume });
    this.smileLoop.play();
    if (stage === 2 && !customer.reducedMotion) {
      const pulse = () => this.scene.cameras.main.flash(340, 62, 82, 101);
      pulse();
      this.smilePulse = this.scene.time.addEvent({ delay: 1750, callback: pulse, loop: true });
    }
  }

  stopSmileEffects() {
    this.smilePulse?.remove();
    this.smileLoop?.destroy();
    this.smilePulse = null;
    this.smileLoop = null;
    this.smileAudioStage = null;
  }

  updateMutantFrame(customer, stage) {
    const key = `mutant-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    this.mutantClawLane = customer.xr;
    this.paintMutantClaws();
    this.mutantClaws.setVisible(this.visible);
    if (stage === 2 && this.visible && !customer.reducedMotion) {
      this.scene.cameras.main.flash(400, 139, 48, 63);
    }
    return true;
  }

  paintMutantClaws() {
    const { x, y, w, h } = this.win;
    const marks = this.mutantClaws.clear();
    for (let i = 0; i < 5; i++) {
      const left = x + w * (this.mutantClawLane - 0.075 + i * 0.026);
      const top = y + h * (1.013 + i * 0.008);
      const endX = left + w * (0.032 + i * 0.005);
      const endY = top + h * 0.061;
      marks.lineStyle(4, 0x23100c, 0.93).lineBetween(left, top, endX, endY);
      marks.lineStyle(1, 0xc89264, 0.73).lineBetween(left, top + 2, endX, endY + 2);
    }
  }

  updateMutantAudio(stage) {
    if (this.mutantAudioStage === stage) return;
    this.stopMutantAudio();
    const [sound, volume] = [['idle', 0.34], ['unease', 0.55], ['mutation', 0.72]][stage];
    this.mutantAudioStage = stage;
    this.mutantLoop = this.scene.sound.add(`mutant-${sound}`, { loop: true, volume });
    this.mutantLoop.play();
  }

  stopMutantAudio() {
    this.mutantLoop?.destroy();
    this.mutantLoop = null;
    this.mutantAudioStage = null;
  }

  updateBeastFrame(customer, stage) {
    const key = `beast-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    this.beastLane = customer.xr;
    this.beastCritical = stage === 2;
    this.paintBeastEffects();
    this.beastClaws.setVisible(this.visible);
    this.beastShade.setVisible(this.visible && this.beastCritical);
    return true;
  }

  paintBeastEffects() {
    const { width, height } = this.scene.scale;
    this.beastShade.clear().fillStyle(0x03070d, 0.68).fillRect(0, 0, width, height);
    const { x, y, w, h } = this.win;
    this.beastClaws.clear();
    for (let i = 0; i < 4; i++) {
      const left = x + w * (this.beastLane - 0.06 + i * 0.024);
      const top = y + h * 1.015;
      this.beastClaws.lineStyle(4, 0x1b100c, 0.93).lineBetween(left, top, left - w * 0.024, top + h * 0.065);
      this.beastClaws.lineStyle(1, 0xd09760, 0.76).lineBetween(left + 2, top, left - w * 0.024 + 2, top + h * 0.065);
    }
  }

  updateBeastAudio(stage) {
    if (this.beastAudioStage === stage) return;
    this.stopBeastAudio();
    const [sound, volume] = [['idle', 0.35], ['unease', 0.55], ['mutation', 0.83]][stage];
    this.beastAudioStage = stage;
    this.beastLoop = this.scene.sound.add(`beast-${sound}`, { loop: true, volume });
    this.beastLoop.play();
    if (stage === 2) this.scene.registry.get('audio').setNightDuck(true);
  }

  stopBeastAudio() {
    if (this.beastAudioStage === 2) this.scene.registry.get('audio').setNightDuck(false);
    this.beastLoop?.destroy();
    this.beastLoop = null;
    this.beastAudioStage = null;
  }

  clearBeastPresence() {
    this.stopBeastAudio();
    this.beastCritical = false;
    this.beastShade.setVisible(false);
  }

  updateTwinsFrame(customer, stage) {
    const key = `twins-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    if (this.visible && stage === 2 && !customer.reducedMotion) {
      this.scene.cameras.main.flash(420, 99, 117, 140);
    }
    return true;
  }

  updateTwinsAudio(stage) {
    if (this.twinsAudioStage === stage) return;
    this.stopTwinsAudio();
    const [sound, volume] = [['idle', 0.22], ['unease', 0.34], ['mutation', 0.56]][stage];
    this.twinsAudioStage = stage;
    this.twinsLoop = this.scene.sound.add(`twins-${sound}`, { loop: true, volume });
    this.twinsLoop.play();
  }

  stopTwinsAudio() {
    this.twinsLoop?.destroy();
    this.twinsLoop = null;
    this.twinsAudioStage = null;
  }

  updateDollFrame(customer, stage) {
    const key = `doll-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    return true;
  }

  updateDollAudio(stage, changed) {
    if (stage === this.dollAudioStage) return;
    this.stopDollAudio();
    this.dollAudioStage = stage;
    const [key, volume] = [['doll-idle', 0.15], ['doll-unease', 0.29], ['doll-mutation', 0.51]][stage];
    this.dollLoop = this.scene.sound.add(key, { loop: true, volume });
    this.dollLoop.play();
    if (changed && stage === 1) {
      this.dollPinCue = this.scene.sound.add('doll-pin', { volume: 0.34, rate: 0.68 });
      this.dollPinCue.play();
    }
  }

  stopDollAudio() {
    this.dollLoop?.destroy();
    this.dollPinCue?.destroy();
    this.dollLoop = null;
    this.dollPinCue = null;
    this.dollAudioStage = null;
  }

  updateRabbitFrame(customer, stage) {
    if (!stage) return false;
    const key = `rabbit-phase-${stage}`;
    if (customer.sprite.texture.key === key) return false;
    customer.sprite.setTexture(key);
    if (stage === 1) {
      this.hasRabbitScratches = true;
      this.rabbitScratchLane = customer.xr - 0.07;
      this.paintRabbitScratches();
      this.rabbitScratches.setVisible(this.visible);
    } else if (this.visible && !customer.reducedMotion) {
      this.scene.cameras.main.flash(650, 102, 137, 168);
    }
    return true;
  }

  paintRabbitScratches() {
    const { x, y, w, h } = this.win;
    const marks = this.rabbitScratches.clear();
    for (let i = 0; i < 4; i++) {
      const left = x + w * (this.rabbitScratchLane + i * 0.018);
      const top = y + h * (1.012 + i * 0.004);
      marks.lineStyle(3, 0x25150e, 0.9).lineBetween(left, top, left + w * 0.085, top + h * 0.025);
      marks.lineStyle(1, 0xbb8960, 0.82).lineBetween(left, top + 2, left + w * 0.085, top + h * 0.025 + 2);
    }
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
    const imageWidth = source.width * scale;
    const imageHeight = source.height * scale;
    const imageLeft = this.stall.x - imageWidth / 2;
    const imageTop = this.stall.y - imageHeight / 2;
    for (const lamp of this.streetlights) {
      const lightX = imageLeft + imageWidth * lamp.x;
      const lightY = imageTop + imageHeight * lamp.y;
      const poolX = imageLeft + imageWidth * lamp.poolX;
      const poolY = imageTop + imageHeight * lamp.poolY;
      lamp.lightX = lightX;
      lamp.lightY = lightY;
      lamp.poolXpx = poolX;
      lamp.poolYpx = poolY;
      const radius = imageHeight * (lamp === this.streetlights[0] ? 0.045 : 0.033);
      const graphics = lamp.graphics;
      graphics.clear();
      // Halo en la bombilla, cono descendente y reflejo sobre el pavimento.
      for (let ring = 5; ring >= 1; ring--) {
        const falloff = ring / 5;
        graphics.fillStyle(0xffd29a, 0.022).fillTriangle(
          lightX, lightY,
          poolX - imageWidth * lamp.spread * falloff, poolY,
          poolX + imageWidth * lamp.reach * falloff, poolY,
        );
        graphics.fillStyle(0xffc47f, 0.035).fillEllipse(
          poolX, poolY,
          imageWidth * (lamp === this.streetlights[0] ? 0.10 : 0.075) * falloff,
          imageHeight * (lamp === this.streetlights[0] ? 0.077 : 0.055) * falloff,
        );
      }
      for (let ring = 5; ring >= 1; ring--) {
        graphics.fillStyle(0xffdda8, 0.07).fillCircle(lightX, lightY, radius * ring / 5);
      }
    }
    if (this.hermitLane !== undefined) this.paintHermitScratches();
    if (this.smileLane !== undefined) this.paintSmileScratches();
    if (this.mutantClawLane !== undefined) this.paintMutantClaws();
    if (this.beastLane !== undefined) this.paintBeastEffects();
    if (this.hasRabbitScratches) this.paintRabbitScratches();
    this.entryX = imageLeft + CUSTOMER_ENTRY_X * imageWidth;
    const right = this.win.x + this.win.w;
    const maskBottom = this.win.y + this.win.h;
    const caseEdge = DISPLAY_CASE_EDGE.map(([x, y]) => ({
      x: imageLeft + x * imageWidth,
      y: imageTop + y * imageHeight,
    }));
    this.maskShape.clear().fillStyle(0xffffff).fillPoints([
      { x: this.entryX, y: this.win.y },
      { x: right, y: this.win.y },
      { x: right, y: maskBottom },
      { x: caseEdge.at(-1).x, y: maskBottom },
      ...caseEdge.reverse(),
    ], true);
    this.debug?.clear().lineStyle(2, 0x00ff66, 1).strokeRect(this.win.x, this.win.y, this.win.w, this.win.h);
    for (const customer of this.customers) this.layout(customer);
    // Las bandejas ocupan la franja del mostrador bajo el vano, sin invadir los botones inferiores.
    const winBottom = this.win.y + this.win.h;
    const bottom = Math.min(height - 118, winBottom + this.win.h * 0.5);
    const top = Math.min(winBottom + 8, bottom - 130);
    this.trays.fit({ x: width * 0.15, y: top, w: width * 0.7, h: bottom - top });
  }

  destroy() {
    this.trays.destroy();
    this.arrival?.remove();
    for (const customer of this.customers) {
      customer.handGlow?.destroy();
      customer.sprite.destroy();
      customer.lightReflection?.destroy();
      customer.bubble.destroy();
    }
    this.customers = [];
    this.rabbitAudio.stop();
    this.stopDollAudio();
    this.stopTwinsAudio();
    this.stopBeastAudio();
    this.stopMutantAudio();
    this.stopSmileEffects();
    this.stopHermitAudio();
    this.stopVoidEffects();
    this.hermitScratches.destroy();
    this.smileScratches.destroy();
    this.mutantClaws.destroy();
    this.beastShade.destroy();
    this.beastClaws.destroy();
    this.rabbitScratches.destroy();
    this.stall.destroy();
    for (const lamp of this.streetlights) {
      lamp.flicker.stop();
      lamp.graphics.destroy();
    }
    this.debug?.destroy();
    this.maskShape.destroy();
  }
}
