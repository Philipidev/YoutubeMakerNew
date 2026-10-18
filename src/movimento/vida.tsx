import React, { useContext } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MovimentoCena } from "./plano";
import { entre, escolher, hash, rng } from "./aleatorio";

/**
 * "Vida": micro-movimento depois que a entrada termina, para nada ficar parado.
 *
 * REGRA: nenhum efeito é aplicado a tudo. Cada tipo de elemento tem um pool de ≥ 3 variantes,
 * sorteadas por elemento (semente da cena + chave). Fase, período e atraso também sorteados.
 */

/** Semente local = semente da cena + chave do elemento. */
export const useSemente = (chave: string) => {
  const { semente } = useContext(MovimentoCena);
  return `${semente}:${chave}`;
};

/** Sorteia a variante de vida de um elemento (determinístico). Pesos opcionais. */
export const useVariante = <T extends string>(chave: string, opcoes: readonly T[], pesos?: Partial<Record<T, number>>): T => {
  const s = useSemente(chave);
  if (!pesos) return escolher(opcoes, `${s}:variante`);
  const total = opcoes.reduce((a, o) => a + (pesos[o] ?? 1), 0);
  let r = rng(`${s}:variante`)() * total;
  for (const o of opcoes) {
    r -= pesos[o] ?? 1;
    if (r <= 0) return o;
  }
  return opcoes[opcoes.length - 1];
};

/** Oscilação senoidal com fase/período sorteados. */
export const useOnda = (chave: string, periodoMin = 60, periodoMax = 110) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const fase = (hash(s) % 628) / 100;
  const periodo = entre(s, periodoMin, periodoMax);
  return Math.sin((f / periodo) * 2 * Math.PI + fase);
};

/** Pulso 0..1 periódico (halo, brilho de borda), começa após `atraso`. */
export const usePulso = (chave: string, atraso = 30) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const periodo = entre(s, 45, 75);
  if (f < atraso) return 0;
  return 0.5 - 0.5 * Math.cos(((f - atraso) / periodo) * 2 * Math.PI);
};

/** Compatibilidade: flutuação simples. */
export const useFlutuar = (chave: string, amplitude = 5) => {
  const y = useOnda(chave) * amplitude;
  return `translateY(${y}px)`;
};

// ---------------------------------------------------------------- cards

export const VIDA_CARD = ["flutuar", "balanco", "bordaViva", "sombraViva", "brilho"] as const;
export type VidaCard = (typeof VIDA_CARD)[number];

/** Estilos de vida do card. O reflexo ("brilho") tem peso menor: aparece em poucos cards. */
export const useVidaCard = (chave: string, corBorda: string) => {
  const variante = useVariante(chave, VIDA_CARD, { brilho: 0.5 });
  const o = useOnda(chave);
  const o2 = useOnda(chave + ":2", 90, 150);
  const p = usePulso(chave, 25);
  const externo: React.CSSProperties = {};
  const interno: React.CSSProperties = {};
  switch (variante) {
    case "flutuar":
      externo.transform = `translateY(${o * 5}px)`;
      break;
    case "balanco":
      externo.transform = `translateX(${o2 * 3}px) rotate(${o * 0.6}deg)`;
      break;
    case "bordaViva":
      externo.transform = `translateY(${o * 2}px)`;
      interno.boxShadow = `0 24px 60px rgba(0,0,0,0.45), 0 0 ${10 + 18 * p}px color-mix(in srgb, ${corBorda} ${Math.round(30 + 50 * p)}%, transparent)`;
      break;
    case "sombraViva":
      externo.transform = `scale(${1 + 0.008 * o})`;
      interno.boxShadow = `0 ${18 + 14 * o}px ${50 + 20 * o}px rgba(0,0,0,${0.4 + 0.1 * o})`;
      break;
    case "brilho":
      externo.transform = `translateY(${o * 3}px)`;
      break;
  }
  return { variante, externo, interno, brilho: variante === "brilho" };
};

// ---------------------------------------------------------------- primitivos visuais

/**
 * Reflexo diagonal que atravessa o elemento periodicamente.
 * Colocar dentro de um container com position: relative e overflow: hidden.
 */
export const Brilho: React.FC<{ chave: string; atraso?: number; intensidade?: number }> = ({ chave, atraso = 35, intensidade = 0.14 }) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const periodo = Math.round(entre(s, 95, 160));
  const desloc = Math.round(entre(s, 0, periodo));
  if (f < atraso) return null;
  const ciclo = (f - atraso + desloc) % periodo;
  const p = interpolate(ciclo, [0, 28], [-0.4, 1.4], { extrapolateRight: "clamp" });
  if (p >= 1.4) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `linear-gradient(105deg, transparent ${(p - 0.25) * 100}%, rgba(255,255,255,${intensidade}) ${p * 100}%, transparent ${(p + 0.25) * 100}%)`,
        borderRadius: "inherit",
      }}
    />
  );
};

/** Onda (ripple) em volta de um ponto SVG: anéis que se expandem e somem. */
export const Ondas: React.FC<{ cx: number; cy: number; raio: number; cor: string; chave: string; espessura?: number }> = ({ cx, cy, raio, cor, chave, espessura = 3 }) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const periodo = Math.round(entre(s, 40, 60));
  return (
    <>
      {[0, 0.5].map((off) => {
        const p = (((f / periodo + off) % 1) + 1) % 1;
        return <circle key={off} cx={cx} cy={cy} r={raio * (1 + p * 1.8)} fill="none" stroke={cor} strokeWidth={espessura * (1 - p)} opacity={1 - p} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- entradas de elementos

export const ENTRADAS = ["subir", "lateral", "escala", "desfoque", "virar"] as const;
export type EntradaElemento = (typeof ENTRADAS)[number];

/** Estilo de entrada de um card/elemento (k: progresso 0 → 1 do spring). */
export const estiloEntradaElemento = (v: EntradaElemento, k: number, lado: 1 | -1 = 1): React.CSSProperties => {
  const q = 1 - k;
  switch (v) {
    case "subir":
      return { opacity: k, transform: `translateY(${q * 60}px)` };
    case "lateral":
      return { opacity: k, transform: `translateX(${q * 120 * lado}px)` };
    case "escala":
      return { opacity: k, transform: `scale(${0.8 + 0.2 * k})` };
    case "desfoque":
      return { opacity: k, filter: q > 0.01 ? `blur(${q * 10}px)` : undefined, transform: `scale(${1.04 - 0.04 * k})` };
    case "virar":
      return { opacity: k, transform: `perspective(1200px) rotateX(${q * 50}deg)`, transformOrigin: "50% 0%" };
  }
};

/** Entrada sorteada para o elemento `chave`. */
export const useEntradaElemento = (chave: string, k: number, lado: 1 | -1 = 1) => estiloEntradaElemento(useVariante(chave + ":entrada", ENTRADAS), k, lado);
