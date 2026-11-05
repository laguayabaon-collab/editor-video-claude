# Editor de video con Claude Code

Este repo convierte lo que se graba con el celular en videos terminados: reels y anuncios verticales, piezas de feed
y videos horizontales para YouTube o la web. Claude hace la edición con los scripts de `scripts/` y la plantilla
Remotion de `plantilla/`.

Si el entorno todavía no está instalado (Node, ffmpeg, la llave de OpenAI), sigue primero `INSTALL.md`.

## Qué produce
| Uso | Formato | Duración |
|---|---|---|
| Reel, TikTok, Stories, anuncio | 9:16 (1080×1920) | 15–60 s |
| Feed de Instagram o Facebook | 4:5 (1080×1350) o 1:1 (1080×1080) | 15–60 s |
| YouTube, web, demo | 16:9 (1920×1080) | 1–5 min |

## Estructura
```
CLAUDE.md                    estas instrucciones
INSTALL.md                   instalación paso a paso (para un agente o una persona)
GRABAR-CON-EL-CELULAR.md     guía para quien graba (compártela si el material llega mal)
.claude/skills/edicion-video skill con el flujo completo, el estilo y las referencias
.env.example                 nombres de las llaves (cópialo como .env; .env nunca se sube)
material/<fecha-nombre>/     lo grabado, tal cual sale del celular (+ notas.md con el encargo)
proyectos/<fecha-nombre>/    un proyecto Remotion por video (lo crea scripts/nuevo-proyecto.sh)
  cortes.json                lo que decide Claude: partes, frases (texto en movimiento), gráficos, CTA, correcciones
  public/videos/             proxies listos para editar
  transcripts/               transcripción por palabra de cada clip
  src/edit-data.json         GENERADO por scripts/armar-edicion.mjs; nunca se edita a mano
plantilla/                   proyecto Remotion base (Clip, Kinetic, Overlays, Cierre, VideoEdit…)
marcas/<marca>/              ficha de marca (marca.md) y logos; _plantilla/ para marcas nuevas
assets/                      efectos de sonido y LICENCIAS.md
exportados/<fecha-nombre>/   los videos terminados, con su textos.md
scripts/                     herramientas del flujo
```
`material/`, `proyectos/`, `exportados/` y las fichas de `marcas/` están en `.gitignore`: el trabajo de cada usuario
no se sube al repo.

## Flujo
Carga siempre la skill **`edicion-video`** al empezar un video y lee su `references/estilo.md`. En resumen:

1. **Proyecto:** `bash scripts/nuevo-proyecto.sh <nombre> [marca]`.
2. **Material:** el usuario deja lo grabado en `material/<fecha-nombre>/`. Luego:
   `bash scripts/preparar-material.sh <fecha-nombre> [9x16|16x9|1x1|4x5]`. Mira las hojas de contacto con Read.
3. **Transcripción:** `node scripts/transcribir.mjs proyectos/<fecha-nombre> [--scribe] [--idioma es]`.
4. **Guion de cortes:** arma `cortes.json` (ejemplo completo en `plantilla/cortes.ejemplo.json`). Muéstrale al
   usuario qué frases quedan y la duración, y confírmalo antes de construir.
5. **Armar:** `node scripts/armar-edicion.mjs proyectos/<fecha-nombre>`.
6. **Verificar:** desde la carpeta del proyecto, `npx tsc --noEmit` y stills en los momentos clave. Revisa las zonas
   seguras con `--props='{"guias":true}'`.
7. **Render y entrega:**
   - `npx remotion render VideoEdit out/video.mp4`;
   - `bash ../../scripts/normalizar.sh out/video.mp4 ../../exportados/<fecha-nombre>/<nombre>-9x16.mp4`, que deja
     −14 LUFS;
   - `bash ../../scripts/hoja.sh <final>`, y revisa la hoja completa antes de entregar.

## Estándar de calidad
- **Nunca cortar dentro de una palabra.**
- **Compactar siempre el aire muerto y los titubeos.**
- **Texto en movimiento siempre** en las piezas para redes, porque la mayoría se ve sin sonido. Va en estilo
  «etiquetas», nunca en subtítulos clásicos con la palabra activa resaltada.
- **Zonas seguras:** nada crítico fuera de (120, 288) → (888, 1248), ni a la derecha de x = 780 desde y = 840.
- **Cada gráfico dice lo mismo que la voz**, dura de 2 a 4 s y va en la franja superior, nunca sobre la cara.
- **HDR del iPhone:** `preparar-material.sh` lo convierte a SDR. Sin eso, la imagen sale lavada.
- **Color original del celular** por defecto. Solo se gradea si el usuario lo pide.
- **Audio:** −14 LUFS con pico de −1,5 dB, y nunca satura.
- **Revisar con stills y hojas de contacto** todo lo que se entrega.
- **No inventar datos:** precios, cifras y promesas salen de la ficha de la marca o del usuario.
- **Música:** por defecto no se incrusta; se agrega en la plataforma al publicar.

## Reglas
- **Llaves:** nunca pedirlas, escribirlas ni mostrarlas en el chat ni en archivos versionados. Viven en `.env` (en
  `.gitignore`) o en las variables de entorno.
- **Grabaciones:** son de quien graba o de su cliente. No se publican ni se comparten sin su permiso.
- **Personas y datos:** no sale en un video nadie que no haya aceptado aparecer, ni datos personales (teléfonos,
  correos, conversaciones reales).
- **Publicación:** publicar en redes, en anuncios o en la web requiere la aprobación del usuario. Este flujo deja
  los videos listos, no los publica.
