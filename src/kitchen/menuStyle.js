const OUTLINES = {
  burger: 'M8 27c0-9 7-14 16-14s16 5 16 14ZM8 31h32M8 35h32c0 5-3 6-7 6H15c-4 0-7-1-7-6ZM16 22h2m5-4h2m5 4h2',
  hotdog: 'M9 29 28 11c5-5 11-4 14 0s2 9-2 13L22 41c-5 5-12 4-15 0s-2-8 2-12Zm1 7 5-2 2-6 6-2 2-6 6-2 2-6 5-1',
  fries: 'M10 23h28l-4 20H14ZM12 23 9 9l5-1 4 15m1 0V5h5v18m3 0 2-19 5 1-2 18m3 0 4-13 5 2-6 11',
  drink: 'M12 18h24l-4 25H16ZM10 13h28v5H10Zm16 0 2-8h9M16 25h16',
  done: 'M11 25l9 9 17-19',
};

export const MENU_INK = 0xdfcaa1;
export const MENU_ACTIVE = 0xe4a545;
export const MENU_FONT = 'Courier New, monospace';

export function foodIconTexture(scene, id) {
  const key = `kitchen-icon-${id}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 96, 96);
    const ctx = texture.context;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(OUTLINES[id]));
    texture.refresh();
  }
  return key;
}

export function foodIcon(scene, id, x = 0, y = 0) {
  return scene.add.image(x, y, foodIconTexture(scene, id)).setTint(MENU_INK);
}
