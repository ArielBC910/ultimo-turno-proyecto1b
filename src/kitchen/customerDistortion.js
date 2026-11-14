const DETAILS = {
  '03': { eyes: [[.52,.15],[.65,.14]], stains: [[.31,.38],[.37,.51]] },
  '05': { eyes: [[.245,.20],[.38,.20]], stains: [[.25,.47],[.19,.59]], limbs: [[.63,.24,.91,.16],[.70,.33,.96,.29]] },
  '06': { eyes: [[.55,.215],[.65,.22]], stains: [[.60,.35],[.65,.38]], limbs: [[.30,.27,.10,.17],[.34,.23,.25,.10]] },
  '07': { eyes: [[.325,.175],[.40,.175]], stains: [[.37,.30],[.51,.42]] },
  '08': { eyes: [[.43,.113],[.48,.11]], stains: [[.46,.23],[.37,.31]] },
  '09': { eyes: [[.39,.065],[.44,.065]], stains: [[.42,.29],[.66,.27]], color: '195,225,255' },
};

// Coordenadas de los retratos frontales. Las poses de entrada conservan su silueta.
const FACES = {
  '01': { sockets: [[.38,.163],[.49,.142]], mouth: [.465,.204], blood: true },
  '02': { sockets: [[.354,.174],[.475,.170]], mouth: [.416,.215] },
  '03': { sockets: [[.52,.15],[.65,.14]], mouth: [.603,.188] },
  '04': { sockets: [[.356,.192],[.428,.193],[.655,.153],[.739,.154]], mouth: [.708,.200] },
  '05': { sockets: [[.245,.20],[.38,.20]], mouth: [.312,.341], blood: true },
  '06': { sockets: [[.55,.215],[.65,.22]], mouth: [.59,.311], blood: true },
  '07': { sockets: [[.325,.175],[.40,.175]], mouth: [.406,.229], blood: true },
  '08': { sockets: [[.43,.113],[.48,.11]], mouth: [.468,.149] },
  '09': { sockets: [[.39,.065],[.44,.065]], mouth: [.418,.136] },
};

export function shadeCustomerFace(ctx, key, width, height) {
  const face = FACES[key.slice(-2)];
  if (!face) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  for (const [x, y] of face.sockets) {
    const radius = width * (key.endsWith('09') ? .028 : .045);
    const shadow = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius);
    shadow.addColorStop(0, 'rgba(10,9,13,.64)');
    shadow.addColorStop(.45, 'rgba(18,13,20,.47)');
    shadow.addColorStop(1, 'rgba(18,13,20,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(x * width - radius, y * height - radius, radius * 2, radius * 2);
  }
  const [x, y] = face.mouth;
  if (face.blood) {
    const radius = width * .032;
    const stain = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius);
    stain.addColorStop(0, 'rgba(81,16,22,.82)');
    stain.addColorStop(.6, 'rgba(69,13,18,.53)');
    stain.addColorStop(1, 'rgba(69,13,18,0)');
    ctx.fillStyle = stain;
    ctx.fillRect(x * width - radius, y * height - radius, radius * 2, radius * 2);
    ctx.strokeStyle = 'rgba(70,14,20,.64)';
    ctx.lineWidth = width * .003;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x * width, y * height);
    ctx.quadraticCurveTo((x + .008) * width, (y + .015) * height, (x + .003) * width, (y + .027) * height);
    ctx.stroke();
  }
  ctx.restore();
}

export function customerPortrait(textures, key) {
  const portraitKey = key + '-portrait';
  if (textures.exists(portraitKey)) return portraitKey;
  const source = textures.get(key).getSourceImage();
  const portrait = textures.createCanvas(portraitKey, source.width, source.height);
  const ctx = portrait.getContext();
  ctx.drawImage(source, 0, 0);
  shadeCustomerFace(ctx, key, source.width, source.height);
  portrait.refresh();
  return portraitKey;
}

export function updateHorrorDetails(textures, customer, stage) {
  const detail = DETAILS[customer.key.slice(-2)];
  if (!detail) return false;
  const key = customer.key + '-horror-' + stage;
  if (customer.sprite.texture.key === key) return false;
  if (!textures.exists(key)) {
    const source = textures.get(customerPortrait(textures, customer.key)).getSourceImage();
    const texture = textures.createCanvas(key, source.width, source.height);
    const ctx = texture.getContext();
    const { width, height } = source;
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    for (const [x, y] of detail.eyes) {
      const radius = width * (.012 + stage * .004);
      const glow = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius);
      glow.addColorStop(0, 'rgba(' + (detail.color ?? '191,177,133') + ',' + (.18 + stage * .12) + ')');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(x * width - radius, y * height - radius, 2 * radius, 2 * radius);
    }
    if (stage >= 2) {
      ctx.strokeStyle = 'rgba(82,13,17,.78)';
      ctx.lineCap = 'round';
      detail.stains.forEach(([x, y], index) => {
        ctx.lineWidth = width * (.007 + index * .004);
        ctx.beginPath();
        ctx.moveTo(x * width, y * height);
        ctx.quadraticCurveTo((x + .009) * width, (y + .025) * height, (x - .005) * width, (y + .025 * stage) * height);
        ctx.stroke();
      });
    }
    if (stage === 3) {
      ctx.globalCompositeOperation = 'destination-over';
      for (const [x, y, endX, endY] of detail.limbs ?? []) {
        ctx.strokeStyle = '#352722';
        ctx.lineWidth = width * .018;
        ctx.beginPath();
        ctx.moveTo(x * width, y * height);
        ctx.lineTo((x + endX) * width / 2, (endY - .05) * height);
        ctx.lineTo(endX * width, endY * height);
        ctx.stroke();
      }
    }
    texture.refresh();
  }
  customer.sprite.setTexture(key);
  return true;
}
