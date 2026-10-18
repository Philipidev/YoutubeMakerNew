import { z } from "zod";

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "id em kebab-case");
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/, "data ISO");

export const FonteSchema = z.object({
  id,
  veiculo: z.string().min(1),
  titulo: z.string().min(1),
  url: z.url(),
  data: dataIso,
  tipo: z.enum(["primaria", "imprensa"]),
  linhaEditorial: z.string().optional(),
});

export const PersonagemSchema = z.object({
  id,
  rotulo: z.string().min(1),
  numero: z.string().max(3),
  cor: z.string().min(1),
  partido: z.string().optional(),
  roupa: z.enum(["camisa", "terno", "toga", "simples"]).optional(),
  /** ISO 3166-1 alfa-2: crachá com bandeira em vez de número (líderes estrangeiros) */
  pais: z.string().length(2).optional(),
  idade: z.enum(["adulto", "idoso"]).optional(),
  acessorio: z.enum(["nenhum", "carteiraVazia", "carteiraCheia", "maletaDinheiro", "documento", "bengala"]).optional(),
});

export const ACOES = [
  "idle",
  "acenar",
  "sorrir",
  "falar",
  "apontar",
  "pensativo",
  "surpreso",
  "bracosCruzados",
  "comemorar",
] as const;
export const AcaoSchema = z.enum(ACOES);
export type Acao = z.infer<typeof AcaoSchema>;

export const PosicaoSchema = z.enum(["esq", "centro", "dir"]);
export type Posicao = z.infer<typeof PosicaoSchema>;

export const CENARIOS = [
  "neutro",
  "pulpitos",
  "pulpitoVazio",
  "urna",
  "plenarioCamara",
  "plenarioSenado",
  "martelo",
  "planalto",
  "mapaBrasil",
  "mapaCapitais",
  "mapaRegioes",
  "mapaEstado",
  "congresso",
  "banco",
  "cpi",
  "policia",
  "tribunal",
  "mundo",
] as const;

/** Parâmetros do cenário (rótulo da instituição, UFs em destaque, valores do coroplético etc.). */
export const CenarioOpcoesSchema = z.object({
  rotulo: z.string().optional(),
  uf: z.string().length(2).optional(),
  ufs: z.array(z.string().length(2)).optional(),
  valores: z.record(z.string(), z.number()).optional(),
  regioes: z.array(z.enum(["N", "NE", "CO", "SE", "S"])).optional(),
  casa: z.enum(["camara", "senado"]).optional(),
  votos: z.array(z.enum(["sim", "nao", "pendente"])).optional(),
  paises: z.array(z.string().length(2)).optional(),
});
export type CenarioOpcoes = z.infer<typeof CenarioOpcoesSchema>;
export const CenarioSchema = z.enum(CENARIOS);
export type CenarioId = z.infer<typeof CenarioSchema>;

const PersonagemEmCena = z.object({
  id,
  acao: AcaoSchema,
  posicao: PosicaoSchema,
  /** Boca sincroniza com a narração desta cena. */
  fala: z.boolean().optional(),
  /** Acessório só nesta cena (ex.: documento ao anunciar um ato). */
  acessorio: z.enum(["nenhum", "carteiraVazia", "carteiraCheia", "maletaDinheiro", "documento", "bengala"]).optional(),
});

const Fato = z.object({
  texto: z.string().min(1),
  fonteIds: z.array(id).min(1),
  /** "divergente" = fontes discordam; o vídeo mostra a divergência explicitamente. */
  status: z.enum(["confirmado", "divergente"]).default("confirmado"),
  /** Para divergência: o que cada fonte diz. */
  divergencia: z.array(z.object({ fonteId: id, versao: z.string().min(1) })).optional(),
});

const Atribuicao = z.object({
  /** personagemId ou texto livre ("Associação X", "analista Y, do veículo Z") */
  quem: z.string().min(1),
  disse: z.string().min(1),
  fonteId: id,
  /** Termos opinativos que esta atribuição cobre na narração. */
  termos: z.array(z.string()).optional(),
});

const Sfx = z.object({
  tipo: z.enum(["whoosh", "pop", "ding"]),
  /** "inicio" ou índice da palavra na narração da cena */
  em: z.union([z.literal("inicio"), z.number().int().min(0)]),
});

const base = {
  id,
  narracao: z.string().min(1),
  cenario: CenarioSchema.optional(),
  personagens: z.array(PersonagemEmCena).optional(),
  fatos: z.array(Fato).optional(),
  atribuicoes: z.array(Atribuicao).optional(),
  sfx: z.array(Sfx).optional(),
  /** Momento da biblioteca que originou a cena (rastreio de reuso). */
  momento: z.string().optional(),
  /** Bloco do roteiro (agrupamento no roteiro.md). */
  bloco: z.string().optional(),
  cenarioOpcoes: CenarioOpcoesSchema.optional(),
  /** Sobrescreve o sorteio de câmera/transição (src/movimento). */
  camera: z.enum(["zoomIn", "zoomOut", "panEsq", "panDir", "panCima", "panBaixo", "kenBurns", "respirar", "deriva"]).optional(),
  transicao: z.enum(["corte", "slideEsq", "slideDir", "slideCima", "push", "wipeDiagonal", "iris", "zoomPunch", "dissolve", "flash"]).optional(),
};

const Argumento = z.object({ texto: z.string().min(1), quem: z.string().min(1), fonteId: id });
const Lado = z.object({
  titulo: z.string().min(1),
  personagemId: id.optional(),
  argumentos: z.array(Argumento).min(1),
});

const Ponto = z.object({ rotulo: z.string(), valor: z.number(), destaque: z.boolean().optional() });
const baseGrafico = { titulo: z.string().min(1), fonteId: id, nota: z.string().optional() };
export const GraficoSchema = z.discriminatedUnion("grafico", [
  z.object({ ...baseGrafico, grafico: z.literal("barras"), unidade: z.string().optional(), pontos: z.array(Ponto).min(1) }),
  z.object({ ...baseGrafico, grafico: z.literal("linha"), unidade: z.string().optional(), zeroNoEixo: z.boolean().optional(), pontos: z.array(Ponto).min(2) }),
  z.object({ ...baseGrafico, grafico: z.literal("piramide"), faixas: z.array(z.object({ faixa: z.string(), homens: z.number(), mulheres: z.number() })).min(2) }),
  z.object({ ...baseGrafico, grafico: z.literal("pictograma"), percentual: z.number().min(0).max(100), rotuloDestaque: z.string() }),
  z.object({ ...baseGrafico, grafico: z.literal("rosca"), pontos: z.array(Ponto).min(2) }),
  z.object({ ...baseGrafico, grafico: z.literal("mapa"), unidade: z.string().optional(), valores: z.record(z.string().length(2), z.number()) }),
]);
export type Grafico = z.infer<typeof GraficoSchema>;

export const CenaSchema = z.discriminatedUnion("tipo", [
  z.object({ ...base, tipo: z.literal("gancho"), dados: z.object({ manchete: z.string(), destaque: z.string().optional() }) }),
  z.object({ ...base, tipo: z.literal("fato"), dados: z.object({ ufs: z.array(z.string().length(2)).optional(), rotuloCenario: z.string().optional() }).optional() }),
  z.object({ ...base, tipo: z.literal("contexto"), dados: z.object({ numero: z.string().optional(), rotulo: z.string().optional() }).optional() }),
  z.object({
    ...base,
    tipo: z.literal("linhaDoTempo"),
    dados: z.object({
      eventos: z
        .array(
          z.object({
            data: z.string().min(1),
            rotulo: z.string().min(1),
            fonteIds: z.array(id).min(1),
            fase: z.enum(["antes", "fato", "reacao"]),
          }),
        )
        .min(2),
    }),
  }),
  z.object({ ...base, tipo: z.literal("ladoA_ladoB"), dados: z.object({ ladoA: Lado, ladoB: Lado }) }),
  z.object({
    ...base,
    tipo: z.literal("pesquisa"),
    dados: z.object({
      instituto: z.string().min(1),
      campo: z.object({ inicio: dataIso, fim: dataIso }),
      registroTSE: z.string().min(1),
      margemErro: z.string().min(1),
      amostra: z.number().int().positive().optional(),
      /** "totais" (inclui brancos/nulos/indecisos) ou "validos". Sempre mostrado na tela. */
      base: z.enum(["totais", "validos"]).default("totais"),
      contratante: z.string().optional(),
      /** Fonte da pesquisa (matéria/registro) para o selo. */
      fonteId: id.optional(),
      resultados: z.array(z.object({ personagemId: id, pct: z.number().min(0).max(100) })).min(1),
    }),
  }),
  z.object({ ...base, tipo: z.literal("debate"), dados: z.object({ ausentes: z.array(id).optional(), titulo: z.string().optional() }).optional() }),
  z.object({
    ...base,
    tipo: z.literal("votacao"),
    dados: z.object({
      orgao: z.string().min(1),
      etapa: z.string().optional(),
      casa: z.enum(["camara", "senado", "stf", "tse", "outro"]).default("outro"),
      placar: z.object({ sim: z.number().int(), nao: z.number().int(), abst: z.number().int() }).optional(),
    }),
  }),
  z.object({ ...base, tipo: z.literal("naoSeSabe"), dados: z.object({ itens: z.array(z.string().min(1)).min(1) }) }),
  z.object({ ...base, tipo: z.literal("grafico"), dados: GraficoSchema }),
  z.object({
    ...base,
    tipo: z.literal("propostas"),
    dados: z.object({
      titulo: z.string().min(1),
      lados: z
        .array(z.object({ personagemId: id, propostas: z.array(z.object({ texto: z.string().min(1), fonteId: id })).min(1) }))
        .min(1),
    }),
  }),
  z.object({
    ...base,
    tipo: z.literal("checklist"),
    dados: z.object({ titulo: z.string().min(1), itens: z.array(z.string().min(1)).min(2) }),
  }),
  z.object({
    ...base,
    tipo: z.literal("servico"),
    dados: z.object({
      titulo: z.string().min(1),
      linhas: z.array(z.object({ rotulo: z.string().min(1), valor: z.string().min(1), fonteId: id.optional() })).min(1),
    }),
  }),
  z.object({ ...base, tipo: z.literal("encerramento") }),
]);
export type Cena = z.infer<typeof CenaSchema>;
export type TipoCena = Cena["tipo"];

export const EpisodioSchema = z.object({
  slug: id,
  titulo: z.string().min(1),
  dataPublicacao: dataIso,
  /** 2–3 linhas neutras para a descrição. */
  resumo: z.string().min(1),
  /** Lado que aparece à esquerda no card A/B; alternado entre episódios. */
  ordemLados: z.enum(["AB", "BA"]).default("AB"),
  fontes: z.array(FonteSchema).min(1),
  personagens: z.array(PersonagemSchema),
  cenas: z.array(CenaSchema).min(1),
});
export type Episodio = z.infer<typeof EpisodioSchema>;
export type Fonte = z.infer<typeof FonteSchema>;
export type Personagem = z.infer<typeof PersonagemSchema>;
