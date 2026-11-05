// Cierre del video: botón de CTA bajo el logo, placa final y la «salida viva» que usan todos los overlays.
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ZONA } from "./zonas";
import { COLORES, rgba } from "./marca";

const { fontFamily: jakarta } = loadJakarta("normal", { weights: ["700", "800"], subsets: ["latin"] });
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SHADOW = "0 18px 50px rgba(0,0,0,0.42)";

const useSpring = (at: number, damping = 13, stiffness = 170) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness, mass: 0.8 } });
};

// ── Salida viva: en los últimos `n` frames el overlay sube, se encoge y se desenfoca ──
export const salida = (e: number): React.CSSProperties => ({
  opacity: e,
  translate: `0 ${(1 - e) * -70}px`,
  scale: String(0.9 + 0.1 * e),
  filter: e < 0.99 ? `blur(${(1 - e) * 12}px)` : undefined,
});

export const SalidaViva: React.FC<{ children: React.ReactNode; n?: number }> = ({ children, n = 10 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const e = interpolate(frame, [durationInFrames - n, durationInFrames], [1, 0], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={salida(e)}>{children}</AbsoluteFill>;
};

// ── CTA bajo el logo del cierre (el logo lo pone Branding.tsx) ──────────────
export const Cta: React.FC<{ texto: string; web?: string }> = ({ texto, web }) => {
  const frame = useCurrentFrame();
  const t = useSpring(0, 11, 190);
  const w = useSpring(10, 14, 200);
  const shine = interpolate(frame, [14, 40], [-0.3, 1.3], CLAMP);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: ZONA.arriba + 200 }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(180deg, ${COLORES.claro} -40%, ${COLORES.primario} 60%)`,
          borderRadius: 999,
          padding: "22px 46px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: `0 18px 46px ${rgba(COLORES.primario, 0.5)}`,
          opacity: Math.min(1, t * 1.5),
          scale: String(interpolate(t, [0, 1], [0.5, 1])),
        }}
      >
        {/* Tamaño ajustado al texto: el botón no pasa del ancho seguro (x 120 → 888 = 768 px) */}
        <span style={{ fontFamily: jakarta, fontWeight: 800, fontSize: Math.min(46, 620 / ((texto.length + 2) * 0.57)), color: "#fff", letterSpacing: -0.5, whiteSpace: "nowrap" }}>{texto}</span>
        <span style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 46, color: "#fff" }}>→</span>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 120,
            left: `${shine * 100}%`,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            transform: "skewX(-20deg)",
          }}
        />
      </div>
      {web ? (
        <div
          style={{
            marginTop: 16,
            fontFamily: jakarta,
            fontWeight: 700,
            fontSize: 32,
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            opacity: w,
          }}
        >
          {web}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── Placa final (después del último clip): logo + botón + web, con apertura en círculo ──
export const PlacaFinal: React.FC<{ texto: string; web?: string; logo: string }> = ({ texto, web, logo }) => {
  const frame = useCurrentFrame();
  const iris = interpolate(frame, [0, 12], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const l = useSpring(6, 13, 160);
  const btn = useSpring(14, 12, 180);
  const out = interpolate(frame, [52, 60], [1, 0], CLAMP);
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${iris * 120}% at 50% 50%)`,
        background: `radial-gradient(ellipse 80% 55% at 50% 45%, ${rgba(COLORES.primario, 0.28)} 0%, ${COLORES.oscuro} 70%)`,
        backgroundColor: COLORES.oscuro,
        alignItems: "center",
        justifyContent: "center",
        // Centrado en el cuadro (x = 540). Para no invadir la columna de botones de TikTok (x > 780 desde y = 840),
        // todo lo que cae debajo de y = 840 mide como mucho 2 × (780 − 540) = 480 px de ancho.
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, opacity: out }}>
        <div
          style={{
            background: COLORES.crema,
            borderRadius: 34,
            padding: "34px 56px",
            boxShadow: SHADOW,
            opacity: l,
            scale: String(interpolate(l, [0, 1], [0.7, 1])),
          }}
        >
          <Img src={staticFile(logo)} style={{ width: 370, display: "block" }} />
        </div>
        <div
          style={{
            background: COLORES.primario,
            // Si el texto no cabe en 480 px (columna de TikTok), pasa a dos líneas centradas
            borderRadius: texto.length > 22 ? 30 : 999,
            padding: "18px 30px",
            maxWidth: 2 * (ZONA.derechaBaja - 540),
            fontFamily: jakarta,
            fontWeight: 800,
            fontSize: 33,
            lineHeight: 1.18,
            textAlign: "center",
            color: "#fff",
            letterSpacing: -0.5,
            boxShadow: `0 18px 46px ${rgba(COLORES.primario, 0.45)}`,
            opacity: btn,
            translate: `0 ${interpolate(btn, [0, 1], [30, 0])}px`,
          }}
        >
          {texto} →
        </div>
        {web ? (
          <div style={{ fontFamily: jakarta, fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.85)", opacity: btn }}>{web}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ── Guía de zonas seguras para revisar stills (VideoEdit con guias=true) ──
export const GuiaZonas: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: ZONA.arriba, background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: ZONA.abajo, bottom: 0, background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: 0, width: ZONA.izquierda, top: ZONA.arriba, height: ZONA.abajo - ZONA.arriba, background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: ZONA.derecha, right: 0, top: ZONA.arriba, height: ZONA.yColumna - ZONA.arriba, background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: ZONA.derechaBaja, right: 0, top: ZONA.yColumna, height: ZONA.abajo - ZONA.yColumna, background: "rgba(255,0,0,0.28)" }} />
  </AbsoluteFill>
);
