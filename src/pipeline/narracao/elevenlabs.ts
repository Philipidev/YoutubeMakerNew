import type { NarracaoProvider } from "./provider";

export const elevenLabsProvider: NarracaoProvider = {
  nome: "elevenlabs",
  async gerar() {
    throw new Error("provider elevenlabs: implementado na Parte 4");
  },
};
