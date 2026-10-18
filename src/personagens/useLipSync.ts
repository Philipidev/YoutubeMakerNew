import type { Palavra } from "../schema/timestamps";

/**
 * Abertura da boca (0..1) a partir dos timestamps de palavra.
 * Dentro de uma palavra oscila no ritmo das sílabas; entre palavras fecha suavemente.
 */
export const aberturaBoca = (palavras: Palavra[], s: number): number => {
  const i = palavras.findIndex((p) => s >= p.inicio && s < p.fim);
  if (i < 0) {
    const ant = [...palavras].reverse().find((p) => p.fim <= s);
    if (ant && s - ant.fim < 0.08) return 0.25 * (1 - (s - ant.fim) / 0.08);
    return 0;
  }
  const p = palavras[i];
  const sil = Math.max(1, p.texto.replace(/[^aeiouáéíóúâêôãõà]/gi, "").length);
  const fase = ((s - p.inicio) / Math.max(0.05, p.fim - p.inicio)) * sil * Math.PI;
  return 0.2 + 0.6 * Math.abs(Math.sin(fase));
};
