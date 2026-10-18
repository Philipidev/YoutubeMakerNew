import React, { useId } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";
import { Brilho, useVariante, useVidaCard } from "../movimento/vida";

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

/**
 * Card base. Depois de entrar, ganha uma "vida" sorteada entre 5 variantes (flutuar, balanço, borda viva,
 * sombra viva, reflexo). `chave` diferencia cards da mesma cena.
 */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; borda?: string; chave?: string; vivo?: boolean }> = ({
  children,
  style,
  borda,
  chave,
  vivo = true,
}) => {
  // sem chave explícita, cada card ganha uma chave estável pela posição na árvore
  const id = useId();
  const k = chave ?? id;
  const corBorda = borda ?? cores.linha;
  const vida = useVidaCard(k, corBorda === cores.linha ? cores.acento : corBorda);
  // props de layout ficam no wrapper externo (que é o filho do flex do pai)
  const { height, flex, minWidth, ...resto } = style ?? {};
  return (
    <div style={{ ...(vivo ? vida.externo : {}), height, flex, minWidth }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: cores.superficie,
          border: `3px solid ${corBorda}`,
          borderRadius: raio.card,
          padding: 40,
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          height: height ? "100%" : undefined,
          boxSizing: "border-box",
          ...resto,
          ...(vivo ? vida.interno : {}),
        }}
      >
        {children}
        {vivo && vida.brilho ? <Brilho chave={k} /> : null}
      </div>
    </div>
  );
};

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
/**
 * Texto que entra palavra por palavra. Estilo sorteado por texto (pop, subida, máquina de escrever, desfoque),
 * ou fixado em `variante`.
 */
export const TextoPop: React.FC<{
  texto: string;
  atraso?: number;
  passo?: number;
  style?: React.CSSProperties;
  destaque?: string[];
  variante?: "pop" | "subida" | "maquina" | "desfoque";
}> = ({ texto, atraso = 0, passo = 3, style, destaque = [], variante }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sorteada = useVariante("texto:" + texto, ["pop", "subida", "maquina", "desfoque"] as const);
  const v = variante ?? sorteada;
  const palavras = texto.split(/\s+/);
  const alvo = destaque.map((d) => d.toLowerCase());
  return (
    <div style={style}>
      {palavras.map((p, i) => {
        const k = spring({ frame: f - atraso - i * passo, fps, config: v === "pop" ? movimento.pop : movimento.entrada });
        const limpo = p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        const q = 1 - k;
        const efeito: React.CSSProperties =
          v === "pop"
            ? { transform: `translateY(${q * 40}px) scale(${0.7 + 0.3 * k})`, opacity: k }
            : v === "subida"
              ? { transform: `translateY(${q * 70}px)`, opacity: k, clipPath: `inset(0 0 ${q * 100}% 0)` }
              : v === "maquina"
                ? { opacity: f - atraso >= i * passo ? 1 : 0 }
                : { opacity: k, filter: q > 0.01 ? `blur(${q * 12}px)` : undefined };
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.25em", color: alvo.includes(limpo) ? cores.acento : undefined, ...efeito }}>
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
