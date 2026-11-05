# Zonas seguras — video vertical 1080×1920

Investigación del 26-10-2026, con fuentes oficiales de Meta y con las plantillas de TikTok y Google medidas por
terceros. El código está en `plantilla/src/zonas.ts` y lo usan el texto en movimiento, los gráficos, el logo y la
placa final. **Diseñamos con el criterio de anuncios, que es el más estricto**, para que la misma pieza sirva en
orgánico y en pauta.

## Zona segura combinada (TikTok + Reels de IG/FB + Stories + YouTube Shorts)
| Lado | Margen | Qué tapa la interfaz |
|---|---|---|
| Arriba | **288 px** | Pestañas «Siguiendo/Para ti», perfil y etiqueta «Publicidad» (YouTube 288; Meta 14 % = 269; TikTok 240) |
| Abajo | **672 px**, es decir, nada crítico debajo de **y = 1248** | Descripción, audio, nombre y botón del anuncio (Meta 35 %; con aviso legal 40 % = 768) |
| Izquierda | **120 px** | Borde de TikTok |
| Derecha | **192 px**, y **300 px desde y = 840** | Botones de YouTube; columna de like, comentar y compartir de TikTok |

Rectángulo seguro: **(120, 288) → (888, 1248)**. Desde y = 840 el borde derecho es x = 780.

**Zonas de cuidado:**
- **y 1248–1540:** visible en orgánico con descripción corta, pero se tapa en anuncios, con la descripción
  expandida o con el ancla de TikTok. Solo para lo que puede taparse sin perder el mensaje.
- **y 210–288:** visible en orgánico, pero la tapa la etiqueta de los anuncios.

**Recorte de la cuadrícula del perfil de Instagram:** es 3:4 desde enero de 2025. Se ve **y 240 → 1680**, y la
zona segura entra completa.

## Dónde va cada cosa
| Elemento | Posición |
|---|---|
| Gráficos y títulos de la franja superior | y 288 → ~560, x 120 → 888 (centro x = 504) |
| Cara del presentador (plano medio) | coronilla ≈ y 540–600, ojos ≈ y 700–860 |
| Texto en movimiento de la voz | bloque alineado a la izquierda desde x = 120, de ~660 px de ancho, **entre y = 900 y y = 1248**. y = 900 queda debajo del mentón en un plano medio (`ZONA.textoTope`). Las líneas m/xl que no caben a buen tamaño se parten solas en dos barras, y si el bloque sigue siendo alto se reduce hasta un 70 %. Conviene que cada frase tenga como mucho 2 o 3 barras: si son más, se parte en dos frases (si no, el texto tapa la cara) |
| Logo del cierre | desde y ≈ 300; botón de CTA debajo (y ≈ 490) |
| Placa final | centrada en la zona segura (x ≈ 450), entre y 700 y 1200 |
| Capa inferior (degradado) | cubre hasta ~y 800 para dar contraste al texto que vive entre y 1000 y 1248 |

## Verificación
`VideoEdit` acepta `guias: true`, que pinta en rojo lo que tapa la interfaz. Hay que revisar stills con
`--props='{"guias":true}'`, o con `PROPS` en `out/stills.mjs`, antes de cada render final.

## Fuentes principales
- Meta Ads Guide, Reels y Stories (14 % arriba, 35 % abajo, 6 % a los lados): facebook.com/business/ads-guide/update/video/instagram-reels
- TikTok, plantillas de In-Feed Ads (medidas por Adkit, 10-09-2026): ads.tiktok.com/help/article/tiktok-auction-in-feed-ads
- Google Ads, video vertical (YouTube 288/672/48/192): support.google.com/google-ads/answer/9128498
- Kapwing y Oktopost, cuadrícula 3:4 de Instagram (2025)
