import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

/** Utilitários de WAV PCM 16-bit mono (formato interno do pipeline). */
export const TAXA = 44100;
const exec = promisify(execFile);

export const silencio = (seg: number) => Buffer.alloc(Math.round(seg * TAXA) * 2);

export const duracaoPcm = (pcm: Buffer) => pcm.length / 2 / TAXA;

export const escreverWav = async (caminho: string, pcm: Buffer) => {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(TAXA, 24);
  h.writeUInt32LE(TAXA * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  await fs.writeFile(caminho, Buffer.concat([h, pcm]));
};

/** Lê o chunk "data" de um WAV PCM 16-bit mono 44.1 kHz. */
export const lerPcm = async (caminho: string): Promise<Buffer> => {
  const b = await fs.readFile(caminho);
  let i = 12;
  while (i < b.length - 8) {
    const id = b.toString("ascii", i, i + 4);
    const tam = b.readUInt32LE(i + 4);
    if (id === "data") return b.subarray(i + 8, i + 8 + tam);
    i += 8 + tam + (tam % 2);
  }
  throw new Error(`WAV sem chunk data: ${caminho}`);
};

/** Converte qualquer áudio para WAV PCM 16-bit mono 44.1 kHz via ffmpeg (normaliza volume de fala). */
export const normalizarParaWav = async (entrada: string, saida: string) => {
  await exec("ffmpeg", ["-loglevel", "error", "-y", "-i", entrada, "-ac", "1", "-ar", String(TAXA), "-sample_fmt", "s16", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", saida]);
};
