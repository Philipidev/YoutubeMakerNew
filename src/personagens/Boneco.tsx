import React from "react";
import { cores, fontes } from "../theme";
import type { Pose } from "./pose";

/**
 * Rig SVG único para todos os personagens. Mudam só número, cor, roupa, idade e acessório,
 * todos escolhidos por dado (registro do personagem), nunca por opinião.
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

export type Roupa = "camisa" | "terno" | "toga" | "simples";
export type Idade = "adulto" | "idoso";
export type Acessorio = "nenhum" | "carteiraVazia" | "carteiraCheia" | "maletaDinheiro" | "documento" | "bengala";
export const ROUPAS: Roupa[] = ["camisa", "terno", "toga", "simples"];
export const ACESSORIOS: Acessorio[] = ["nenhum", "carteiraVazia", "carteiraCheia", "maletaDinheiro", "documento", "bengala"];

const Braco: React.FC<{ lado: "E" | "D"; ombro: number; cotovelo: number; corManga: string; punho?: string; objeto?: React.ReactNode }> = ({
  lado,
  ombro,
  cotovelo,
  corManga,
  punho,
  objeto,
}) => {
  const s = lado === "E" ? -1 : 1;
  const o = lado === "E" ? OMBRO_E : OMBRO_D;
  const t1 = rad(ombro);
  const cot = { x: o.x + s * Math.sin(t1) * BRACO, y: o.y + Math.cos(t1) * BRACO };
  const t2 = rad(ombro + cotovelo);
  const mao = { x: cot.x + s * Math.sin(t2) * ANTEBRACO, y: cot.y + Math.cos(t2) * ANTEBRACO };
  const pulso = { x: cot.x + s * Math.sin(t2) * (ANTEBRACO - 20), y: cot.y + Math.cos(t2) * (ANTEBRACO - 20) };
  return (
    <g>
      <line x1={o.x} y1={o.y} x2={cot.x} y2={cot.y} stroke={cores.contorno} strokeWidth={ESPESSURA + 8} strokeLinecap="round" />
      <line x1={cot.x} y1={cot.y} x2={mao.x} y2={mao.y} stroke={cores.contorno} strokeWidth={ESPESSURA + 8} strokeLinecap="round" />
      <line x1={o.x} y1={o.y} x2={cot.x} y2={cot.y} stroke={corManga} strokeWidth={ESPESSURA} strokeLinecap="round" />
      <line x1={cot.x} y1={cot.y} x2={mao.x} y2={mao.y} stroke={corManga} strokeWidth={ESPESSURA} strokeLinecap="round" />
      {punho ? <circle cx={pulso.x} cy={pulso.y} r={ESPESSURA / 2} fill={punho} stroke={cores.contorno} strokeWidth={3} /> : null}
      {objeto ? <g transform={`translate(${mao.x} ${mao.y}) scale(1.4)`}>{objeto}</g> : null}
      <circle cx={mao.x} cy={mao.y} r={21} fill={cores.pele} stroke={cores.contorno} strokeWidth={4} />
    </g>
  );
};

/** Objetos seguros na mão direita. Carteira vazia/cheia é o par simétrico para renda (pobreza/riqueza). */
const Objeto: React.FC<{ tipo: Acessorio }> = ({ tipo }) => {
  if (tipo === "carteiraVazia" || tipo === "carteiraCheia") {
    const cheia = tipo === "carteiraCheia";
    return (
      <g>
        {cheia ? (
          <>
            <rect x={-30} y={-6} width={56} height={34} rx={4} fill="#7DBE7A" stroke={cores.contorno} strokeWidth={3} transform="rotate(-12)" />
            <rect x={-24} y={-2} width={56} height={34} rx={4} fill="#93D18F" stroke={cores.contorno} strokeWidth={3} transform="rotate(6)" />
          </>
        ) : null}
        <rect x={-38} y={12} width={76} height={50} rx={8} fill="#6B4A32" stroke={cores.contorno} strokeWidth={5} />
        <line x1={-38} y1={30} x2={38} y2={30} stroke="#4E3524" strokeWidth={4} />
        {!cheia ? (
          <text x={0} y={53} textAnchor="middle" fontFamily={fontes.corpo} fontWeight={800} fontSize={16} fill="#E9DCC9">
            R$ 0
          </text>
        ) : null}
      </g>
    );
  }
  if (tipo === "maletaDinheiro") {
    return (
      <g>
        <path d="M -16 14 Q -16 0 0 0 Q 16 0 16 14" fill="none" stroke={cores.contorno} strokeWidth={6} />
        <rect x={-50} y={14} width={100} height={70} rx={8} fill="#3A2C22" stroke={cores.contorno} strokeWidth={5} />
        <text x={0} y={60} textAnchor="middle" fontFamily={fontes.display} fontSize={34} fill="#93D18F">
          R$
        </text>
      </g>
    );
  }
  if (tipo === "documento") {
    return (
      <g transform="rotate(-8)">
        <rect x={-30} y={-70} width={64} height={84} rx={4} fill="#F3EFE6" stroke={cores.contorno} strokeWidth={4} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={-20} y1={-55 + i * 16} x2={22} y2={-55 + i * 16} stroke="#9AA4B2" strokeWidth={4} />
        ))}
      </g>
    );
  }
  if (tipo === "bengala") {
    return <path d="M 0 0 L 0 170 M 0 0 Q 0 -24 22 -24" fill="none" stroke="#6B4A32" strokeWidth={10} strokeLinecap="round" />;
  }
  return null;
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

const TRONCO = "M 120 300 Q 120 268 152 266 L 248 266 Q 280 268 280 300 L 288 520 Q 288 548 260 548 L 140 548 Q 112 548 112 520 Z";

const Cracha: React.FC<{ numero: string; cor: string; x?: number; y?: number; r?: number; bandeira?: string }> = ({ numero, cor, x = 200, y = 345, r = 46, bandeira }) =>
  bandeira ? (
    <g>
      <clipPath id={`band-${x}-${y}`}>
        <circle cx={x} cy={y} r={r} />
      </clipPath>
      <image href={bandeira} x={x - r * 1.5} y={y - r} width={r * 3} height={r * 2} clipPath={`url(#band-${x}-${y})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx={x} cy={y} r={r} fill="none" stroke={cores.contorno} strokeWidth={6} />
    </g>
  ) : (
  <g>
    <circle cx={x} cy={y} r={r} fill={cores.texto} stroke={cor} strokeWidth={8} />
    <circle cx={x} cy={y} r={r + 4} fill="none" stroke={cores.contorno} strokeWidth={3} />
    <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={fontes.display} fontSize={(numero.length > 2 ? 0.9 : 1.2) * r} fill={cores.contorno}>
      {numero}
    </text>
  </g>
  );

/** Tronco conforme a roupa. A cor do personagem aparece sempre com peso visual equivalente. */
const Tronco: React.FC<{ roupa: Roupa; cor: string; numero: string; bandeira?: string }> = ({ roupa, cor, numero, bandeira }) => {
  const tem = !!numero || !!bandeira;
  if (roupa === "terno") {
    return (
      <g>
        <path d={TRONCO} fill="#262D38" stroke={cores.contorno} strokeWidth={7} />
        <path d="M 168 266 L 200 380 L 232 266 Z" fill="#F3EFE6" stroke={cores.contorno} strokeWidth={4} />
        <path d="M 192 286 L 208 286 L 214 300 L 206 380 L 200 392 L 194 380 L 186 300 Z" fill={cor} stroke={cores.contorno} strokeWidth={4} />
        <path d="M 192 272 L 208 272 L 210 288 L 190 288 Z" fill={cor} stroke={cores.contorno} strokeWidth={4} />
        <path d="M 152 268 L 168 266 L 200 400 L 160 330 Z" fill="#323B48" stroke={cores.contorno} strokeWidth={4} />
        <path d="M 248 268 L 232 266 L 200 400 L 240 330 Z" fill="#323B48" stroke={cores.contorno} strokeWidth={4} />
        <rect x={113} y={492} width={174} height={14} fill={cor} opacity={0.9} />
        {[440, 470].map((y) => (
          <circle key={y} cx={206} cy={y} r={5} fill={cores.contorno} />
        ))}
        {tem ? <Cracha numero={numero} cor={cor} x={250} y={425} r={32} bandeira={bandeira} /> : null}
      </g>
    );
  }
  if (roupa === "toga") {
    return (
      <g>
        <path d="M 116 300 Q 116 266 152 264 L 248 264 Q 284 266 284 300 L 300 650 L 100 650 Z" fill="#14171C" stroke={cores.contorno} strokeWidth={7} />
        <path d="M 176 266 L 200 300 L 224 266 Z" fill="#F3EFE6" stroke={cores.contorno} strokeWidth={4} />
        <path d="M 200 300 L 200 650" stroke="#2A2F38" strokeWidth={4} />
        <rect x={110} y={492} width={180} height={14} fill={cor} />
        {tem ? <Cracha numero={numero} cor={cor} y={380} r={40} bandeira={bandeira} /> : null}
      </g>
    );
  }
  if (roupa === "simples") {
    return (
      <g>
        <path d={TRONCO} fill={cor} stroke={cores.contorno} strokeWidth={7} />
        <path d="M 176 266 Q 200 292 224 266" fill="none" stroke={cores.contorno} strokeWidth={6} />
        {tem ? <Cracha numero={numero} cor={cor} bandeira={bandeira} /> : null}
      </g>
    );
  }
  // camisa social na cor do personagem
  return (
    <g>
      <path d={TRONCO} fill={cor} stroke={cores.contorno} strokeWidth={7} />
      <path d="M 166 264 L 200 296 L 234 264 L 222 262 L 200 282 L 178 262 Z" fill="#F3EFE6" stroke={cores.contorno} strokeWidth={4} />
      <line x1={200} y1={296} x2={200} y2={540} stroke={cores.contorno} strokeWidth={3} opacity={0.4} />
      {tem ? <Cracha numero={numero} cor={cor} bandeira={bandeira} /> : null}
    </g>
  );
};

export type BonecoProps = {
  pose: Pose;
  /** número no peito; vazio = sem crachá (cidadão, aposentado etc.) */
  numero: string;
  /** cor CSS do personagem (camisa, gravata ou faixa, conforme a roupa) */
  cor: string;
  roupa?: Roupa;
  idade?: Idade;
  acessorio?: Acessorio;
  /** data URI da bandeira: substitui o número no crachá (personagens internacionais) */
  bandeira?: string;
};

export const Boneco: React.FC<BonecoProps> = ({ pose: p, numero, cor, roupa = "camisa", idade = "adulto", acessorio = "nenhum", bandeira }) => {
  const manga = roupa === "terno" ? "#262D38" : roupa === "toga" ? "#14171C" : cor;
  const punho = roupa === "terno" ? "#F3EFE6" : undefined;
  const calca = roupa === "simples" ? "#3E4E66" : "#262E39";
  const escalaResp = 1 + p.respiracao * 0.012;
  const sobY = 114 - p.sobrancelhaY * 14;
  const idoso = idade === "idoso";
  return (
    <svg viewBox={`0 0 ${BONECO_W} ${BONECO_H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${p.corpoY})`}>
        {/* sombra no chão (não acompanha o pulo) */}
        <ellipse cx={200} cy={706 - p.corpoY} rx={110 + p.corpoY * 0.8} ry={14} fill="#000" opacity={0.35} />
        <rect x={150} y={520} width={44} height={160} rx={18} fill={calca} stroke={cores.contorno} strokeWidth={6} />
        <rect x={206} y={520} width={44} height={160} rx={18} fill={calca} stroke={cores.contorno} strokeWidth={6} />
        <ellipse cx={166} cy={688} rx={34} ry={16} fill={cores.contorno} />
        <ellipse cx={234} cy={688} rx={34} ry={16} fill={cores.contorno} />
        <g transform={`translate(200 540) scale(1 ${escalaResp}) translate(-200 -540)`}>
          <Tronco roupa={roupa} cor={cor} numero={numero} bandeira={bandeira} />
        </g>
        <g transform={`translate(0 ${p.cabecaY}) rotate(${p.cabecaRot} 200 250)`}>
          <rect x={180} y={226} width={40} height={46} rx={10} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          <ellipse cx={200} cy={150} rx={92} ry={98} fill={cores.pele} stroke={cores.contorno} strokeWidth={7} />
          <ellipse cx={108} cy={156} rx={14} ry={22} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          <ellipse cx={292} cy={156} rx={14} ry={22} fill={cores.peleSombra} stroke={cores.contorno} strokeWidth={6} />
          {idoso ? (
            <g fill="#D9D4CE" stroke={cores.contorno} strokeWidth={5}>
              <path d="M 108 140 Q 104 92 136 74 Q 134 104 152 100 Q 126 112 118 150 Z" />
              <path d="M 292 140 Q 296 92 264 74 Q 266 104 248 100 Q 274 112 282 150 Z" />
            </g>
          ) : (
            <path d="M 112 128 Q 116 48 200 46 Q 284 48 288 128 Q 258 88 200 92 Q 142 88 112 128 Z" fill="#3A3330" stroke={cores.contorno} strokeWidth={6} />
          )}
          <Sobrancelha cx={164} lado="E" y={sobY} ang={p.sobrancelhaAng} />
          <Sobrancelha cx={236} lado="D" y={sobY} ang={p.sobrancelhaAng} />
          <Olho cx={164} abertura={p.olhos} olharX={p.olharX} />
          <Olho cx={236} abertura={p.olhos} olharX={p.olharX} />
          {idoso ? (
            <g fill="none" stroke={cores.contorno} strokeWidth={5}>
              <circle cx={164} cy={148} r={26} />
              <circle cx={236} cy={148} r={26} />
              <line x1={190} y1={146} x2={210} y2={146} />
            </g>
          ) : null}
          <ellipse cx={150} cy={182} rx={14} ry={8} fill="#E8A598" opacity={0.45} />
          <ellipse cx={250} cy={182} rx={14} ry={8} fill="#E8A598" opacity={0.45} />
          <Boca sorriso={p.sorriso} abertura={p.boca} />
        </g>
        <Braco lado="E" ombro={p.ombroE} cotovelo={p.cotoveloE} corManga={manga} punho={punho} />
        <Braco
          lado="D"
          ombro={p.ombroD}
          cotovelo={p.cotoveloD}
          corManga={manga}
          punho={punho}
          objeto={acessorio !== "nenhum" ? <Objeto tipo={acessorio} /> : undefined}
        />
      </g>
    </svg>
  );
};
