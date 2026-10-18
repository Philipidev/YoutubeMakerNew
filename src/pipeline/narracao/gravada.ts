import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { NarracaoProvider } from "./provider";
import type { Palavra, Timestamps } from "../../schema/timestamps";
import { RAIZ } from "../caminhos";
import { duracaoPcm, escreverWav, lerPcm, normalizarParaWav, silencio } from "./audio";
import { alinharRoteiro, type PalavraReconhecida } from "./alinhamento";
import { tokenizar } from "./estimativa";

/**
 * Voz gravada. Aceita:
 *  - episodes/<slug>/voz/<cenaId>.wav (um arquivo por cena; qualquer formato que o ffmpeg leia), ou
 *  - episodes/<slug>/voz/voz.wav (arquivo único com todas as cenas, na ordem do roteiro).
 * O Whisper (faster-whisper, scripts/align_whisper.py) dá os tempos; o TEXTO continua sendo o do roteiro.
 */
const exec = promisify(execFile);
const PAUSA_ENTRE_CENAS = 0.4;
const EXTENSOES = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];

const python = () => process.env.PYTHON || "python";

const whisper = async (audio: string): Promise<PalavraReconhecida[]> => {
  const { stdout } = await exec(python(), [path.join(RAIZ, "scripts", "align_whisper.py"), audio], {
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  return JSON.parse(stdout);
};

const achar = async (dir: string, base: string) => {
  for (const ext of EXTENSOES) {
    const p = path.join(dir, base + ext);
    if (await fs.stat(p).catch(() => null)) return p;
  }
  return null;
};

export const gravadaProvider: NarracaoProvider = {
  nome: "gravada",
  async gerar(episodio, dirSaida, dirEpisodio) {
    const dirVoz = path.join(dirEpisodio, "voz");
    const tmp = path.join(dirSaida, "voz-normalizada");
    await fs.mkdir(tmp, { recursive: true });
    const unico = await achar(dirVoz, "voz");
    const audioPath = path.join(dirSaida, "audio.wav");

    if (unico) {
      // arquivo único: alinha o roteiro inteiro e corta as cenas pelos índices dos tokens
      const norm = path.join(tmp, "voz.wav");
      await normalizarParaWav(unico, norm);
      const rec = await whisper(norm);
      const tokensPorCena = episodio.cenas.map((c) => tokenizar(c.narracao));
      const todas = alinharRoteiro(tokensPorCena.flat(), rec);
      const cenas: Timestamps["cenas"] = [];
      let k = 0;
      for (const [i, c] of episodio.cenas.entries()) {
        const palavras = todas.slice(k, k + tokensPorCena[i].length);
        k += tokensPorCena[i].length;
        cenas.push({ cenaId: c.id, inicioSeg: palavras[0]?.inicio ?? 0, fimSeg: palavras[palavras.length - 1]?.fim ?? 0, palavras });
      }
      const pcm = await lerPcm(norm);
      await fs.copyFile(norm, audioPath);
      return { timestamps: { provider: "gravada", duracaoSeg: duracaoPcm(pcm), cenas }, audioPath };
    }

    // um arquivo por cena
    const pedacos: Buffer[] = [];
    const cenas: Timestamps["cenas"] = [];
    let t = 0;
    for (const c of episodio.cenas) {
      const arq = await achar(dirVoz, c.id);
      if (!arq) throw new Error(`voz gravada ausente: ${path.join(dirVoz, c.id)}.wav (ou voz.wav único)`);
      const norm = path.join(tmp, `${c.id}.wav`);
      await normalizarParaWav(arq, norm);
      const rec = await whisper(norm);
      const palavras: Palavra[] = alinharRoteiro(tokenizar(c.narracao), rec).map((p) => ({ ...p, inicio: p.inicio + t, fim: p.fim + t }));
      const pcm = await lerPcm(norm);
      cenas.push({ cenaId: c.id, inicioSeg: t, fimSeg: t + duracaoPcm(pcm), palavras });
      pedacos.push(pcm, silencio(PAUSA_ENTRE_CENAS));
      t += duracaoPcm(pcm) + PAUSA_ENTRE_CENAS;
    }
    await escreverWav(audioPath, Buffer.concat(pedacos));
    return { timestamps: { provider: "gravada", duracaoSeg: t, cenas }, audioPath };
  },
};
