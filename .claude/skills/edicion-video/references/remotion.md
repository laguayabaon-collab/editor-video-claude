# Estructura del proyecto Remotion — patrón probado

La plantilla completa está en `plantilla/` y `scripts/nuevo-proyecto.sh` la copia en cada proyecto. Este
archivo resume su arquitectura.

## Scaffold
```bash
npx create-video@latest --yes --blank --no-tailwind NOMBRE
cd NOMBRE && npm i
npm i @remotion/media@VER @remotion/captions@VER @remotion/google-fonts@VER --save-exact
# VER = versión de remotion del package.json (deben coincidir exactas)
```
Reemplazar `src/index.css` (el blank trae `@import "tailwindcss"` roto sin Tailwind):
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #000; }
```

## Archivos
```
src/
├── edit-data.json    ← GENERADO por scripts/armar-edicion.mjs desde cortes.json (no a mano)
├── marca.ts          ← colores de la marca (branding.colores; si no, la paleta por defecto)
├── fonts.ts          ← Roboto (UI clásica) y Jakarta
├── Composition.tsx   ← <Composition id="VideoEdit" durationInFrames={EDIT_DURATION}>
├── VideoEdit.tsx     ← timeline: clips + frases + overlays (con SalidaViva) + SFX + branding + placa final
├── Clip.tsx          ← <Video> con trimBefore, Ken Burns, punch-in, barrido con desenfoque, capa inferior
├── Kinetic.tsx       ← TEXTO EN MOVIMIENTO (estilo aprobado «etiquetas»; también «editorial» e «impacto»)
├── Captions.tsx      ← capa inferior (ScrimLayer) y subtítulos clásicos (desactivados: capStyle="none")
├── Overlays.tsx      ← pills / contraste / callout / ledger (Jakarta + colores de marca)
├── Cierre.tsx        ← Cta, PlacaFinal y SalidaViva
└── Branding.tsx      ← logo del cierre
referencias/Infografias-ejemplo.tsx ← infografías con anclas (sistemas, hub, horario, 24/7 a pantalla completa, gráfica)
```

## edit-data.json (generado por scripts/armar-edicion.mjs)
```json
{ "fps": 30, "overlap": 0.3, "width": 1080, "height": 1920,
  "keywords": ["WHATSAPP", "..."],
  "segments": [{ "clip|start": "...", "trim/start": 0, "dur": 0,
    "scaleFrom": 1.12, "scaleTo": 1.16, "gain": 1.0, "label": "hook",
    "captions": [{ "text": " palabra", "startMs": 0, "endMs": 0, "timestampMs": 0, "confidence": null }] }] }
```
- `captions` en formato `Caption` oficial, ms RELATIVOS al inicio del segmento.
- El script normaliza marcas/nombres que Whisper transcribe mal (mapa fixWord)
  y mantiene capitalización natural.

## Timeline con crossfade (VideoEdit.tsx)
```ts
const OVERLAP = Math.round(data.overlap * FPS);
let cursor = 0;
const timeline = segments.map((seg, i) => {
  const durF = Math.round(seg.dur * FPS);
  const from = cursor;
  cursor += durF - (i < segments.length - 1 ? OVERLAP : 0);
  return { seg, durF, from };
});
```
Cada Clip hace su propio fade in/out (opacity + volumen con la MISMA curva,
usando la duración del solape) → crossfade audiovisual sin pops.

## Cues de overlays generadas (no hardcodear frames)

El script generador calcula la timeline completa y emite las cues ya en frames
absolutos, ancladas a palabras del transcript:

```js
const srcToFrame = (tr, t) => { /* busca la sub-toma que contiene t */ };
const wordFrame  = (tr, palabra, nth) => srcToFrame(tr, hits[nth].start);
overlays: [{ kind, from: wordFrame("3796","7",1), dur, props }]
```

`VideoEdit.tsx` sólo mapea `kind → componente`. Ventaja: si cambian los cortes
(compactado, tomas distintas), los overlays se re-sincronizan solos. Nunca
escribir offsets a mano como `seg.from + s(5.7)`.

## Claves aprendidas
- `<Video trimBefore={frames}>` de `@remotion/media` para recortar.
- Volumen por función: `volume={(f) => gain * interpolate(f, ...)}`.
- Overlays como `<Sequence>` HERMANOS de los clips (no hijos): tienen su propio
  fade porque no heredan el crossfade. SFX = `<Sequence><Audio/></Sequence>`
  alineados al frame del overlay.
- La capa inferior (ScrimLayer) va DENTRO de Clip; el texto en movimiento son
  cues `frase` hermanas, encima. Las frases nacen de `cortes.json → frases`
  (formato corto) y armar-edicion.mjs les calcula entradas y salidas.
- Overlays con varios pasos: `anclas` { clave: { parte, palabra, n } } → `props.at`
  en frames relativos; `hasta` fija la duración hasta otra palabra.
- Props de variante en VideoEdit (`textStyle`, `scrim`, `capStyle`) permiten
  comparar estilos con renderStill/renderMedia y un solo bundle (ver previews en
  el proyecto de referencia, `out/comparativa*.mjs`).
- Stills de verificación: `--scale=0.5` es rápido; elegir frames con subtítulo
  + overlay visibles.
- tsconfig ya trae esModuleInterop: importar JSON directo funciona.
- Junction de Windows en public/ rompe el bundler (EPERM symlink) → copiar o
  transcodificar los archivos reales.

## Iteración con el usuario
1. Stills de momentos clave → mostrar ANTES del primer render completo.
2. Cambios de estilo: renderizar variantes del MISMO frame y comparar en grid.
3. Render completo (~1.5-2.5 min para 32 s) solo tras aprobar stills.
4. Entregar el video con su hoja de contacto. Documentar las decisiones nuevas del usuario.
