import React from "react";
import { AbsoluteFill, Audio, Sequence } from "remotion";
import "../fontes";
import { FPS, audio as audioTheme } from "../theme";
import type { EpisodioProps } from "./dados";
import { Fundo } from "./Fundo";
import { CenaRouter } from "./CenaRouter";
import { BarraProgresso } from "./BarraProgresso";
import { LegendaQueimada } from "./LegendaQueimada";

export const EpisodioVideo: React.FC<EpisodioProps> = ({ dados, legendaQueimada, semAudio }) => {
  if (!dados) return null;
  const { episodio, timestamps, tempos, audioSrc } = dados;
  return (
    <AbsoluteFill>
      <Fundo />
      {episodio.cenas.map((cena) => {
        const tempo = tempos.find((t) => t.cenaId === cena.id)!;
        const ts = timestamps.cenas.find((c) => c.cenaId === cena.id);
        const inicioSeg = tempo.inicioFrame / FPS;
        const palavras = (ts?.palavras ?? []).map((p) => ({ ...p, inicio: p.inicio - inicioSeg, fim: p.fim - inicioSeg }));
        return (
          <Sequence key={cena.id} from={tempo.inicioFrame} durationInFrames={tempo.duracaoFrames} name={`${cena.tipo}:${cena.id}`}>
            <CenaRouter cena={cena} episodio={episodio} palavras={palavras} duracaoFrames={tempo.duracaoFrames} />
          </Sequence>
        );
      })}
      <BarraProgresso />
      {legendaQueimada || semAudio ? <LegendaQueimada timestamps={timestamps} /> : null}
      {audioSrc && !semAudio ? <Audio src={audioSrc} volume={audioTheme.volumeVoz} /> : null}
    </AbsoluteFill>
  );
};
