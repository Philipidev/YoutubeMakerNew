import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { FPS, audio } from "../theme";
import type { Episodio } from "../schema/episodio";
import type { TempoCena, Timestamps } from "../schema/timestamps";
import type { PlanoCena } from "../movimento/plano";
import { DURACAO_TRANSICAO } from "../movimento/transicoes";
import { hash } from "../movimento/aleatorio";

/** SFX gerados por scripts/gerar-sfx.py (síntese própria, sem licença de terceiros). */
export type TipoSfx = "whoosh" | "pop" | "ding";
/** 3 variações por tipo, sorteadas por evento (nada de som idêntico repetido). */
const arquivo = (tipo: TipoSfx, frame: number, slug: string) => `sfx/${tipo}-${(hash(slug + ":" + frame) % 3) + 1}.wav`;
const DURACAO_SFX = 45;

type Evento = { frame: number; tipo: TipoSfx };

/** Eventos padrão por tipo de cena + os declarados em cena.sfx. */
export const eventosSfx = (ep: Episodio, tempos: TempoCena[], plano: PlanoCena[], ts: Timestamps): Evento[] => {
  const ev: Evento[] = [];
  ep.cenas.forEach((c, i) => {
    const t = tempos.find((x) => x.cenaId === c.id);
    if (!t) return;
    const ini = t.inicioFrame;
    if (i > 0 && plano[i]?.entrada !== "corte") ev.push({ frame: Math.max(0, ini - 4), tipo: "whoosh" });
    if (c.tipo === "contexto" && c.dados?.numero) ev.push({ frame: ini + 6, tipo: "ding" });
    if (c.tipo === "pesquisa" || (c.tipo === "votacao" && c.dados.placar)) ev.push({ frame: ini + 40, tipo: "ding" });
    if (c.tipo === "grafico") ev.push({ frame: ini + 48, tipo: "ding" });
    if ((c.fatos?.length ?? 0) + (c.atribuicoes?.length ?? 0) > 0 && c.tipo !== "debate") ev.push({ frame: ini + 6, tipo: "pop" });
    for (const s of c.sfx ?? []) {
      if (s.em === "inicio") ev.push({ frame: ini, tipo: s.tipo });
      else {
        const p = ts.cenas.find((x) => x.cenaId === c.id)?.palavras[s.em];
        if (p) ev.push({ frame: Math.round(p.inicio * FPS), tipo: s.tipo });
      }
    }
  });
  // evita empilhar dois sons no mesmo instante
  return ev.sort((a, b) => a.frame - b.frame).filter((e, i, arr) => i === 0 || e.frame - arr[i - 1].frame > 6);
};

export const TrilhaSfx: React.FC<{ episodio: Episodio; tempos: TempoCena[]; plano: PlanoCena[]; timestamps: Timestamps }> = ({ episodio, tempos, plano, timestamps }) => {
  const ev = eventosSfx(episodio, tempos, plano, timestamps);
  return (
    <>
      {ev.map((e, i) => (
        <Sequence key={i} from={e.frame} durationInFrames={DURACAO_SFX + DURACAO_TRANSICAO} layout="none">
          <Audio src={staticFile(arquivo(e.tipo, e.frame, episodio.slug))} volume={audio.volumeSfx * (e.tipo === "whoosh" ? 0.8 : 1)} />
        </Sequence>
      ))}
    </>
  );
};
