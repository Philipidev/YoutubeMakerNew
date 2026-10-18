import React, { useMemo } from "react";
import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Timestamps } from "../schema/timestamps";
import type { Trilha } from "./trilhas";

/**
 * Trilha de fundo com "ducking" automático:
 * - nível base igualado entre músicas (pelo LUFS medido);
 * - enquanto a voz fala, a música fica ~18 dB abaixo da narração (−14 LUFS → música ~−32 LUFS);
 * - em pausas e cards de seção ela sobe para ~−27 LUFS, com transição suave (sem tranco);
 * - fade-in no início e fade-out no fim; repete (loop) se o vídeo for mais longo que a faixa.
 */
const LUFS_FALANDO = -32;
const LUFS_PAUSA = -27;
const ATAQUE_SEG = 0.15; // quão perto de uma palavra a música já começa a baixar
const SOLTURA_SEG = 0.7; // quanto tempo depois da última palavra ela leva para subir

const ganho = (lufsAlvo: number, lufsFaixa: number) => Math.pow(10, (lufsAlvo - lufsFaixa) / 20);

export const TrilhaDeFundo: React.FC<{ trilha: Trilha; timestamps: Timestamps | null }> = ({ trilha, timestamps }) => {
  const { fps, durationInFrames } = useVideoConfig();
  // intervalos de fala (palavras), ordenados, para medir a distância até a fala mais próxima
  const falas = useMemo(() => (timestamps ? timestamps.cenas.flatMap((c) => c.palavras.map((p) => [p.inicio, p.fim] as const)) : []), [timestamps]);
  const gFalando = ganho(LUFS_FALANDO, trilha.lufs);
  const gPausa = ganho(LUFS_PAUSA, trilha.lufs);

  const distanciaFala = (s: number) => {
    let melhor = Infinity;
    // busca binária pelo primeiro intervalo que termina depois de s
    let lo = 0;
    let hi = falas.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (falas[m][1] < s) lo = m + 1;
      else hi = m;
    }
    for (const k of [lo - 1, lo]) {
      const f = falas[k];
      if (!f) continue;
      if (s >= f[0] && s <= f[1]) return 0;
      // antes da palavra conta o ataque; depois, a soltura
      melhor = Math.min(melhor, s < f[0] ? (f[0] - s) * (SOLTURA_SEG / ATAQUE_SEG) : s - f[1]);
    }
    return melhor;
  };

  return (
    <Audio
      src={staticFile(trilha.arquivo)}
      loop
      volume={(f) => {
        const s = f / fps;
        const abertura = falas.length ? interpolate(distanciaFala(s), [0, SOLTURA_SEG], [0, 1], { extrapolateRight: "clamp" }) : 1;
        const g = gFalando + (gPausa - gFalando) * abertura;
        const fade = interpolate(f, [0, fps * 1.5, durationInFrames - fps * 3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return Math.min(1, g * fade);
      }}
    />
  );
};
