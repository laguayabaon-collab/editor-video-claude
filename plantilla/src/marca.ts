// Colores de la marca del video. Los de PORDEFECTO son la paleta del estilo base; cada marca los cambia en
// cortes.json → branding.colores (ver marcas/<marca>/marca.md).
import data from "./edit-data.json";

export type Colores = {
  primario: string; // barras grandes, acentos, botón del CTA
  claro: string; // variante clara del primario (degradados, detalles)
  oscuro: string; // capa inferior, tarjetas, placa final
  alerta: string; // lo que se advierte o se evita
  crema: string; // barras de las etiquetas pequeñas y tarjeta del logo
};

const PORDEFECTO: Colores = {
  primario: "#2ea55f",
  claro: "#5dcaa5",
  oscuro: "#042a28",
  alerta: "#e0436a",
  crema: "#f7f5f0",
};

const branding = data.branding as { colores?: Partial<Colores> };
export const COLORES: Colores = { ...PORDEFECTO, ...(branding.colores ?? {}) };

// "#rrggbb" + alfa → "rgba(...)"
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
