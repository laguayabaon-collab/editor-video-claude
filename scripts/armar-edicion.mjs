// Genera src/edit-data.json de un proyecto a partir de su cortes.json y las transcripciones por palabra.
// Hace lo que no se debe hacer a mano: compactar el aire muerto (cortes secos en pausas largas), asignar los
// subtítulos por solapamiento, alternar el Ken Burns y anclar cada overlay a la palabra que lo dispara.
// Uso (desde la raíz del repo): node scripts/armar-edicion.mjs proyectos/<nombre>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] ?? '.');
const C = JSON.parse(readFileSync(path.join(dir, 'cortes.json'), 'utf8'));
const FORMATOS = { '9x16': [1080, 1920], '16x9': [1920, 1080], '1x1': [1080, 1080], '4x5': [1080, 1350] };
const [W, H] = FORMATOS[C.formato ?? '9x16'];
const FPS = C.fps ?? 30, OVERLAP = C.overlap ?? 0.3;
const GAP = C.compactar?.pausa ?? 0.62, RESPIRO = C.compactar?.respiro ?? 0.3;
const ZOOM = C.zoom ?? [1.06, 1.16];
const fr = (s) => Math.round(s * FPS);
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');

// Transcripciones normalizadas por scripts/transcribir.mjs: { words: [{ text, start, end }] }
const cache = {};
const palabras = (clip) => {
  if (cache[clip]) return cache[clip];
  const f = path.join(dir, 'transcripts', clip.replace(/\.[^.]+$/, '') + '.json');
  if (!existsSync(f)) throw new Error(`Falta la transcripción de ${clip}: corre scripts/transcribir.mjs`);
  return (cache[clip] = JSON.parse(readFileSync(f, 'utf8')).words.map(w => {
    // Whisper estira la palabra anterior a una pausa y deja algunas en duración cero: se corrige para medir huecos reales.
    const effEnd = Math.max(Math.min(w.end, w.start + 0.5), w.start + 0.09);
    return { ...w, effEnd };
  }));
};
const corregir = C.corregir ?? {};
const textoCorregido = (t) => {
  const limpio = t.trim();
  const clave = Object.keys(corregir).find(k => norm(k) === norm(limpio));
  return clave ? limpio.replace(new RegExp(clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), corregir[clave]) : limpio;
};

// 0. Aviso: una parte no debe empezar ni terminar a mitad de una palabra.
for (const p of C.partes) for (const t of [p.desde, p.hasta]) {
  const w = palabras(p.clip).find(x => t > x.start + 0.03 && t < x.end - 0.03);
  if (w) console.warn(`⚠ «${p.label}» corta la palabra «${w.text.trim()}» (${w.start.toFixed(2)}–${w.end.toFixed(2)} s) en ${t} s: mueve el corte antes o después`);
}

// 1. Partes → sub-tomas (compactado de pausas).
const subtomas = [];
C.partes.forEach((p, ip) => {
  const ws = palabras(p.clip).filter(w => w.end > p.desde && w.start < p.hasta);
  const tramos = [[p.desde, null]];
  for (let i = 1; i < ws.length; i++) {
    const hueco = ws[i].start - ws[i - 1].effEnd;
    if (hueco >= GAP && C.compactar?.activo !== false) {
      tramos.at(-1)[1] = ws[i - 1].effEnd + RESPIRO / 2;
      tramos.push([ws[i].start - RESPIRO / 2, null]);
    }
  }
  tramos.at(-1)[1] = p.hasta;
  const total = tramos.reduce((s, [a, b]) => s + (b - a), 0);
  const [z0, z1] = ip % 2 === 0 ? ZOOM : [ZOOM[1], ZOOM[0]];
  let acum = 0;
  tramos.forEach(([a, b], it) => {
    const d = b - a;
    const sFrom = z0 + (z1 - z0) * (acum / total), sTo = z0 + (z1 - z0) * ((acum + d) / total);
    acum += d;
    const caps = ws.filter(w => w.end > a && w.start < b).map((w, k) => ({
      text: (k === 0 ? '' : ' ') + textoCorregido(w.text),
      startMs: Math.round(Math.max(0, w.start - a) * 1000), endMs: Math.round((Math.min(w.end, b) - a) * 1000),
      timestampMs: Math.round(((Math.max(w.start, a) + Math.min(w.end, b)) / 2 - a) * 1000), confidence: null,
    }));
    subtomas.push({ clip: p.clip, start: +a.toFixed(3), dur: +d.toFixed(3), scaleFrom: +sFrom.toFixed(4), scaleTo: +sTo.toFixed(4),
      gain: p.gain ?? 1, label: tramos.length > 1 ? `${p.label}-${it + 1}` : p.label, parte: p.label, hard: it > 0, captions: caps });
  });
});

// 2. Línea de tiempo: igual que VideoEdit.tsx (fundido entre partes, corte seco entre sub-tomas).
let cursor = 0;
const linea = subtomas.map((s, i) => {
  const durF = fr(s.dur), from = cursor, next = subtomas[i + 1];
  cursor += durF - (next && !next.hard ? fr(OVERLAP) : 0);
  return { ...s, from, durF };
});
const totalFrames = linea.reduce((m, t) => Math.max(m, t.from + t.durF), 0);

// 3. Overlays anclados a palabras: { parte, palabra, n } → frame absoluto.
const frameDe = ({ parte, palabra, n = 1, dt = 0 }) => {
  const p = C.partes.find(x => x.label === parte);
  if (!p) throw new Error(`Overlay: no existe la parte «${parte}»`);
  const hits = palabras(p.clip).filter(w => w.start >= p.desde && w.start < p.hasta && norm(w.text).startsWith(norm(palabra)));
  if (!hits[n - 1]) throw new Error(`Overlay: «${palabra}» (${n}) no aparece en la parte «${parte}»`);
  const t = hits[n - 1].start;
  const s = linea.find(x => x.parte === parte && t >= x.start && t < x.start + x.dur) ?? linea.find(x => x.parte === parte && x.start > t);
  return s.from + fr(Math.max(0, t - s.start) + dt);
};
const overlays = (C.overlays ?? []).map(o => {
  const from = frameDe(o.en);
  const props = { ...(o.props ?? {}) };
  if (o.kind === 'pills') props.delays = (o.items_en ?? []).map(a => frameDe(a) - from);
  if (o.kind === 'ledger') props.rows = (props.rows ?? []).map(r => ({ ...r, at: r.en ? frameDe(r.en) - from : r.at ?? 0 }));
  if (o.kind === 'ledger' && props.total_en) props.totalAt = frameDe(props.total_en) - from;
  // Cualquier overlay puede anclar varios momentos internos: anclas { clave: { parte, palabra, n } } → props.at { clave: frame relativo }.
  if (o.anclas) props.at = Object.fromEntries(Object.entries(o.anclas).map(([k, a]) => [k, frameDe(a) - from]));
  // Duración fija (dur, en s) o hasta otra palabra (hasta: { parte, palabra, n, dt }).
  const dur = o.hasta ? frameDe(o.hasta) - from : fr(o.dur ?? 3);
  return { kind: o.kind, from, dur, props };
});

// 4. Texto en movimiento (estilo aprobado): cortes.json → frases: [{ parte, lineas: [{ t, s: "s"|"m"|"xl", em?, tono?, en }] }].
// Cada línea entra cuando se dice su palabra `en` ("palabra" o { palabra, n, parte, dt }). Si la frase no trae `hasta`,
// termina 2 frames antes de la siguiente y nunca cruza la transición al final de su parte.
const frases = (C.frases ?? []).map((f) => {
  const anc = f.lineas.map((l) => {
    const e = typeof l.en === 'string' ? { palabra: l.en } : (l.en ?? {});
    if (!e.palabra) throw new Error(`Frase «${l.t}»: falta \`en\` (la palabra que la dispara)`);
    return { parte: e.parte ?? f.parte, palabra: e.palabra, n: e.n ?? 1, dt: e.dt ?? -0.04 };
  });
  const from = frameDe(anc[0]);
  return { f, from, parte: anc.at(-1).parte, at: Object.fromEntries(anc.map((a, i) => [`l${i}`, frameDe(a) - from])) };
});
frases.forEach((x, i) => {
  let fin;
  if (x.f.hasta) fin = frameDe(x.f.hasta);
  else {
    const ult = linea.filter((s) => s.parte === x.parte).at(-1);
    fin = ult.from + ult.durF - (ult === linea.at(-1) ? 0 : fr(OVERLAP));
    if (frases[i + 1]) fin = Math.min(fin, frases[i + 1].from - 2);
  }
  overlays.push({ kind: 'frase', from: x.from, dur: Math.max(1, fin - x.from), props: { lines: x.f.lineas.map(({ en, ...l }) => l), at: x.at } });
});
const fr_ = overlays.filter((o) => o.kind === 'frase').sort((a, b) => a.from - b.from);
fr_.slice(1).forEach((o, i) => { if (o.from < fr_[i].from + fr_[i].dur) console.warn(`⚠ La frase «${o.props.lines[0].t}» empieza antes de que salga la anterior`); });

const salida = { croma: !!C.croma, encuadre: C.encuadre ?? null, fps: FPS, overlap: OVERLAP, width: W, height: H, keywords: (C.keywords ?? []).map(k => k.toUpperCase()), totalFrames,
  branding: C.branding ?? { logo: 'logo.png' }, overlays, segments: subtomas.map(({ parte, ...s }) => s) };
writeFileSync(path.join(dir, 'src', 'edit-data.json'), JSON.stringify(salida, null, 2));

// Resumen para revisar antes de renderizar.
const original = C.partes.reduce((s, p) => s + (p.hasta - p.desde), 0);
const conservado = subtomas.reduce((s, x) => s + x.dur, 0);
console.log(`${C.partes.length} partes · ${subtomas.length} tomas (${subtomas.filter(s => s.hard).length} cortes secos) · ${(totalFrames / FPS).toFixed(1)} s · se recortaron ${(original - conservado).toFixed(1)} s de pausas`);
for (const t of linea) console.log(`  ${(t.from / FPS).toFixed(2).padStart(6)} s  ${t.hard ? '│' : '╪'} ${t.label.padEnd(14)} ${t.clip} ${t.start.toFixed(2)}–${(t.start + t.dur).toFixed(2)}  «${t.captions.map(c => c.text).join('').trim().slice(0, 60)}»`);
for (const o of [...overlays].sort((a, b) => a.from - b.from))
  console.log(`  ${o.kind === 'frase' ? 'texto  ' : 'overlay'} ${(o.from / FPS).toFixed(2).padStart(6)} s (${(o.dur / FPS).toFixed(1)} s) ${o.kind === 'frase' ? '«' + o.props.lines.map((l) => l.t).join(' / ') + '»' : o.kind}`);
