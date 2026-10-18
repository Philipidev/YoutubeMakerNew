import type { NarracaoProvider } from "./provider";

export const gravadaProvider: NarracaoProvider = {
  nome: "gravada",
  async gerar() {
    throw new Error("provider gravada: implementado na Parte 4");
  },
};
