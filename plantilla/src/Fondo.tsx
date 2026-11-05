// Fondos para material grabado en pantalla verde (cortes.json → "croma": true):
// FondoMarca = degradado del color oscuro de la marca con brillo y rejilla que se mueven lento;
// FondoVideo = una toma (generada o de archivo) que reemplaza al fondo mientras la voz habla de ella.
import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORES, rgba } from "./marca";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FondoMarca: React.FC = () => {
  const frame = useCurrentFrame();
  const gx = 50 + 8 * Math.sin(frame / 140);
  const gy = 38 + 6 * Math.cos(frame / 170);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORES.oscuro }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 50% at ${gx}% ${gy}%, ${rgba(COLORES.primario, 0.42)} 0%, ${rgba(COLORES.primario, 0.12)} 45%, transparent 75%)`,
        }}
      />
      {/* Rejilla sutil que se desplaza muy lento */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${rgba(COLORES.claro, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(COLORES.claro, 0.07)} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(frame * 0.4) % 90}px`,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
    </AbsoluteFill>
  );
};

// src en public/; `fuente` = duración de la toma en s (si la cue dura más, se ralentiza para cubrirla)
export const FondoVideo: React.FC<{ src: string; fuente?: number }> = ({ src, fuente = 5 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const vel = Math.min(1, fuente / (durationInFrames / fps));
  const op = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], CLAMP);
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ scale: String(zoom) }}>
        <Video src={staticFile(src)} muted playbackRate={vel} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {/* Velo de marca: mantiene la paleta y el contraste del presentador y los textos */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${rgba(COLORES.oscuro, 0.55)} 0%, ${rgba(COLORES.oscuro, 0.25)} 45%, ${rgba(COLORES.oscuro, 0.6)} 100%)` }} />
    </AbsoluteFill>
  );
};
