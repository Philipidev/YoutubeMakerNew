import type React from "react";

/**
 * Pool de transições entre cenas. A cena nova entra por cima da anterior durante DURACAO_TRANSICAO frames;
 * a anterior faz a saída casada (ex.: push empurra as duas). Escolha por sorteio determinístico.
 */
export const DURACAO_TRANSICAO = 14;

export const TRANSICOES = [
  "corte",
  "slideEsq",
  "slideDir",
  "slideCima",
  "push",
  "wipeDiagonal",
  "iris",
  "zoomPunch",
  "dissolve",
  "flash",
] as const;
export type Transicao = (typeof TRANSICOES)[number];

/** Peso de sorteio: transições chamativas aparecem menos que as discretas. */
export const PESOS_TRANSICAO: Record<Transicao, number> = {
  corte: 0.8,
  slideEsq: 1.2,
  slideDir: 1.2,
  slideCima: 1,
  push: 1.4,
  wipeDiagonal: 1.5,
  iris: 1.2,
  zoomPunch: 1.5,
  dissolve: 1.5,
  flash: 0.6,
};

/** Família visual: o sorteio evita repetir a família da cena anterior (dois slides seguidos parecem iguais). */
export const FAMILIA_TRANSICAO: Record<Transicao, string> = {
  corte: "corte",
  slideEsq: "desliza",
  slideDir: "desliza",
  slideCima: "desliza",
  push: "desliza",
  wipeDiagonal: "mascara",
  iris: "mascara",
  zoomPunch: "escala",
  dissolve: "fade",
  flash: "fade",
};

/** Estilo da cena que ENTRA. p: 0 → 1. */
export const estiloEntrada = (t: Transicao, p: number): React.CSSProperties => {
  const q = 1 - p;
  switch (t) {
    case "corte":
      return {};
    case "slideEsq":
      return { transform: `translateX(${q * 100}%)` };
    case "slideDir":
      return { transform: `translateX(${-q * 100}%)` };
    case "slideCima":
      return { transform: `translateY(${q * 100}%)` };
    case "push":
      return { transform: `translateX(${q * 100}%)` };
    case "wipeDiagonal": {
      const x = -50 + p * 250; // linha diagonal varrendo da esquerda para a direita
      return { clipPath: `polygon(0 0, ${x}% 0, ${x - 50}% 100%, 0 100%)` };
    }
    case "iris":
      return { clipPath: `circle(${p * 120}% at 50% 45%)` };
    case "zoomPunch":
      return { transform: `scale(${1 + 0.35 * q})`, opacity: p, filter: `blur(${q * 8}px)` };
    case "dissolve":
      return { opacity: p, filter: `blur(${q * 6}px)` };
    case "flash":
      return { opacity: p > 0.5 ? 1 : 0 };
  }
};

/** Estilo da cena que SAI (casada com a transição da cena seguinte). p: 0 → 1. */
export const estiloSaida = (t: Transicao, p: number): React.CSSProperties => {
  switch (t) {
    case "push":
      return { transform: `translateX(${-p * 100}%)` };
    case "slideEsq":
      return { transform: `translateX(${-p * 25}%)`, opacity: 1 - p * 0.6 };
    case "slideDir":
      return { transform: `translateX(${p * 25}%)`, opacity: 1 - p * 0.6 };
    case "slideCima":
      return { transform: `translateY(${-p * 20}%)`, opacity: 1 - p * 0.6 };
    case "zoomPunch":
      return { transform: `scale(${1 - 0.1 * p})`, opacity: 1 - p };
    case "dissolve":
      return { opacity: 1 - p };
    default:
      return {};
  }
};

/** Para o flash: opacidade da camada branca. */
export const opacidadeFlash = (p: number) => (p < 0.5 ? p * 2 : (1 - p) * 2) * 0.85;
