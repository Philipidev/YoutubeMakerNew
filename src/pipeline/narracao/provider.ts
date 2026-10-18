import type { Episodio } from "../../schema/episodio";
import type { Timestamps } from "../../schema/timestamps";

export type ResultadoNarracao = {
  timestamps: Timestamps;
  /** Caminho do audio.wav gerado (null no mock). */
  audioPath: string | null;
};

/** Contrato comum: TTS, voz gravada e mock produzem audio.wav + timestamps.json no mesmo formato. */
export interface NarracaoProvider {
  readonly nome: Timestamps["provider"];
  gerar(episodio: Episodio, dirSaida: string, dirEpisodio: string): Promise<ResultadoNarracao>;
}
