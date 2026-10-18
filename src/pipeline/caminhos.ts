import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const caminhos = (slug: string) => ({
  episodioDir: path.join(RAIZ, "episodes", slug),
  episodioJson: path.join(RAIZ, "episodes", slug, "episodio.json"),
  checagemJson: path.join(RAIZ, "episodes", slug, "checagem.json"),
  aprovadoJson: path.join(RAIZ, "episodes", slug, "aprovado.json"),
  vozDir: path.join(RAIZ, "episodes", slug, "voz"),
  publicDir: path.join(RAIZ, "public", "episodes", slug),
  outDir: path.join(RAIZ, "out", slug),
  previaDir: path.join(RAIZ, "out", slug, "previa"),
});
