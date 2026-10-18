/** Renderiza um episódio já narrado (sem regerar narração). Uso: npx tsx scripts/render.ts <slug> <Vertical|Horizontal> <saida.mp4> */
import { renderizar } from "../src/pipeline/render";

const [slug, composicao, saida] = process.argv.slice(2);
if (!slug || !composicao || !saida) throw new Error("uso: tsx scripts/render.ts <slug> <Vertical|Horizontal> <saida.mp4>");
await renderizar({ composicao, props: { slug, legendaQueimada: false, semAudio: false }, saida });
console.log(`✔ ${saida}`);
