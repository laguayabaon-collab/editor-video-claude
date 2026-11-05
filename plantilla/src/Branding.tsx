import data from "./edit-data.json";

const branding = data.branding as { logo: string; badge?: string };
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ZONA } from "./zonas";

const POP = Easing.bezier(0.34, 1.56, 0.64, 1);

// Logos de cierre (branding.logo y, opcional, branding.badge, ambos en public/): aparecen arriba,
// en la parte «cierre», mientras la persona se presenta. Tarjeta blanca para el logo; el badge va suelto.
export const Branding: React.FC = () => {
  const frame = useCurrentFrame();

  const logoIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });
  const badgeIn = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: ZONA.arriba + 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: 26,
            padding: "20px 36px",
            boxShadow: "0 16px 44px rgba(0,0,0,0.28)",
            opacity: logoIn,
            scale: String(interpolate(logoIn, [0, 1], [0.7, 1])),
            translate: `0px ${interpolate(logoIn, [0, 1], [-30, 0])}px`,
          }}
        >
          <Img src={staticFile(branding.logo)} style={{ width: 360, display: "block" }} />
        </div>

        {branding.badge ? <Img
          src={staticFile(branding.badge)}
          style={{
            width: 300,
            borderRadius: 18,
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            opacity: badgeIn,
            scale: String(interpolate(badgeIn, [0, 1], [0.7, 1])),
            translate: `0px ${interpolate(badgeIn, [0, 1], [-20, 0])}px`,
          }}
        /> : null}
      </div>
    </AbsoluteFill>
  );
};
