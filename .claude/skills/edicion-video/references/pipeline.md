# Pipeline ffmpeg — comandos probados

## Proxy vertical (desde MOV/MP4 de celular)
La rotación del celular viene como metadato; ffmpeg auto-rota al decodificar.
El proxy hornea la rotación, unifica fps y procesa el audio. SIN color grade
por defecto.

```bash
ffmpeg -y -i "ORIGINAL.MOV" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" \
  -r 30 -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p \
  -af "highpass=f=90,afftdn=nf=-25,dynaudnorm=f=300:g=11:m=25:p=0.9,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:a aac -b:a 160k -movflags +faststart \
  public/source.mp4
```
- `dynaudnorm` es CLAVE cuando hay secciones con niveles muy distintos (ej.
  micro apagado al inicio: −44 dB vs −20 dB del resto → queda parejo).
- Para varios clips (montaje multiclip), transcodificar cada uno igual a
  `public/videos/` (no usar junctions de Windows: el bundler de Remotion falla
  con EPERM al copiarlas como symlink).
- Verificar niveles por segmento:
```bash
ffmpeg -ss INICIO -to FIN -i public/source.mp4 -af volumedetect -f null - 2>&1 | grep mean_volume
```

## SFX sintetizados (libres de derechos)
```bash
# Pop (overlays)
ffmpeg -y -f lavfi -i "sine=frequency=820:duration=0.12" \
  -af "vibrato=f=8:d=0.3,afade=t=in:st=0:d=0.008,afade=t=out:st=0.05:d=0.07,volume=0.9" \
  -ac 2 -ar 48000 public/pop.mp3
# Click UI (botones de mockup)
ffmpeg -y -f lavfi -i "anoisesrc=d=0.05:c=white:a=0.5" \
  -af "bandpass=f=2400:w=800,afade=t=in:st=0:d=0.004,afade=t=out:st=0.015:d=0.035,volume=0.8" \
  -ac 2 -ar 48000 public/click.mp3
# Whoosh (transiciones)
ffmpeg -y -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.6:r=48000" \
  -af "flanger=delay=5:depth=8:speed=2,highpass=f=250,lowpass=f=5000,afade=t=in:st=0:d=0.10,afade=t=out:st=0.24:d=0.26,volume=0.8" \
  -ac 2 public/whoosh.mp3
```

## Música (OPCIONAL — por defecto NO se incrusta)
El usuario la agrega en la plataforma al publicar. Si pide música incrustada, usa solo pistas con licencia para
ese uso (propias, compradas o de una biblioteca libre de derechos) y anota la fuente y la licencia en
`assets/LICENCIAS.md`.
- Mezcla con ducking sidechain (la música baja cuando hay voz):
```bash
ffmpeg -y -i video.mp4 -i musica.mp3 -filter_complex \
  "[1:a]atrim=0:DUR+1,asetpts=PTS-STARTPTS,volume=0.5,afade=t=in:st=0:d=0.6,afade=t=out:st=DUR-2.8:d=2.8[mus];\
   [mus][0:a]sidechaincompress=threshold=0.025:ratio=10:attack=25:release=500[duck];\
   [0:a][duck]amix=inputs=2:duration=first:normalize=0[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k out_mix.mp4
```

## Verificación
```bash
# contact sheet del resultado
ffmpeg -y -i out.mp4 -vf "fps=1/2.4,scale=150:-1,tile=7x2" grid.jpg
# niveles (pico debe ser ≤ -0.5 dB; si da 0.0 hay clipping → bajar ganancias)
ffmpeg -i out.mp4 -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
```

## Grades comparativos (solo si el usuario pide color)
```bash
# frame base + variantes con LUTs del skill color-grade
ffmpeg -y -ss T -i ORIGINAL -vframes 1 -update 1 frame.png
python ~/.claude/skills/color-grade/sample_clip.py ORIGINAL --emit fix.cube --frames 12
ffmpeg -y -i frame.png -vf "lut3d='fix.cube':interp=tetrahedral" v1.png
# grid etiquetado (fontfile escapado para Windows)
# drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='LABEL':...
```
Nota Windows: exportar `PYTHONIOENCODING=utf-8` antes de correr los scripts
Python del skill color-grade (la consola cp1252 rompe con caracteres unicode).
El solver de piel de `color-grade` necesita Ruby instalado.
