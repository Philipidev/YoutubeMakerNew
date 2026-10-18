/** Mostra o plano de movimento sorteado (câmera e transição por cena). Uso: npx tsx scripts/plano.ts <slug> */
import fs from "node:fs";
import { planejarMovimento } from "../src/movimento/plano";
import { EpisodioSchema } from "../src/schema/episodio";

const slug = process.argv[2];
const ep = EpisodioSchema.parse(JSON.parse(fs.readFileSync(`episodes/${slug}/episodio.json`, "utf8")));
const caminhoTempos = `public/episodes/${slug}/cenas.json`;
const tempos = fs.existsSync(caminhoTempos) ? JSON.parse(fs.readFileSync(caminhoTempos, "utf8")) : [];
for (const [i, p] of planejarMovimento(ep).entries()) {
  console.log(`${p.cenaId.padEnd(16)} ${p.camera.padEnd(10)} ${p.entrada.padEnd(13)} ${tempos[i]?.inicioFrame ?? ""}`);
}
