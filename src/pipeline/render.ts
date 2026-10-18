import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { RAIZ } from "./caminhos";
import type { EpisodioPropsBase } from "../video/dados";

let bundleCache: string | null = null;

export const obterBundle = async () => {
  if (!bundleCache) {
    bundleCache = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: path.join(RAIZ, "public") });
  }
  return bundleCache;
};

export const renderizar = async (opts: { composicao: string; props: EpisodioPropsBase; saida: string; semAudio?: boolean }) => {
  const serveUrl = await obterBundle();
  const comp = await selectComposition({ serveUrl, id: opts.composicao, inputProps: opts.props });
  let ultimo = -1;
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: "h264",
    outputLocation: opts.saida,
    inputProps: opts.props,
    muted: opts.semAudio,
    crf: 18,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== ultimo) {
        ultimo = p;
        process.stdout.write(`  render ${opts.composicao}: ${p * 10}%\n`);
      }
    },
  });
};
