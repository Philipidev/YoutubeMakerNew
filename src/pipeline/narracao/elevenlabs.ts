import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { NarracaoProvider } from "./provider";
import type { Timestamps } from "../../schema/timestamps";
import { duracaoPcm, escreverWav, silencio } from "./audio";
import { palavrasDeCaracteres } from "./alinhamento";

/**
 * TTS ElevenLabs (POST /v1/text-to-speech/{voice}/with-timestamps, saída pcm_44100).
 * Uma requisição por cena, com previous_text/next_text para manter a entonação contínua.
 * Cache por hash(texto, voz, modelo, configurações): reprocessar o episódio não cobra de novo cenas que não mudaram.
 */
const API = "https://api.elevenlabs.io/v1/text-to-speech";
const PAUSA_ENTRE_CENAS = 0.4;
const SEED = 1234;

type Alinhamento = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
type Resposta = { audio_base64: string; alignment: Alinhamento | null };

const config = () => {
  const chave = process.env.ELEVENLABS_API_KEY;
  const voz = process.env.ELEVENLABS_VOICE_ID;
  if (!chave || !voz) throw new Error("ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID são obrigatórios no .env");
  return {
    chave,
    voz,
    modelo: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    ajustes: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
  };
};

const sintetizar = async (texto: string, anterior: string | undefined, seguinte: string | undefined, dirCache: string): Promise<Resposta> => {
  const c = config();
  const chaveCache = crypto.createHash("sha256").update(JSON.stringify([texto, c.voz, c.modelo, c.ajustes, anterior, seguinte, SEED])).digest("hex").slice(0, 24);
  const arq = path.join(dirCache, `${chaveCache}.json`);
  const emCache = await fs.readFile(arq, "utf8").catch(() => null);
  if (emCache) return JSON.parse(emCache);

  const r = await fetch(`${API}/${c.voz}/with-timestamps?output_format=pcm_44100`, {
    method: "POST",
    headers: { "xi-api-key": c.chave, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: c.modelo, voice_settings: c.ajustes, previous_text: anterior, next_text: seguinte, seed: SEED }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const json = (await r.json()) as Resposta;
  if (!json.alignment) throw new Error("ElevenLabs não devolveu alignment");
  await fs.mkdir(dirCache, { recursive: true });
  await fs.writeFile(arq, JSON.stringify(json));
  return json;
};

export const elevenLabsProvider: NarracaoProvider = {
  nome: "elevenlabs",
  async gerar(episodio, dirSaida, dirEpisodio) {
    // cache fora de public/ (não vai para o bundle do render) e fora do git
    const dirCache = path.join(dirEpisodio, ".cache-tts");
    const pedacos: Buffer[] = [];
    const cenas: Timestamps["cenas"] = [];
    let t = 0;
    for (const [i, cena] of episodio.cenas.entries()) {
      process.stdout.write(`  tts ${i + 1}/${episodio.cenas.length}: ${cena.id}\n`);
      const res = await sintetizar(cena.narracao, episodio.cenas[i - 1]?.narracao, episodio.cenas[i + 1]?.narracao, dirCache);
      const pcm = Buffer.from(res.audio_base64, "base64");
      const palavras = palavrasDeCaracteres(cena.narracao, res.alignment!, t);
      cenas.push({ cenaId: cena.id, inicioSeg: t, fimSeg: t + duracaoPcm(pcm), palavras });
      pedacos.push(pcm, silencio(PAUSA_ENTRE_CENAS));
      t += duracaoPcm(pcm) + PAUSA_ENTRE_CENAS;
    }
    const audioPath = path.join(dirSaida, "audio.wav");
    await escreverWav(audioPath, Buffer.concat(pedacos));
    return { timestamps: { provider: "elevenlabs", duracaoSeg: t, cenas }, audioPath };
  },
};
