# Editor de video con Claude Code

Graba con tu celular y pídele a Claude el video terminado. Este repo le da a [Claude Code](https://claude.com/claude-code)
todo lo que necesita para editar videos hablados como un editor profesional: reels, anuncios, piezas de feed y
videos para YouTube.

*English: a Claude Code workspace that turns phone recordings into finished talking-head videos (reels, ads,
YouTube) with Remotion. The docs are in Spanish; Claude can follow them and work in any language.*

## Qué hace
- **Elige las mejores tomas.** Lee la transcripción palabra por palabra, descarta los falsos arranques y nunca
  corta dentro de una palabra.
- **Quita el aire muerto.** Compacta las pausas y los titubeos con cortes secos que no se notan.
- **Texto en movimiento en lugar de subtítulos.** Toda la voz aparece como texto animado, con la palabra clave
  destacada y sincronizado a la voz, porque la mayoría de los videos se ven sin sonido.
- **Gráficos que dicen lo mismo que la voz.** Contrastes, listas, cifras, el botón del CTA y la placa final.
- **Respeta las zonas seguras** de TikTok, Reels, Stories y Shorts, para que la interfaz no tape nada importante.
- **Imagen y sonido listos para publicar.** Convierte el HDR del iPhone, limpia el audio y lo deja a −14 LUFS.
- **Pide tu aprobación.** Te muestra el guion de cortes antes de construir y revisa cada render con stills y hojas
  de contacto antes de entregarlo.

## Cómo se usa
1. Clona el repo y ábrelo en Claude Code.
2. Pídele a Claude: **«Instala este repo siguiendo INSTALL.md»**. Revisará qué tienes, instalará lo que falte (con tu
   permiso) y hará una prueba.
3. Graba siguiendo [GRABAR-CON-EL-CELULAR.md](GRABAR-CON-EL-CELULAR.md) y deja los archivos en
   `material/<fecha-nombre>/`.
4. Pídele, por ejemplo: **«Edita un reel de 45 segundos con lo que dejé en material/2026-11-05-lanzamiento/. El CTA
   es "Escríbenos por WhatsApp"»**.

El flujo completo está en la skill [`edicion-video`](.claude/skills/edicion-video/SKILL.md) y en
[CLAUDE.md](CLAUDE.md).

## Qué necesitas
- **Claude Code.**
- **Node.js 20 o superior, ffmpeg y Git** (Git Bash en Windows). [INSTALL.md](INSTALL.md) explica cómo instalarlos
  en Windows, macOS y Linux.
- **Una llave de la API de OpenAI** para transcribir con Whisper. Se paga por minuto de audio; consulta los precios
  de OpenAI. Si tienes llave de ElevenLabs, puedes usar Scribe, que además separa hablantes.
- **Python 3 con numpy y Pillow**, solo si vas a grabar con pantalla verde.

Tus llaves van en un archivo `.env` que nunca se sube (está en `.gitignore`), o en tus variables de entorno.

## Licencias
- **El código de este repo:** licencia MIT (ver [LICENSE](LICENSE)).
- **[Remotion](https://www.remotion.dev),** el motor de render, **tiene su propia licencia:** es gratis para
  personas, organizaciones sin fines de lucro y empresas de hasta 3 empleados. Las empresas más grandes necesitan
  una licencia de empresa. Revisa los términos vigentes en [remotion.dev/license](https://www.remotion.dev/license)
  antes de usarlo comercialmente.
- **Plus Jakarta Sans:** SIL Open Font License.
- **Los efectos de sonido:** sintetizados con ffmpeg, libres de derechos.

## Créditos
Creado por [La Guayaba Online](https://laguayabaonline.com), a partir del flujo con el que editamos nuestros videos
y los de nuestros clientes.
