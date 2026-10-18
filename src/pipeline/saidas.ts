import fs from "node:fs/promises";
import path from "node:path";
import { AVISO_IA } from "../theme";
import { trilhaPorId } from "../video/trilhas";
import type { Episodio } from "../schema/episodio";
import type { Timestamps } from "../schema/timestamps";
import { ChecagemSchema, type Checagem } from "../schema/checagem";
import { caminhos } from "./caminhos";
import { gerarSrt, gerarVtt } from "./legenda";
import { calcularTempos } from "./duracoes";
import { placarSimetria, type Problema } from "./validar";

const fmtData = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

/** Bloco fixo de transparência sobre o uso de IA (vai em toda descrição). */
export const COMO_E_FEITO = [
  "COMO ESTE VÍDEO É FEITO",
  "• Roteiro escrito com auxílio de inteligência artificial (Claude, da Anthropic), a partir de fontes oficiais e jornalísticas, cada fato conferido em mais de um veículo. A revisão e a decisão editorial são humanas.",
  "• Narração com voz sintética (ElevenLabs).",
  "• Animação gerada por código. Os personagens são bonecos genéricos, identificados só pelo número e pela cor do partido: não reproduzem rosto nem voz de ninguém.",
  "• O canal não opina: adjetivos e interpretações aparecem sempre atribuídos a quem disse, com a fonte.",
  "Viu algum erro? Comente com a fonte.",
].join("\n");

const mmss = (seg: number) => `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}`;

/** Capítulos do YouTube a partir das cenas de seção (o 1º precisa estar em 0:00; mínimo de 3). */
export const capitulos = (ep: Episodio, ts: Timestamps | null): string => {
  if (!ts) return "";
  const tempos = calcularTempos(ts);
  const lista: [number, string][] = [[0, "Abertura"]];
  ep.cenas.forEach((c, i) => {
    if (c.tipo === "secao") lista.push([tempos[i].inicioFrame / 30, c.dados.titulo]);
  });
  return lista.length >= 3 ? "CAPÍTULOS\n" + lista.map(([s, t]) => `${mmss(s)} ${t}`).join("\n") : "";
};

export const gerarDescricao = (ep: Episodio, ts: Timestamps | null = null) => {
  const fontes = ep.fontes.map((f) => `• ${f.veiculo} — ${f.titulo} (${fmtData(f.data)})\n  ${f.url}`).join("\n");
  const t = trilhaPorId(ep.trilha);
  const musica = t ? `\n\nMúsica: ${t.titulo} — ${t.artista}${t.atribuicao ? ". " + t.atribuicao : " (Biblioteca de Áudio do YouTube)"}` : "";
  const caps = capitulos(ep, ts);
  const tags = ["#Eleições2026", ...ep.personagens.filter((p) => p.partido).map((p) => "#" + p.rotulo.replace(/\s+/g, ""))].join(" ");
  return [ep.titulo, ep.resumo.trim(), caps, `FONTES\n${fontes}${musica}`, COMO_E_FEITO, AVISO_IA, tags].filter(Boolean).join("\n\n") + "\n";
};

const esc = (s: string) => s.replace(/\|/g, "\|").replace(/\n/g, " ");

export const gerarRelatorio = (ep: Episodio, problemas: Problema[], checagem: Checagem | null, ts: Timestamps) => {
  const fonteNome = new Map([...ep.fontes, ...(checagem?.fontesExtras ?? [])].map((f) => [f.id, f.veiculo]));
  const nomes = (ids: string[]) => ids.map((i) => fonteNome.get(i) ?? `?${i}`).join(", ");
  const l: string[] = [];
  l.push(`# Relatório de checagem — ${ep.titulo}`, "");
  l.push(`- Slug: \`${ep.slug}\``, `- Publicação: ${fmtData(ep.dataPublicacao)}`, `- Duração: ${ts.duracaoSeg.toFixed(1)} s (narração: ${ts.provider})`);
  if (checagem) l.push(`- Checado em: ${checagem.checadoEm}`, `- Pedido original: ${checagem.pedido}`);
  l.push("");
  l.push("## Fatos", "");
  if (checagem) {
    l.push("| Fato | Fontes | Status | Nota |", "|---|---|---|---|");
    for (const f of checagem.fatos) l.push(`| ${esc(f.fato)} | ${esc(nomes(f.fonteIds))} | ${f.status} | ${esc(f.nota ?? "")} |`);
  } else {
    l.push("_checagem.json ausente: listando fatos do episódio._", "", "| Fato | Fontes | Cena |", "|---|---|---|");
    for (const c of ep.cenas) for (const f of c.fatos ?? []) l.push(`| ${esc(f.texto)} | ${esc(nomes(f.fonteIds))} | ${c.id} |`);
  }
  l.push("", "## Atribuições", "", "| Quem | Disse | Fonte | Cena |", "|---|---|---|---|");
  for (const c of ep.cenas) {
    for (const a of c.atribuicoes ?? []) l.push(`| ${esc(a.quem)} | ${esc(a.disse)} | ${esc(nomes([a.fonteId]))} | ${c.id} |`);
    if (c.tipo === "ladoA_ladoB") {
      for (const [lado, d] of [["A", c.dados.ladoA], ["B", c.dados.ladoB]] as const) {
        for (const arg of d.argumentos) l.push(`| ${esc(arg.quem)} (Lado ${lado}) | ${esc(arg.texto)} | ${esc(nomes([arg.fonteId]))} | ${c.id} |`);
      }
    }
  }
  l.push("", "## Simetria", "", "| Personagem | Cenas | Chars de narração | Argumentos A/B |", "|---|---|---|---|");
  for (const [id, v] of Object.entries(placarSimetria(ep))) l.push(`| ${id} | ${v.cenas} | ${Math.round(v.chars)} | ${v.argumentos} |`);
  if (checagem?.simetria) l.push("", checagem.simetria);
  l.push("", "## Validação automática", "");
  if (!problemas.length) l.push("Sem erros ou avisos.");
  for (const p of problemas) l.push(`- **${p.nivel}** ${p.cenaId ? `[${p.cenaId}] ` : ""}${p.msg}`);
  l.push("", "## Fontes", "");
  for (const f of ep.fontes) l.push(`- [${f.id}] ${f.veiculo} (${f.tipo}${f.linhaEditorial ? `, ${f.linhaEditorial}` : ""}) — ${f.titulo}, ${fmtData(f.data)} — ${f.url}`);
  return l.join("\n") + "\n";
};

export const gerarSaidasTexto = async (o: { slug: string; episodio: Episodio; timestamps: Timestamps; problemas: Problema[]; dir: string; previa: boolean }) => {
  const c = caminhos(o.slug);
  const checagemBruta = await fs.readFile(c.checagemJson, "utf8").catch(() => null);
  const checagem = checagemBruta ? ChecagemSchema.parse(JSON.parse(checagemBruta)) : null;
  const pref = o.previa ? "previa" : "legenda";
  await fs.writeFile(path.join(o.dir, `${pref}.srt`), gerarSrt(o.timestamps), "utf8");
  await fs.writeFile(path.join(o.dir, `${pref}.vtt`), gerarVtt(o.timestamps), "utf8");
  await fs.writeFile(path.join(o.dir, "descricao.txt"), gerarDescricao(o.episodio, o.previa ? null : o.timestamps), "utf8");
  await fs.writeFile(path.join(o.dir, "relatorio-checagem.md"), gerarRelatorio(o.episodio, o.problemas, checagem, o.timestamps), "utf8");
};
