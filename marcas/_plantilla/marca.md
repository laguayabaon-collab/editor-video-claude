# <Marca> — ficha de marca para video

Copia esta carpeta como `marcas/<marca-en-minusculas>/` y completa los datos antes del primer video de una marca.

## Logos (`logos/`)
| Archivo | Uso |
|---|---|
| `logo.png` | Logo principal con fondo transparente (se usa en el cierre) |
| `badge.png` | Opcional: sello, certificación o partner |

## Colores (van a `cortes.json → branding.colores`)
| Clave | Hex | Uso en video |
|---|---|---|
| `primario` | `#` | Barras grandes del texto en movimiento, palabra destacada, botón del CTA |
| `claro` | `#` | Variante clara del primario (degradados y detalles) |
| `oscuro` | `#` | Capa inferior, tarjetas de los gráficos y placa final (debe dar buen contraste con blanco) |
| `alerta` | `#` | Lo que se advierte o se evita (comisiones, errores) |
| `crema` | `#` | Barras de las líneas pequeñas y tarjeta del logo (casi blanco) |

## Tipografía
- Texto en movimiento y gráficos: Plus Jakarta Sans (estilo aprobado). Solo se cambia si el cliente exige la suya; en ese caso se carga en `Kinetic.tsx`, `Overlays.tsx` y `Cierre.tsx`.
- Placas: 

## CTA del cierre (`cortes.json → branding.cta`)
- Texto del botón: 
- Web o canal: 

## Personas y nombres (para corregir la transcripción)
- 

## Tono y CTA
- 

## Qué no decir
- Promesas, precios o datos que el cliente no haya confirmado.
