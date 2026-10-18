import { staticFile, type CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { EpisodioSchema, type Episodio } from "../schema/episodio";
import { TimestampsSchema, type TempoCena, type Timestamps } from "../schema/timestamps";
import { estimarTimestamps } from "../pipeline/narracao/estimativa";
import { calcularTempos } from "../pipeline/duracoes";

export const EpisodioPropsSchema = z.object({
  slug: z.string(),
  legendaQueimada: z.boolean(),
  /** Prévia: sem voz e sem SFX. */
  semAudio: z.boolean(),
});
export type EpisodioPropsBase = z.infer<typeof EpisodioPropsSchema>;

export type DadosEpisodio = {
  episodio: Episodio;
  timestamps: Timestamps;
  tempos: TempoCena[];
  audioSrc: string | null;
};
export type EpisodioProps = EpisodioPropsBase & { dados?: DadosEpisodio };

const buscarJson = async (caminho: string): Promise<unknown | null> => {
  const r = await fetch(staticFile(caminho));
  if (!r.ok) return null;
  return r.json();
};

/** Carrega episódio e tempos de public/episodes/<slug>/ (escritos pelo pipeline). */
export const carregarDados = async (slug: string): Promise<DadosEpisodio> => {
  const base = `episodes/${slug}`;
  const ep = await buscarJson(`${base}/episodio.json`);
  if (!ep) throw new Error(`public/${base}/episodio.json não encontrado. Rode o pipeline (previa/episodio) para sincronizar.`);
  const episodio = EpisodioSchema.parse(ep);
  const tsBruto = await buscarJson(`${base}/timestamps.json`);
  const timestamps = tsBruto ? TimestampsSchema.parse(tsBruto) : estimarTimestamps(episodio.cenas);
  const audioSrc = timestamps.provider === "mock" ? null : staticFile(`${base}/audio.wav`);
  return { episodio, timestamps, tempos: calcularTempos(timestamps), audioSrc };
};

export const calcularMetadataEpisodio: CalculateMetadataFunction<EpisodioProps> = async ({ props }) => {
  const dados = await carregarDados(props.slug);
  const fim = dados.tempos.reduce((m, t) => Math.max(m, t.inicioFrame + t.duracaoFrames), 1);
  return { durationInFrames: fim, props: { ...props, dados } };
};
