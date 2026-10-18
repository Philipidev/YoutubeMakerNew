/**
 * Aleatoriedade determinística: a mesma semente sempre gera a mesma escolha,
 * então re-renderizar um episódio dá exatamente o mesmo vídeo.
 */
export const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Gerador mulberry32 a partir de uma semente textual. */
export const rng = (semente: string) => {
  let a = hash(semente);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Escolhe um item da lista pela semente, evitando repetir `evitar` (ex.: a escolha da cena anterior). */
export const escolher = <T,>(lista: readonly T[], semente: string, evitar?: T): T => {
  const opcoes = lista.length > 1 && evitar !== undefined ? lista.filter((x) => x !== evitar) : lista;
  return opcoes[Math.floor(rng(semente)() * opcoes.length)];
};

/** Número em [min, max) pela semente. */
export const entre = (semente: string, min: number, max: number) => min + rng(semente)() * (max - min);
