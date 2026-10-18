import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { elevenLabsProvider, montarTrechos } from "../src/pipeline/narracao/elevenlabs";
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
    { id: "a", tipo: "gancho", bloco: "1. Abertura", narracao: "Flávio teve 47,03% dos votos válidos, segundo o TSE. ".repeat(8).trim(), dados: { manchete: "x" } },
    { id: "s", tipo: "secao", bloco: "2. Seção", narracao: "Os debates.", dados: { numero: "2", titulo: "Os debates" } },
    { id: "fim", tipo: "encerramento", bloco: "2. Seção", narracao: "Fontes na descrição." },
  ],
});

/** Resposta falsa: 0,05 s por caractere; PCM 24 kHz silencioso do mesmo tamanho; request-id no header. */
let contador = 0;
const respostaFalsa = (texto: string) => {
  const dur = texto.length * 0.05;
  return new Response(
    JSON.stringify({
      audio_base64: Buffer.alloc(Math.round(dur * 24000) * 2).toString("base64"),
      alignment: {
        characters: [...texto],
        character_start_times_seconds: [...texto].map((_, i) => i * 0.05),
        character_end_times_seconds: [...texto].map((_, i) => (i + 1) * 0.05),
      },
    }),
    { status: 200, headers: { "request-id": `req-${++contador}` } },
  );
};

afterEach(() => vi.unstubAllGlobals());

describe("montarTrechos", () => {
  it("um trecho por seção e texto falado com números/siglas por extenso", () => {
    const t = montarTrechos(ep);
    expect(t).toHaveLength(2);
    expect(t[0].texto).toContain("quarenta e sete vírgula zero três por cento");
    expect(t[0].texto).toContain("tê-esse-é");
    expect(t[1].cenas.map((c) => c.cenaId)).toEqual(["s", "fim"]);
  });
});

describe("provider ElevenLabs (fetch simulado)", () => {
  it("encadeia por request-id, devolve tempos das palavras originais, confere saldo e usa cache", async () => {
    process.env.ELEVENLABS_API_KEY = "teste";
    process.env.ELEVENLABS_VOICE_ID = "voz";
    process.env.ELEVENLABS_MODEL_ID = "eleven_v4";
    const chamadas: { url: string; body?: Record<string, unknown> }[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: { body?: string }) => {
      if (url.endsWith("/user/subscription")) {
        chamadas.push({ url });
        return new Response(JSON.stringify({ tier: "free", character_count: 0, character_limit: 10000 }), { status: 200 });
      }
      const body = JSON.parse(init!.body!);
      chamadas.push({ url, body });
      return respostaFalsa(body.text);
    });
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tts-"));
    const { timestamps, audioPath } = await elevenLabsProvider.gerar(ep, dir, dir);

    const tts = chamadas.filter((c) => c.body);
    expect(chamadas[0].url).toContain("/user/subscription");
    expect(tts).toHaveLength(2);
    expect(tts[0].url).toContain("/voz/with-timestamps?output_format=pcm_24000");
    expect(tts[0].body!.model_id).toBe("eleven_v4");
    expect(tts[0].body!.voice_settings).toEqual({ stability: 0.6, similarity_boost: 0.75 });
    expect(tts[1].body!.previous_request_ids).toEqual(["req-" + (contador - 1)]);
    expect(tts[1].body!.previous_text).toBeUndefined();

    // tempos voltam para as palavras ORIGINAIS (legenda mostra "47,03%")
    const palavras = timestamps.cenas[0].palavras;
    expect(palavras[2].texto).toBe("47,03%");
    expect(palavras[2].fim).toBeGreaterThan(palavras[2].inicio + 1); // "quarenta e sete vírgula zero três por cento" é longo
    expect(timestamps.cenas[1].inicioSeg).toBeGreaterThan(timestamps.cenas[0].fimSeg);

    const dur = duracaoPcm(await lerPcm(audioPath!));
    expect(dur).toBeCloseTo(timestamps.duracaoSeg, 1);

    const antes = chamadas.length;
    await elevenLabsProvider.gerar(ep, dir, dir);
    expect(chamadas.length).toBe(antes); // tudo do cache: nem saldo nem TTS
  });
});
