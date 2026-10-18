import React from "react";
import { cores, fontes } from "../theme";
import type { Pose } from "./pose";

/**
 * Rig SVG único para todos os personagens. Só mudam `numero` e `cor` (detalhe).
 * Nenhum traço de pessoa real: mesma cabeça, mesmo corpo, mesmas proporções.
 * viewBox 400 × 720; pés em y≈700.
 */
export const BONECO_W = 400;
export const BONECO_H = 720;

const BRACO = 95;
const ANTEBRACO = 90;
const ESPESSURA = 32;
const OMBRO_E = { x: 132, y: 292 };
const OMBRO_D = { x: 268, y: 292 };
const rad = (g: number) => (g * Math.PI) / 180;

const Braco: React.FC<{ lado: "E" | "D"; ombro: number; cotovelo: number; corManga: string }> = ({ lado, ombro, cotovelo, corManga }) => {
  const s = lado === "E" ? -1 : 1;
  const o = lado === "E" ? OMBRO_E : OMBRO_D;
  const t1 = rad(ombro);
  const cot = { x: o.x + s * Math.sin(t1) * BRACO, y: o.y + Math.cos(t1) * BRACO };
  const t2 = rad(ombro + cotovelo);
  const mao = { x: cot.x + s * Math.sin(t2) * ANTEBRACO, y: cot.y + Math.cos(t2) * ANTEBRACO };
  return (
    <g>
      <line x1={o.x} y1={o.y} x2={cot.x} y2={cot.y} stroke={cores.contorno} strokeWidth={ESPESSURA + 8} strokeLinecap="round" />
      <line x1={cot.x} y1={cot.y} x2={mao.x} y2={mao.y} stroke={cores.contorno} strokeWidth={ESPESSURA + 8} strokeLinecap="round" />
      <line x1={o.x} y1={o.y} x2={cot.x} y2={cot.y} stroke={corManga} strokeWidth={ESPESSURA} strokeLinecap="round" />
      <line x1={cot.x} y1={cot.y} x2={mao.x} y2={mao.y} stroke={corManga} strokeWidth={ESPESSURA} strokeLinecap="round" />
      <circle cx={mao.x} cy={mao.y} r={21} fill={cores.pele} stroke={cores.contorno} strokeWidth={4} />
    </g>
  );
};

const Olho: React.FC<{ cx: number; abertura: number; olharX: number }> = ({ cx, abertura, olharX }) => {
  const ry = Math.max(1.5, 14 * abertura);
  return (
    <g>
      <ellipse cx={cx} cy={148} rx={12} ry={ry} fill={cores.contorno} />
      {abertura > 0.3 ? <circle cx={cx + 3 + olharX * 4} cy={143} r={3.5} fill="#fff" /> : null}
    </g>
  );
};

const Sobrancelha: React.FC<{ cx: number; lado: "E" | "D"; y: number; ang: number }> = ({ cx, lado, y, ang }) => {
  const s = lado === "E" ? 1 : -1;
  return (
    <g transform={`rotate(${ang * s} ${cx} ${y})`}>
      <line x1={cx - 16} y1={y} x2={cx + 16} y2={y} stroke={cores.contorno} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

const Boca: React.FC<{ sorriso: number; abertura: number }> = ({ sorriso, abertura }) => {
  const cx = 200;
  const y = 196;
  const larg = 30 + Math.max(0, sorriso) * 6;
  const curva = sorriso * 16;
  const ab = abertura * 34;
  const dCima = `M ${cx - larg} ${y} Q ${cx} ${y + curva} ${cx + larg} ${y}`;
  if (ab < 2) return <path d={dCima} stroke={cores.contorno} strokeWidth={7} fill="none" strokeLinecap="round" />;
  const d = `${dCima} Q ${cx} ${y + curva + ab * 1.6} ${cx - larg} ${y} Z`;
  return (
    <g>
      <path d={d} fill="#5A1E24" stroke={cores.contorno} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cx={cx} cy={y + curva / 2 + ab * 0.6} rx={larg * 0.45} ry={Math.max(1, ab * 0.25)} fill="#E07A7A" />
    </g>
  );
};

export type BonecoProps = {
  pose: Pose;
  numero: string;
  /** cor CSS do detalhe (crachá do peito, gola, faixa) */
  cor: string;
};

export const Boneco: React.FC<BonecoProps> = ({ pose: p, numero, cor }) => {
  const camisa = "#3B4654";
  const calca = "#262E39";
  const escalaResp = 1 + p.respiracao * 0.012;
  const sobY = 114 - p.sobrancelhaY * 14;
  return (
    <svg viewBox={`0 0 ${BONECO_W} ${BONECO_H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${p.corpoY})`}>
        {/* sombra no chão (não acompanha o pulo) */}
        <ellipse cx={200} cy={706 - p.corpoY} rx={110 + p.corpoY * 0.8} ry={14} fill="#000" opacity={0.35} />
        {/* pernas */}
        <rect x={150} y={520} width={44} height={160} rx={18} fill={calca} stroke={cores.contorno} strokeWidth={6} />
        <rect x={206} y={520} width={44} height={160} rx={18} fill={calca} stroke={cores.contorno} strokeWidth={6} />
        <ellipse cx={166} cy={688} rx={34} ry={16} fill={cores.contorno} />
        <ellipse cx={234} cy={688} rx={34} ry={16} fill={cores.contorno} />
        {/* tronco */}
        <g transform={`translate(200 540) scale(1 ${escalaResp}) translate(-200 -540)`}>
          <path
            d="M 120 300 Q 120 268 152 266 L 248 266 Q 280 268 280 300 L 288 520 Q 288 548 260 548 L 140 548 Q 112 548 112 520 Z"
            fill={camisa}
            stroke={cores.contorno}
            strokeWidth={7}
          />
          {/* gola na cor do personagem */}
          <path d="M 172 266 L 200 290 L 228 266" fill="none" stroke={cor} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
          {/* faixa da cintura */}
          <rect x={113} y={492} width={174} height={18} fill={cor} />
          {/* crachá com número */}
          <circle cx={200} cy={345} r={46} fill={cor} stroke={cores.contorno} strokeWidth={6} />
          <text x={200} y={347} textAnchor="middle" dominantBaseline="central" fontFamily={fontes.display} fontSize={numero.length > 2 ? 42 : 56} fill={cores.contorno}>
            {numero}
          </text>
        </g>
        {/* pescoço + cabeça */}
        <g transform={`translate(0 ${p.cabecaY}) rotate(${p.cabecaRot} 200 250)`}>
          <rect x={180} y={226} width={40} height={46} rx={10} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          <ellipse cx={200} cy={150} rx={92} ry={98} fill={cores.pele} stroke={cores.contorno} strokeWidth={7} />
          {/* orelhas */}
          <ellipse cx={108} cy={156} rx={14} ry={22} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          <ellipse cx={292} cy={156} rx={14} ry={22} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          {/* cabelo genérico, igual para todos */}
          <path d="M 112 128 Q 116 48 200 46 Q 284 48 288 128 Q 258 88 200 92 Q 142 88 112 128 Z" fill="#3A3330" stroke={cores.contorno} strokeWidth={6} />
          <Sobrancelha cx={164} lado="E" y={sobY} ang={p.sobrancelhaAng} />
          <Sobrancelha cx={236} lado="D" y={sobY} ang={p.sobrancelhaAng} />
          <Olho cx={164} abertura={p.olhos} olharX={p.olharX} />
          <Olho cx={236} abertura={p.olhos} olharX={p.olharX} />
          <ellipse cx={150} cy={182} rx={14} ry={8} fill="#E8A598" opacity={0.45} />
          <ellipse cx={250} cy={182} rx={14} ry={8} fill="#E8A598" opacity={0.45} />
          <Boca sorriso={p.sorriso} abertura={p.boca} />
        </g>
        {/* braços na frente do tronco */}
        <Braco lado="E" ombro={p.ombroE} cotovelo={p.cotoveloE} corManga={camisa} />
        <Braco lado="D" ombro={p.ombroD} cotovelo={p.cotoveloD} corManga={camisa} />
      </g>
    </svg>
  );
};
