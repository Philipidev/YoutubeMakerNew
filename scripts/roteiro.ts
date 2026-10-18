/**
 * Gera episodes/<slug>/roteiro.md: narração por bloco com minutagem, sugestão visual por cena,
 * fontes, tabela de checagem e revisão de simetria. Documento do gate 1 (aprovação do roteiro).
 * Uso: npx tsx scripts/roteiro.ts <slug>   (rode a prévia antes para ter os tempos)
 */
import fs from "node:fs";
import { EpisodioSchema, type Cena, type Episodio } from "../src/schema/episodio";
import { ChecagemSchema } from "../src/schema/checagem";
import { estimarTimestamps } from "../src/pipeline/narracao/estimativa";
import { calcularTempos } from "../src/pipeline/duracoes";
import { placarSimetria } from "../src/pipeline/validar";
import { planejarMovimento } from "../src/movimento/plano";

const slug = process.argv[2];
const ler = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const ep: Episodio = EpisodioSchema.parse(ler(`episodes/${slug}/episodio.json`));
const checagem = fs.existsSync(`episodes/${slug}/checagem.json`) ? ChecagemSchema.parse(ler(`episodes/${slug}/checagem.json`)) : null;
const tsPath = `public/episodes/${slug}/timestamps.json`;
const ts = fs.existsSync(tsPath) ? ler(tsPath) : estimarTimestamps(ep.cenas);
const tempos = calcularTempos(ts);
const plano = planejarMovimento(ep);

const mmss = (frames: number) => {
  const s = Math.round(frames / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const nome = (id: string) => ep.personagens.find((p) => p.id === id)?.rotulo ?? id;
const veiculos = (ids: string[]) => [...new Set(ids.map((i) => ep.fontes.find((f) => f.id === i)?.veiculo ?? i))].join(", ");
const esc = (s: string) => s.replace(/\|/g, "\\|");

const visual = (c: Cena, i: number): string => {
  const partes: string[] = [`**${c.tipo}**`];
  if (c.cenario) partes.push(`cenário ${c.cenario}`);
  if (c.personagens?.length) partes.push(c.personagens.map((p) => `${nome(p.id)} (${p.acao}, ${p.posicao})`).join(" e "));
  if (c.tipo === "debate" && c.dados?.ausentes?.length) partes.push(`púlpitos vazios: ${c.dados.ausentes.map(nome).join(", ")}`);
  if (c.tipo === "ladoA_ladoB") partes.push(`Lado A/B: ${c.dados.ladoA.titulo} × ${c.dados.ladoB.titulo}`);
  if (c.tipo === "pesquisa") partes.push(`gráfico ${c.dados.instituto} (${c.dados.base})`);
  if (c.tipo === "grafico") partes.push(`gráfico ${c.dados.grafico}: ${c.dados.titulo}`);
  if (c.tipo === "linhaDoTempo") partes.push(`${c.dados.eventos.length} eventos`);
  if (c.fatos?.length) partes.push(`cards: ${c.fatos.map((f) => `“${f.texto}”`).join("; ")}`);
  if (c.atribuicoes?.length) partes.push(`citações: ${c.atribuicoes.map((a) => nome(a.quem)).join(", ")}`);
  partes.push(`câmera ${plano[i].camera}, entra com ${plano[i].entrada}, composição ${plano[i].composicao}`);
  return partes.join(" · ");
};

const fontesDaCena = (c: Cena) =>
  [
    ...(c.fatos ?? []).flatMap((f) => f.fonteIds),
    ...(c.atribuicoes ?? []).map((a) => a.fonteId),
    ...(c.tipo === "linhaDoTempo" ? c.dados.eventos.flatMap((e) => e.fonteIds) : []),
    ...(c.tipo === "ladoA_ladoB" ? [...c.dados.ladoA.argumentos, ...c.dados.ladoB.argumentos].map((a) => a.fonteId) : []),
    ...(c.tipo === "grafico" ? [c.dados.fonteId] : []),
    ...(c.tipo === "pesquisa" && c.dados.fonteId ? [c.dados.fonteId] : []),
    ...(c.tipo === "servico" ? c.dados.linhas.flatMap((l) => (l.fonteId ? [l.fonteId] : [])) : []),
  ].filter((v, i, a) => a.indexOf(v) === i);

const l: string[] = [];
const total = tempos.reduce((m, t) => Math.max(m, t.inicioFrame + t.duracaoFrames), 0);
const palavras = ep.cenas.reduce((s, c) => s + c.narracao.split(/\s+/).length, 0);
l.push(`# Roteiro — ${ep.titulo}`, "");
l.push(`- Publicação: ${ep.dataPublicacao}`, `- Narração: ${palavras} palavras · duração ${mmss(total)} (${ts.provider === "mock" ? "estimada, sem áudio" : `áudio ${ts.provider}`})`, `- Resumo: ${ep.resumo}`, "");

l.push("## 1. Narração por bloco (com minutagem) e 2. sugestão visual", "");
let blocoAtual = "";
ep.cenas.forEach((c, i) => {
  const t = tempos[i];
  const bloco = c.bloco ?? "Sem bloco";
  if (bloco !== blocoAtual) {
    const dos = ep.cenas.map((x, k) => ({ x, k })).filter(({ x }) => (x.bloco ?? "Sem bloco") === bloco);
    const ini = tempos[dos[0].k].inicioFrame;
    const fim = tempos[dos[dos.length - 1].k].inicioFrame + tempos[dos[dos.length - 1].k].duracaoFrames;
    l.push(`### ${bloco} (${mmss(ini)}–${mmss(fim)})`, "");
    blocoAtual = bloco;
  }
  l.push(`**[${mmss(t.inicioFrame)}] ${c.id}**`, "", `> ${c.narracao}`, "", `Visual: ${visual(c, i)}`, "", `Fontes: ${veiculos(fontesDaCena(c)) || "—"}`, "");
});

l.push("## 3. Fontes (descrição do vídeo)", "");
for (const f of ep.fontes) l.push(`- **${f.veiculo}** — ${f.titulo} (${f.data.split("-").reverse().join("/")}) — ${f.url}`);
l.push("");

l.push("## 4. Tabela de checagem", "");
if (checagem) {
  l.push("| Fato | Fontes | Status | Nota |", "|---|---|---|---|");
  for (const f of checagem.fatos) l.push(`| ${esc(f.fato)} | ${esc(veiculos(f.fonteIds)) || "—"} | ${f.status} | ${esc(f.nota ?? "")} |`);
} else l.push("_checagem.json ausente_");
l.push("");

l.push("## 5. Revisão de simetria", "");
const placar = placarSimetria(ep);
l.push("| Personagem | Cenas na tela | Caracteres de narração com ele na tela | Argumentos em Lado A/B |", "|---|---|---|---|");
for (const [id, v] of Object.entries(placar)) l.push(`| ${nome(id)} | ${v.cenas} | ${Math.round(v.chars)} | ${v.argumentos} |`);
const sujeito = (n: string) => ep.cenas.reduce((s, c) => s + (c.narracao.match(new RegExp(`\\b${n}\\b`, "g"))?.length ?? 0), 0);
l.push("", `Menções na narração: Lula ${sujeito("Lula")} · Flávio ${sujeito("Flávio")}`, "");
if (checagem?.simetria) l.push(checagem.simetria, "");

fs.writeFileSync(`episodes/${slug}/roteiro.md`, l.join("\n") + "\n");
console.log(`ok: episodes/${slug}/roteiro.md (${palavras} palavras, ${mmss(total)})`);
