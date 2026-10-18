import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, safe } from "../theme";
import { useFormato } from "../layout/useFormato";
import type { Timestamps } from "../schema/timestamps";
import { gerarBlocos } from "../pipeline/legenda-blocos";

/** Legenda queimada (prévia e flag --legendaQueimada). Mesmos blocos do .srt. Palavra ativa em destaque. */
export const LegendaQueimada: React.FC<{ timestamps: Timestamps }> = ({ timestamps }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { formato, height, t } = useFormato();
  const blocos = useMemo(() => gerarBlocos(timestamps), [timestamps]);
  const palavras = useMemo(() => timestamps.cenas.flatMap((c) => c.palavras), [timestamps]);
  const s = f / fps;
  const bloco = blocos.find((b) => s >= b.inicio && s < b.fim);
  if (!bloco) return null;
  const ativa = palavras.find((p) => s >= p.inicio && s < p.fim);
  const bottom = height * safe[formato].base + 24;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", padding: "0 6%" }}>
      <div style={{ background: `${cores.fundo}E6`, borderRadius: 18, padding: "14px 26px", textAlign: "center" }}>
        {bloco.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.corpo * 1.15, lineHeight: 1.3, color: cores.texto }}>
            {l.split(" ").map((w, j) => (
              <span key={j} style={{ color: ativa && ativa.texto === w ? cores.acento : cores.texto }}>
                {w}{" "}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
