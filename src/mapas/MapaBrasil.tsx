import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento } from "../theme";
import dados from "./brasil.json";
import { Ondas } from "../movimento/vida";

/** Malha do IBGE projetada (scripts/gerar-mapas.ts). viewBox 1000×1000. */
type UF = { sigla: string; nome: string; regiao: string; path: string; centro: number[]; caixa: number[] };
type Capital = { nome: string; uf: string; x: number; y: number };
export const UFS = dados.ufs as UF[];
export const CAPITAIS = dados.capitais as Capital[];

export const REGIOES = {
  N: { nome: "Norte", cor: "oklch(0.70 0.10 160)" },
  NE: { nome: "Nordeste", cor: "oklch(0.74 0.11 80)" },
  CO: { nome: "Centro-Oeste", cor: "oklch(0.70 0.10 40)" },
  SE: { nome: "Sudeste", cor: "oklch(0.70 0.10 230)" },
  S: { nome: "Sul", cor: "oklch(0.70 0.10 300)" },
} as const;
export type Regiao = keyof typeof REGIOES;

export type ModoMapa = "estados" | "capitais" | "regioes" | "estado";

export type MapaBrasilProps = {
  modo?: ModoMapa;
  /** cor por UF (destaque) */
  destaque?: Record<string, string>;
  /** valores por UF para coroplético (0..1 normalizado internamente) */
  valores?: Record<string, number>;
  /** cor do valor máximo no coroplético */
  corEscala?: string;
  /** modo "estado": UF em foco */
  uf?: string;
  /** mostrar siglas dos estados */
  siglas?: boolean;
  /** regiões em destaque (modo regioes); vazio = todas */
  regioes?: Regiao[];
  largura: number;
};

const misturarCor = (a: string, b: string, k: number) => `color-mix(in srgb, ${b} ${Math.round(k * 100)}%, ${a})`;

/** Mapa do Brasil desenhado (fronteiras reais do IBGE). Estados entram em sequência. */
export const MapaBrasil: React.FC<MapaBrasilProps> = ({ modo = "estados", destaque = {}, valores, corEscala = cores.acento, uf, siglas = true, regioes = [], largura }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const foco = modo === "estado" ? UFS.find((u) => u.sigla === uf) : undefined;
  // viewBox: Brasil inteiro, ou caixa do estado com margem
  let vb = [0, 0, 1000, 1000];
  if (foco) {
    const [x, y, w, h] = foco.caixa;
    const lado = Math.max(w, h) * 1.25;
    vb = [x + w / 2 - lado / 2, y + h / 2 - lado / 2, lado, lado];
  }
  const escalaTraco = vb[2] / 1000;
  const vals = valores ? Object.values(valores) : [];
  const [vmin, vmax] = vals.length ? [Math.min(...vals), Math.max(...vals)] : [0, 1];
  const ordem = [...UFS].sort((a, b) => a.centro[1] - b.centro[1]);
  const corUF = (u: UF) => {
    if (destaque[u.sigla]) return destaque[u.sigla];
    if (valores && valores[u.sigla] !== undefined) return misturarCor(cores.superficieAlta, corEscala, (valores[u.sigla] - vmin) / Math.max(1e-9, vmax - vmin));
    if (modo === "regioes") {
      const r = REGIOES[u.regiao as Regiao];
      const ativa = !regioes.length || regioes.includes(u.regiao as Regiao);
      return ativa ? r.cor : cores.superficieAlta;
    }
    if (foco) return u.sigla === foco.sigla ? cores.acento : cores.superficie;
    return cores.superficieAlta;
  };
  const textoUF = (u: UF) => !!destaque[u.sigla] || (modo === "regioes") || (foco && u.sigla === foco.sigla);
  return (
    <svg viewBox={vb.join(" ")} width={largura} height={largura} style={{ overflow: foco ? "hidden" : "visible", borderRadius: foco ? 40 : 0 }}>
      {ordem.map((u, i) => {
        const k = spring({ frame: f - i * 0.8, fps, config: movimento.entradaSuave });
        const [cx, cy] = u.centro;
        // vida: onda de brilho atravessando o mapa (oeste → leste) depois da entrada
        const onda = f > 40 ? Math.max(0, Math.sin((f - 40) / 22 - cx / 140)) ** 4 : 0;
        return (
          <path
            key={u.sigla}
            d={u.path}
            fill={corUF(u)}
            stroke={cores.fundo}
            strokeWidth={(modo === "regioes" ? 1.2 : 2.2) * escalaTraco}
            strokeLinejoin="round"
            opacity={k}
            style={{ filter: onda > 0.01 ? `brightness(${1 + 0.22 * onda})` : undefined }}
            transform={`translate(${cx} ${cy}) scale(${0.85 + 0.15 * k}) translate(${-cx} ${-cy})`}
          />
        );
      })}
      {/* vida: halo pulsante nos estados em destaque (no lugar de escalar o estado) */}
      {UFS.filter((u) => destaque[u.sigla] || (foco && u.sigla === foco.sigla)).map((u) => {
        const p = f > 25 ? 0.5 - 0.5 * Math.cos(((f - 25) / 40) * 2 * Math.PI) : 0;
        return (
          <path
            key={`halo-${u.sigla}`}
            d={u.path}
            fill="none"
            stroke={destaque[u.sigla] ?? cores.acento}
            strokeWidth={(3 + 7 * p) * escalaTraco}
            strokeLinejoin="round"
            opacity={0.25 + 0.5 * p}
            style={{ filter: `blur(${2 * escalaTraco}px)` }}
          />
        );
      })}
      {siglas && modo !== "capitais"
        ? UFS.map((u) => {
            const ativo = textoUF(u);
            if (foco && u.sigla !== foco.sigla) return null;
            return (
              <text
                key={u.sigla}
                x={u.centro[0]}
                y={u.centro[1]}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={fontes.corpo}
                fontWeight={800}
                fontSize={(foco ? 60 : u.sigla === "DF" ? 12 : 22) * escalaTraco * (foco ? 0.4 : 1)}
                fill={ativo ? cores.contorno : cores.textoSecundario}
                opacity={interpolate(f, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
              >
                {u.sigla}
              </text>
            );
          })
        : null}
      {modo === "regioes"
        ? (Object.keys(REGIOES) as Regiao[]).map((r) => {
            const us = UFS.filter((u) => u.regiao === r);
            const cx = us.reduce((s, u) => s + u.centro[0], 0) / us.length;
            const cy = us.reduce((s, u) => s + u.centro[1], 0) / us.length;
            if (regioes.length && !regioes.includes(r)) return null;
            return (
              <text key={r} x={cx} y={cy + 30} textAnchor="middle" fontFamily={fontes.display} fontSize={40} fill={cores.texto} stroke={cores.fundo} strokeWidth={6} paintOrder="stroke">
                {REGIOES[r].nome.toUpperCase()}
              </text>
            );
          })
        : null}
      {modo === "capitais" || foco
        ? CAPITAIS.filter((c) => !foco || c.uf === foco.sigla).map((c, i) => {
            const k = spring({ frame: f - 20 - i * 1.5, fps, config: movimento.pop });
            const r = 7 * escalaTraco;
            const brasilia = c.uf === "DF";
            return (
              <g key={c.uf} opacity={k}>
                {foco || brasilia ? <Ondas cx={c.x} cy={c.y} raio={r * 1.6} cor={brasilia && !foco ? cores.acento : cores.texto} chave={"cap-" + c.uf} espessura={3 * escalaTraco} /> : null}
                <circle cx={c.x} cy={c.y} r={r * (brasilia ? 1.6 : 1) * k} fill={brasilia ? cores.acento : cores.texto} stroke={cores.contorno} strokeWidth={2 * escalaTraco} />
                <text
                  x={c.x + r * 1.6}
                  y={c.y}
                  dominantBaseline="central"
                  fontFamily={fontes.corpo}
                  fontWeight={700}
                  fontSize={(foco ? 34 : 22) * escalaTraco * (foco ? 0.5 : 1)}
                  fill={cores.texto}
                  stroke={cores.fundo}
                  strokeWidth={4 * escalaTraco}
                  paintOrder="stroke"
                >
                  {c.nome}
                </text>
              </g>
            );
          })
        : null}
    </svg>
  );
};
