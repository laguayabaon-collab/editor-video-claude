import { useMemo } from "react";
import {
  createTikTokStyleCaptions,
  type Caption,
  type TikTokPage,
} from "@remotion/captions";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CAP_FONTS, type CapFont } from "./fonts";
import data from "./edit-data.json";
import { COLORES, rgba } from "./marca";

// "accent": la palabra activa en verde · "fade": sin resaltado
export type CapStyle = "fade" | "accent" | "none";
// Capa inferior que da contraste a los subtítulos
export type Scrim = "none" | "degradado" | "marca" | "vidrio";

const ACCENT = "#35C75A";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Palabras clave del mensaje → peso máximo de la fuente
const KEYWORDS = new Set<string>(data.keywords);
const isKeywordWord = (text: string) =>
  KEYWORDS.has(text.replace(/[^\p{L}\p{N}/]/gu, "").toUpperCase());

const SWITCH_CAPTIONS_EVERY_MS = 1300;
const BOTTOM = 400; // distancia del renglón al borde inferior (zona segura de reels)

// ── Capa inferior ───────────────────────────────────────────────────────────
export const ScrimLayer: React.FC<{ scrim: Scrim }> = ({ scrim }) => {
  if (scrim === "none") return null;
  if (scrim === "degradado")
    return (
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 14%, rgba(0,0,0,0.18) 26%, transparent 36%)",
        }}
      />
    );
  if (scrim === "marca")
    return (
      <AbsoluteFill
        style={{
          background:
            // cubre hasta ~y 900: el texto de la voz vive entre y≈1000 y 1248 (zona segura)
            `linear-gradient(to top, ${rgba(COLORES.oscuro, 0.9)} 0%, ${rgba(COLORES.oscuro, 0.78)} 22%, ${rgba(COLORES.oscuro, 0.45)} 38%, ${rgba(COLORES.oscuro, 0.12)} 50%, transparent 58%)`,
        }}
      />
    );
  // vidrio: panel esmerilado con filo verde
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div
        style={{
          height: 560,
          backdropFilter: "blur(10px) saturate(1.15)",
          background: `linear-gradient(to top, ${rgba(COLORES.oscuro, 0.72)}, ${rgba(COLORES.oscuro, 0.38)})`,
          borderTop: `3px solid ${rgba(COLORES.claro, 0.85)}`,
          maskImage: "linear-gradient(to top, black 82%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ── Una página de subtítulos: las palabras entran a medida que se dicen ─────
const Word: React.FC<{
  text: string;
  fromF: number;
  toF: number;
  font: (typeof CAP_FONTS)[CapFont];
  capStyle: CapStyle;
}> = ({ text, fromF, toF, font, capStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - fromF + 2, fps, config: { damping: 15, stiffness: 260, mass: 0.6 } });
  const active = capStyle === "accent" && frame >= fromF && frame < toF;
  const pulse = spring({ frame: frame - fromF, fps, config: { damping: 11, stiffness: 300, mass: 0.5 } });
  const after = spring({ frame: frame - toF, fps, config: { damping: 20, stiffness: 200 } });
  const scale = active ? interpolate(pulse, [0, 1], [1, 1.04]) : interpolate(after, [0, 1], [1.04, 1]);
  const kw = isKeywordWord(text);
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: font.family,
        fontWeight: kw ? font.heavy : 700,
        fontSize: 64,
        lineHeight: 1.18,
        letterSpacing: -0.5,
        color: active ? ACCENT : "#fff",
        opacity: interpolate(enter, [0, 1], [0, 1], CLAMP),
        translate: `0 ${interpolate(enter, [0, 1], [26, 0])}px`,
        scale: String(frame >= fromF ? scale : 1),
        filter: `blur(${interpolate(enter, [0, 1], [8, 0], CLAMP)}px)`,
        textShadow: "0 2px 3px rgba(0,0,0,0.7), 0 6px 22px rgba(0,0,0,0.55)",
      }}
    >
      {text}
    </span>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage; capStyle: CapStyle; capFont: CapFont }> = ({ page, capStyle, capFont }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], CLAMP);
  const font = CAP_FONTS[capFont];
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: `0 80px ${BOTTOM}px` }}>
      <div
        style={{
          opacity: out,
          translate: `0 ${interpolate(out, [0, 1], [-10, 0])}px`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 22,
          rowGap: 4,
          maxWidth: 900,
        }}
      >
        {page.tokens.map((t) => (
          <Word
            key={t.fromMs}
            text={t.text.trim()}
            fromF={Math.round(((t.fromMs - page.startMs) / 1000) * fps)}
            toF={Math.round(((t.toMs - page.startMs) / 1000) * fps)}
            font={font}
            capStyle={capStyle}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{
  captions: Caption[];
  capStyle?: CapStyle;
  capFont?: CapFont;
}> = ({ captions, capStyle = "accent", capFont = "jakarta" }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS }),
    [captions],
  );
  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = (page.startMs / 1000) * fps;
        const endFrame = Math.min(
          nextPage ? (nextPage.startMs / 1000) * fps : Infinity,
          startFrame + (SWITCH_CAPTIONS_EVERY_MS / 1000) * fps + fps * 0.6,
        );
        const durationInFrames = endFrame - startFrame;
        if (durationInFrames <= 0) return null;
        return (
          <Sequence
            key={index}
            name={`Sub: ${page.text.slice(0, 24)}`}
            from={Math.round(startFrame)}
            durationInFrames={Math.ceil(durationInFrames)}
          >
            <CaptionPage page={page} capStyle={capStyle} capFont={capFont} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
