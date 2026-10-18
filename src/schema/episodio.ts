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
] as const;
export const CenarioSchema = z.enum(CENARIOS);
export type CenarioId = z.infer<typeof CenarioSchema>;

const PersonagemEmCena = z.object({
  id,
  acao: AcaoSchema,
  posicao: PosicaoSchema,
  /** Boca sincroniza com a narração desta cena. */
  fala: z.boolean().optional(),
});

const Fato = z.object({ texto: z.string().min(1), fonteIds: z.array(id).min(1) });

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
};

const Argumento = z.object({ texto: z.string().min(1), quem: z.string().min(1), fonteId: id });
const Lado = z.object({
  titulo: z.string().min(1),
  personagemId: id.optional(),
  argumentos: z.array(Argumento).min(1),
});

export const CenaSchema = z.discriminatedUnion("tipo", [
  z.object({ ...base, tipo: z.literal("gancho"), dados: z.object({ manchete: z.string(), destaque: z.string().optional() }) }),
  z.object({ ...base, tipo: z.literal("fato") }),
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
      resultados: z.array(z.object({ personagemId: id, pct: z.number().min(0).max(100) })).min(1),
    }),
  }),
  z.object({ ...base, tipo: z.literal("debate"), dados: z.object({ ausentes: z.array(id).optional() }).optional() }),
  z.object({
    ...base,
    tipo: z.literal("votacao"),
    dados: z.object({
      orgao: z.string().min(1),
      etapa: z.string().optional(),
      placar: z.object({ sim: z.number().int(), nao: z.number().int(), abst: z.number().int() }).optional(),
    }),
  }),
  z.object({ ...base, tipo: z.literal("naoSeSabe"), dados: z.object({ itens: z.array(z.string().min(1)).min(1) }) }),
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
