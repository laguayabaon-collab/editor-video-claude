import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ZONA } from "./zonas";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { COLORES, rgba } from "./marca";

// Mismo sistema que el texto en movimiento: Plus Jakarta Sans y colores de la marca.
const { fontFamily: uiFont } = loadJakarta("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

const POP = Easing.bezier(0.34, 1.56, 0.64, 1);
const GREEN = COLORES.primario;
const GREEN_DARK = COLORES.oscuro;
const RED = COLORES.alerta;
const CARD = rgba(COLORES.oscuro, 0.88);

// Framing selfie: la cara ocupa el centro del cuadro, así que TODO overlay
// vive en la franja superior (gorra/techo). Ver references/estilo.md.
const useInOut = (inFrames = 10) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, inFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { enter, exit };
};

// ── Pills de conceptos (Tip) ────────────────────────────────────────────────
const Pill: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { exit } = useInOut();
  const t = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });
  return (
    <div
      style={{
        opacity: t * exit,
        translate: `${interpolate(t, [0, 1], [-70, 0])}px 0px`,
        scale: String(interpolate(t, [0, 1], [0.85, 1])),
        background: CARD,
        border: `3px solid ${GREEN}`,
        borderRadius: 999,
        padding: "14px 30px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ fontSize: 34 }}>✅</span>
      <span
        style={{
          fontFamily: uiFont,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: 0.5,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// items: textos (micro-texto en mayúsculas permitido); delays: frame de entrada de cada uno (anclado a la palabra).
export const ConceptPills: React.FC<{ items: string[]; delays: number[] }> = ({ items, delays }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: ZONA.arriba + 10 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {items.map((t, i) => <Pill key={t} text={t} delay={delays[i] ?? i * 30} />)}
    </div>
  </AbsoluteFill>
);

// ── Contraste ❌/✅ (Ventaja: lo que evitas vs lo que haces) ─────────────────
const ContrastRow: React.FC<{
  icon: string;
  text: string;
  color: string;
  delay: number;
  strike?: boolean;
}> = ({ icon, text, color, delay, strike }) => {
  const frame = useCurrentFrame();
  const { exit } = useInOut();
  const t = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });
  return (
    <div
      style={{
        opacity: t * exit,
        translate: `${interpolate(t, [0, 1], [-60, 0])}px 0px`,
        background: CARD,
        borderLeft: `8px solid ${color}`,
        borderRadius: 14,
        padding: "14px 26px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 12px 32px rgba(0,0,0,0.38)",
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span
        style={{
          fontFamily: uiFont,
          fontWeight: 700,
          fontSize: 42,
          letterSpacing: -0.5,
          color: "#fff",
          whiteSpace: "nowrap",
          textDecoration: strike ? "line-through" : "none",
          textDecorationColor: RED,
          opacity: strike ? 0.75 : 1,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Lo que se evita (tachado, rojo) frente a lo que se gana (verde). Debe decir lo mismo que la voz.
export const ContrastPair: React.FC<{ mal: string; bien: string; iconoMal?: string; iconoBien?: string }> = ({ mal, bien, iconoMal = "🚫", iconoBien = "🎯" }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: ZONA.arriba }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ContrastRow icon={iconoMal} text={mal} color={RED} delay={0} strike />
      <ContrastRow icon={iconoBien} text={bien} color={GREEN} delay={16} />
    </div>
  </AbsoluteFill>
);

// ── Callout suelto ──────────────────────────────────────────────────────────
export const MathCallout: React.FC<{ emoji: string; text: string; accent?: boolean }> = ({
  emoji,
  text,
  accent,
}) => {
  const { enter, exit } = useInOut(9);
  const frame = useCurrentFrame();
  const wobble = Math.sin(frame / 6) * 1.1;

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: ZONA.arriba + 20 }}>
      <div
        style={{
          opacity: enter * exit,
          scale: String(interpolate(enter, [0, 1], [0.55, 1])),
          rotate: `${-2 + wobble}deg`,
          background: accent
            ? `linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`
            : CARD,
          border: accent ? "none" : `3px solid ${GREEN}`,
          borderRadius: 22,
          padding: "18px 34px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: accent
            ? "0 18px 50px rgba(18,140,74,0.5)"
            : "0 14px 40px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontSize: 44 }}>{emoji}</span>
        <span
          style={{
            fontFamily: uiFont,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 0.5,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Ledger de ROI: se construye línea a línea con lo que se va diciendo ─────
export type LedgerRow = { at: number; emoji: string; label: string; value: string };

const NUM: React.CSSProperties = {
  fontFamily: uiFont,
  fontVariantNumeric: "tabular-nums",
  fontWeight: 800,
};

export const RoiLedger: React.FC<{
  rows: LedgerRow[];
  totalAt: number;
  totalLabel: string;
  totalValue: string;
}> = ({ rows, totalAt, totalLabel, totalValue }) => {
  const frame = useCurrentFrame();
  const { enter, exit } = useInOut(10);
  const totalIn = interpolate(frame, [totalAt, totalAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: ZONA.arriba }}>
      <div
        style={{
          width: 620,
          opacity: enter * exit,
          scale: String(interpolate(enter, [0, 1], [0.86, 1])),
          translate: `0px ${interpolate(enter, [0, 1], [-24, 0])}px`,
          background: CARD,
          border: `3px solid ${GREEN}`,
          borderRadius: 22,
          padding: "18px 20px",
          boxShadow: "0 20px 54px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {rows.map((r) => {
          // La tarjeta crece a medida que se escribe (no reserva el alto final)
          if (frame < r.at - 1) return null;
          const t = interpolate(frame, [r.at, r.at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: POP,
          });
          const negative = r.value.startsWith("−");
          return (
            <div
              key={r.label}
              style={{
                opacity: t,
                translate: `${interpolate(t, [0, 1], [-28, 0])}px 0px`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "8px 8px",
              }}
            >
              <span style={{ fontSize: 32, width: 42 }}>{r.emoji}</span>
              <span
                style={{
                  flex: 1,
                  fontFamily: uiFont,
                  fontWeight: 500,
                  fontSize: 32,
                  color: "rgba(255,255,255,0.94)",
                  whiteSpace: "nowrap",
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  ...NUM,
                  fontSize: 36,
                  color: negative ? "#FFB4AE" : GREEN,
                }}
              >
                {r.value}
              </span>
            </div>
          );
        })}

        {/* Total */}
        {frame < totalAt - 1 ? null : (
        <div
          style={{
            opacity: totalIn,
            scale: String(interpolate(totalIn, [0, 1], [0.9, 1])),
            marginTop: 4,
            background: `linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
            borderRadius: 14,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 10px 30px rgba(18,140,74,0.45)",
          }}
        >
          <span style={{ fontSize: 32, width: 42 }}>💰</span>
          <span
            style={{
              flex: 1,
              fontFamily: uiFont,
              fontWeight: 700,
              fontSize: 32,
              color: "#fff",
              whiteSpace: "nowrap",
            }}
          >
            {totalLabel}
          </span>
          <span style={{ ...NUM, fontSize: 42, color: "#fff" }}>{totalValue}</span>
        </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
