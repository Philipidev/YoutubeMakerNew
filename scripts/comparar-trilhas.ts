/**
 * Renderiza o mesmo trecho do episódio com cada trilha do catálogo, para escolher ouvindo.
 * Uso: npx tsx scripts/comparar-trilhas.ts <slug> [segundos=40]
 * Saída: out/<slug>/trilhas/<id>.mp4 (720p, leve)
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderizar } from "../src/pipeline/render";
import { caminhos } from "../src/pipeline/caminhos";
import { TRILHAS } from "../src/video/trilhas";

const exec = promisify(execFile);
const slug = process.argv[2];
const segundos = Number(process.argv[3] ?? 40);
const dir = path.join(caminhos(slug).outDir, "trilhas");
await fs.mkdir(dir, { recursive: true });
for (const t of TRILHAS) {
  const bruto = path.join(dir, `${t.id}-1080.mp4`);
  console.log(`▸ ${t.titulo} — ${t.artista}`);
  await renderizar({ composicao: "Horizontal", props: { slug, legendaQueimada: false, semAudio: false, trilha: t.id }, saida: bruto, crf: 28, frameRange: [0, segundos * 30 - 1] });
  await exec("ffmpeg", ["-loglevel", "error", "-y", "-i", bruto, "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "30", "-preset", "fast", "-c:a", "aac", "-b:a", "160k", path.join(dir, `${t.id}.mp4`)]);
  await fs.rm(bruto, { force: true });
}
console.log(`✔ ${dir}`);
