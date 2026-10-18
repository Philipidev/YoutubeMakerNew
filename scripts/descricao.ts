/** Regera out/<slug>/descricao.txt (capítulos + fontes + bloco de IA) com os tempos da narração atual. Uso: npx tsx scripts/descricao.ts <slug> [--short] */
import fs from "node:fs";
import { EpisodioSchema } from "../src/schema/episodio";
import { TimestampsSchema } from "../src/schema/timestamps";
import { gerarComentarioFontes, gerarDescricao } from "../src/pipeline/saidas";

const slug = process.argv[2];
const short = process.argv.includes("--short");
const ep = EpisodioSchema.parse(JSON.parse(fs.readFileSync(`episodes/${slug}/episodio.json`, "utf8")));
const ts = TimestampsSchema.parse(JSON.parse(fs.readFileSync(`public/episodes/${slug}/timestamps.json`, "utf8")));
let texto = gerarDescricao(ep, short ? null : ts);
if (short) {
  // Short: link do vídeo completo no topo e #Shorts nas hashtags
  texto = texto.replace(/\n\n(#Eleições2026)/, "\n\n#Shorts $1");
  texto = texto.replace(ep.resumo.trim(), `${ep.resumo.trim()}\n\n▶ Vídeo completo, com todas as seções: [cole aqui o link do vídeo principal]`);
}
fs.writeFileSync(`out/${slug}/descricao.txt`, texto);
fs.writeFileSync(`out/${slug}/comentario-fontes.txt`, gerarComentarioFontes(ep).join("\n\n----- (novo comentário) -----\n\n") + "\n");
console.log(`  descrição: ${texto.length} caracteres (limite do YouTube: 5.000)`);
console.log(`✔ out/${slug}/descricao.txt`);
