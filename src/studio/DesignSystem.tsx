import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import "../fontes";
import { cores, coresPersonagem, fontes, movimento, raio, safe, tipos } from "../theme";
import { useFormato } from "../layout/useFormato";
import { Fundo } from "../video/Fundo";

const Amostra: React.FC<{ nome: string; cor: string }> = ({ nome, cor }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 150 }}>
    <div style={{ width: 110, height: 110, borderRadius: 24, background: cor, border: `2px solid ${cores.linha}` }} />
    <div style={{ fontFamily: fontes.corpo, fontSize: 20, color: cores.textoSecundario, textAlign: "center" }}>{nome}</div>
  </div>
);

const Titulo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: fontes.corpo, fontWeight: 800, letterSpacing: 4, color: cores.acento, fontSize: 24, textTransform: "uppercase", margin: "36px 0 16px" }}>
    {children}
  </div>
);

/** Referência visual fixa do canal: paleta, cores de personagem, tipografia, movimento e safe zones. */
export const DesignSystem: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { formato, width, height } = useFormato();
  const t = tipos[formato];
  const s = safe[formato];
  const ciclo = f % 60;
  const entrada = spring({ frame: ciclo, fps, config: movimento.entrada });
  const pop = spring({ frame: ciclo, fps, config: movimento.pop });
  const zoom = interpolate(f, [0, 150], [movimento.zoomLento.de, movimento.zoomLento.ate]);
  return (
    <AbsoluteFill>
      <Fundo />
      <AbsoluteFill style={{ padding: `${height * s.topo}px ${width * s.lados}px` }}>
        <div style={{ fontFamily: fontes.display, fontSize: t.manchete, color: cores.texto, lineHeight: 1 }}>DESIGN SYSTEM</div>
        <Titulo>Paleta base</Titulo>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Amostra nome="fundo" cor={cores.fundo} />
          <Amostra nome="superfície" cor={cores.superficie} />
          <Amostra nome="texto" cor={cores.texto} />
          <Amostra nome="secundário" cor={cores.textoSecundario} />
          <Amostra nome="acento" cor={cores.acento} />
          <Amostra nome="confirmado" cor={cores.status.confirmado} />
          <Amostra nome="divergente" cor={cores.status.divergente} />
          <Amostra nome="não se sabe" cor={cores.status.naoSeSabe} />
        </div>
        <Titulo>Personagens (mesma luminância)</Titulo>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.entries(coresPersonagem).map(([n, c]) => (
            <Amostra key={n} nome={n} cor={c} />
          ))}
        </div>
        <Titulo>Tipografia</Titulo>
        <div style={{ fontFamily: fontes.display, fontSize: t.numero, color: cores.acento, lineHeight: 1 }}>13 · 22</div>
        <div style={{ fontFamily: fontes.display, fontSize: t.titulo, color: cores.texto }}>Manchete Anton {t.titulo}</div>
        <div style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.corpo, color: cores.texto }}>Corpo Inter {t.corpo}: segundo o governo, a medida…</div>
        <div style={{ fontFamily: fontes.corpo, fontSize: t.legenda, color: cores.textoSecundario }}>Fonte · Veículo · 25/09/2026</div>
        <Titulo>Movimento</Titulo>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { n: "entrada", st: { transform: `translateY(${(1 - entrada) * 60}px)`, opacity: entrada } },
            { n: "pop", st: { transform: `scale(${0.6 + pop * 0.4})` } },
            { n: "zoomLento", st: { transform: `scale(${zoom})` } },
          ].map(({ n, st }) => (
            <div key={n} style={{ ...st, background: cores.superficie, border: `2px solid ${cores.linha}`, borderRadius: raio.card, padding: "24px 32px", fontFamily: fontes.corpo, fontWeight: 800, color: cores.texto, fontSize: 26 }}>
              {n}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      {/* safe zones */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: height * s.topo, background: "#ff3d6b22", borderBottom: "2px dashed #ff3d6b88" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: height * s.base, background: "#ff3d6b22", borderTop: "2px dashed #ff3d6b88", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontes.corpo, color: "#ff8fa8", fontSize: 24 }}>
        zona da UI da plataforma (sem conteúdo essencial)
      </div>
    </AbsoluteFill>
  );
};
