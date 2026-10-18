import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import "../fontes";
import { FPS } from "../theme";
import { Fundo } from "../video/Fundo";
import { CenaRouter } from "../video/CenaRouter";
import { LegendaQueimada } from "../video/LegendaQueimada";
import { carregarDados, type DadosEpisodio } from "../video/dados";

export const CenaIsoladaSchema = z.object({ slug: z.string(), cenaId: z.string(), legenda: z.boolean() });
type Props = z.infer<typeof CenaIsoladaSchema> & { dados?: DadosEpisodio };

/** Uma cena de um episódio, isolada, para revisão no Studio. */
export const CenaIsolada: React.FC<Props> = ({ cenaId, dados, legenda }) => {
  if (!dados) return null;
  const cena = dados.episodio.cenas.find((c) => c.id === cenaId);
  const tempo = dados.tempos.find((t) => t.cenaId === cenaId);
  const ts = dados.timestamps.cenas.find((c) => c.cenaId === cenaId);
  if (!cena || !tempo) return null;
  const ini = tempo.inicioFrame / FPS;
  const palavras = (ts?.palavras ?? []).map((p) => ({ ...p, inicio: p.inicio - ini, fim: p.fim - ini }));
  const tsLocal = { ...dados.timestamps, cenas: ts ? [{ ...ts, inicioSeg: ts.inicioSeg - ini, fimSeg: ts.fimSeg - ini, palavras }] : [] };
  return (
    <AbsoluteFill>
      <Fundo />
      <CenaRouter cena={cena} episodio={dados.episodio} palavras={palavras} duracaoFrames={tempo.duracaoFrames} />
      {legenda ? <LegendaQueimada timestamps={tsLocal} /> : null}
    </AbsoluteFill>
  );
};

export const calcularMetadataCena: CalculateMetadataFunction<Props> = async ({ props }) => {
  const dados = await carregarDados(props.slug);
  const tempo = dados.tempos.find((t) => t.cenaId === props.cenaId);
  if (!tempo) throw new Error(`cena ${props.cenaId} não existe em ${props.slug}`);
  return { durationInFrames: tempo.duracaoFrames, props: { ...props, dados } };
};

/** Cenas do episódio de demonstração (episodes/demo-cenas). */
export const CENAS_DEMO = [
  "gancho", "fato", "divergencia", "contexto", "linha", "lados", "pesquisa", "debate", "debate-vazio", "votacao", "mapa", "stf", "urna", "nao-se-sabe", "fim",
] as const;
