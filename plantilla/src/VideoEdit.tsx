import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Branding } from "./Branding";
import { ScrimLayer, type CapStyle, type Scrim } from "./Captions";
import { FondoMarca, FondoVideo } from "./Fondo";
import { Cta, GuiaZonas, PlacaFinal, SalidaViva } from "./Cierre";
import { Clip } from "./Clip";
import type { Segment } from "./Clip";
import type { CapFont } from "./fonts";
import { Frase, type Linea, type TextStyle } from "./Kinetic";
import {
  ConceptPills,
  ContrastPair,
  MathCallout,
  RoiLedger,
  type LedgerRow,
} from "./Overlays";
import data from "./edit-data.json";

const FPS = data.fps;
const OVERLAP = Math.round(data.overlap * FPS);

const segments = data.segments as Segment[];
const branding = data.branding as { logo: string; cta?: { texto: string; web?: string } };

// Timeline: transición con barrido entre partes, corte seco (hard) en empalmes internos
let cursor = 0;
const timeline = segments.map((seg, i) => {
  const durF = Math.round(seg.dur * FPS);
  const from = cursor;
  const next = segments[i + 1];
  cursor += durF - (next && !next.hard ? OVERLAP : 0);
  return { seg, durF, from, i };
});
const CLIPS_END = Math.max(1, timeline.reduce((m, t) => Math.max(m, t.from + t.durF), 0));
// Placa final (si cortes.json trae branding.cta): entra 12 frames antes del final del último clip y dura 60.
const PLACA = branding.cta?.texto ? { from: CLIPS_END - 12, dur: 60 } : null;
export const EDIT_DURATION = PLACA ? PLACA.from + PLACA.dur : CLIPS_END;

type Cue = { kind: string; from: number; dur: number; props?: Record<string, unknown> };
const cues = data.overlays as Cue[];
// Pantalla verde: el presentador va recortado sobre el fondo de marca y las tomas «fondo» van detrás de él
const CROMA = !!(data as { croma?: boolean }).croma;
const ENCUADRE = (data as { encuadre?: { escala: number; dx: number; dy: number } | null }).encuadre ?? null;
const FONDOS = cues.filter((c) => c.kind === "fondo");
const ENCIMA = cues.filter((c) => c.kind !== "fondo");

// Punch-in de cámara en cada línea grande (xl) de las frases
const PUNCHES = cues.flatMap((c) =>
  c.kind !== "frase"
    ? []
    : (c.props!.lines as Linea[]).flatMap((l, i) => (l.s === "xl" ? [c.from + (c.props!.at as Record<string, number>)[`l${i}`]] : [])),
);

const renderCue = (c: Cue, estilo: TextStyle) => {
  switch (c.kind) {
    case "frase":
      return <Frase lines={c.props!.lines as Linea[]} at={c.props!.at as Record<string, number>} estilo={estilo} />;
    case "pills":
      return <ConceptPills items={c.props!.items as string[]} delays={c.props!.delays as number[]} />;
    case "contrast":
      return <ContrastPair mal={c.props!.mal as string} bien={c.props!.bien as string} />;
    case "callout":
      return <MathCallout emoji={c.props!.emoji as string} text={c.props!.text as string} />;
    case "ledger":
      return (
        <RoiLedger
          rows={c.props!.rows as LedgerRow[]}
          totalAt={c.props!.totalAt as number}
          totalLabel={c.props!.totalLabel as string}
          totalValue={c.props!.totalValue as string}
        />
      );
    case "cta":
      return (
        <Cta
          texto={(c.props?.texto as string) ?? branding.cta?.texto ?? ""}
          web={(c.props?.web as string) ?? branding.cta?.web}
        />
      );
    // Infografías propias de un video: agrégalas aquí (ejemplos en plantilla/referencias/).
    default:
      return null;
  }
};

// Golpes de sonido de cada overlay (frames relativos al inicio de la cue)
const cueBeats = (c: Cue): { at: number; sfx: string; vol: number }[] => {
  switch (c.kind) {
    case "pills":
      return (c.props!.delays as number[]).map((at) => ({ at, sfx: "pop.mp3", vol: 0.5 }));
    case "contrast":
      return [
        { at: 0, sfx: "pop.mp3", vol: 0.55 },
        { at: 16, sfx: "pop.mp3", vol: 0.55 },
      ];
    case "callout":
    case "cta":
      return [{ at: 0, sfx: "pop.mp3", vol: 0.6 }];
    case "ledger": {
      const rows = c.props!.rows as LedgerRow[];
      return [
        ...rows.map((r) => ({ at: r.at, sfx: "click.mp3", vol: 0.6 })),
        { at: c.props!.totalAt as number, sfx: "pop.mp3", vol: 0.75 },
      ];
    }
    default:
      return [];
  }
};

// Estilo aprobado (oct 2026): texto en movimiento «etiquetas» sin subtítulos clásicos, capa inferior de marca.
export const VideoEdit: React.FC<{ capStyle?: CapStyle; capFont?: CapFont; scrim?: Scrim; textStyle?: TextStyle; guias?: boolean }> = ({
  guias = false,
  capStyle = "none",
  textStyle = "etiquetas",
  capFont = "jakarta",
  scrim = "marca",
}) => {
  // El logo aparece en la parte «cierre» (o en la última, si no hay una con ese nombre).
  const cierre = [...timeline].reverse().find((t) => t.seg.label.startsWith("cierre")) ?? timeline[timeline.length - 1];
  if (!cierre) return <AbsoluteFill style={{ backgroundColor: "#000" }} />;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {CROMA ? <FondoMarca /> : null}
      {FONDOS.map((c, i) => (
        <Sequence key={`fondo${i}`} name={`Fondo · ${String(c.props?.src)}`} from={c.from} durationInFrames={c.dur}>
          <FondoVideo src={c.props!.src as string} fuente={(c.props?.fuente as number) ?? 5} />
        </Sequence>
      ))}
      {timeline.map(({ seg, durF, from, i }) => (
        <Sequence key={i} name={`${i + 1} · ${seg.label}`} from={from} durationInFrames={durF}>
          <Clip
            seg={seg}
            overlap={OVERLAP}
            isFirst={i === 0}
            isLast={i === timeline.length - 1}
            hardOut={!!timeline[i + 1]?.seg.hard}
            capStyle={capStyle}
            capFont={capFont}
            scrim={scrim}
            punches={PUNCHES.map((p) => p - from)}
            croma={CROMA}
            encuadre={ENCUADRE}
          />
        </Sequence>
      ))}
      {CROMA ? <ScrimLayer scrim={scrim} /> : null}

      {/* Overlays y sus SFX, con timing calculado desde la transcripción. Los gráficos salen con «salida viva». */}
      {ENCIMA.map((c, i) => (
        <Sequence key={`cue${i}`} name={`Overlay · ${c.kind}`} from={c.from} durationInFrames={c.dur}>
          {c.kind === "frase" ? renderCue(c, textStyle) : <SalidaViva>{renderCue(c, textStyle)}</SalidaViva>}
        </Sequence>
      ))}
      {cues.flatMap((c, i) =>
        cueBeats(c).map((b, j) => (
          <Sequence key={`sfx${i}-${j}`} name={`SFX ${c.kind} ${j + 1}`} from={c.from + b.at} durationInFrames={8}>
            <Audio src={staticFile(b.sfx)} volume={b.vol} />
          </Sequence>
        )),
      )}

      {/* Branding del cierre */}
      <Sequence name="Branding cierre" from={cierre.from + 10} durationInFrames={cierre.durF - 10}>
        <Branding />
      </Sequence>

      {/* Placa final con logo y CTA */}
      {PLACA && branding.cta ? (
        <>
          <Sequence name="Placa final" from={PLACA.from} durationInFrames={PLACA.dur}>
            <PlacaFinal texto={branding.cta.texto} web={branding.cta.web} logo={branding.logo} />
          </Sequence>
          <Sequence name="SFX placa" from={PLACA.from} durationInFrames={16}>
            <Audio src={staticFile("whoosh.mp3")} volume={0.45} />
          </Sequence>
        </>
      ) : null}

      {/* Zonas seguras en rojo (solo para revisar: --props={"guias":true}) */}
      {guias ? <GuiaZonas /> : null}

      {/* Whoosh solo en transiciones con barrido (no en cortes secos) */}
      {timeline.slice(1).map(({ from, seg }, i) =>
        seg.hard ? null : (
          <Sequence key={`w${i}`} name={`whoosh ${i + 1}`} from={from - 5} durationInFrames={16}>
            <Audio src={staticFile("whoosh.mp3")} volume={0.4} />
          </Sequence>
        ),
      )}
    </AbsoluteFill>
  );
};
