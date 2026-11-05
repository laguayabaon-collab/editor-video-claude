import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

// Roboto: texto de UI de los overlays clásicos (pills, contraste, callout, ledger).
export const { fontFamily: uiFont } = loadRoboto("normal", { weights: ["400", "500", "700", "900"], subsets: ["latin"] });

// Subtítulos clásicos (solo si se piden con capStyle; por defecto el video usa texto en movimiento, Kinetic.tsx).
export type CapFont = "jakarta" | "roboto";
export const CAP_FONTS: Record<CapFont, { family: string; heavy: number; label: string }> = {
  jakarta: {
    family: loadJakarta("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily,
    heavy: 800,
    label: "Plus Jakarta Sans",
  },
  roboto: { family: uiFont, heavy: 900, label: "Roboto" },
};

export const captionFont = uiFont;
