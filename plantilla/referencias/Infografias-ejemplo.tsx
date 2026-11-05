// Gráficos propios de un video de ejemplo (reel sobre hoteles). Cada uno recibe `at` (frames relativos al inicio de la cue,
// calculados por armar-edicion.mjs desde las palabras de la voz) y vive en la franja superior, salvo Full247,
// que es un corte a pantalla completa (hace de B-roll tipográfico mientras sigue la voz).
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

const { fontFamily: jakarta } = loadJakarta("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

// Colores de la paleta por defecto (ver src/marca.ts). Ejemplo de infografías ancladas a palabras.
const C = {
  verde: "#2ea55f",
  verdeClaro: "#5dcaa5",
  magenta: "#e0436a",
  teal: "#042a28",
  crema: "#f7f5f0",
};
const CARD = "rgba(4,42,40,0.86)";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SHADOW = "0 18px 50px rgba(0,0,0,0.42)";

type At = Record<string, number>;

const useSpring = (at: number, damping = 13, stiffness = 170) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness, mass: 0.8 } });
};

// Salida común: fundido + leve subida en los últimos 8 frames.
const useExit = (n = 10) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [durationInFrames - n, durationInFrames], [1, 0], { ...CLAMP, easing: Easing.in(Easing.cubic) });
};
// Salida viva: sube, se encoge y se desenfoca mientras se desvanece
const salida = (e: number): React.CSSProperties => ({
  opacity: e,
  translate: `0 ${(1 - e) * -70}px`,
  scale: String(0.9 + 0.1 * e),
  filter: e < 0.99 ? `blur(${(1 - e) * 12}px)` : undefined,
});

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string; o?: number }> = ({ children, color = C.verdeClaro, o = 1 }) => (
  <div
    style={{
      fontFamily: jakarta,
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: 6,
      color,
      opacity: o,
      display: "inline-block",
      background: "rgba(4,42,40,0.78)",
      borderRadius: 999,
      padding: "10px 24px 10px 30px",
    }}
  >
    {children}
  </div>
);

// ── Íconos de línea ─────────────────────────────────────────────────────────
type IconName = "pms" | "crm" | "web" | "ota";
const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 54, color = "#fff" }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === "pms" && (
        <>
          <path {...p} d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M3 18v2M21 18v2" />
          <path {...p} d="M6 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
        </>
      )}
      {name === "crm" && (
        <>
          <circle {...p} cx="9" cy="8" r="3" />
          <path {...p} d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
          <circle {...p} cx="17" cy="9" r="2.4" />
          <path {...p} d="M16.5 14c2.6 0 4.5 1.8 4.5 4.5" />
        </>
      )}
      {name === "web" && (
        <>
          <circle {...p} cx="12" cy="12" r="9" />
          <path {...p} d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
      )}
      {name === "ota" && (
        <>
          <path {...p} d="M20 12.5 12.5 20 3 10.5V3h7.5z" />
          <circle {...p} cx="7.5" cy="7.5" r="1.5" />
        </>
      )}
    </svg>
  );
};

const SISTEMAS: { key: IconName; label: string; x: number; y: number; rot: number }[] = [
  { key: "pms", label: "PMS", x: 168, y: 300, rot: -5 },
  { key: "crm", label: "CRM", x: 404, y: 330, rot: 4 },
  { key: "web", label: "Web", x: 676, y: 296, rot: -3 },
  { key: "ota", label: "OTA", x: 912, y: 326, rot: 5 },
];

// ── 1. Sistemas sueltos: caen uno por palabra; OTA recibe la etiqueta de comisión ──
const Tile: React.FC<{ s: (typeof SISTEMAS)[number]; at: number; shake?: number }> = ({ s, at, shake = 0 }) => {
  const frame = useCurrentFrame();
  const t = useSpring(at, 11, 190);
  if (frame < at - 1) return null;
  const wobble = shake > 0 ? Math.sin(frame * 1.9) * 7 * shake : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - 100,
        top: s.y - 92,
        width: 200,
        height: 184,
        borderRadius: 30,
        background: CARD,
        border: "2px solid rgba(255,255,255,0.14)",
        boxShadow: SHADOW,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        opacity: Math.min(1, t * 1.4),
        translate: `${wobble}px ${interpolate(t, [0, 1], [-140, 0])}px`,
        rotate: `${interpolate(t, [0, 1], [s.rot * 4, s.rot])}deg`,
        scale: String(interpolate(t, [0, 1], [0.6, 1])),
      }}
    >
      <Icon name={s.key} />
      <div style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 40, color: "#fff", letterSpacing: -0.5 }}>{s.label}</div>
    </div>
  );
};

export const Sistemas: React.FC<{ at: At }> = ({ at }) => {
  const frame = useCurrentFrame();
  const exit = useExit();
  const head = useSpring(0);
  const com = useSpring(at.comision, 9, 200);
  const shake = interpolate(frame, [at.comision, at.comision + 6, at.comision + 22], [0, 1, 0], CLAMP);
  return (
    <AbsoluteFill style={{ ...salida(exit) }}>
      <div style={{ position: "absolute", top: 118, width: "100%", textAlign: "center", translate: `0 ${interpolate(head, [0, 1], [-20, 0])}px` }}>
        <Eyebrow o={head}>TU HOTEL HOY</Eyebrow>
      </div>
      {/* Conectores rotos entre sistemas: nada habla con nada */}
      <svg width={1080} height={600} style={{ position: "absolute", inset: 0 }}>
        {SISTEMAS.slice(1).map((s, i) => {
          const a = SISTEMAS[i];
          const visible = frame >= at[s.key] + 6;
          if (!visible) return null;
          const mx = (a.x + s.x) / 2, my = (a.y + s.y) / 2;
          return (
            <g key={s.key} opacity={0.85}>
              <line x1={a.x + 100} y1={a.y} x2={mx - 14} y2={my} stroke={C.magenta} strokeWidth={4} strokeDasharray="8 10" />
              <line x1={mx + 14} y1={my} x2={s.x - 100} y2={s.y} stroke={C.magenta} strokeWidth={4} strokeDasharray="8 10" />
              <text x={mx} y={my + 10} textAnchor="middle" fontFamily={jakarta} fontWeight={800} fontSize={30} fill={C.magenta}>×</text>
            </g>
          );
        })}
      </svg>
      {SISTEMAS.map((s) => (
        <Tile key={s.key} s={s} at={at[s.key]} shake={s.key === "ota" ? shake : 0} />
      ))}
      {/* Etiqueta de comisión sobre OTA */}
      {frame >= at.comision - 1 ? (
        <div
          style={{
            position: "absolute",
            left: 912 - 150,
            top: 326 + 84,
            width: 300,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: C.magenta,
              borderRadius: 999,
              padding: "12px 26px",
              fontFamily: jakarta,
              fontWeight: 800,
              fontSize: 30,
              color: "#fff",
              whiteSpace: "nowrap",
              boxShadow: "0 12px 30px rgba(224,67,106,0.45)",
              scale: String(interpolate(com, [0, 1], [0.3, 1])),
              rotate: `${interpolate(com, [0, 1], [-14, -4])}deg`,
              opacity: Math.min(1, com * 1.5),
            }}
          >
            − comisión por venta
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 2. Hub: los sistemas se conectan a un solo ecosistema ──────────────────
export const Hub: React.FC<{ at: At }> = ({ at }) => {
  const frame = useCurrentFrame();
  const exit = useExit();
  const hub = useSpring(0, 12, 160);
  const join = useSpring(at.integra, 16, 120);
  const pill = useSpring(at.automatizar, 12, 180);
  const badge = useSpring(at.h247, 9, 220);
  const HX = 540, HY = 296;
  const pulse = 1 + 0.04 * Math.sin(frame / 5);
  return (
    <AbsoluteFill style={{ ...salida(exit) }}>
      <svg width={1080} height={600} style={{ position: "absolute", inset: 0 }}>
        {SISTEMAS.map((s) => {
          // Del lugar donde quedaron sueltos a una órbita alrededor del núcleo
          const ox = HX + (s.x < HX ? -1 : 1) * (s.x < 300 || s.x > 800 ? 330 : 175);
          const x = interpolate(join, [0, 1], [s.x, ox]);
          const draw = interpolate(frame, [at.integra + 8, at.integra + 24], [0, 1], CLAMP);
          const len = Math.abs(x - HX);
          return (
            <line
              key={s.key}
              x1={HX}
              y1={HY}
              x2={x}
              y2={HY}
              stroke={C.verde}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - draw)}
            />
          );
        })}
      </svg>
      {SISTEMAS.map((s) => {
        const ox = HX + (s.x < HX ? -1 : 1) * (s.x < 300 || s.x > 800 ? 330 : 175);
        const x = interpolate(join, [0, 1], [s.x, ox]);
        const y = interpolate(join, [0, 1], [s.y, HY]);
        const appear = interpolate(frame, [0, 8], [0, 1], CLAMP);
        return (
          <div
            key={s.key}
            style={{
              position: "absolute",
              left: x - 62,
              top: y - 62,
              width: 124,
              height: 124,
              borderRadius: 28,
              background: interpolate(join, [0, 1], [0, 1]) > 0.5 ? C.verde : CARD,
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: SHADOW,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: appear,
              rotate: `${interpolate(join, [0, 1], [s.rot, 0])}deg`,
              scale: String(interpolate(join, [0, 1], [0.9, 0.82])),
            }}
          >
            <Icon name={s.key} size={42} />
            <div style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 28, color: "#fff" }}>{s.label}</div>
          </div>
        );
      })}
      {/* Núcleo */}
      <div
        style={{
          position: "absolute",
          left: HX - 95,
          top: HY - 95,
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${C.verdeClaro}, ${C.verde} 55%, #1d7a44)`,
          boxShadow: `0 0 0 ${10 * join}px rgba(46,165,95,0.25), 0 20px 60px rgba(46,165,95,0.55)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(interpolate(hub, [0, 1], [0.2, 1]) * (join > 0.98 ? pulse : 1)),
          opacity: Math.min(1, hub * 1.5),
        }}
      >
        <Img src={staticFile("iso-white.png")} style={{ width: 150, height: 150 }} />
      </div>
      <div style={{ position: "absolute", top: 84, width: "100%", textAlign: "center", opacity: hub }}>
        <Eyebrow>UN SOLO ECOSISTEMA</Eyebrow>
      </div>
      {/* Ventas automatizadas 24/7 */}
      {frame >= at.automatizar - 1 ? (
        <div style={{ position: "absolute", top: 408, width: "100%", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "rgba(247,245,240,0.96)",
              borderRadius: 999,
              padding: "14px 18px 14px 30px",
              boxShadow: SHADOW,
              opacity: Math.min(1, pill * 1.4),
              translate: `0 ${interpolate(pill, [0, 1], [30, 0])}px`,
              scale: String(interpolate(pill, [0, 1], [0.8, 1])),
            }}
          >
            <span style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 36, color: C.teal, letterSpacing: -0.5 }}>Ventas automatizadas</span>
            <span
              style={{
                fontFamily: jakarta,
                fontWeight: 800,
                fontSize: 34,
                color: "#fff",
                background: C.verde,
                borderRadius: 999,
                padding: "6px 18px",
                fontVariantNumeric: "tabular-nums",
                scale: String(interpolate(badge, [0, 1], [0, 1])),
                display: "inline-block",
                width: interpolate(badge, [0, 1], [0, 116]),
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              24/7
            </span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 3. Horario: el equipo cubre 9 de 24 horas ───────────────────────────────
export const Horario: React.FC<{ at: At }> = ({ at }) => {
  const frame = useCurrentFrame();
  const exit = useExit(6);
  const card = useSpring(0, 14, 180);
  const BAR = 820;
  const hx = (h: number) => (h / 24) * BAR;
  const fill = interpolate(frame, [at.nueve, at.seis + 4], [9, 18], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const lbl9 = useSpring(at.nueve, 12, 200);
  const lbl6 = useSpring(at.seis, 12, 200);
  return (
    <AbsoluteFill style={{ ...salida(exit), alignItems: "center", paddingTop: 128 }}>
      <div
        style={{
          width: BAR + 80,
          background: CARD,
          borderRadius: 30,
          padding: "26px 40px 30px",
          boxShadow: SHADOW,
          border: "2px solid rgba(255,255,255,0.12)",
          opacity: Math.min(1, card * 1.4),
          translate: `0 ${interpolate(card, [0, 1], [-40, 0])}px`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 38, color: "#fff", letterSpacing: -0.5 }}>Tu equipo comercial</div>
          <div style={{ fontFamily: jakarta, fontWeight: 700, fontSize: 26, color: "rgba(255,255,255,0.6)" }}>24 h</div>
        </div>
        <div style={{ position: "relative", height: 46, marginTop: 22, borderRadius: 12, overflow: "hidden", background: "rgba(224,67,106,0.28)" }}>
          {/* rayado: horas sin atención */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "repeating-linear-gradient(-45deg, rgba(224,67,106,0.55) 0 8px, transparent 8px 18px)",
            }}
          />
          {frame >= at.nueve ? (
            <div
              style={{
                position: "absolute",
                left: hx(9),
                width: hx(fill) - hx(9),
                top: 0,
                bottom: 0,
                background: `linear-gradient(90deg, ${C.verde}, ${C.verdeClaro})`,
              }}
            />
          ) : null}
        </div>
        <div style={{ position: "relative", height: 46, marginTop: 10 }}>
          {[
            { h: 9, txt: "9:00", t: lbl9 },
            { h: 18, txt: "18:00", t: lbl6 },
          ].map((l) => (
            <div
              key={l.txt}
              style={{
                position: "absolute",
                left: hx(l.h) - 60,
                width: 120,
                textAlign: "center",
                fontFamily: jakarta,
                fontWeight: 800,
                fontSize: 34,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
                opacity: Math.min(1, l.t * 1.5),
                translate: `0 ${interpolate(l.t, [0, 1], [-14, 0])}px`,
              }}
            >
              {l.txt}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 4. Corte a pantalla completa: «Nuestro ecosistema trabaja 24/7» ─────────
export const Full247: React.FC<{ at: At }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Apertura y cierre en círculo (iris)
  const iris = Math.min(
    interpolate(frame, [0, 9], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) }),
    interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], { ...CLAMP, easing: Easing.in(Easing.cubic) }),
  );
  const l1 = useSpring(at.ecosistema - 2, 14, 200);
  const l2 = useSpring(at.trabaja - 2, 14, 200);
  const big = useSpring(at.h247 - 2, 10, 140);
  const ring = interpolate(frame, [4, at.h247 + 6], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const R = 380, CIRC = 2 * Math.PI * R;
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${iris * 120}% at 50% 42%)`,
        background: `radial-gradient(ellipse 80% 55% at 50% 45%, #0b4a3f 0%, ${C.teal} 70%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Anillo de 24 horas que se completa */}
      <svg width={1000} height={1000} style={{ position: "absolute", top: 960 - 500 - 120, left: 40 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const on = ring * 24 > i;
          return (
            <line
              key={i}
              x1={500 + Math.cos(a) * (R + 26)}
              y1={500 + Math.sin(a) * (R + 26)}
              x2={500 + Math.cos(a) * (R + (i % 6 === 0 ? 58 : 44))}
              y2={500 + Math.sin(a) * (R + (i % 6 === 0 ? 58 : 44))}
              stroke={on ? C.verdeClaro : "rgba(255,255,255,0.18)"}
              strokeWidth={i % 6 === 0 ? 7 : 4}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={500} cy={500} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
        <circle
          cx={500}
          cy={500}
          r={R}
          fill="none"
          stroke={C.verde}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - ring)}
          transform="rotate(-90 500 500)"
          style={{ filter: "drop-shadow(0 0 18px rgba(46,165,95,0.7))" }}
        />
      </svg>
      <div style={{ position: "absolute", top: 640, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontFamily: jakarta,
            fontWeight: 700,
            fontSize: 54,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: -0.5,
            opacity: l1,
            translate: `0 ${interpolate(l1, [0, 1], [24, 0])}px`,
          }}
        >
          Nuestro ecosistema
        </div>
        <div
          style={{
            fontFamily: jakarta,
            fontWeight: 800,
            fontSize: 64,
            color: C.verdeClaro,
            letterSpacing: -1,
            opacity: l2,
            translate: `0 ${interpolate(l2, [0, 1], [24, 0])}px`,
          }}
        >
          trabaja
        </div>
        <div
          style={{
            fontFamily: jakarta,
            fontWeight: 800,
            fontSize: 300,
            lineHeight: 1,
            marginTop: 6,
            letterSpacing: -14,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
            opacity: Math.min(1, big * 2),
            scale: String(interpolate(big, [0, 1], [1.5, 1])),
            textShadow: "0 18px 60px rgba(0,0,0,0.45)",
          }}
        >
          24/7
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 5. Crecimiento: ventas y reservas que suben ─────────────────────────────
export const Crecimiento: React.FC<{ at: At }> = ({ at }) => {
  const frame = useCurrentFrame();
  const exit = useExit();
  const card = useSpring(0, 14, 180);
  const draw = interpolate(frame, [4, at.aumenten + 14], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const tagV = useSpring(2, 12, 200);
  const tagR = useSpring(at.reservas, 12, 200);
  const W = 760, H = 190;
  const pts = [0, 0.12, 0.08, 0.3, 0.26, 0.5, 0.46, 0.72, 0.68, 1].map((v, i, arr) => [(i / (arr.length - 1)) * W, H - 14 - v * (H - 34)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const LEN = 1100;
  const tip = pts[Math.min(pts.length - 1, Math.floor(draw * (pts.length - 1)))];
  return (
    <AbsoluteFill style={{ ...salida(exit), alignItems: "center", paddingTop: 120 }}>
      <div
        style={{
          width: W + 80,
          background: CARD,
          borderRadius: 30,
          padding: "24px 40px 26px",
          boxShadow: SHADOW,
          border: "2px solid rgba(255,255,255,0.12)",
          opacity: Math.min(1, card * 1.4),
          translate: `0 ${interpolate(card, [0, 1], [-40, 0])}px`,
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { txt: "Ventas", t: tagV },
            { txt: "Reservas", t: tagR },
          ].map((g) => (
            <div
              key={g.txt}
              style={{
                fontFamily: jakarta,
                fontWeight: 800,
                fontSize: 34,
                color: "#fff",
                background: "rgba(46,165,95,0.22)",
                border: `2px solid ${C.verde}`,
                borderRadius: 999,
                padding: "8px 22px",
                opacity: Math.min(1, g.t * 1.5),
                scale: String(interpolate(g.t, [0, 1], [0.6, 1])),
              }}
            >
              {g.txt} <span style={{ color: C.verdeClaro }}>↑</span>
            </div>
          ))}
        </div>
        <svg width={W} height={H} style={{ marginTop: 16, overflow: "visible" }}>
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={C.verde} stopOpacity={0.45} />
              <stop offset="1" stopColor={C.verde} stopOpacity={0} />
            </linearGradient>
            <clipPath id="reveal">
              <rect x={0} y={-20} width={W * draw} height={H + 40} />
            </clipPath>
          </defs>
          <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="url(#area)" clipPath="url(#reveal)" />
          <path
            d={d}
            fill="none"
            stroke={C.verdeClaro}
            strokeWidth={7}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={LEN}
            strokeDashoffset={LEN * (1 - draw)}
          />
          {draw > 0.02 ? <circle cx={tip[0]} cy={tip[1]} r={11} fill="#fff" stroke={C.verde} strokeWidth={5} /> : null}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ── 6. Comisiones: lo que se deja de perder vs lo que se gana ───────────────
const Fila: React.FC<{ at: number; mal?: boolean; children: React.ReactNode }> = ({ at, mal, children }) => {
  const frame = useCurrentFrame();
  const t = useSpring(at, 12, 190);
  const strike = interpolate(frame, [at + 10, at + 22], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  if (frame < at - 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: mal ? CARD : "rgba(247,245,240,0.97)",
        borderRadius: 24,
        padding: "20px 34px 20px 22px",
        boxShadow: SHADOW,
        opacity: Math.min(1, t * 1.5),
        translate: `${interpolate(t, [0, 1], [mal ? -80 : 80, 0])}px 0`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: mal ? C.magenta : C.verde,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: jakarta,
          fontWeight: 800,
          fontSize: 34,
        }}
      >
        {mal ? "✕" : "✓"}
      </div>
      <div style={{ position: "relative" }}>
        <span
          style={{
            fontFamily: jakarta,
            fontWeight: 800,
            fontSize: 42,
            letterSpacing: -0.5,
            color: mal ? "rgba(255,255,255,0.85)" : C.teal,
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </span>
        {mal ? (
          <div
            style={{
              position: "absolute",
              left: -6,
              top: "52%",
              height: 6,
              borderRadius: 3,
              width: `calc(${strike * 100}% + 12px)`,
              background: C.magenta,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export const Comisiones: React.FC<{ at: At }> = ({ at }) => {
  const exit = useExit();
  return (
    <AbsoluteFill style={{ ...salida(exit), alignItems: "center", paddingTop: 140 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Fila at={0} mal>
          Comisiones externas
        </Fila>
        <Fila at={at.aumenta}>Más reservas cada día</Fila>
      </div>
    </AbsoluteFill>
  );
};

// ── 7. CTA bajo el logo del cierre ──────────────────────────────────────────
export const Cta: React.FC<{ texto: string; web: string }> = ({ texto, web }) => {
  const frame = useCurrentFrame();
  const exit = useExit(6);
  const t = useSpring(0, 11, 190);
  const w = useSpring(10, 14, 200);
  const shine = interpolate(frame, [14, 40], [-0.3, 1.3], CLAMP);
  return (
    <AbsoluteFill style={{ ...salida(exit), alignItems: "center", paddingTop: 318 }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(180deg, ${C.verdeClaro} -40%, ${C.verde} 60%)`,
          borderRadius: 999,
          padding: "22px 46px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 18px 46px rgba(46,165,95,0.5)",
          opacity: Math.min(1, t * 1.5),
          scale: String(interpolate(t, [0, 1], [0.5, 1])),
        }}
      >
        <span style={{ fontFamily: jakarta, fontWeight: 800, fontSize: 46, color: "#fff", letterSpacing: -0.5, whiteSpace: "nowrap" }}>{texto}</span>
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
    </AbsoluteFill>
  );
};

// ── Placa final (después del último clip) ───────────────────────────────────
export const PlacaFinal: React.FC<{ texto: string; web: string }> = ({ texto, web }) => {
  const frame = useCurrentFrame();
  const iris = interpolate(frame, [0, 12], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const logo = useSpring(6, 13, 160);
  const btn = useSpring(14, 12, 180);
  const out = interpolate(frame, [52, 60], [1, 0], CLAMP);
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${iris * 120}% at 50% 50%)`,
        background: `radial-gradient(ellipse 80% 55% at 50% 45%, #0b4a3f 0%, ${C.teal} 70%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44, opacity: out }}>
        <div
          style={{
            background: C.crema,
            borderRadius: 34,
            padding: "36px 56px",
            boxShadow: SHADOW,
            opacity: logo,
            scale: String(interpolate(logo, [0, 1], [0.7, 1])),
          }}
        >
          <Img src={staticFile("logo.png")} style={{ width: 560, display: "block" }} />
        </div>
        <div
          style={{
            background: C.verde,
            borderRadius: 999,
            padding: "22px 46px",
            fontFamily: jakarta,
            fontWeight: 800,
            fontSize: 48,
            color: "#fff",
            letterSpacing: -0.5,
            boxShadow: "0 18px 46px rgba(46,165,95,0.45)",
            opacity: btn,
            translate: `0 ${interpolate(btn, [0, 1], [30, 0])}px`,
          }}
        >
          {texto} →
        </div>
        <div style={{ fontFamily: jakarta, fontWeight: 700, fontSize: 36, color: "rgba(255,255,255,0.85)", opacity: btn }}>{web}</div>
      </div>
    </AbsoluteFill>
  );
};
