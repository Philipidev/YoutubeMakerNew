import React, { useContext } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MovimentoCena } from "./plano";
import { entre, hash } from "./aleatorio";

/**
 * "Vida": micro-movimento depois que a animação de entrada termina, para nada ficar parado.
 * Parâmetros (fase, período, atraso) sorteados pela semente da cena: cada card/elemento se mexe diferente.
 */

/** Semente local = semente da cena + chave do elemento. */
export const useSemente = (chave: string) => {
  const { semente } = useContext(MovimentoCena);
  return `${semente}:${chave}`;
};

/** Flutuação suave (translateY + leve rotação). */
export const useFlutuar = (chave: string, amplitude = 5) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const fase = (hash(s) % 628) / 100;
  const periodo = entre(s, 70, 120);
  const y = Math.sin((f / periodo) * 2 * Math.PI + fase) * amplitude;
  const r = Math.sin((f / (periodo * 1.7)) * 2 * Math.PI + fase) * 0.35;
  return `translateY(${y}px) rotate(${r}deg)`;
};

/** Pulso 0..1 periódico (para brilho/halo), começa após `atraso` frames. */
export const usePulso = (chave: string, atraso = 30) => {
  const f = useCurrentFrame();
  const s = useSemente(chave);
  const periodo = entre(s, 45, 75);
  if (f < atraso) return 0;
  return 0.5 - 0.5 * Math.cos(((f - atraso) / periodo) * 2 * Math.PI);
};

/**
 * Reflexo diagonal que atravessa o elemento periodicamente (cards, barras em destaque).
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
        const p = ((f / periodo + off) % 1 + 1) % 1;
        return <circle key={off} cx={cx} cy={cy} r={raio * (1 + p * 1.8)} fill="none" stroke={cor} strokeWidth={espessura * (1 - p)} opacity={1 - p} />;
      })}
    </>
  );
};
