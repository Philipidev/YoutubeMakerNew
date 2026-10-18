/** Mostra como a narração será dividida em trechos para a ElevenLabs e o total de caracteres. Uso: npx tsx scripts/trechos.ts <slug> */
import fs from "node:fs";
import { EpisodioSchema } from "../src/schema/episodio";
import { montarTrechos } from "../src/pipeline/narracao/elevenlabs";

const slug = process.argv[2];
const ep = EpisodioSchema.parse(JSON.parse(fs.readFileSync(`episodes/${slug}/episodio.json`, "utf8")));
const trechos = montarTrechos(ep);
let total = 0;
trechos.forEach((t, i) => {
  total += t.texto.length;
  console.log(`trecho ${i + 1}: ${t.texto.length} car. — ${t.cenas.map((c) => c.cenaId).join(", ")}`);
});
console.log(`total: ${total} caracteres (≈ créditos no v4/v2)`);
if (process.argv[3] === "--texto") for (const t of trechos) console.log("\n---\n" + t.texto);
