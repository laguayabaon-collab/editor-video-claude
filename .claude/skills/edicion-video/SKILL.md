---
name: edicion-video
description: Pipeline completo para editar videos hablados (talking head, anuncios, reels 9:16, videos 16:9) desde lo grabado con el celular hasta el render final con Remotion. Analiza el material, transcribe con la API de Whisper (OpenAI) o ElevenLabs Scribe, elige las mejores tomas, compacta las pausas, agrega texto en movimiento sincronizado por palabra en lugar de subtítulos clásicos, gráficos, efectos de sonido y audio normalizado. Úsalo cuando el usuario pida editar un video, crear un reel o anuncio desde una grabación, agregar subtítulos o texto a un video, o convertir una grabación larga en un clip corto para redes.
---

# Edición de video con Claude Code

Convierte lo que se graba con el celular en un video terminado: reel o anuncio vertical, pieza de feed o video
horizontal. Trabaja dentro de este repositorio, con los scripts de `scripts/` y la plantilla Remotion de `plantilla/`.
Las rutas de esta skill son relativas a la raíz del repo.

**Antes de diseñar, lee siempre `references/estilo.md`:** es el estilo por defecto (texto en movimiento
«etiquetas», gráficos en la franja superior, cierre con CTA). Solo te desvías si el usuario lo pide.

**Skills complementarias** (si están instaladas): `remotion-*` (framework), `color-grade` (LUTs medidos).

## Reglas duras (no negociables)

1. **Nunca cortar dentro de una palabra.** Los cortes van en límites de palabra del transcript, con un margen de
   30–200 ms (los tiempos de Whisper se corren ~50–100 ms).
2. **La transcripción se guarda en caché.** `transcribir.mjs` no vuelve a transcribir si el video no cambió.
3. **Confirmar el plan antes de construir.** Mostrar el guion de cortes en texto (qué frases quedan, duración
   estimada) y esperar la aprobación, salvo que el usuario pida trabajar sin aprobaciones.
4. **Verificar con stills antes de renderizar** (`npx remotion still … --scale=0.5` en los momentos clave). El render
   completo va solo cuando los stills pasan.
5. **Audio:** el final queda a −14 LUFS con pico de −1,5 dB (`scripts/normalizar.sh`) y nunca satura.
6. **Las decisiones de estilo se toman viendo.** Nunca describir opciones de color o tipografía con palabras: generar
   stills etiquetados de las variantes reales y elegir con AskUserQuestion.
7. **Color original primero.** El material de celular bien expuesto no suele necesitar corrección. Solo se gradea si
   el usuario lo pide, midiendo (skill `color-grade`) y comparando siempre contra el original.
8. **Gráficos cortos y fieles a la voz:** 2–4 s en pantalla (un panel que crece paso a paso puede durar más). Cada
   gráfico se ancla a la palabra que lo dispara y dice lo mismo que la voz: si la voz advierte de un error, el
   gráfico muestra el error (✕), no el caso ideal (✓).
9. **Compactar siempre el aire muerto** (pausas y titubeos). Es la queja número uno de quien graba.
10. **Sin música incrustada** por defecto: se agrega en la plataforma al publicar.
11. **Zonas seguras:** nada crítico fuera de (120, 288) → (888, 1248) en 9:16, ni a la derecha de x = 780 desde
    y = 840. Detalle en `references/zonas-seguras.md`.
12. **No inventar datos:** precios, cifras y promesas de una marca salen de su ficha o del usuario.
13. **Revisar todo lo que se entrega** con la hoja de contacto (`scripts/hoja.sh`). Lo que no revisaste, no lo
    entregues.
14. **Llaves:** nunca pedirlas, escribirlas ni mostrarlas en el chat ni en archivos versionados. Viven en `.env`
    (ignorado por git) o en las variables de entorno.

## Fases

### 1. Proyecto
```bash
bash scripts/nuevo-proyecto.sh <nombre> [marca]
```
Crea `material/<AAAA-MM-DD-nombre>/` (ahí va lo grabado) y `proyectos/<AAAA-MM-DD-nombre>/` (proyecto Remotion con
la plantilla). Si hay ficha en `marcas/<marca>/`, copia su logo. Pregunta al usuario lo que el material no responde
(AskUserQuestion): tipo de video, destino y formato, texto del CTA y web, marca y colores.

### 2. Material
```bash
bash scripts/preparar-material.sh <AAAA-MM-DD-nombre> [9x16|16x9|1x1|4x5]
```
Por cada archivo hace la hoja de contacto (`analisis/`), el informe de niveles y pausas, y el proxy en
`public/videos/`: rotación horneada, 30 fps, audio limpio y parejo. Si el celular grabó en HDR (iPhone), lo
convierte a SDR Rec.709 con mapeo de tonos; sin eso la imagen sale lavada y la piel pálida.

**Mira las hojas de contacto con Read antes de decidir nada.**

### 3. Transcripción
```bash
node scripts/transcribir.mjs proyectos/<AAAA-MM-DD-nombre> [--scribe] [--idioma es]
```
Usa Whisper de OpenAI (`OPENAI_API_KEY`); con `--scribe`, ElevenLabs Scribe (`ELEVENLABS_API_KEY`), que además
separa hablantes. Deja `transcripts/<clip>.json` (palabras con tiempos) y un `.txt` con marcas de tiempo para leer.
Lee el texto completo y detecta falsos arranques, frases repetidas (elige la mejor toma), muletillas y pausas.

### 4. Guion de cortes (`cortes.json` del proyecto)
Ejemplo completo y comentado: `plantilla/cortes.ejemplo.json`.
- **`partes`:** `label`, `clip`, `desde` y `hasta` en límites de palabra (inicio de la primera − 0,1 s, fin de la
  última + 0,15 s). Estructura de anuncio: gancho → problema → solución → CTA → cierre; la parte del logo se llama
  `cierre`.
- **`corregir`:** nombres que la transcripción escribe mal (por ejemplo, `{"remoshon": "Remotion"}`).
- **`frases`:** toda la voz como texto en movimiento, con las palabras exactas partidas en líneas `s`/`m`/`xl`. Cada
  línea lleva `en` (la palabra que la dispara), `em` (la palabra destacada) y, si advierte algo, `tono: "alerta"`.
  Las salidas las calcula el script.
- **`overlays`:** gráficos de la franja superior, anclados con `{ "parte", "palabra", "n" }`. `anclas` encadena
  varios pasos de un mismo gráfico y `hasta` lo sostiene hasta otra palabra. Tipos: `contrast`, `pills`, `callout`,
  `ledger` y `cta`. Las infografías propias se agregan al `VideoEdit.tsx` del proyecto (ejemplos en
  `plantilla/referencias/Infografias-ejemplo.tsx`).
- **`branding`:** `cta` (texto y web del botón y de la placa final; confírmalo con el usuario) y `colores` (vacío =
  paleta por defecto).

Muestra al usuario el guion (qué frases quedan y la duración) y confírmalo antes de construir.

### 5. Armar
```bash
node scripts/armar-edicion.mjs proyectos/<AAAA-MM-DD-nombre>
```
Genera `src/edit-data.json` (nunca se edita a mano) e imprime la línea de tiempo. Compacta las pausas de más de
0,62 s con un corte seco dejando 0,3 s de respiro, alterna el zoom lento entre partes, calcula el frame de cada
gráfico y de cada línea de texto, y avisa si dos frases se solapan. Detalle del algoritmo en
`references/remotion.md`.

### 6. Verificar (desde la carpeta del proyecto)
```bash
npx tsc --noEmit
npx remotion still VideoEdit out/f.png --frame=N --scale=0.5
npx remotion still VideoEdit out/g.png --frame=N --scale=0.5 --props='{"guias":true}'   # zonas seguras
```
Stills del gancho, de cada gráfico, de una transición y del cierre. Míralos con Read.

### 7. Render y entrega
```bash
npx remotion render VideoEdit out/video.mp4
bash ../../scripts/normalizar.sh out/video.mp4 ../../exportados/<AAAA-MM-DD-nombre>/<nombre>-9x16.mp4
bash ../../scripts/hoja.sh ../../exportados/<AAAA-MM-DD-nombre>/<nombre>-9x16.mp4
```
Revisa la hoja completa con Read antes de entregar. Entrega el video junto con un `textos.md`: descripción para
cada red, hashtags, CTA y texto alternativo. Itera según los comentarios.

## Pantalla verde (opcional)
`python scripts/croma.py public/videos/<clip>.mp4 public/videos/<clip>-croma.webm --techo <filas> [--prueba out/p.png]`
saca un WebM con transparencia. Copia la transcripción como `<clip>-croma.json` y en `cortes.json` pon
`"croma": true`, el `encuadre` y, si quieres, tomas de fondo `kind: "fondo"`. Detalle en `references/estilo.md`.

## Referencias
- `references/estilo.md`: estilo por defecto (texto, gráficos, transiciones, cierre, colores, audio).
- `references/zonas-seguras.md`: márgenes de TikTok, Reels, Stories y Shorts, y dónde va cada cosa.
- `references/pipeline.md`: comandos ffmpeg probados (proxy, efectos de sonido, música opcional, verificación).
- `references/remotion.md`: arquitectura del proyecto Remotion y del armado.
