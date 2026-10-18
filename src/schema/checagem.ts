import { z } from "zod";

/** Resultado da checagem feita pela skill nova-noticia. Base do relatorio-checagem.md. */
export const ChecagemSchema = z.object({
  slug: z.string(),
  checadoEm: z.string(),
  pedido: z.string(),
  fatos: z.array(
    z.object({
      fato: z.string(),
      fonteIds: z.array(z.string()),
      status: z.enum(["confirmado", "divergente", "descartado"]),
      nota: z.string().optional(),
    }),
  ),
  /** Fontes consultadas que não entraram em episodio.fontes (ex.: só usadas para descartar). */
  fontesExtras: z
    .array(z.object({ id: z.string(), veiculo: z.string(), url: z.url(), data: z.string(), linhaEditorial: z.string().optional() }))
    .default([]),
  simetria: z.string().optional(),
});
export type Checagem = z.infer<typeof ChecagemSchema>;
