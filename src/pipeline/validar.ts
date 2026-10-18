import { coresPartido } from "../theme";
import { EpisodioSchema, type Cena, type Episodio } from "../schema/episodio";

export type Problema = { nivel: "erro" | "aviso"; cenaId?: string; msg: string };

/** Termos que exprimem juízo. Só podem aparecer na narração atribuídos a alguém. */
export const TERMOS_OPINATIVOS = [
  "populista", "populismo", "eleitoreir", "oportunis", "coraj", "ótima", "ótimo", "excelente", "péssim",
  "desastros", "vergonh", "absurd", "acertad", "equivocad", "irresponsáv", "histórica", "histórico",
  "polêmic", "controvers", "radical", "extremist", "golpist", "autoritári", "demagog", "manobra",
  "brilhante", "lament", "infelizmente", "felizmente", "escândalo", "escandal", "mentir", "mentira",
];

const MARCADORES_ATRIBUICAO = [
  "segundo", "para o", "para a", "para os", "para as", "de acordo com", "disse", "afirmou", "declarou",
  "avalia", "avaliou", "classificou", "chamou", "criticou", "defendeu", "argumenta", "argumentou",
  "sustenta", "na visão", "nas palavras", "chamad", "citando", "conforme", "alega", "alegou", "acusou", "diz", "dizem", "afirma",
];

const PROIBIDOS: { re: RegExp; msg: string }[] = [
  { re: /\bvote(m)?\b|\bvotem em\b|em quem votar|não vote/i, msg: "pedido/sugestão de voto" },
  { re: /\bvai (ganhar|vencer|perder)\b|\bvão (ganhar|vencer|perder)\b|deve (ganhar|vencer)|favorito/i, msg: "previsão de resultado" },
];

const frases = (t: string) => t.split(/(?<=[.!?…])\s+/).filter(Boolean);
const normal = (s: string) => s.toLowerCase();

const idsFonte = (c: Cena): string[] => [
  ...(c.fatos ?? []).flatMap((f) => f.fonteIds),
  ...(c.atribuicoes ?? []).map((a) => a.fonteId),
  ...(c.tipo === "linhaDoTempo" ? c.dados.eventos.flatMap((e) => e.fonteIds) : []),
  ...(c.tipo === "ladoA_ladoB" ? [...c.dados.ladoA.argumentos, ...c.dados.ladoB.argumentos].map((a) => a.fonteId) : []),
  ...(c.tipo === "grafico" ? [c.dados.fonteId] : []),
  ...(c.tipo === "pesquisa" && c.dados.fonteId ? [c.dados.fonteId] : []),
  ...(c.tipo === "servico" ? c.dados.linhas.flatMap((l) => (l.fonteId ? [l.fonteId] : [])) : []),
  ...(c.tipo === "propostas" ? c.dados.lados.flatMap((l) => l.propostas.map((p) => p.fonteId)) : []),
];

export const validarEpisodio = (bruto: unknown): { episodio: Episodio | null; problemas: Problema[] } => {
  const r = EpisodioSchema.safeParse(bruto);
  if (!r.success) {
    return {
      episodio: null,
      problemas: r.error.issues.map((i) => ({ nivel: "erro", msg: `schema: ${i.path.join(".")}: ${i.message}` })),
    };
  }
  const ep = r.data;
  const problemas: Problema[] = [];
  const fontes = new Set(ep.fontes.map((f) => f.id));
  const pers = new Set(ep.personagens.map((p) => p.id));
  const ids = new Set<string>();

  for (const c of ep.cenas) {
    if (ids.has(c.id)) problemas.push({ nivel: "erro", cenaId: c.id, msg: "id de cena duplicado" });
    ids.add(c.id);

    for (const fid of idsFonte(c)) {
      if (!fontes.has(fid)) problemas.push({ nivel: "erro", cenaId: c.id, msg: `fonte inexistente: ${fid}` });
    }
    for (const p of c.personagens ?? []) {
      if (!pers.has(p.id)) problemas.push({ nivel: "erro", cenaId: c.id, msg: `personagem inexistente: ${p.id}` });
    }
    if (c.tipo === "pesquisa") {
      for (const res of c.dados.resultados) {
        if (!pers.has(res.personagemId)) problemas.push({ nivel: "erro", cenaId: c.id, msg: `pesquisa: personagem inexistente ${res.personagemId}` });
      }
    }

    // Termos opinativos: só com atribuição explícita na mesma frase e coberta por c.atribuicoes
    const termosCobertos = (c.atribuicoes ?? []).flatMap((a) => (a.termos ?? []).map(normal));
    for (const fr of frases(c.narracao)) {
      const frl = normal(fr);
      for (const termo of TERMOS_OPINATIVOS) {
        if (!new RegExp(String.raw`(^|[^\p{L}])` + termo, "u").test(frl)) continue;
        const temMarcador = MARCADORES_ATRIBUICAO.some((m) => frl.includes(m));
        const coberto = termosCobertos.some((t) => t.includes(termo) || termo.includes(t) || frl.includes(t));
        if (!temMarcador || !coberto) {
          problemas.push({
            nivel: "erro",
            cenaId: c.id,
            msg: `termo opinativo sem atribuição: "${termo}" em "${fr}". Atribua a quem disse (atribuicoes[].termos) e use marcador ("segundo…", "para…", "disse…").`,
          });
        }
      }
    }
    for (const { re, msg } of PROIBIDOS) {
      if (re.test(c.narracao)) problemas.push({ nivel: "erro", cenaId: c.id, msg: `${msg}: "${c.narracao}"` });
    }
    if (c.tipo === "propostas") {
      const ns = c.dados.lados.map((l) => l.propostas.length);
      if (Math.max(...ns) !== Math.min(...ns)) problemas.push({ nivel: "aviso", cenaId: c.id, msg: `propostas com quantidades diferentes por lado: ${ns.join(" x ")}` });
    }
    if (c.tipo === "fato" && !c.fatos?.length && !c.atribuicoes?.length) {
      problemas.push({ nivel: "erro", cenaId: c.id, msg: "cena de fato sem fatos[] nem atribuicoes[] com fonte" });
    }
  }

  // cor de partido: se um ator político usa cor de partido, todos com partido devem usar a do próprio partido
  const partidos = new Set(Object.keys(coresPartido));
  const comPartido = ep.personagens.filter((p) => p.partido);
  if (comPartido.some((p) => partidos.has(p.cor))) {
    for (const p of comPartido) {
      if (p.cor !== p.partido) problemas.push({ nivel: "aviso", msg: `simetria de cor: ${p.id} (${p.partido}) não usa a cor do próprio partido (cor=${p.cor})` });
    }
  }

  if (ep.cenas[ep.cenas.length - 1].tipo !== "encerramento") {
    problemas.push({ nivel: "erro", msg: "última cena deve ser encerramento (fontes + aviso IA)" });
  }
  if (ep.cenas[0].tipo !== "gancho") problemas.push({ nivel: "aviso", msg: "primeira cena não é gancho" });

  problemas.push(...checarSimetria(ep));
  return { episodio: ep, problemas };
};

/** Placar de simetria: caracteres de narração e de argumentos por personagem. */
export const placarSimetria = (ep: Episodio) => {
  const placar: Record<string, { chars: number; cenas: number; argumentos: number }> = {};
  for (const p of ep.personagens) placar[p.id] = { chars: 0, cenas: 0, argumentos: 0 };
  for (const c of ep.cenas) {
    const presentes = new Set((c.personagens ?? []).map((p) => p.id));
    for (const id of presentes) {
      if (!placar[id]) continue;
      placar[id].cenas++;
      placar[id].chars += c.narracao.length / presentes.size;
    }
    if (c.tipo === "ladoA_ladoB") {
      for (const lado of [c.dados.ladoA, c.dados.ladoB]) {
        if (lado.personagemId && placar[lado.personagemId]) placar[lado.personagemId].argumentos += lado.argumentos.length;
      }
    }
  }
  return placar;
};

const checarSimetria = (ep: Episodio): Problema[] => {
  const out: Problema[] = [];
  // só atores políticos (com partido ou número) entram na comparação de tempo de tela
  const politicos = new Set(ep.personagens.filter((p) => p.partido || p.numero).map((p) => p.id));
  const placar = Object.entries(placarSimetria(ep)).filter(([id, v]) => v.cenas > 0 && politicos.has(id));
  if (placar.length >= 2) {
    const chars = placar.map(([, v]) => v.chars);
    const max = Math.max(...chars);
    const min = Math.min(...chars);
    if (max > 0 && (max - min) / max > 0.25) {
      out.push({
        nivel: "aviso",
        msg: `assimetria de tempo de tela > 25%: ${placar.map(([k, v]) => `${k}=${Math.round(v.chars)}`).join(", ")}`,
      });
    }
  }
  for (const c of ep.cenas) {
    if (c.tipo !== "ladoA_ladoB") continue;
    const a = c.dados.ladoA.argumentos.length;
    const b = c.dados.ladoB.argumentos.length;
    if (a !== b) out.push({ nivel: "aviso", cenaId: c.id, msg: `Lado A tem ${a} argumentos e Lado B tem ${b}` });
  }
  return out;
};
