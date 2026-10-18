import type { Timestamps } from "../schema/timestamps";
import { gerarBlocos } from "./legenda-blocos";

const tempo = (s: number, sep: "," | ".") => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const seg = Math.floor((ms % 60_000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(seg)}${sep}${p(r, 3)}`;
};

export const gerarSrt = (ts: Timestamps) =>
  gerarBlocos(ts)
    .map((b, i) => `${i + 1}\n${tempo(b.inicio, ",")} --> ${tempo(b.fim, ",")}\n${b.linhas.join("\n")}\n`)
    .join("\n");

export const gerarVtt = (ts: Timestamps) =>
  "WEBVTT\n\n" +
  gerarBlocos(ts)
    .map((b) => `${tempo(b.inicio, ".")} --> ${tempo(b.fim, ".")}\n${b.linhas.join("\n")}\n`)
    .join("\n");
