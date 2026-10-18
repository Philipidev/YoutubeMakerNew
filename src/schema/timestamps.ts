import { z } from "zod";

export const PalavraSchema = z.object({
  texto: z.string(),
  inicio: z.number().min(0),
  fim: z.number().min(0),
});
export type Palavra = z.infer<typeof PalavraSchema>;

/** Formato único produzido por todos os NarracaoProvider. Tempos em segundos, absolutos no áudio. */
export const TimestampsSchema = z.object({
  provider: z.enum(["elevenlabs", "gravada", "mock"]),
  duracaoSeg: z.number().positive(),
  cenas: z.array(
    z.object({
      cenaId: z.string(),
      inicioSeg: z.number().min(0),
      fimSeg: z.number().min(0),
      palavras: z.array(PalavraSchema),
    }),
  ),
});
export type Timestamps = z.infer<typeof TimestampsSchema>;

/** Durações derivadas do áudio, em frames. Gerado em public/episodes/<slug>/cenas.json. */
export const TempoCenaSchema = z.object({
  cenaId: z.string(),
  inicioFrame: z.number().int().min(0),
  duracaoFrames: z.number().int().positive(),
});
export type TempoCena = z.infer<typeof TempoCenaSchema>;
