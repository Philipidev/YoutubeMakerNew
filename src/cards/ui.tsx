import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";

/** Progresso de entrada (0..1) com atraso em frames. */
export const useEntrada = (atraso = 0, config: keyof typeof movimento & ("entrada" | "entradaSuave" | "pop") = "entrada") => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - atraso, fps, config: movimento[config] });
};

/** Saída nos últimos frames da cena (1 → 0). */
export const useSaida = (duracao: number) => {
  const f = useCurrentFrame();
  return interpolate(f, [duracao - movimento.duracaoSaida, duracao], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: movimento.easingSaida,
  });
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; borda?: string }> = ({ children, style, borda }) => (
  <div
    style={{
      background: cores.superficie,
      border: `3px solid ${borda ?? cores.linha}`,
      borderRadius: raio.card,
      padding: 40,
      boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{ children: React.ReactNode; cor?: string; texto?: string; style?: React.CSSProperties }> = ({ children, cor = cores.acento, texto = cores.contorno, style }) => {
  const { t } = useFormato();
  return (
    <span
      style={{
        display: "inline-block",
        background: cor,
        color: texto,
        borderRadius: raio.chip,
        padding: "6px 18px",
        fontFamily: fontes.corpo,
        fontWeight: 800,
        fontSize: t.legenda,
        letterSpacing: 2,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Rotulo: React.FC<{ children: React.ReactNode; cor?: string }> = ({ children, cor = cores.acento }) => {
  const { t } = useFormato();
  return (
    <div style={{ fontFamily: fontes.corpo, fontWeight: 800, color: cor, fontSize: t.legenda, letterSpacing: 4, textTransform: "uppercase" }}>
      {children}
    </div>
  );
};

/** Texto que entra palavra por palavra com pop. */
export const TextoPop: React.FC<{ texto: string; atraso?: number; passo?: number; style?: React.CSSProperties; destaque?: string[] }> = ({
  texto,
  atraso = 0,
  passo = 3,
  style,
  destaque = [],
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palavras = texto.split(/\s+/);
  const alvo = destaque.map((d) => d.toLowerCase());
  return (
    <div style={style}>
      {palavras.map((p, i) => {
        const k = spring({ frame: f - atraso - i * passo, fps, config: movimento.pop });
        const limpo = p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - k) * 40}px) scale(${0.7 + 0.3 * k})`,
              opacity: k,
              marginRight: "0.25em",
              color: alvo.includes(limpo) ? cores.acento : undefined,
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
};

export const formatarData = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
