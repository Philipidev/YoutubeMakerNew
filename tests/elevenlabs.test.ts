import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { elevenLabsProvider } from "../src/pipeline/narracao/elevenlabs";
import { EpisodioSchema } from "../src/schema/episodio";
import { lerPcm, duracaoPcm } from "../src/pipeline/narracao/audio";

const ep = EpisodioSchema.parse({
  slug: "t",
  titulo: "T",
  dataPublicacao: "2026-10-17",
  resumo: "r",
  fontes: [{ id: "f1", veiculo: "V", titulo: "T", url: "https://example.com", data: "2026-10-17", tipo: "primaria" }],
  personagens: [],
  cenas: [
    { id: "a", tipo: "gancho", narracao: "Olá mundo.", dados: { manchete: "x" } },
    { id: "fim", tipo: "encerramento", narracao: "Fontes na descrição." },
  ],
});

/** Resposta falsa: 0,05 s por caractere, PCM silencioso do mesmo tamanho. */
const respostaFalsa = (texto: string) => {
  const dur = texto.length * 0.05;
  return {
    audio_base64: Buffer.alloc(Math.round(dur * 44100) * 2).toString("base64"),
    alignment: {
      characters: [...texto],
      character_start_times_seconds: [...texto].map((_, i) => i * 0.05),
      character_end_times_seconds: [...texto].map((_, i) => (i + 1) * 0.05),
    },
  };
};

afterEach(() => vi.unstubAllGlobals());

describe("provider ElevenLabs (fetch simulado)", () => {
  it("gera audio.wav contínuo, timestamps absolutos e usa cache na segunda vez", async () => {
    process.env.ELEVENLABS_API_KEY = "teste";
    process.env.ELEVENLABS_VOICE_ID = "voz";
    const chamadas: { url: string; body: { text: string; previous_text?: string } }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      chamadas.push({ url, body });
      return new Response(JSON.stringify(respostaFalsa(body.text)), { status: 200 });
    });
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tts-"));
    const { timestamps, audioPath } = await elevenLabsProvider.gerar(ep, dir, dir);

    expect(chamadas).toHaveLength(2);
    expect(chamadas[0].url).toContain("/voz/with-timestamps?output_format=pcm_44100");
    expect(chamadas[1].body.previous_text).toBe("Olá mundo.");
    expect(timestamps.cenas[1].palavras[0].inicio).toBeCloseTo(10 * 0.05 + 0.4, 3);
    const dur = duracaoPcm(await lerPcm(audioPath!));
    expect(dur).toBeCloseTo(timestamps.duracaoSeg, 2);

    await elevenLabsProvider.gerar(ep, dir, dir);
    expect(chamadas).toHaveLength(2); // segunda execução veio do cache
  });
});
