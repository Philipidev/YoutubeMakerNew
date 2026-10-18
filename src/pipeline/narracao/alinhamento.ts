import type { Palavra } from "../../schema/timestamps";
import { tokenizar } from "./estimativa";

/**
 * Converte o alinhamento por caractere (ElevenLabs) em tempos por palavra.
 * As palavras são os tokens EXATOS da narração (legenda sai do texto do roteiro, não da transcrição).
 */
export const palavrasDeCaracteres = (
  texto: string,
  al: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] },
  offset = 0,
): Palavra[] => {
  const chars = al.characters.join("");
  if (chars !== texto) {
    // o alinhamento normalmente espelha o texto enviado; se não, alinha pelos caracteres não-brancos
    return alinharPorSequencia(texto, al, offset);
  }
  const out: Palavra[] = [];
  let cursor = 0;
  for (const tok of tokenizar(texto)) {
    const ini = texto.indexOf(tok, cursor);
    const fim = ini + tok.length - 1;
    cursor = fim + 1;
    out.push({ texto: tok, inicio: offset + al.character_start_times_seconds[ini], fim: offset + al.character_end_times_seconds[fim] });
  }
  return out;
};

const alinharPorSequencia = (
  texto: string,
  al: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] },
  offset: number,
): Palavra[] => {
  // índices dos caracteres não-brancos do alinhamento
  const idx: number[] = [];
  al.characters.forEach((c, i) => {
    if (c.trim()) idx.push(i);
  });
  const out: Palavra[] = [];
  let k = 0;
  for (const tok of tokenizar(texto)) {
    const n = [...tok].length;
    const a = idx[Math.min(k, idx.length - 1)];
    const b = idx[Math.min(k + n - 1, idx.length - 1)];
    out.push({ texto: tok, inicio: offset + (al.character_start_times_seconds[a] ?? 0), fim: offset + (al.character_end_times_seconds[b] ?? 0) });
    k += n;
  }
  return out;
};

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type PalavraReconhecida = { palavra: string; inicio: number; fim: number };

/**
 * Alinha tokens do roteiro com palavras reconhecidas pelo Whisper (voz gravada).
 * Programação dinâmica (edit distance) sobre palavras normalizadas; tokens sem par recebem tempo interpolado.
 */
export const alinharRoteiro = (tokens: string[], rec: PalavraReconhecida[]): Palavra[] => {
  const A = tokens.map(normal);
  const B = rec.map((r) => normal(r.palavra));
  const n = A.length;
  const m = B.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const custo = A[i - 1] === B[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
    }
  // backtrack: par (i,j) quando diagonal
  const par = new Array<number>(n).fill(-1);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const custo = A[i - 1] === B[j - 1] ? 0 : 1;
    if (d[i][j] === d[i - 1][j - 1] + custo) {
      par[i - 1] = j - 1;
      i--;
      j--;
    } else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  const out: Palavra[] = tokens.map((t, k) => (par[k] >= 0 ? { texto: t, inicio: rec[par[k]].inicio, fim: rec[par[k]].fim } : { texto: t, inicio: NaN, fim: NaN }));
  // interpola os sem par entre vizinhos conhecidos
  for (let k = 0; k < out.length; k++) {
    if (!Number.isNaN(out[k].inicio)) continue;
    let a = k - 1;
    while (a >= 0 && Number.isNaN(out[a].inicio)) a--;
    let b = k + 1;
    while (b < out.length && Number.isNaN(out[b].inicio)) b++;
    const t0 = a >= 0 ? out[a].fim : rec[0]?.inicio ?? 0;
    const t1 = b < out.length ? out[b].inicio : rec[rec.length - 1]?.fim ?? t0 + 0.4 * (b - a);
    const passo = (t1 - t0) / (b - a);
    out[k] = { texto: tokens[k], inicio: t0 + passo * (k - a - 1), fim: t0 + passo * (k - a) };
  }
  return out;
};
