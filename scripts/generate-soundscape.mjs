import { mkdirSync, writeFileSync } from 'node:fs';
const directory = new URL('../public/assets/audio/', import.meta.url);
mkdirSync(directory, { recursive: true });
const RATE = 22050;
const TAU = Math.PI * 2;
function wav(name, duration, synth, fade = 0.04) {
  const count = Math.round(RATE * duration);
  const data = Buffer.alloc(44 + count * 2);
  data.write('RIFF'); data.writeUInt32LE(36 + count * 2, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const t = i / RATE;
    const edge = Math.min(1, t / fade, (duration - t) / fade);
    const value = Math.max(-0.95, Math.min(0.95, synth(t, i) * edge));
    data.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(new URL(name, directory), data);
}
function midi(note) { return 440 * 2 ** ((note - 69) / 12); }
const chords = [[38, 45, 53, 64], [36, 43, 50, 62], [34, 41, 53, 57], [33, 40, 52, 58]];
wav('night-music.wav', 32, (t) => {
  const chord = chords[Math.floor(t / 8) % 4];
  const phase = (t % 8) / 8;
  const swell = Math.sin(Math.PI * phase) ** 0.7;
  let pad = 0;
  for (let j = 0; j < chord.length; j++) {
    const freq = midi(chord[j]);
    pad += (Math.sin(TAU * freq * t) + 0.25 * Math.sin(TAU * freq * 2 * t)) * 0.044;
    pad += Math.sin(TAU * freq * 1.003 * t) * 0.025;
  }
  const bellNote = midi(chord[3] + (Math.floor(t / 2) % 2 ? 12 : 0));
  const beat = t % 2;
  const bell = Math.sin(TAU * bellNote * beat) * Math.exp(-beat * 3.5) * 0.09
    + Math.sin(TAU * bellNote * 2.01 * beat) * Math.exp(-beat * 6) * 0.024;
  return pad * swell + bell + Math.sin(TAU * midi(chord[0] - 12) * t) * 0.06 * swell;
}, 0.8);

let seed = 281017;
let low = 0;
wav('fan-loop.wav', 12, (t) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const noise = seed / 2147483648 - 1;
  low += 0.13 * (noise - low);
  const air = low * (0.52 + 0.04 * Math.sin(TAU * 24 * t));
  const motor = Math.sin(TAU * 60 * t) * 0.085 + Math.sin(TAU * 120 * t) * 0.038;
  const rotation = Math.sin(TAU * 72 * t) * (0.045 + 0.009 * Math.sin(TAU * t / 3));
  return air + motor + rotation;
}, 0.045);

function insect(t, period, offset, carrier, gain) {
  const position = (t + offset) % period;
  if (position > period * 0.52) return 0;
  const pulse = position % 0.115;
  if (pulse > 0.066) return 0;
  const envelope = Math.sin(Math.PI * pulse / 0.066) ** 2;
  const group = Math.sin(Math.PI * position / (period * 0.52)) ** 0.5;
  return gain * envelope * group * (Math.sin(TAU * carrier * t + 0.9 * Math.sin(TAU * 70 * t)) + 0.15 * Math.sin(TAU * carrier * 1.9 * t));
}
wav('night-crickets.wav', 24, (t) =>
  insect(t, 2.4, 0.12, 4650, 0.25)
  + insect(t, 3, 1.2, 5100, 0.15)
  + insect(t, 4, 2.2, 3900, 0.085), 0.15);
console.log('Música ambiental, ventilador y grillos generados.');

let clickSeed = 1831;
wav('flashlight-click.wav', 0.095, (t) => {
  clickSeed = (Math.imul(clickSeed, 1664525) + 1013904223) >>> 0;
  const noise = clickSeed / 2147483648 - 1;
  const main = noise * Math.exp(-t * 110) * 0.62;
  const spring = Math.sin(TAU * 1700 * t) * Math.exp(-t * 95) * 0.18;
  const second = t > 0.025 ? Math.sin(TAU * 540 * t) * Math.exp(-(t - 0.025) * 160) * 0.12 : 0;
  return main + spring + second;
}, 0.001);
for (const [name, closing] of [['door-close.wav', true], ['door-open.wav', false]]) {
  let rattling = 0;
  let motorSeed = 7302;
  wav(name, 0.7, (t) => {
    motorSeed = (Math.imul(motorSeed, 1664525) + 1013904223) >>> 0;
    const noise = motorSeed / 2147483648 - 1;
    rattling += 0.19 * (noise - rattling);
    const gate = Math.min(1, t * 25) * Math.max(0, 1 - t / 0.62);
    const pitch = closing ? 150 * t - 50 * t * t : 85 * t + 48 * t * t;
    const motor = Math.sin(TAU * pitch) * 0.14 * gate;
    const rails = rattling * 0.22 * gate + Math.sin(TAU * 920 * t) * 0.018 * gate;
    const hitTime = closing ? 0.56 : 0.06;
    const age = t - hitTime;
    const clunk = age > 0 ? (noise * 0.28 + Math.sin(TAU * 105 * age) * 0.33 + Math.sin(TAU * 351 * age) * 0.1) * Math.exp(-age * 33) : 0;
    return motor + rails + clunk * (closing ? 1 : 0.55);
  }, 0.004);
}
console.log('Clic de linterna y mecanismos de puerta generados.');
