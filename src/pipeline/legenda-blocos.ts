import type { Palavra, Timestamps } from "../schema/timestamps";

/** Regras de legenda (puro, usado no .srt/.vtt e na legenda queimada). */
export const MAX_CHARS_LINHA = 42;
export const MAX_LINHAS = 2;
const PAUSA_QUEBRA_SEG = 0.25;
const MAX_DURACAO_BLOCO_SEG = 7;
const MIN_DURACAO_BLOCO_SEG = 0.8;
const EXTENSAO_MAX_SEG = 0.5;

export type BlocoLegenda = { inicio: number; fim: number; linhas: string[] };

const fimDeFrase = (p: string) => /[.!?…]["”»)]?$/.test(p);
const pausaLeve = (p: string) => /[,;:—–]["”»)]?$/.test(p);

/** Quebra uma lista de palavras em linhas ≤ MAX_CHARS_LINHA, preferindo quebrar após vírgula na 2ª metade. */
const quebrarLinhas = (palavras: string[]): string[] => {
  const linhas: string[] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    const cand = [...atual, p].join(" ");
    if (cand.length > MAX_CHARS_LINHA && atual.length) {
      linhas.push(atual.join(" "));
      atual = [p];
    } else atual.push(p);
  }
  if (atual.length) linhas.push(atual.join(" "));
  // rebalanceia 2 linhas: move palavras da 1ª para a 2ª se a 1ª estiver muito mais longa
  if (linhas.length === 2) {
    const ws = palavras;
    let melhor = { custo: Infinity, corte: 0 };
    for (let i = 1; i < ws.length; i++) {
      const a = ws.slice(0, i).join(" ");
      const b = ws.slice(i).join(" ");
      if (a.length > MAX_CHARS_LINHA || b.length > MAX_CHARS_LINHA) continue;
      const custo = Math.abs(a.length - b.length) - (pausaLeve(ws[i - 1]) ? 12 : 0);
      if (custo < melhor.custo) melhor = { custo, corte: i };
    }
    if (melhor.corte) return [ws.slice(0, melhor.corte).join(" "), ws.slice(melhor.corte).join(" ")];
  }
  return linhas;
};

const cabe = (palavras: string[]) => {
  // simula quebra gulosa e verifica limite de linhas
  let linhas = 1;
  let len = 0;
  for (const p of palavras) {
    if (p.length > MAX_CHARS_LINHA) return false;
    const novo = len === 0 ? p.length : len + 1 + p.length;
    if (novo > MAX_CHARS_LINHA) {
      linhas++;
      len = p.length;
    } else len = novo;
  }
  return linhas <= MAX_LINHAS;
};

const blocosDaCena = (palavras: Palavra[]): BlocoLegenda[] => {
  const blocos: BlocoLegenda[] = [];
  let atual: Palavra[] = [];
  const fechar = () => {
    if (!atual.length) return;
    blocos.push({
      inicio: atual[0].inicio,
      fim: atual[atual.length - 1].fim,
      linhas: quebrarLinhas(atual.map((p) => p.texto)),
    });
    atual = [];
  };
  palavras.forEach((p, i) => {
    if (atual.length && !cabe([...atual, p].map((x) => x.texto))) fechar();
    if (atual.length && p.fim - atual[0].inicio > MAX_DURACAO_BLOCO_SEG) fechar();
    atual.push(p);
    const prox = palavras[i + 1];
    const chars = atual.map((x) => x.texto).join(" ").length;
    const pausa = prox ? prox.inicio - p.fim : Infinity;
    if (fimDeFrase(p.texto) && chars >= 12) fechar();
    else if (pausa > PAUSA_QUEBRA_SEG && chars >= 20) fechar();
    else if (pausaLeve(p.texto) && chars >= MAX_CHARS_LINHA * 1.2) fechar();
  });
  fechar();
  return blocos;
};

/** Gera blocos de legenda a partir do texto exato da narração (tokens dos timestamps). */
export const gerarBlocos = (ts: Timestamps): BlocoLegenda[] => {
  const todos = ts.cenas.flatMap((c) => blocosDaCena(c.palavras));
  // ajusta durações: mínimo e pequena extensão sem invadir o próximo bloco
  return todos.map((b, i) => {
    const prox = todos[i + 1];
    const limite = prox ? prox.inicio - 0.05 : b.fim + EXTENSAO_MAX_SEG;
    const fim = Math.min(Math.max(b.fim + EXTENSAO_MAX_SEG, b.inicio + MIN_DURACAO_BLOCO_SEG), Math.max(limite, b.fim));
    return { ...b, fim };
  });
};
