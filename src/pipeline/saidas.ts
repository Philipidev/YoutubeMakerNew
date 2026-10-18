import fs from "node:fs/promises";
import path from "node:path";
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

/** Limites do YouTube: descrição 5.000 caracteres; comentário 10.000. Margem de segurança. */
const LIMITE_DESCRICAO = 4800;
const LIMITE_COMENTARIO = 9500;

const linhaCompacta = (f: Episodio["fontes"][number]) => `• ${f.veiculo} (${fmtData(f.data)}): ${f.url}`;
const linhaCompleta = (f: Episodio["fontes"][number]) => `• ${f.veiculo} — ${f.titulo} (${fmtData(f.data)})\n  ${f.url}`;

/**
 * Descrição dentro do limite do YouTube. Se as fontes não couberem, entram as principais
 * (oficiais primeiro) e a lista completa vai para o comentário fixado (gerarComentarioFontes).
 * Retorna também se a lista ficou incompleta.
 */
export const gerarDescricaoComLimite = (ep: Episodio, ts: Timestamps | null = null): { texto: string; fontesCompletas: boolean } => {
  const t = trilhaPorId(ep.trilha);
  const musica = t ? `Música: ${t.titulo} — ${t.artista}${t.atribuicao ? ". " + t.atribuicao : " (Biblioteca de Áudio do YouTube)"}` : "";
  const caps = capitulos(ep, ts);
  // hashtags dos candidatos em par; a ordem segue o lado fixo do episódio
  const tags = ["#Eleições2026", ...ep.personagens.filter((p) => p.partido).map((p) => "#" + p.rotulo.replace(/\s+/g, ""))].join(" ");
  const montar = (fontes: string, aviso: string) => [ep.resumo.trim(), caps, fontes, musica, COMO_E_FEITO, tags].filter(Boolean).join("\n\n").replace("{{AVISO}}", aviso) + "\n";

  const todasCompletas = "FONTES\n" + ep.fontes.map(linhaCompleta).join("\n");
  if (montar(todasCompletas, "").length <= LIMITE_DESCRICAO) return { texto: montar(todasCompletas, ""), fontesCompletas: true };

  // prioridade: oficiais → uma fonte por cena (todo assunto do vídeo tem ao menos uma) → o resto
  const primeiraDaCena = ep.cenas.flatMap((c) => {
    const ids = [
      ...(c.tipo === "pesquisa" && c.dados.fonteId ? [c.dados.fonteId] : []),
      ...(c.tipo === "grafico" ? [c.dados.fonteId] : []),
      ...(c.fatos ?? []).flatMap((f) => f.fonteIds),
      ...(c.atribuicoes ?? []).map((a) => a.fonteId),
      ...(c.tipo === "ladoA_ladoB" ? [...c.dados.ladoA.argumentos, ...c.dados.ladoB.argumentos].map((a) => a.fonteId) : []),
      ...(c.tipo === "linhaDoTempo" ? c.dados.eventos.flatMap((e) => e.fonteIds) : []),
    ];
    return ids.slice(0, 1);
  });
  const porId = new Map(ep.fontes.map((f) => [f.id, f]));
  const ordemIds = [...ep.fontes.filter((f) => f.tipo === "primaria").map((f) => f.id), ...primeiraDaCena, ...ep.fontes.map((f) => f.id)];
  const ordenadas = [...new Set(ordemIds)].map((id) => porId.get(id)).filter((f): f is Episodio["fontes"][number] => !!f);
  const rodape = `(+ lista completa com ${ep.fontes.length} fontes no comentário fixado)`;
  const escolhidas: string[] = [];
  for (const f of ordenadas) {
    const tentativa = `PRINCIPAIS FONTES\n${[...escolhidas, linhaCompacta(f)].join("\n")}\n${rodape}`;
    if (montar(tentativa, "").length > LIMITE_DESCRICAO) break;
    escolhidas.push(linhaCompacta(f));
  }
  return { texto: montar(`PRINCIPAIS FONTES\n${escolhidas.join("\n")}\n${rodape}`, ""), fontesCompletas: false };
};

export const gerarDescricao = (ep: Episodio, ts: Timestamps | null = null) => gerarDescricaoComLimite(ep, ts).texto;

/** Lista completa de fontes para o comentário fixado; divide em partes de até 10 mil caracteres. */
export const gerarComentarioFontes = (ep: Episodio): string[] => {
  const partes: string[] = [];
  let atual = "FONTES COMPLETAS DO VÍDEO";
  for (const f of ep.fontes) {
    const linha = linhaCompleta(f);
    if ((atual + "\n" + linha).length > LIMITE_COMENTARIO) {
      partes.push(atual);
      atual = "FONTES (continuação)";
    }
    atual += "\n" + linha;
  }
  partes.push(atual);
  return partes;
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
  const comentarios = gerarComentarioFontes(o.episodio);
  await fs.writeFile(path.join(o.dir, "comentario-fontes.txt"), comentarios.join("\n\n----- (novo comentário) -----\n\n") + "\n", "utf8");
  await fs.writeFile(path.join(o.dir, "relatorio-checagem.md"), gerarRelatorio(o.episodio, o.problemas, checagem, o.timestamps), "utf8");
};
