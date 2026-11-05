#!/usr/bin/env bash
# Hoja de contacto de un video (un cuadro cada N segundos) para revisarlo de un vistazo antes de entregar.
# Uso: bash scripts/hoja.sh video.mp4 [segundos=1] [salida.jpg]
set -euo pipefail
IN="$1"; CADA="${2:-1}"; OUT="${3:-${IN%.*}-hoja.jpg}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
N=$(awk -v d="$DUR" -v c="$CADA" 'BEGIN{n=int(d/c)+1; print (n<1?1:n)}')
COLS=$(( N < 10 ? N : 10 )); FILAS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -i "$IN" -vf "fps=1/$CADA,scale=216:-1,tile=${COLS}x${FILAS}" -frames:v 1 "$OUT"
echo "$OUT ($N cuadros, $DUR s)"
