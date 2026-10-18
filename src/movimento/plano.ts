import React from "react";
import type { Episodio } from "../schema/episodio";
import { escolher, rng } from "./aleatorio";
import { CAMERAS, type Camera } from "./camera";
import { FAMILIA_TRANSICAO, PESOS_TRANSICAO, TRANSICOES, type Transicao } from "./transicoes";

export type PlanoCena = {
  cenaId: string;
  camera: Camera;
  /** transição com que esta cena entra */
  entrada: Transicao;
  /** transição da cena seguinte (define a saída desta); null na última */
  saida: Transicao | null;
  /** semente estável para variações internas (gestos, brilhos, atrasos) */
  semente: string;
  /** onde ficam os cards em relação ao cenário/personagem (16:9); nunca repete a da cena anterior */
  composicao: Composicao;
};

/** Composição da cena no 16:9: cards à esquerda (cenário à direita), à direita, ou no topo (cenário menor embaixo). */
export const COMPOSICOES = ["esq", "dir", "topo"] as const;
export type Composicao = (typeof COMPOSICOES)[number];

const sortearPeso = (semente: string, evitar?: Transicao): Transicao => {
  const opcoes = TRANSICOES.filter((t) => !evitar || FAMILIA_TRANSICAO[t] !== FAMILIA_TRANSICAO[evitar]);
  const total = opcoes.reduce((s, t) => s + PESOS_TRANSICAO[t], 0);
  let r = rng(semente)() * total;
  for (const t of opcoes) {
    r -= PESOS_TRANSICAO[t];
    if (r <= 0) return t;
  }
  return opcoes[opcoes.length - 1];
};

/**
 * Plano de movimento do episódio: câmera e transição de cada cena.
 * Sorteio determinístico (slug + id da cena), sem repetir a escolha da cena anterior.
 * `cena.camera` / `cena.transicao` no JSON sobrescrevem o sorteio.
 */
export const planejarMovimento = (ep: Episodio): PlanoCena[] => {
  const plano: PlanoCena[] = [];
  let camAnt: Camera | undefined;
  let trAnt: Transicao | undefined;
  let compAnt: Composicao | undefined;
  ep.cenas.forEach((c, i) => {
    const semente = `${ep.slug}:${c.id}`;
    const camera = (c.camera as Camera | undefined) ?? escolher(CAMERAS, `${semente}:camera`, camAnt);
    // primeira cena entra seca: o gancho já tem o próprio impacto
    const entrada: Transicao = i === 0 ? "corte" : ((c.transicao as Transicao | undefined) ?? sortearPeso(`${semente}:transicao`, trAnt));
    // com 1 personagem não existe "topo" (o boneco ocupa a altura): sorteia só entre os lados
    const um = (c.personagens?.length ?? 0) === 1;
    // boneco sozinho com lado fixo no episódio: a composição segue o lado dele (cards do lado oposto)
    const ladoFixo = um ? ep.posicoesFixas?.[c.personagens![0].id] : undefined;
    const opcoesComp = um ? (["esq", "dir"] as const) : COMPOSICOES;
    const composicao: Composicao = ladoFixo === "esq" ? "esq" : ladoFixo === "dir" ? "dir" : escolher(opcoesComp, `${semente}:composicao`, compAnt);
    plano.push({ cenaId: c.id, camera, entrada, saida: null, semente, composicao });
    camAnt = camera;
    compAnt = composicao;
    trAnt = entrada;
  });
  for (let i = 0; i < plano.length - 1; i++) plano[i].saida = plano[i + 1].entrada;
  return plano;
};

/** Contexto da cena em renderização (câmera sorteada, semente). */
export const MovimentoCena = React.createContext<{ camera: Camera; semente: string; composicao: Composicao }>({ camera: "zoomIn", semente: "studio", composicao: "esq" });
