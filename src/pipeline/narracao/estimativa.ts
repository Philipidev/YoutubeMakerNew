import type { Palavra, Timestamps } from "../../schema/timestamps";

/**
 * Estimativa de tempos de fala sem áudio (provider mock e prévia).
 * Puro: roda tanto no Node quanto no navegador do Studio.
 */
const CHARS_POR_SEG = 14;
const PAUSA_VIRGULA = 0.18;
const PAUSA_PONTO = 0.35;
const PAUSA_ENTRE_CENAS = 0.4;

export const tokenizar = (texto: string): string[] => texto.trim().split(/\s+/).filter(Boolean);

export const estimarPalavras = (texto: string, inicio: number): Palavra[] => {
  let t = inicio;
  return tokenizar(texto).map((tok) => {
    const dur = Math.max(0.12, tok.replace(/[^\p{L}\p{N}]/gu, "").length / CHARS_POR_SEG + 0.04);
    const p = { texto: tok, inicio: t, fim: t + dur };
    t += dur;
    if (/[.!?…:]$/.test(tok)) t += PAUSA_PONTO;
    else if (/[,;]$/.test(tok)) t += PAUSA_VIRGULA;
    return p;
  });
};

export const estimarTimestamps = (cenas: { id: string; narracao: string }[]): Timestamps => {
  let t = 0;
  const out = cenas.map((c) => {
    const palavras = estimarPalavras(c.narracao, t);
    const fim = palavras.length ? palavras[palavras.length - 1].fim : t + 1;
    const cena = { cenaId: c.id, inicioSeg: t, fimSeg: fim, palavras };
    t = fim + PAUSA_ENTRE_CENAS;
    return cena;
  });
  return { provider: "mock", duracaoSeg: t, cenas: out };
};
