import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";
import type { CenaProps } from "../video/CenaRouter";

/** Placeholder: rótulo do tipo + narração. Usado enquanto o tipo não tem componente próprio. */
export const CenaGenerica: React.FC<CenaProps> = ({ cena }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { area, t } = useFormato();
  const e = spring({ frame: f, fps, config: movimento.entrada });
  return (
    <AbsoluteFill style={{ padding: `${area.y}px ${area.x}px`, justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(${(1 - e) * 80}px)`,
          opacity: e,
          background: cores.superficie,
          borderRadius: raio.card,
          padding: 48,
          border: `2px solid ${cores.linha}`,
        }}
      >
        <div style={{ fontFamily: fontes.corpo, fontWeight: 800, color: cores.acento, fontSize: t.legenda, letterSpacing: 4, textTransform: "uppercase" }}>
          {cena.tipo}
        </div>
        <div style={{ fontFamily: fontes.corpo, fontWeight: 600, color: cores.texto, fontSize: t.corpo, marginTop: 20, lineHeight: 1.35 }}>
          {cena.narracao}
        </div>
      </div>
    </AbsoluteFill>
  );
};
