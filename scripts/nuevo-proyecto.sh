#!/usr/bin/env bash
# Crea un proyecto de edición nuevo a partir de la plantilla: proyectos/<AAAA-MM-DD-nombre>/ con Remotion listo,
# su cortes.json de ejemplo y la carpeta material/<mismo nombre>/ donde va lo grabado.
# Uso (desde la raíz del repo): bash scripts/nuevo-proyecto.sh <nombre> [marca]
set -euo pipefail
cd "$(dirname "$0")/.."
NOMBRE="$(date +%Y-%m-%d)-$1"; MARCA="${2:-}"
P="proyectos/$NOMBRE"
[ -e "$P" ] && { echo "Ya existe $P"; exit 1; }
mkdir -p "material/$NOMBRE" "$P"
cp -r plantilla/. "$P/"
rm -rf "$P/node_modules" "$P/out"
cp assets/sfx/*.mp3 "$P/public/"
# Logo de la marca (marcas/<marca>/logos/logo.png). Sin marca, queda el logo de muestra de la plantilla.
[ -n "$MARCA" ] && [ -f "marcas/$MARCA/logos/logo.png" ] && cp "marcas/$MARCA/logos/logo.png" "$P/public/logo.png"
# CTA del cierre: se completa en cortes.json con el texto y la web de la marca (confirmarlo con el usuario en cada pieza).
CTA_T=""; CTA_W=""
cat > "$P/cortes.json" <<EOF
{
  "marca": "$MARCA",
  "formato": "9x16",
  "keywords": [],
  "corregir": {},
  "branding": { "logo": "logo.png", "cta": { "texto": "$CTA_T", "web": "$CTA_W" }, "colores": {} },
  "partes": [
    { "label": "hook", "clip": "IMG_0001.mp4", "desde": 0.0, "hasta": 3.0 },
    { "label": "cierre", "clip": "IMG_0001.mp4", "desde": 3.0, "hasta": 6.0 }
  ],
  "frases": [],
  "overlays": []
}
EOF
echo '{"fps":30,"overlap":0.3,"width":1080,"height":1920,"keywords":[],"totalFrames":1,"branding":{"logo":"logo.png"},"overlays":[],"segments":[]}' > "$P/src/edit-data.json"
(cd "$P" && npm install --no-audit --no-fund --loglevel=error)
echo "Proyecto listo: $P · deja lo grabado en material/$NOMBRE/"
