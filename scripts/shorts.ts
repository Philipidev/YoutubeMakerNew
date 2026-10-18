/**
 * Gera episódios-filhos verticais (Shorts) a partir de um episódio aprovado.
 * Definição: episodes/<slug>/shorts.json (gancho próprio + lista de cenas do episódio-pai).
 * Cada Short: gancho (com os dois candidatos quando o pai tem lado fixo) → cenas → encerramento.
 * Só entram as fontes usadas nas cenas do Short. A narração reaproveita o cache compartilhado.
 *
 * Uso: npx tsx scripts/shorts.ts <slug>   → cria episodes/<slug>--short-<id>/episodio.json (+ checagem.json)
 */
import fs from "node:fs";
import path from "node:path";
import { EpisodioSchema, type Cena } from "../src/schema/episodio";

type DefShort = { id: string; titulo: string; gancho: { narracao: string; manchete: string; destaque?: string }; cenas: string[] };

const slug = process.argv[2];
const base = path.join("episodes", slug);
const pai = EpisodioSchema.parse(JSON.parse(fs.readFileSync(path.join(base, "episodio.json"), "utf8")));
const defs: DefShort[] = JSON.parse(fs.readFileSync(path.join(base, "shorts.json"), "utf8"));

const fontesDaCena = (c: Cena): string[] => [
  ...(c.fatos ?? []).flatMap((f) => f.fonteIds),
  ...(c.atribuicoes ?? []).map((a) => a.fonteId),
  ...(c.tipo === "linhaDoTempo" ? c.dados.eventos.flatMap((e) => e.fonteIds) : []),
  ...(c.tipo === "ladoA_ladoB" ? [...c.dados.ladoA.argumentos, ...c.dados.ladoB.argumentos].map((a) => a.fonteId) : []),
  ...(c.tipo === "grafico" ? [c.dados.fonteId] : []),
  ...(c.tipo === "pesquisa" && c.dados.fonteId ? [c.dados.fonteId] : []),
  ...(c.tipo === "servico" ? c.dados.linhas.flatMap((l) => (l.fonteId ? [l.fonteId] : [])) : []),
];

for (const d of defs) {
  const cenas = d.cenas.map((id) => {
    const c = pai.cenas.find((x) => x.id === id);
    if (!c) throw new Error(`${d.id}: cena ${id} não existe em ${slug}`);
    return { ...c, bloco: d.titulo };
  });
  const candidatos = Object.entries(pai.posicoesFixas ?? {});
  const gancho = {
    id: "gancho",
    tipo: "gancho",
    bloco: d.titulo,
    cenario: candidatos.length ? "pulpitos" : undefined,
    narracao: d.gancho.narracao,
    personagens: candidatos.map(([id, pos]) => ({ id, acao: "idle", posicao: pos })),
    dados: { manchete: d.gancho.manchete, destaque: d.gancho.destaque },
  };
  const fim = { id: "fim", tipo: "encerramento", bloco: d.titulo, narracao: "O vídeo completo está no canal. As fontes estão na descrição." };
  const usadas = new Set(cenas.flatMap((c) => fontesDaCena(c as Cena)));
  const filho = {
    ...pai,
    slug: `${slug}--short-${d.id}`,
    titulo: d.titulo,
    resumo: d.gancho.narracao,
    fontes: pai.fontes.filter((f) => usadas.has(f.id)),
    cenas: [gancho, ...cenas, fim],
  };
  const dir = path.join("episodes", filho.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "episodio.json"), JSON.stringify(EpisodioSchema.parse(filho), null, 2) + "\n");
  const checagem = path.join(base, "checagem.json");
  if (fs.existsSync(checagem)) {
    const ch = JSON.parse(fs.readFileSync(checagem, "utf8"));
    fs.writeFileSync(path.join(dir, "checagem.json"), JSON.stringify({ ...ch, slug: filho.slug, pedido: `Short derivado de ${slug}: ${d.titulo}` }, null, 2) + "\n");
  }
  console.log(`✔ ${filho.slug}: ${filho.cenas.length} cenas, ${filho.fontes.length} fontes`);
}
