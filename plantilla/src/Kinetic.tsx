// Tipografía en movimiento en lugar de subtítulos: cada frase de la voz es un bloque con jerarquía
// (s = pequeña, m = media, xl = grande) y una palabra destacada (`em`). Cada línea entra cuando se dice
// su primera palabra (props.at.l0, l1… calculados por armar-edicion.mjs). Tres estilos para comparar.
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORES } from "./marca";
import { ALTO_TEXTO, ANCHO_BAJO, MARGEN_INFERIOR, ZONA } from "./zonas";

const serif = loadInstrument("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
const jakarta = loadJakarta("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily;
const bricolage = loadBricolage("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily;

export type TextStyle = "editorial" | "etiquetas" | "impacto";
export type Linea = { t: string; s: "s" | "m" | "xl"; em?: string; tono?: "alerta" };

// Colores de la marca (cortes.json → branding.colores; si está vacío, la paleta por defecto de marca.ts)
const VERDE = COLORES.primario;
const MAGENTA = COLORES.alerta;
const TEAL = COLORES.oscuro;
const CREMA = COLORES.crema;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Zona segura (zonas.ts): el bloque termina en y=1248 y no pasa de x=780 (columna de botones de TikTok).
const MAXW = ANCHO_BAJO;
const BOTTOM = MARGEN_INFERIOR;

const SIZE = { s: 46, m: 70, xl: 112 };
// Ajuste para que una línea grande no se salga del ancho (aprox. por caracteres)
const fit = (t: string, px: number, k: number) => Math.min(px, MAXW / (t.length * k));

const useSp = (at: number, damping = 18, stiffness = 210) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness, mass: 0.7 } });
};

// Salida del bloque completo: suben y se desvanecen en los últimos 7 frames
const useOut = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - 7, durationInFrames], [0, 1], CLAMP);
};

// Si una línea m/xl no cabe a un tamaño legible en el ancho seguro, se parte en dos barras
// (por el espacio más cercano al centro); la segunda entra 3 frames después.
const BASE_ETQ = { s: 42, m: 62, xl: 92 };
const partirLineas = (lines: Linea[], at: Record<string, number>) =>
  lines.flatMap((l, i) => {
    const a = at[`l${i}`] ?? 0;
    if (l.s === "s" || !l.t.includes(" ") || MAXW / (l.t.length * 0.6) >= BASE_ETQ[l.s] * 0.8) return [{ l, a }];
    const medio = l.t.length / 2;
    const esp = [...l.t].map((c, j) => (c === " " ? j : -1)).filter((j) => j > 0).sort((x, y) => Math.abs(x - medio) - Math.abs(y - medio))[0];
    const t1 = l.t.slice(0, esp), t2 = l.t.slice(esp + 1);
    const em = (t: string) => (l.em && t.toLowerCase().includes(l.em.toLowerCase()) ? l.em : undefined);
    return [
      { l: { ...l, t: t1, em: em(t1) }, a },
      { l: { ...l, t: t2, em: em(t2) }, a: a + 3 },
    ];
  });

// Divide el texto alrededor de la palabra destacada
const partes = (l: Linea) => {
  if (!l.em) return [{ txt: l.t, em: false }];
  const i = l.t.toLowerCase().indexOf(l.em.toLowerCase());
  if (i < 0) return [{ txt: l.t, em: false }];
  return [
    { txt: l.t.slice(0, i), em: false },
    { txt: l.t.slice(i, i + l.em.length), em: true },
    { txt: l.t.slice(i + l.em.length), em: false },
  ].filter((p) => p.txt);
};

// ── A · Editorial: sans grueso + serif itálica en la palabra clave, revelado por máscara ──
const LineaEditorial: React.FC<{ l: Linea; at: number; idx: number; k?: number }> = ({ l, at, idx }) => {
  const frame = useCurrentFrame();
  const t = useSp(at);
  const out = useOut();
  if (frame < at - 1) return null;
  const px = l.s === "s" ? SIZE.s : fit(l.t, SIZE[l.s], l.s === "xl" ? 0.56 : 0.55);
  const accent = l.tono === "alerta" ? "#ff9db3" : "#8ff0c4";
  return (
    <div style={{ overflow: "hidden", paddingBottom: 6, marginTop: l.s === "s" ? 0 : -4 }}>
      <div
        style={{
          translate: `0 ${interpolate(t, [0, 1], [110, 0]) - out * 40 * (1 + idx * 0.25)}%`,
          rotate: `${interpolate(t, [0, 1], [4, 0])}deg`,
          transformOrigin: "left bottom",
          opacity: 1 - out,
          fontFamily: jakarta,
          fontWeight: l.s === "s" ? 700 : 800,
          fontSize: px,
          lineHeight: 1.05,
          letterSpacing: l.s === "s" ? 0 : -px * 0.035,
          color: l.s === "s" ? "rgba(255,255,255,0.88)" : "#fff",
          whiteSpace: "nowrap",
          textShadow: "0 4px 24px rgba(0,0,0,0.45)",
        }}
      >
        {partes(l).map((p, i) =>
          p.em ? (
            <span
              key={i}
              style={{
                fontFamily: serif,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: px * 1.12,
                letterSpacing: -px * 0.01,
                color: accent,
                paddingRight: px * 0.06,
                textShadow: "0 2px 4px rgba(0,0,0,0.55), 0 6px 26px rgba(0,0,0,0.6)",
              }}
            >
              {p.txt}
            </span>
          ) : (
            <span key={i}>{p.txt}</span>
          ),
        )}
      </div>
    </div>
  );
};

// ── B · Etiquetas: cada línea sobre una barra que barre desde la izquierda ──
// Alto aproximado de una barra de etiqueta (para que el bloque no suba hasta la cara)
const pxEtq = (l: Linea) => (l.s === "s" ? BASE_ETQ.s : fit(l.t, BASE_ETQ[l.s], 0.6));
const altoEtq = (l: Linea) => pxEtq(l) * 1.1 + (l.s === "xl" ? 18 : 14) + 8;

const LineaEtiqueta: React.FC<{ l: Linea; at: number; idx: number; k?: number }> = ({ l, at, idx, k = 1 }) => {
  const frame = useCurrentFrame();
  const bar = useSp(at - 3, 22, 340);
  const txt = useSp(at - 1, 17, 320);
  const out = useOut();
  if (frame < at - 4) return null;
  const px = pxEtq(l) * k;
  const fondo = l.s === "xl" ? (l.tono === "alerta" ? MAGENTA : VERDE) : CREMA;
  const color = l.s === "xl" ? "#fff" : TEAL;
  return (
    <div style={{ display: "flex", marginTop: 8 * k }}>
      <div
        style={{
          position: "relative",
          padding: l.s === "xl" ? `${6 * k}px ${26 * k}px ${12 * k}px` : `${6 * k}px ${20 * k}px ${8 * k}px`,
          borderRadius: 10,
          overflow: "hidden",
          opacity: 1 - out,
          translate: `${-out * 60 * (1 + idx * 0.3)}px 0`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: fondo, transformOrigin: "left", scale: `${bar} 1` }} />
        <div
          style={{
            position: "relative",
            fontFamily: jakarta,
            fontWeight: l.s === "s" ? 700 : 800,
            fontSize: px,
            lineHeight: 1.1,
            letterSpacing: -px * 0.025,
            color,
            whiteSpace: "nowrap",
            translate: `0 ${interpolate(txt, [0, 1], [70, 0])}%`,
            opacity: txt,
          }}
        >
          {partes(l).map((p, i) => (
            <span key={i} style={p.em && l.s !== "xl" ? { color: VERDE } : undefined}>
              {p.txt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── C · Impacto: centrado, palabra por palabra con desenfoque y escala ──
const LineaImpacto: React.FC<{ l: Linea; at: number; idx: number; k?: number }> = ({ l, at, idx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  if (frame < at - 1) return null;
  const px = l.s === "s" ? 46 : fit(l.t, l.s === "m" ? 70 : 120, 0.55);
  const palabras = partes(l).flatMap((p) => p.txt.split(/(\s+)/).filter((w) => w.trim()).map((w) => ({ w, em: p.em })));
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: px * 0.26, opacity: 1 - out, translate: `0 ${-out * 30 * (1 + idx * 0.3)}px` }}>
      {palabras.map((p, i) => {
        const s = spring({ frame: frame - at - i * 2, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: bricolage,
              fontWeight: l.s === "s" ? 700 : 800,
              fontSize: px,
              lineHeight: 1.04,
              letterSpacing: -px * 0.03,
              whiteSpace: "nowrap",
              opacity: s,
              scale: String(interpolate(s, [0, 1], [1.35, 1])),
              ...(p.em
                ? {
                    backgroundImage: `linear-gradient(180deg, ${l.tono === "alerta" ? "#ffd0db" : "#e4fff2"} 10%, ${l.tono === "alerta" ? "#ff6f90" : "#6fe3ae"} 90%)`,
                    filter: `blur(${interpolate(s, [0, 1], [10, 0], CLAMP)}px) drop-shadow(0 4px 14px rgba(0,0,0,0.55))`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : {
                    color: l.s === "s" ? "rgba(255,255,255,0.88)" : "#fff",
                    textShadow: "0 4px 24px rgba(0,0,0,0.45)",
                    filter: `blur(${interpolate(s, [0, 1], [10, 0], CLAMP)}px)`,
                  }),
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

export const Frase: React.FC<{ lines: Linea[]; at: Record<string, number>; estilo: TextStyle }> = ({ lines, at, estilo }) => {
  const partidas = partirLineas(lines, at);
  // Si el bloque es más alto que la franja de texto (de y=ZONA.textoTope a y=1248), se reduce: nunca tapa la cara.
  const alto = partidas.reduce((s, { l }) => s + altoEtq(l), 0);
  const k = estilo === "etiquetas" ? Math.max(0.7, Math.min(1, ALTO_TEXTO / alto)) : 1;
  const L = estilo === "editorial" ? LineaEditorial : estilo === "etiquetas" ? LineaEtiqueta : LineaImpacto;
  // Filo vertical verde del estilo editorial: crece con el bloque
  const barra = useSp(0, 20, 200);
  const out = useOut();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: estilo === "impacto" ? "center" : "flex-start",
        padding: `0 ${1080 - ZONA.derechaBaja}px ${BOTTOM}px ${estilo === "editorial" ? ZONA.izquierda + 24 : ZONA.izquierda}px`,
      }}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: estilo === "impacto" ? "center" : "flex-start" }}>
        {estilo === "editorial" ? (
          <div
            style={{
              position: "absolute",
              left: -28,
              top: 8,
              bottom: 12,
              width: 6,
              borderRadius: 3,
              background: VERDE,
              transformOrigin: "top",
              scale: `1 ${barra * (1 - out)}`,
            }}
          />
        ) : null}
        {partidas.map(({ l, a }, i) => (
          <L key={i} l={l} at={a} idx={i} k={k} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
