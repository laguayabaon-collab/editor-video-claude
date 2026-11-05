# Instalación

Esta guía está escrita para que la siga un agente (Claude Code u otro) en la computadora del usuario, aunque una
persona también puede seguirla a mano. Funciona en Windows, macOS y Linux.

> **Para el agente:**
> - Sigue los pasos en orden.
> - Antes de instalar algo, comprueba si ya está.
> - Pide confirmación al usuario antes de instalar software del sistema.
> - **Nunca pidas que te peguen una llave en el chat, ni la escribas en un archivo versionado ni la muestres.** El
>   usuario la pone en `.env` o en sus variables de entorno (paso 4).

## 1. Requisitos

| Componente | Versión | Para qué |
|---|---|---|
| Node.js | 20 o superior (probado con 24) | Remotion y los scripts `.mjs` |
| ffmpeg y ffprobe | 6 o superior (probado con 8), con `zscale` (libzimg) y `libvpx` | Proxies, conversión de HDR, audio, hojas de contacto |
| Bash | Git Bash en Windows; el de macOS y Linux | Scripts `.sh` |
| Git | cualquiera reciente | Clonar el repo |
| Claude Code | — | El agente que edita |
| Llave de OpenAI | — | Transcripción (Whisper) |
| Python 3 con `numpy` y `Pillow` | opcional | Solo para pantalla verde (`scripts/croma.py`) |

Remotion descarga su propio Chrome Headless Shell (~150 MB) la primera vez que renderiza. No hace falta instalar
Chrome.

## 2. Instalar lo que falte

Primero comprueba qué hay:
```bash
node --version; npm --version; git --version; ffmpeg -version | head -1; ffprobe -version | head -1; python3 --version || python --version
```

### Windows (PowerShell)
```powershell
winget install -e --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
```
```powershell
winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
```
```powershell
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
```
Cierra y abre la terminal para que se actualice el PATH.
- **Si `ffmpeg` sigue sin aparecer:** agrega al PATH la carpeta `bin` que winget creó en
  `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*-full_build\bin`.
- **Bash:** los scripts `.sh` se corren con Git Bash, que viene con Git.

### macOS (Homebrew)
```bash
brew install node ffmpeg git
```

### Linux (Debian/Ubuntu)
```bash
sudo apt update && sudo apt install -y ffmpeg git curl
```
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt install -y nodejs
```

### Comprobar ffmpeg
```bash
ffmpeg -hide_banner -filters | grep -E " zscale | tonemap " ; ffmpeg -hide_banner -encoders | grep libvpx-vp9
```
- **`zscale` y `tonemap`:** hacen falta para convertir el HDR del iPhone. Si no aparecen, instala una compilación
  completa de ffmpeg (en Windows, la de Gyan *full*).
- **`libvpx-vp9`:** solo hace falta para la pantalla verde.

### Opcional: pantalla verde
```bash
python -m pip install numpy Pillow
```

## 3. Clonar el repo y abrirlo en Claude Code

```bash
git clone https://github.com/laguayabaon-collab/editor-video-claude.git
```
```bash
cd editor-video-claude
```

Abre Claude Code **en la carpeta del repo**. Así carga solo la skill `edicion-video` (`.claude/skills/`) y las
instrucciones de `CLAUDE.md`.

Instala las dependencias de la plantilla una vez, para comprobar que todo baja bien:
```bash
cd plantilla && npm ci && cd ..
```

## 4. Llave de OpenAI

La transcripción usa la API de Whisper de OpenAI (`whisper-1`). La llave se crea en
https://platform.openai.com/api-keys y el uso se cobra por minuto de audio (ver los precios de OpenAI).

El usuario elige **una** de estas dos formas. El agente nunca ve ni escribe la llave:

**A. Archivo `.env` en la raíz del repo**, ignorado por git:
```bash
cp .env.example .env
```
El usuario abre `.env` en su editor y pega la llave después de `OPENAI_API_KEY=`.

**B. Variable de entorno del usuario.** En Windows, desde PowerShell, el usuario la escribe en lugar de `TU_LLAVE`:
```powershell
[Environment]::SetEnvironmentVariable('OPENAI_API_KEY','TU_LLAVE','User')
```
En macOS o Linux, el usuario agrega `export OPENAI_API_KEY=...` a su `~/.zshrc` o `~/.bashrc`.

Comprobación, sin mostrar la llave:
```bash
node -e "require('fs').existsSync('.env') && require('fs').readFileSync('.env','utf8').match(/^OPENAI_API_KEY=.+/m) ? console.log('OK en .env') : console.log(process.env.OPENAI_API_KEY ? 'OK en el entorno' : 'FALTA OPENAI_API_KEY')"
```

**Opcional:** con `ELEVENLABS_API_KEY`, el script puede transcribir con ElevenLabs Scribe, que además separa
hablantes (`--scribe`).

## 5. Skills de Remotion (recomendado)

Las skills oficiales de Remotion le dan al agente la documentación del framework:
```bash
npx -y skills@latest add remotion-dev/skills -g -y
```
Si al terminar el instalador muestra `Failed to install … PromptScript`, es normal: es otro formato de agente.
Para Claude Code quedan bien.

## 6. Prueba sin cámara ni llave

Este paso crea un proyecto, fabrica un video de prueba con ffmpeg y renderiza un cuadro. Si llega al final sin
errores, todo está listo.

```bash
bash scripts/nuevo-proyecto.sh prueba
```
```bash
P=$(ls -d proyectos/*-prueba | tail -1); N=$(basename "$P"); echo "$N"
```
```bash
ffmpeg -v error -y -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=6" -f lavfi -i "sine=frequency=440:duration=6" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "material/$N/IMG_0001.mp4"
```
```bash
bash scripts/preparar-material.sh "$N" 9x16
```
Una transcripción falsa, para probar el armado sin gastar la API:
```bash
mkdir -p "$P/transcripts" && node -e "const w=['Esta','es','una','prueba','del','editor','de','video','con','Claude'].map((t,i)=>({text:' '+t,start:0.3+i*0.55,end:0.7+i*0.55}));require('fs').writeFileSync(process.argv[1],JSON.stringify({fuente:'IMG_0001.mp4',motor:'prueba',text:'',words:w}))" "$P/transcripts/IMG_0001.json"
```
```bash
node scripts/armar-edicion.mjs "$P"
```
```bash
cd "$P" && npx tsc --noEmit && npx remotion still VideoEdit out/prueba.png --frame=150 --scale=0.5 && cd ../..
```
El cuadro `out/prueba.png` debe mostrar las barras de color de la prueba con el logo de muestra («TU LOGO») arriba.

- **Si termina bien:** se puede borrar la prueba con `rm -rf "$P" "material/$N"`.
- **Para probar también la llave:** antes de borrar, corre `node scripts/transcribir.mjs "$P"`, que reemplaza la
  transcripción falsa. Un tono de prueba no tiene palabras: basta con que no dé error de autenticación.

## 7. Listo

El usuario graba siguiendo `GRABAR-CON-EL-CELULAR.md` y le pide a Claude, por ejemplo:

> Edita un reel con lo que dejé en `material/2026-11-05-mi-video/`. El CTA es «Escríbenos por WhatsApp».

La skill `edicion-video` se encarga del resto y pide aprobación del guion antes de construir.

## Problemas conocidos

| Problema | Solución |
|---|---|
| El bundler de Remotion falla con `EPERM: symlink` (Windows) | No uses accesos directos ni junctions en `public/`. Copia los archivos reales: `preparar-material.sh` ya lo hace. |
| Los `.MOV` del iPhone salen horizontales | Traen metadatos de rotación. El proxy de `preparar-material.sh` ya aplica la rotación. |
| La imagen sale lavada y la piel pálida | El video era HDR y faltó `zscale` en ffmpeg: instala una compilación completa (paso 2). |
| `npx remotion add …` falla | Instala los paquetes `@remotion/*` con `npm i`, fijando la misma versión de `remotion`. |
| Python imprime `UnicodeEncodeError` (Windows) | `export PYTHONIOENCODING=utf-8` antes de correrlo. |
| `Falta OPENAI_API_KEY` | Paso 4. En Windows, una variable recién creada no llega a las terminales ya abiertas: el script la lee del registro, o basta con reabrir la terminal. |
| El render falla con `ERR_NAME_NOT_RESOLVED` | Remotion carga la fuente Plus Jakarta Sans desde Google Fonts: hace falta conexión a internet al renderizar. |
