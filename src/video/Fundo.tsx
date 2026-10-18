import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { cores } from "../theme";

/** Fundo do canal: grafite com grade sutil em deriva constante (movimento de fundo). */
export const Fundo: React.FC<{ deslocamento?: number }> = ({ deslocamento = 0 }) => {
  const f = useCurrentFrame() + deslocamento;
  const desloc = interpolate(f, [0, 300], [0, 60], { extrapolateRight: "extend" }) % 60;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${cores.fundoAlt} 0%, ${cores.fundo} 70%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${cores.linha}33 2px, transparent 2px), linear-gradient(90deg, ${cores.linha}33 2px, transparent 2px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `${desloc}px ${desloc}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
