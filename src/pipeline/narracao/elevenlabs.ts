import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { NarracaoProvider } from "./provider";
import type { Episodio } from "../../schema/episodio";
import type { Palavra, Timestamps } from "../../schema/timestamps";
import { escreverWav, normalizarParaWav } from "./audio";
import { tokenizar } from "./estimativa";
import { prepararFala } from "./normalizar";

/**
 * Narração ElevenLabs — fluxo definido a partir da documentação oficial (out/2026), ver docs/narracao.md:
 *
 * - Modelo padrão eleven_v4 (pt-BR suportado, stitching mais confiável). Alternativa: eleven_multilingual_v2.
 * - Texto dividido em TRECHOS de ~600–1.500 caracteres, agrupando cenas do mesmo bloco (cena curta solta soa picotada).
 * - Chamadas em SEQUÊNCIA, cada uma com previous_request_ids (até 3 trechos anteriores, header `request-id`,
 *   válidos por 2 h). Sem IDs válidos (ex.: trecho vindo do cache), usa previous_text/next_text.
 * - Endpoint /with-timestamps; saída pcm_24000 (pcm_44100 exige plano Pro). Depois: 44,1 kHz e −14 LUFS (YouTube).
 * - Números e siglas escritos como se falam (normalizar.ts); os tempos voltam para as palavras ORIGINAIS do roteiro.
 * - Cache por trecho (hash de texto + voz + modelo + ajustes): reprocessar não cobra de novo.
 * - Antes de gastar, confere o saldo da conta e aborta se não houver caracteres suficientes.
 */
const API = "https://api.elevenlabs.io/v1";
const TAXA_API = 24000;
const FORMATO = `pcm_${TAXA_API}`;
const MIN_TRECHO = 300;
const MAX_TRECHO = 2000;
const PAUSA_ENTRE_TRECHOS = 0.5;
const VALIDADE_REQUEST_ID_MS = 115 * 60 * 1000; // a API aceita até 2 h; margem de 5 min
const SEED = 1234;

export type Alinhamento = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
type Resposta = { audio_base64: string; alignment: Alinhamento | null; normalized_alignment?: Alinhamento | null };
type EmCache = Resposta & { requestId: string | null; criadoEm: number };

/** fetch com nova tentativa em falha de rede, 429 e 5xx (espera crescente). Erros 4xx de uso não são repetidos. */
const comRetry = async (url: string, init?: RequestInit, tentativas = 4): Promise<Response> => {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, init);
      if ((r.status === 429 || r.status >= 500) && i < tentativas) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      if (i >= tentativas) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * i));
    }
  }
};

export const configElevenLabs = () => {
  const chave = process.env.ELEVENLABS_API_KEY;
  const voz = process.env.ELEVENLABS_VOICE_ID;
  if (!chave || !voz) throw new Error("ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID ausentes. Rode: powershell -ExecutionPolicy Bypass -File scripts\\configurar-elevenlabs.ps1");
  const modelo = process.env.ELEVENLABS_MODEL_ID || "eleven_v4";
  // v4 aceita só stability/similarity; v2 aceita também style/speaker boost/speed (doc oficial)
  const ajustes =
    modelo === "eleven_v4"
      ? { stability: 0.6, similarity_boost: 0.75 }
      : { stability: 0.6, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1.0 };
  return { chave, voz, modelo, ajustes };
};

const erroLegivel = async (r: Response) => {
  const corpo = (await r.text()).slice(0, 400);
  if (r.status === 401) return `ElevenLabs 401: chave inválida ou sem permissão de Text to Speech. ${corpo}`;
  if (r.status === 402) return `ElevenLabs 402: recurso exige plano pago (no free, vozes da Voice Library não funcionam pela API; use uma voz padrão ou criada no Voice Design). ${corpo}`;
  if (r.status === 429) return `ElevenLabs 429: limite de requisições simultâneas ou de cota. ${corpo}`;
  return `ElevenLabs ${r.status}: ${corpo}`;
};

/** Saldo de caracteres da conta (null se a chave não tiver permissão de leitura do usuário). */
export const saldoElevenLabs = async (): Promise<{ plano: string; usados: number; limite: number; restantes: number } | null> => {
  const { chave } = configElevenLabs();
  const r = await comRetry(`${API}/user/subscription`, { headers: { "xi-api-key": chave } });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(await erroLegivel(r));
  const j = (await r.json()) as { tier: string; character_count: number; character_limit: number };
  return { plano: j.tier, usados: j.character_count, limite: j.character_limit, restantes: j.character_limit - j.character_count };
};

/** Uma chamada TTS com timestamps. Devolve também o request-id (para encadear os próximos trechos). */
export const sintetizarTrecho = async (opts: {
  texto: string;
  previousRequestIds?: string[];
  previousText?: string;
  nextText?: string;
}): Promise<{ res: Resposta; requestId: string | null }> => {
  const c = configElevenLabs();
  const corpo: Record<string, unknown> = {
    text: opts.texto,
    model_id: c.modelo,
    voice_settings: c.ajustes,
    seed: SEED,
    apply_text_normalization: "auto",
  };
  // pela doc, previous_text/next_text são ignorados quando há request ids: mandamos um ou outro
  if (opts.previousRequestIds?.length) corpo.previous_request_ids = opts.previousRequestIds.slice(-3);
  else {
    if (opts.previousText) corpo.previous_text = opts.previousText;
    if (opts.nextText) corpo.next_text = opts.nextText;
  }
  const r = await comRetry(`${API}/text-to-speech/${c.voz}/with-timestamps?output_format=${FORMATO}`, {
    method: "POST",
    headers: { "xi-api-key": c.chave, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(await erroLegivel(r));
  const res = (await r.json()) as Resposta;
  if (!res.alignment) throw new Error("ElevenLabs não devolveu alignment");
  return { res, requestId: r.headers.get("request-id") };
};

type CenaFala = { cenaId: string; tokens: string[]; texto: string; spans: [number, number][] };
export type Trecho = { cenas: CenaFala[]; texto: string; offsets: number[] };

/** Agrupa cenas consecutivas em trechos (texto falado): um trecho por seção, até MAX_TRECHO caracteres. */
export const montarTrechos = (ep: Episodio): Trecho[] => {
  const cenas = ep.cenas.map((c) => {
    const tokens = tokenizar(c.narracao);
    const { texto, spans } = prepararFala(tokens);
    return { cenaId: c.id, tokens, texto, spans, bloco: c.bloco ?? "" };
  });
  const trechos: Trecho[] = [];
  let atual: typeof cenas = [];
  const fechar = () => {
    if (!atual.length) return;
    const offsets: number[] = [];
    let texto = "";
    for (const c of atual) {
      if (texto) texto += "\n\n";
      offsets.push(texto.length);
      texto += c.texto;
    }
    trechos.push({ cenas: atual.map(({ cenaId, tokens, texto: tx, spans }) => ({ cenaId, tokens, texto: tx, spans })), texto, offsets });
    atual = [];
  };
  for (const c of cenas) {
    const tam = atual.reduce((s, x) => s + x.texto.length + 2, 0);
    const mudouBloco = atual.length > 0 && atual[atual.length - 1].bloco !== c.bloco;
    // corte preferencial na troca de seção (pausa natural); dentro da seção só corta perto do máximo
    if (atual.length && (tam + c.texto.length > MAX_TRECHO || (mudouBloco && tam >= MIN_TRECHO))) fechar();
    atual.push(c);
  }
  fechar();
  return trechos;
};

/** Converte o alinhamento por caractere em tempos por palavra ORIGINAL, usando os spans do texto falado. */
export const palavrasDoTrecho = (t: Trecho, al: Alinhamento, offsetSeg: number): { cenaId: string; palavras: Palavra[] }[] => {
  const chars = al.characters.join("");
  const igual = chars === t.texto;
  // se o alinhamento não espelhar o texto enviado, mapeia pela contagem de caracteres não-brancos
  const naoBrancos: number[] = [];
  if (!igual) al.characters.forEach((ch, i) => ch.trim() && naoBrancos.push(i));
  const indice = (pos: number) => {
    if (igual) return pos;
    const alvo = t.texto.slice(0, pos).replace(/\s/g, "").length;
    return naoBrancos[Math.min(alvo, naoBrancos.length - 1)] ?? 0;
  };
  return t.cenas.map((c, ci) => {
    const base = t.offsets[ci];
    let ultimoFim = offsetSeg;
    const palavras = c.tokens.map((tok, k) => {
      const [a, b] = c.spans[k];
      if (b <= a) return { texto: tok, inicio: ultimoFim, fim: ultimoFim }; // token sem fala própria (ex.: "R$")
      const ini = offsetSeg + (al.character_start_times_seconds[indice(base + a)] ?? 0);
      const fim = offsetSeg + (al.character_end_times_seconds[indice(base + b - 1)] ?? 0);
      ultimoFim = Math.max(fim, ini);
      return { texto: tok, inicio: ini, fim: ultimoFim };
    });
    return { cenaId: c.cenaId, palavras };
  });
};

const chaveCache = (t: Trecho, c: ReturnType<typeof configElevenLabs>) =>
  crypto.createHash("sha256").update(JSON.stringify([t.texto, c.voz, c.modelo, c.ajustes, SEED, FORMATO])).digest("hex").slice(0, 24);

export const elevenLabsProvider: NarracaoProvider = {
  nome: "elevenlabs",
  async gerar(episodio, dirSaida, dirEpisodio) {
    const c = configElevenLabs();
    // cache fora de public/ (não vai para o bundle do render) e fora do git
    const dirCache = path.join(dirEpisodio, ".cache-tts");
    await fs.mkdir(dirCache, { recursive: true });
    const trechos = montarTrechos(episodio);
    const arqs = trechos.map((t) => path.join(dirCache, `${chaveCache(t, c)}.json`));
    const emCache = await Promise.all(arqs.map(async (a) => JSON.parse(await fs.readFile(a, "utf8").catch(() => "null")) as EmCache | null));

    // confere o saldo antes de gastar
    const aGerar = trechos.reduce((s, t, i) => s + (emCache[i] ? 0 : t.texto.length), 0);
    process.stdout.write(`  ${trechos.length} trechos (${c.modelo}); ${aGerar} caracteres a gerar; ${emCache.filter(Boolean).length} trecho(s) no cache\n`);
    if (aGerar > 0) {
      const saldo = await saldoElevenLabs();
      if (saldo) {
        process.stdout.write(`  saldo ElevenLabs (${saldo.plano}): ${saldo.restantes} caracteres\n`);
        if (saldo.restantes < aGerar) throw new Error(`saldo insuficiente: precisa de ${aGerar} caracteres e restam ${saldo.restantes}`);
      } else process.stdout.write("  (chave sem permissão para ler o saldo; seguindo)\n");
    }

    const pedacos: Buffer[] = [];
    const cenas: Timestamps["cenas"] = [];
    const ids: { id: string; em: number }[] = [];
    let t = 0;
    for (const [i, tr] of trechos.entries()) {
      let r = emCache[i];
      if (!r) {
        process.stdout.write(`  tts ${i + 1}/${trechos.length} (${tr.texto.length} car.)\n`);
        // encadeia por request id só se TODOS os anteriores tiverem id válido (senão, contexto por texto)
        const frescos = ids.filter((x) => Date.now() - x.em < VALIDADE_REQUEST_ID_MS);
        const usarIds = i > 0 && frescos.length === i;
        const { res, requestId } = await sintetizarTrecho({
          texto: tr.texto,
          previousRequestIds: usarIds ? frescos.map((x) => x.id).slice(-3) : undefined,
          previousText: trechos[i - 1]?.texto.slice(-400),
          nextText: trechos[i + 1]?.texto.slice(0, 400),
        });
        r = { ...res, requestId, criadoEm: Date.now() };
        await fs.writeFile(arqs[i], JSON.stringify(r));
      }
      if (r.requestId) ids.push({ id: r.requestId, em: r.criadoEm });
      const pcm = Buffer.from(r.audio_base64, "base64");
      for (const cp of palavrasDoTrecho(tr, r.alignment!, t)) {
        const ini = cp.palavras[0]?.inicio ?? t;
        const fim = cp.palavras[cp.palavras.length - 1]?.fim ?? t;
        cenas.push({ cenaId: cp.cenaId, inicioSeg: ini, fimSeg: fim, palavras: cp.palavras });
      }
      pedacos.push(pcm, Buffer.alloc(Math.round(PAUSA_ENTRE_TRECHOS * TAXA_API) * 2));
      t += pcm.length / 2 / TAXA_API + PAUSA_ENTRE_TRECHOS;
    }
    // grava em 24 kHz e normaliza para 44,1 kHz / −14 LUFS (padrão do YouTube)
    const bruto = path.join(dirSaida, "audio-24k.wav");
    await escreverWav(bruto, Buffer.concat(pedacos), TAXA_API);
    const audioPath = path.join(dirSaida, "audio.wav");
    await normalizarParaWav(bruto, audioPath);
    await fs.rm(bruto, { force: true });
    return { timestamps: { provider: "elevenlabs", duracaoSeg: t, cenas }, audioPath };
  },
};
