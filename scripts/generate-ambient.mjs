import { writeFileSync, mkdirSync } from 'node:fs';
const directory = new URL('../public/assets/audio/', import.meta.url);
mkdirSync(directory, { recursive: true });
const rate = 22050;
const duration = 12;
const frames = rate * duration;
const wav = Buffer.alloc(44 + frames * 2);
wav.write('RIFF'); wav.writeUInt32LE(36 + frames * 2, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(frames * 2, 40);
for (let i = 0; i < frames; i++) {
  const t = i / rate;
  // Frecuencias y modulación completan ciclos en 12 s para un bucle sin chasquido.
  const low = Math.sin(2 * Math.PI * 55 * t) * 0.24;
  const tension = Math.sin(2 * Math.PI * (661 / 12) * t) * 0.12;
  const upper = Math.sin(2 * Math.PI * (991 / 12) * t) * 0.08;
  const breathing = 0.68 + 0.32 * Math.cos(2 * Math.PI * t / 12);
  wav.writeInt16LE(Math.round((low + tension + upper) * breathing * 18000), 44 + i * 2);
}
writeFileSync(new URL('night-ambient.wav', directory), wav);
console.log('Ambiente original generado.');
