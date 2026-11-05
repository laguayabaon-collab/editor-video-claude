# Estilo por defecto

Aplicar en todo video; solo desviarse si el usuario lo pide. Todo esto ya viene en `plantilla/`, y
`plantilla/cortes.ejemplo.json` es un video real hecho con este estilo.

> Los subtítulos clásicos con la palabra activa resaltada se probaron y se descartaron por verse anticuados. No
> volver a ellos salvo pedido explícito.

## Texto en movimiento en lugar de subtítulos (`Kinetic.tsx`, estilo «etiquetas»)
- **No hay subtítulos clásicos ni palabra activa resaltada.** Cada frase de la voz se convierte en un bloque de
  texto en movimiento (`frases` en `cortes.json`) que cubre TODA la voz, con las palabras exactas, partidas en líneas.
- Jerarquía por línea: `s` (≈42 px, contexto) · `m` (≈62 px) · `xl` (≈96 px, la idea fuerte; se ajusta al ancho).
  Una o dos líneas `xl` por frase como máximo. `em` = palabra destacada; `tono: "alerta"` para lo que se advierte
  (comisión, dinero perdido, error).
- Cada línea va sobre una **barra que barre desde la izquierda** y el texto sube con ella:
  - líneas `s` y `m`: barra crema (`crema`), texto en el color oscuro de la marca y la palabra `em` en el color primario;
  - líneas `xl`: barra del color primario y texto blanco, o barra de alerta si `tono: "alerta"`.
- Tipografía: **Plus Jakarta Sans** 700/800, interletrado negativo en las grandes. Alineado a la izquierda, margen
  de 80 px, borde inferior a 360 px (zona segura de reels).
- Cada línea entra **cuando se dice su palabra `en`** (−0,04 s). La barra arranca 3 frames antes y el texto 1 frame
  antes: así el texto no llega tarde a la voz.
- Salida del bloque: las líneas se van a la izquierda con fundido en 7 frames. `armar-edicion.mjs` cierra cada
  frase 2 frames antes de la siguiente y nunca la deja cruzar una transición entre partes.
- Las otras dos direcciones que se compararon («editorial», con serif itálica, e «impacto», centrado palabra a palabra)
  siguen en `Kinetic.tsx` como `textStyle`, pero NO son las aprobadas.

## Zonas seguras (obligatorio)
- Todo lo crítico va dentro de **(120, 288) → (888, 1248)** y, desde y = 840, a la izquierda de x = 780 (columna
  de botones de TikTok). Detalle y fuentes en `references/zonas-seguras.md`; las constantes, en `plantilla/src/zonas.ts`.
- El texto en movimiento termina en y = 1248 (no más abajo) y mide ~660 px de ancho; los gráficos van en la
  franja y 288–560; la cara entre los dos. Se revisa con `guias: true` antes de cada render.

## Pantalla verde (`croma: true`)
- `scripts/croma.py` recorta el verde midiendo cuánto domina (g − max(r, b)), no por distancia de color: funciona con
  pantallas pálidas sin comerse la piel. Saca un WebM con alfa; su transcripción se copia con el mismo nombre.
- El presentador va sobre el fondo de marca animado (`FondoMarca`) y, mientras la voz habla de algo, sobre una toma
  generada (`kind: "fondo"`) con un velo del color oscuro de la marca. `encuadre` acerca el plano abierto.
- Tomas de fondo: video propio, de stock con licencia o generado con la herramienta de video con IA que tengas.
  Sin caras reconocibles ni texto legible, para que no compitan con el presentador.

## Capa inferior
- Degradado del color oscuro de la marca (`scrim: "marca"`): 92 % abajo → transparente al 36 % del alto. Da
  contraste al texto sin teñir la cara. Alternativas descartadas: degradado negro, panel de vidrio, sin capa.

## Movimiento de cámara y transiciones (`Clip.tsx`)
- **Punch-in** de +7 % en cada línea `xl`: entra en 4 frames, se sostiene ~0,8 s y vuelve en 10.
- **Transiciones entre partes con barrido vertical y desenfoque** (190 px, blur hasta 16 px, escala +20 % para que
  no se vean bordes) sobre el fundido de 0,3 s, con whoosh. Los empalmes internos de una toma siguen en corte seco.
- Ken Burns lento alternado por parte (1,06 ↔ 1,16) y viñeta sutil.

## Gráficos de la franja superior
- **Coherencia semántica (crítico):** el gráfico refuerza lo que dice la voz y nunca lo contradice. Si la voz advierte
  de un error, el gráfico muestra el error (✕, tachado, color de alerta), no el caso ideal.
- Viven en la franja superior (techo/pared), nunca sobre la cara. Tarjetas en el color oscuro de la marca al 86 %,
  Plus Jakarta Sans, entradas con `spring` y SFX (pop/click/whoosh).
- **Salida viva** (`SalidaViva` en `Cierre.tsx`, automática en la plantilla): en los últimos 10 frames el gráfico sube,
  se encoge y se desenfoca. Nada de fundidos planos.
- Infografías construidas palabra a palabra con `anclas` (varias palabras disparan pasos internos): ejemplos en
  `plantilla/referencias/Infografias-ejemplo.tsx` (sistemas sueltos que caen, hub que los conecta, barra de horario
  9–18 frente a 24 h, gráfica que se dibuja, contraste tachado).
- **Corte a pantalla completa** como B-roll tipográfico para la frase cumbre (p. ej. «24/7» gigante con anillo
  de 24 h y apertura en iris), cuando no hay B-roll filmado o generado.
- Paneles acumulativos (ledger, checklist) pueden durar más de 4 s si crecen línea a línea.

## Cierre
- Logo de la marca en tarjeta crema en la franja superior al entrar la parte `cierre`; botón de CTA verde con
  brillo debajo (`kind: "cta"`) cuando la voz invita a actuar.
- **Placa final** de 2 s: fondo oscuro de la marca con apertura en círculo, logo, botón del CTA y web
  (`branding.cta` en `cortes.json`). El CTA se confirma con el usuario en cada pieza.

## Colores
- Paleta por defecto (`plantilla/src/marca.ts`): primario `#2ea55f`, claro `#5dcaa5`, oscuro `#042a28`,
  alerta `#e0436a`, crema `#f7f5f0`. Para cada marca se cambian en `cortes.json → branding.colores` con su ficha
  (`marcas/<marca>/marca.md`).
- Color del footage: **original primero**, sin grade salvo pedido; si se propone, medir con `color-grade` y comparar
  contra el original.

## Audio
- Cadena del proxy: `highpass=f=90, afftdn=nf=-25, dynaudnorm=f=300:g=11:m=25:p=0.9, loudnorm=I=-16:TP=-1.5:LRA=11`.
- Final a −14 LUFS con pico de −1,5 dB (`scripts/normalizar.sh`). SFX sintetizados, sin música incrustada.

## Cómo decidir cambios de estilo
- Siempre con comparativa visual real: grid de stills etiquetados **y** una previa en movimiento lado a lado
  (el usuario juzga la animación, no solo el cuadro). Elegir con AskUserQuestion.
