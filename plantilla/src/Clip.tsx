import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions, ScrimLayer } from "./Captions";
import type { CapStyle, Scrim } from "./Captions";
import type { CapFont } from "./fonts";
import type { Caption } from "@remotion/captions";

export type Segment = {
  clip: string; // archivo en public/videos
  start: number; // segundo del clip donde empieza el corte
  dur: number;
  scaleFrom: number;
  scaleTo: number;
  gain: number;
  label: string;
  hard: boolean; // corte seco con el segmento anterior (empalme de la misma toma)
  captions: Caption[];
};

const EASE = Easing.bezier(0.33, 0, 0.2, 1);

// Sin color grade (color original del iPhone — decisión aprobada). Solo viñeta.
export const Clip: React.FC<{
  seg: Segment;
  overlap: number;
  isFirst: boolean;
  isLast: boolean;
  hardOut: boolean; // el siguiente segmento entra con corte seco
  capStyle?: CapStyle;
  capFont?: CapFont;
  scrim?: Scrim;
  punches?: number[]; // frames (relativos al clip) donde la cámara hace punch-in
  croma?: boolean; // presentador recortado (WebM con alfa): sin fondo negro, la viñeta y la capa van en VideoEdit
  encuadre?: { escala: number; dx: number; dy: number } | null; // acerca un plano abierto (p. ej. pantalla verde)
}> = ({ seg, overlap, isFirst, isLast, hardOut, capStyle, capFont, scrim = "none", punches = [], croma = false, encuadre = null }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const kenBurns = interpolate(frame, [0, durationInFrames], [seg.scaleFrom, seg.scaleTo]);
  // Punch-in: entra en 4 frames, se sostiene ~0,8 s y vuelve en 10
  const punch = punches.reduce(
    (m, p) => Math.max(m, interpolate(frame - p, [0, 4, 24, 34], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })),
    0,
  );

  // Corte seco: 1 frame de fade (~33 ms) solo en audio/opacity para evitar pops
  const inDur = isFirst ? 8 : seg.hard ? 1 : overlap;
  const outDur = isLast ? 12 : hardOut ? 1 : overlap;
  const fadeCurve = (f: number) =>
    interpolate(f, [0, inDur, durationInFrames - outDur, durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const opacity = interpolate(
    frame,
    [0, inDur, durationInFrames - outDur, durationInFrames],
    [seg.hard ? 1 : 0, 1, 1, hardOut && !isLast ? 1 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );
  // Barrido vertical con desenfoque en las transiciones entre partes (no en cortes secos)
  const whipIn = !isFirst && !seg.hard ? interpolate(frame, [0, inDur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;
  const whipOut = !isLast && !hardOut ? interpolate(frame, [durationInFrames - outDur, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }) : 0;
  const whip = whipIn + whipOut;
  const scale = kenBurns * (1 + 0.07 * punch) * (1 + 0.2 * whip);

  return (
    <AbsoluteFill style={{ backgroundColor: croma ? undefined : "#000", opacity }}>
      <AbsoluteFill
        style={{
          scale: String(scale),
          translate: `0 ${whipIn * 190 - whipOut * 190}px`,
          filter: whip > 0.01 ? `blur(${whip * 16}px)` : undefined,
        }}
      >
        <AbsoluteFill style={encuadre ? { transform: `translate(${encuadre.dx}px, ${encuadre.dy}px) scale(${encuadre.escala})` } : undefined}>
          <Video
            src={staticFile(`videos/${seg.clip}`)}
            trimBefore={Math.round(seg.start * fps)}
            volume={(f) => seg.gain * fadeCurve(f)}
            objectFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Viñeta sutil */}
      {croma ? null : <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 42%, transparent 58%, rgba(0,0,0,0.28) 100%)",
        }}
      />}

      {croma ? null : <ScrimLayer scrim={scrim} />}
      {capStyle === "none" ? null : <Captions captions={seg.captions} capStyle={capStyle} capFont={capFont} />}
    </AbsoluteFill>
  );
};
