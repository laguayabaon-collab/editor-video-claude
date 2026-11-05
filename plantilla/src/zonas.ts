// Zonas seguras de video vertical 1080×1920 (investigación del 26-10-2026; detalle en la skill edicion-video,
// references/zonas-seguras.md). Es la intersección de TikTok, Instagram/Facebook Reels y Stories y YouTube Shorts,
// con el criterio de ANUNCIOS (el más estricto): lo que va aquí dentro no lo tapa la interfaz de ninguna app.
export const ZONA = {
  arriba: 288, // pestañas, perfil, etiqueta «Publicidad»
  abajo: 1248, // descripción, audio, botón del anuncio (Meta: 35 % inferior)
  izquierda: 120,
  derecha: 888, // botones de YouTube Shorts
  derechaBaja: 780, // desde y=840: columna de botones de TikTok (like, comentar, compartir)
  yColumna: 840,
  textoTope: 900, // el texto de la voz no sube de aquí: queda debajo del mentón en un plano medio
} as const;

// Derivados para maquetar
export const ANCHO_BAJO = ZONA.derechaBaja - ZONA.izquierda; // 660: ancho útil del texto de la voz
export const CENTRO_BAJO = (ZONA.izquierda + ZONA.derechaBaja) / 2; // 450: centro óptico de lo que va abajo
export const MARGEN_INFERIOR = 1920 - ZONA.abajo; // 672
export const ALTO_TEXTO = ZONA.abajo - ZONA.textoTope; // 348: alto máximo del bloque de texto de la voz
// Franja superior para gráficos (encima de la cabeza en un plano medio: coronilla ≈ y 540)
export const FRANJA_SUP = { y: ZONA.arriba, alto: 260, x: ZONA.izquierda, ancho: ZONA.derecha - ZONA.izquierda };
