/**
 * Catálogo de trilhas de fundo (public/musica). `lufs` medido com ffmpeg loudnorm para igualar o nível de todas.
 * Origem e licença: assets/musica/LICENSES.md.
 */
export type Trilha = { id: string; arquivo: string; titulo: string; artista: string; lufs: number; atribuicao?: string };

export const TRILHAS: Trilha[] = [
  { id: "rain-over-kyoto-station", arquivo: "musica/rain-over-kyoto-station--the-mini-vandals.mp3", titulo: "Rain Over Kyoto Station", artista: "The Mini Vandals", lufs: -11.2 },
  { id: "floating-lanterns", arquivo: "musica/floating-lanterns--the-mini-vandals.mp3", titulo: "Floating Lanterns", artista: "The Mini Vandals", lufs: -10.8 },
  { id: "running", arquivo: "musica/running--nat-keefe.mp3", titulo: "Running", artista: "Nat Keefe", lufs: -14.6 },
  { id: "jomon-grove", arquivo: "musica/jomon-grove--the-mini-vandals.mp3", titulo: "Jomon Grove", artista: "The Mini Vandals", lufs: -12.9 },
];

export const trilhaPorId = (id?: string) => TRILHAS.find((t) => t.id === id);
