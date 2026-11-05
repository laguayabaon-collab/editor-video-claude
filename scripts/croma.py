"""Recorta la pantalla verde de un proxy y deja un video con transparencia (WebM VP9 con alfa) listo para Remotion.

El recorte mide cuánto domina el verde en cada píxel (g − max(r, b)), en vez de la distancia de color: así funciona
con pantallas verdes pálidas o sobreexpuestas sin comerse la piel ni la ropa blanca. También quita el reflejo verde
(despill), afina el borde y tapa con una «máscara de basura» lo que no es pantalla (techo, luces).

Uso (desde la carpeta del proyecto):
  python ../../scripts/croma.py public/videos/IMG_0001.mp4 public/videos/IMG_0001-croma.webm \
      [--t0 10] [--t1 22] [--techo 415] [--desde 0] [--hasta 0] [--prueba out/croma-prueba.png]

  --t0 / --t1  umbral del verde: por debajo de t0 es sujeto, por encima de t1 es fondo (medir con --prueba).
  --techo      filas de arriba que siempre son fondo (techo del estudio). 0 = sin máscara.
  --prueba     solo guarda un cuadro de muestra sobre el verde oscuro de la marca y termina.
"""
import argparse, json, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

p = argparse.ArgumentParser()
p.add_argument("entrada"); p.add_argument("salida")
p.add_argument("--t0", type=float, default=10); p.add_argument("--t1", type=float, default=22)
p.add_argument("--techo", type=int, default=0)
p.add_argument("--desde", type=float, default=0); p.add_argument("--hasta", type=float, default=0)
p.add_argument("--prueba")
a = p.parse_args()

info = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                           "stream=width,height,r_frame_rate", "-of", "json", a.entrada]))["streams"][0]
W, H = info["width"], info["height"]
fps = info["r_frame_rate"]
rango = (["-ss", str(a.desde)] if a.desde else []) + (["-to", str(a.hasta)] if a.hasta else [])


def alfa(rgb):
    r, g, b = (rgb[..., i].astype(np.float32) for i in range(3))
    m = np.maximum(r, b)
    al = 1 - np.clip((g - m - a.t0) / (a.t1 - a.t0), 0, 1)
    if a.techo:
        al[: a.techo, :] = 0
    A = Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = np.empty((H, W, 4), np.uint8)
    out[..., 0] = rgb[..., 0]
    out[..., 1] = np.minimum(g, m + 2).astype(np.uint8)  # despill
    out[..., 2] = rgb[..., 2]
    out[..., 3] = np.asarray(A)
    return out


lector = subprocess.Popen(["ffmpeg", "-v", "error", *rango, "-i", a.entrada, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                          stdout=subprocess.PIPE)
if a.prueba:
    rgb = np.frombuffer(lector.stdout.read(W * H * 3), np.uint8).reshape(H, W, 3)
    lector.kill()
    k = alfa(rgb)
    fondo = Image.new("RGBA", (W, H), (4, 42, 40, 255))
    fondo.alpha_composite(Image.fromarray(k))
    fondo.convert("RGB").save(a.prueba)
    print("prueba:", a.prueba); sys.exit(0)

escritor = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", fps,
                             "-i", "-", *rango, "-i", a.entrada, "-map", "0:v", "-map", "1:a?",
                             "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-deadline", "realtime",
                             "-cpu-used", "8", "-row-mt", "1", "-auto-alt-ref", "0", "-c:a", "libopus", "-b:a", "160k",
                             a.salida], stdin=subprocess.PIPE)
n = 0
while True:
    buf = lector.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    escritor.stdin.write(alfa(np.frombuffer(buf, np.uint8).reshape(H, W, 3)).tobytes())
    n += 1
    if n % 300 == 0:
        print(f"{n} cuadros", flush=True)
escritor.stdin.close(); escritor.wait(); lector.wait()
print(f"listo: {a.salida} ({n} cuadros)")
