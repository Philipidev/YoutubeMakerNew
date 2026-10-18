import type { NarracaoProvider } from "./provider";
import { estimarTimestamps } from "./estimativa";

/** Sem áudio: tempos estimados pelo texto. Usado na prévia e em testes. */
export const mockProvider: NarracaoProvider = {
  nome: "mock",
  async gerar(episodio) {
    return { timestamps: estimarTimestamps(episodio.cenas), audioPath: null };
  },
};
