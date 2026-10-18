import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import "../fontes";
import { FPS, audio as audioTheme, movimento } from "../theme";
import type { EpisodioProps } from "./dados";
import { Fundo } from "./Fundo";
import { CenaRouter } from "./CenaRouter";
import { BarraProgresso } from "./BarraProgresso";
import { LegendaQueimada } from "./LegendaQueimada";
import { TrilhaSfx } from "./Sfx";
import { MovimentoCena, planejarMovimento, type PlanoCena } from "../movimento/plano";
import { DURACAO_TRANSICAO, estiloEntrada, estiloSaida, opacidadeFlash } from "../movimento/transicoes";

/**
 * Envolve a cena com a transição de entrada (primeiros frames) e a saída casada com a próxima cena
 * (frames extras após o fim, sobrepostos à entrada da seguinte). Fundo opaco próprio para o wipe/íris funcionarem.
 */
const CenaComTransicao: React.FC<{ plano: PlanoCena; duracao: number; inicioAbs: number; children: React.ReactNode }> = ({ plano, duracao, inicioAbs, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = DURACAO_TRANSICAO;
  const pEntrada = plano.entrada === "corte" ? 1 : spring({ frame: f, fps, config: movimento.entrada, durationInFrames: T });
  const pSaida = plano.saida ? interpolate(f, [duracao, duracao + T], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const flash = plano.entrada === "flash" && f < T ? opacidadeFlash(f / T) : 0;
  return (
    <AbsoluteFill style={estiloEntrada(plano.entrada, pEntrada)}>
      <AbsoluteFill style={plano.saida ? estiloSaida(plano.saida, pSaida) : undefined}>
        <Fundo deslocamento={inicioAbs} />
        <MovimentoCena.Provider value={{ camera: plano.camera, semente: plano.semente }}>{children}</MovimentoCena.Provider>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};

export const EpisodioVideo: React.FC<EpisodioProps> = ({ dados, legendaQueimada, semAudio }) => {
  const plano = useMemo(() => (dados ? planejarMovimento(dados.episodio) : []), [dados]);
  if (!dados) return null;
  const { episodio, timestamps, tempos, audioSrc } = dados;
  const ultima = episodio.cenas.length - 1;
  return (
    <AbsoluteFill>
      <Fundo />
      {episodio.cenas.map((cena, i) => {
        const tempo = tempos.find((t) => t.cenaId === cena.id)!;
        const ts = timestamps.cenas.find((c) => c.cenaId === cena.id);
        const inicioSeg = tempo.inicioFrame / FPS;
        const palavras = (ts?.palavras ?? []).map((p) => ({ ...p, inicio: p.inicio - inicioSeg, fim: p.fim - inicioSeg }));
        const extra = i < ultima ? DURACAO_TRANSICAO : 0;
        return (
          <Sequence key={cena.id} from={tempo.inicioFrame} durationInFrames={tempo.duracaoFrames + extra} name={`${cena.tipo}:${cena.id}`}>
            <CenaComTransicao plano={plano[i]} duracao={tempo.duracaoFrames} inicioAbs={tempo.inicioFrame}>
              <CenaRouter cena={cena} episodio={episodio} palavras={palavras} duracaoFrames={tempo.duracaoFrames} />
            </CenaComTransicao>
          </Sequence>
        );
      })}
      <BarraProgresso />
      {legendaQueimada || semAudio ? <LegendaQueimada timestamps={timestamps} /> : null}
      {audioSrc && !semAudio ? <Audio src={audioSrc} volume={audioTheme.volumeVoz} /> : null}
      {!semAudio ? <TrilhaSfx episodio={episodio} tempos={tempos} plano={plano} timestamps={timestamps} /> : null}
    </AbsoluteFill>
  );
};
