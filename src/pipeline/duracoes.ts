import { FPS } from "../theme";
import type { TempoCena, Timestamps } from "../schema/timestamps";

/** Folga após a última palavra de cada cena, para o visual respirar. */
const PADDING_FIM_SEG = 0.25;

/**
 * Durações das cenas derivadas do áudio. A cena i vai do início da sua primeira palavra
 * (cena 0 começa em 0) até o início da cena i+1; a última até o fim do áudio + padding.
 */
export const calcularTempos = (ts: Timestamps): TempoCena[] => {
  const inicios = ts.cenas.map((c, i) => (i === 0 ? 0 : Math.round(c.inicioSeg * FPS)));
  const fimTotal = Math.round((ts.duracaoSeg + PADDING_FIM_SEG) * FPS);
  return ts.cenas.map((c, i) => {
    const inicio = inicios[i];
    const fim = i + 1 < inicios.length ? inicios[i + 1] : Math.max(fimTotal, Math.round((c.fimSeg + PADDING_FIM_SEG) * FPS));
    return { cenaId: c.cenaId, inicioFrame: inicio, duracaoFrames: Math.max(1, fim - inicio) };
  });
};
