#!/usr/bin/env bash
# Normaliza el audio de un video a -14 LUFS (redes y web) en dos pasadas, sin recodificar la imagen.
# Uso: scripts/normalizar.sh entrada.mp4 salida.mp4
set -euo pipefail
ent="$1"; sal="$2"
med=$(ffmpeg -hide_banner -i "$ent" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$med" | grep "\"$1\"" | sed -E 's/.*: "([^"]+)".*/\1/'; }
ffmpeg -hide_banner -v error -y -i "$ent" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart "$sal"
ffmpeg -hide_banner -i "$sal" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
