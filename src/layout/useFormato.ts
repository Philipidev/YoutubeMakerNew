import { useVideoConfig } from "remotion";
import { safe, tipos } from "../theme";
import type { Posicao } from "../schema/episodio";

export type Formato = "vertical" | "horizontal";

export const useFormato = () => {
  const { width, height } = useVideoConfig();
  const formato: Formato = height > width ? "vertical" : "horizontal";
  const s = safe[formato];
  const area = {
    x: width * s.lados,
    y: height * s.topo,
    w: width * (1 - 2 * s.lados),
    h: height * (1 - s.topo - s.base),
  };
  /** Centro X de cada posição fixa do palco. */
  const posX: Record<Posicao, number> =
    formato === "vertical"
      ? { esq: width * 0.27, centro: width * 0.5, dir: width * 0.73 }
      : { esq: width * 0.25, centro: width * 0.5, dir: width * 0.75 };
  return { formato, width, height, area, posX, t: tipos[formato] };
};
