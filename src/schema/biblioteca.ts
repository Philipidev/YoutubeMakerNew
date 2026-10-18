import { z } from "zod";
import { AcaoSchema, CenarioSchema, PosicaoSchema } from "./episodio";

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const PersonagemRegistroSchema = z.object({
  id: z.string(),
  rotulo: z.string(),
  numero: z.string().max(3),
  /** chave de theme.coresPersonagem */
  cor: z.string(),
  partido: z.string().optional(),
  cargo: z.string().optional(),
  desde: dataIso,
  /** episódios onde apareceu */
  episodios: z.array(z.string()).default([]),
});

export const AcaoCatalogoSchema = z.object({
  id: AcaoSchema,
  descricao: z.string(),
  quandoUsar: z.string(),
  quandoNaoUsar: z.string(),
  duracaoMinFrames: z.number().int().positive(),
});

/** Cena-modelo com slots {{nome}}. Nunca contém texto de notícia específica. */
export const MomentoSchema = z.object({
  id: z.string(),
  descricao: z.string(),
  tipo: z.string(),
  cenario: CenarioSchema.optional(),
  personagens: z
    .array(z.object({ slot: z.string(), acao: AcaoSchema, posicao: PosicaoSchema, fala: z.boolean().optional() }))
    .default([]),
  narracaoModelo: z.string(),
  slots: z.array(z.string()),
  usadoEm: z.array(z.string()).default([]),
});

export const FalaSchema = z.object({
  id: z.string(),
  uso: z.enum(["abertura", "transicao", "atribuicao", "encerramento", "aviso"]),
  texto: z.string(),
  aprovadaEm: dataIso,
});

export const ContextoSchema = z.object({
  id: z.string(),
  descricao: z.string(),
  fatos: z.array(
    z.object({
      texto: z.string(),
      fontes: z.array(z.object({ veiculo: z.string(), url: z.url(), data: z.string() })).min(1),
    }),
  ),
  checadoEm: dataIso,
  validadeDias: z.number().int().positive(),
});

export type PersonagemRegistro = z.infer<typeof PersonagemRegistroSchema>;
export type Momento = z.infer<typeof MomentoSchema>;
export type Contexto = z.infer<typeof ContextoSchema>;
