// Transcribe los videos de un proyecto con tiempos por palabra y guarda transcripts/<clip>.json:
// { fuente, motor, text, words: [{ text, start, end, speaker? }] }. Si el video no cambió, no vuelve a transcribir.
// Motor por defecto: Whisper de OpenAI (OPENAI_API_KEY). Con --scribe usa ElevenLabs Scribe (ELEVENLABS_API_KEY), que
// además separa hablantes. Las llaves se leen de las variables de entorno o del .env de la raíz y nunca se imprimen.
// Uso (desde la raíz del repo): node scripts/transcribir.mjs proyectos/<nombre> [--scribe] [--idioma es]
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const dir = path.resolve(process.argv[2] ?? '.');
const SCRIBE = process.argv.includes('--scribe');
const iIdioma = process.argv.indexOf('--idioma');
const IDIOMA = iIdioma > 0 ? process.argv[iIdioma + 1] : 'es'; // código ISO 639-1: es, en, pt…
const videos = path.join(dir, 'public', 'videos');
const salida = path.join(dir, 'transcripts');
mkdirSync(salida, { recursive: true });

const llave = (nombre) => {
  if (process.env[nombre]) return process.env[nombre];
  const env = path.resolve(import.meta.dirname, '..', '.env');
  const m = existsSync(env) && readFileSync(env, 'utf8').match(new RegExp(`^${nombre}=(.+)$`, 'm'));
  if (m) return m[1].trim();
  // En Windows, una variable de usuario recién creada no llega a las terminales que ya estaban abiertas: se lee del registro.
  if (process.platform === 'win32') {
    try { const v = execFileSync('reg', ['query', 'HKCU\\Environment', '/v', nombre]).toString().match(/REG_\w+\s+(\S+)/)?.[1]; if (v) return v; } catch { /* no está */ }
  }
  throw new Error(`Falta ${nombre}: ponla en el .env de la raíz (ver .env.example) o como variable de entorno.`);
};

for (const archivo of readdirSync(videos).filter(f => /\.(mp4|mov|m4v)$/i.test(f))) {
  const ruta = path.join(videos, archivo);
  const destino = path.join(salida, archivo.replace(/\.[^.]+$/, '') + '.json');
  const huella = `${statSync(ruta).size}-${statSync(ruta).mtimeMs}`;
  if (existsSync(destino) && JSON.parse(readFileSync(destino, 'utf8')).huella === huella) { console.log('en caché', archivo); continue; }
  const mp3 = path.join(os.tmpdir(), `transcribir-${process.pid}.mp3`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', ruta, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', mp3]);
  const fd = new FormData();
  let words, text;
  if (SCRIBE) {
    fd.append('model_id', 'scribe_v1'); fd.append('language_code', IDIOMA); fd.append('diarize', 'true'); fd.append('timestamps_granularity', 'word');
    fd.append('file', new Blob([readFileSync(mp3)]), 'audio.mp3');
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': llave('ELEVENLABS_API_KEY') }, body: fd });
    const j = await r.json(); if (!r.ok) throw new Error(`Scribe ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    words = j.words.filter(w => w.type === 'word').map(w => ({ text: w.text, start: w.start, end: w.end, speaker: w.speaker_id }));
    text = j.text;
  } else {
    fd.append('model', 'whisper-1'); fd.append('language', IDIOMA); fd.append('response_format', 'verbose_json');
    fd.append('timestamp_granularities[]', 'word'); fd.append('timestamp_granularities[]', 'segment');
    fd.append('file', new Blob([readFileSync(mp3)]), 'audio.mp3');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${llave('OPENAI_API_KEY')}` }, body: fd });
    const j = await r.json(); if (!r.ok) throw new Error(`Whisper ${r.status}: ${j.error?.message ?? ''}`);
    words = j.words.map(w => ({ text: w.word, start: w.start, end: w.end }));
    text = j.text;
  }
  writeFileSync(destino, JSON.stringify({ fuente: archivo, motor: SCRIBE ? 'scribe_v1' : 'whisper-1', huella, text, words }, null, 1));
  // Texto con marcas de tiempo cada ~8 palabras, para leer y elegir las tomas.
  const lineas = [];
  for (let i = 0; i < words.length; i += 8) lineas.push(`[${words[i].start.toFixed(2)}] ${words.slice(i, i + 8).map(w => w.text.trim()).join(' ')}`);
  writeFileSync(destino.replace(/\.json$/, '.txt'), lineas.join('\n'));
  console.log('ok', archivo, words.length, 'palabras');
}
