import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { cores, safe } from "../theme";
import { useFormato } from "../layout/useFormato";

export const BarraProgresso: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { formato, width, height } = useFormato();
  const y = height * safe[formato].topo * 0.35;
  const margem = width * safe[formato].lados;
  const pct = Math.min(1, f / Math.max(1, durationInFrames - 1));
  return (
    <div style={{ position: "absolute", left: margem, right: margem, top: y, height: 10, borderRadius: 5, background: `${cores.texto}22`, overflow: "hidden" }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: cores.acento, borderRadius: 5 }} />
    </div>
  );
};
