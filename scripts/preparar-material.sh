#!/usr/bin/env bash
# Prepara lo grabado con el celular para editar: hoja de contacto, niveles y silencios de cada archivo, y un proxy
# en el formato del video (rotación horneada, 30 fps, audio limpio y parejo) en proyectos/<nombre>/public/videos/.
# Sin color grade (el color original del celular se respeta por defecto). Si el celular grabó en HDR (iPhone: HLG/Dolby
# Vision; también PQ), lo convierte a SDR Rec.709 con mapeo de tonos: sin eso la imagen sale lavada y la piel pálida.
# Uso (desde la raíz del repo): bash scripts/preparar-material.sh <nombre> [9x16|16x9|1x1|4x5]
set -euo pipefail
cd "$(dirname "$0")/.."
NOMBRE="$1"; FORMATO="${2:-9x16}"
case "$FORMATO" in 9x16) W=1080; H=1920;; 16x9) W=1920; H=1080;; 1x1) W=1080; H=1080;; 4x5) W=1080; H=1350;; *) echo "formato no válido"; exit 1;; esac
ORIG="material/$NOMBRE"; P="proyectos/$NOMBRE"; mkdir -p "$P/public/videos" "$P/analisis"
shopt -s nullglob nocaseglob
for f in "$ORIG"/*.{mov,mp4,m4v}; do
  b=$(basename "${f%.*}")
  echo "── $b"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate:format=duration:stream_side_data=rotation -of default=nw=1 "$f" | tr '\n' ' '; echo
  # HDR → SDR (Hable sin desaturar: verificado el 26-10-2026 midiendo piel y blancos)
  trc=$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of default=nw=1:nk=1 "$f" | head -1 | tr -d '\r,')
  case "$trc" in
    arib-std-b67|smpte2084)
      SDR="zscale=tin=$trc:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
      echo "HDR ($trc): se convierte a SDR";;
    *) SDR="";;
  esac
  ffmpeg -v error -y -i "$f" -vf "${SDR}fps=1/4,scale=160:-1,tile=6x5" -frames:v 1 "$P/analisis/$b-hoja.jpg"
  ffmpeg -i "$f" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" | tr -s ' ' | tr '\n' ' '; echo
  n=$(ffmpeg -i "$f" -af silencedetect=noise=-30dB:d=0.6 -f null - 2>&1 | grep -c silence_end || true); echo "pausas de más de 0,6 s: $n"
  ffmpeg -v error -y -i "$f" \
    -vf "${SDR}scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,setsar=1" \
    -r 30 -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -af "highpass=f=90,afftdn=nf=-25,dynaudnorm=f=300:g=11:m=25:p=0.9,loudnorm=I=-16:TP=-1.5:LRA=11" \
    -c:a aac -b:a 160k -movflags +faststart "$P/public/videos/$b.mp4"
done
echo "Listo: hojas de contacto en $P/analisis/ y proxies en $P/public/videos/"
