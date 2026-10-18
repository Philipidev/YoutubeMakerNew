import React from "react";
import { AbsoluteFill } from "remotion";
import { fontes, safe } from "../theme";
import { useFormato } from "../layout/useFormato";

/** Overlay de revisão: mostra as áreas onde nada essencial pode ficar (UI das plataformas e legenda). */
export const Zonas: React.FC = () => {
  const { formato, height, zonaLegenda } = useFormato();
  const s = safe[formato];
  const faixa = (top: number, h: number, cor: string, rotulo: string) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height: h,
        background: `${cor}33`,
        borderTop: `3px dashed ${cor}`,
        borderBottom: `3px dashed ${cor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 16,
        fontFamily: fontes.corpo,
        fontWeight: 800,
        fontSize: 20,
        color: cor,
      }}
    >
      {rotulo}
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {faixa(0, height * s.topo, "#FF3D6B", "UI DA PLATAFORMA")}
      {faixa(zonaLegenda.y, zonaLegenda.h, "#3DA5FF", "ZONA DA LEGENDA")}
      {faixa(height * (1 - s.base), height * s.base, "#FF3D6B", "UI DA PLATAFORMA")}
    </AbsoluteFill>
  );
};
