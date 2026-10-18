import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as bandeiras from "country-flag-icons/string/3x2";
import { cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";

/** Bandeiras: country-flag-icons (MIT), código ISO 3166-1 alfa-2. */
const svgBandeira = (iso: string): string | undefined => (bandeiras as Record<string, string>)[iso.toUpperCase()];
export const uriBandeira = (iso: string) => {
  const svg = svgBandeira(iso);
  return svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : undefined;
};

const nomes = new Intl.DisplayNames(["pt-BR"], { type: "region" });
export const nomePais = (iso: string) => nomes.of(iso.toUpperCase()) ?? iso;

export const Bandeira: React.FC<{ iso: string; largura: number; arredondada?: boolean }> = ({ iso, largura, arredondada = true }) => {
  const uri = uriBandeira(iso);
  return (
    <div
      style={{
        width: largura,
        height: (largura * 2) / 3,
        borderRadius: arredondada ? largura * 0.06 : 0,
        overflow: "hidden",
        border: `3px solid ${cores.contorno}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        background: cores.superficieAlta,
      }}
    >
      {uri ? <img src={uri} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
    </div>
  );
};

/** Bandeira tremulando (onda simples por fatias). */
export const BandeiraTremulando: React.FC<{ iso: string; largura: number }> = ({ iso, largura }) => {
  const f = useCurrentFrame();
  const uri = uriBandeira(iso);
  const fatias = 12;
  const alt = (largura * 2) / 3;
  return (
    <div style={{ display: "flex", width: largura, height: alt }}>
      {Array.from({ length: fatias }).map((_, i) => {
        const y = Math.sin(f / 6 - i * 0.6) * alt * 0.04 * (i / fatias);
        return (
          <div key={i} style={{ width: largura / fatias, height: alt, overflow: "hidden", transform: `translateY(${y}px)`, filter: `brightness(${1 + Math.sin(f / 6 - i * 0.6) * 0.08})` }}>
            {uri ? <img src={uri} style={{ width: largura, height: alt, marginLeft: (-largura / fatias) * i, display: "block" }} /> : null}
          </div>
        );
      })}
    </div>
  );
};

/** Cenário internacional: cartões de país entrando em sequência sobre um globo estilizado. */
export const CenarioMundo: React.FC<{ paises: string[] }> = ({ paises }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, formato, composicao, area, palcoY, conteudoTopo, t } = useFormato();
  const lateral = formato === "horizontal" && composicao !== "topo";
  const raioGlobo = Math.min(width * 0.42, 460);
  const rot = (f * 0.6) % 360;
  // bandeiras dimensionadas pela largura E pela altura disponível (16:9 tem pouca altura)
  const porLinha = formato === "horizontal" ? Math.min(paises.length, 4) : paises.length <= 2 ? 1 : 2;
  const linhas = Math.ceil(paises.length / porLinha);
  const altDisp = palcoY - conteudoTopo - 60;
  const altFlags = lateral ? altDisp : altDisp - 180;
  const largDisp = lateral ? width * 0.6 : area.w;
  const larg = Math.min((largDisp * 0.95) / porLinha - 40, ((altFlags / linhas - 90) * 3) / 2, 520);
  return (
    <AbsoluteFill>
      <svg width={width} height={palcoY} style={{ position: "absolute", opacity: 0.35 }}>
        <defs>
          <clipPath id="globo">
            <circle cx={width / 2} cy={palcoY * 0.55} r={raioGlobo} />
          </clipPath>
        </defs>
        <circle cx={width / 2} cy={palcoY * 0.55} r={raioGlobo} fill="#1E3442" stroke={cores.linha} strokeWidth={4} />
        <g clipPath="url(#globo)" stroke="#3E6478" strokeWidth={2} fill="none">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = ((i * 30 + rot) % 360) * (Math.PI / 180);
            const rx = Math.abs(Math.cos(a)) * raioGlobo;
            return <ellipse key={i} cx={width / 2} cy={palcoY * 0.55} rx={rx} ry={raioGlobo} />;
          })}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = palcoY * 0.55 + Math.sin((lat * Math.PI) / 180) * raioGlobo;
            const rx = Math.cos((lat * Math.PI) / 180) * raioGlobo;
            return <ellipse key={lat} cx={width / 2} cy={y} rx={rx} ry={rx * 0.08} />;
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: lateral ? (composicao === "dir" ? area.x : width * 0.36) : area.x, width: lateral ? width * 0.6 : area.w, top: lateral ? conteudoTopo : conteudoTopo + 180, height: lateral ? altDisp : altDisp - 180, display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "center", alignContent: "center" }}>
        {paises.map((iso, i) => {
          const k = spring({ frame: f - 6 - i * 5, fps, config: movimento.pop });
          return (
            <div key={iso} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `scale(${k})`, background: `${cores.superficie}DD`, borderRadius: raio.card, padding: 20 }}>
              <BandeiraTremulando iso={iso} largura={larg} />
              <div style={{ fontFamily: fontes.display, fontSize: t.destaque, color: cores.texto }}>{nomePais(iso)}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
