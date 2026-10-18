import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento } from "../theme";
import { useFormato } from "../layout/useFormato";

/**
 * Cenários de instituições. Estilizados, sem brasões, logos ou marcas oficiais:
 * a identificação vem do rótulo de texto, não de símbolo institucional.
 */

const PisoBase: React.FC<{ cor?: string }> = ({ cor = cores.superficie }) => {
  const { width, height, palcoY } = useFormato();
  return <div style={{ position: "absolute", left: -width * 0.3, top: palcoY - 10, width: width * 1.6, height: height - palcoY + 10, background: `linear-gradient(${cor}, ${cores.fundo})`, borderTop: `4px solid ${cores.linha}` }} />;
};

const useSubida = () => spring({ frame: useCurrentFrame(), fps: useVideoConfig().fps, config: movimento.entradaSuave });

/** Rótulo de instituição (no lugar de logo). */
export const PlacaInstituicao: React.FC<{ texto: string; y?: number }> = ({ texto, y }) => {
  const { palcoY, t } = useFormato();
  const e = useSubida();
  // logo abaixo do piso, sempre acima da zona da legenda
  return (
    <div style={{ position: "absolute", width: "100%", top: y ?? palcoY + 6, textAlign: "center", opacity: e }}>
      <span style={{ fontFamily: fontes.display, fontSize: t.corpo, color: cores.texto, background: `${cores.fundo}CC`, padding: "6px 22px", borderRadius: 12, letterSpacing: 2 }}>{texto}</span>
    </div>
  );
};

/** Congresso Nacional estilizado: duas torres, cúpula côncava (Câmara) e convexa (Senado). */
export const CenarioCongresso: React.FC<{ rotulo?: string; destaque?: "camara" | "senado" }> = ({ rotulo = "CONGRESSO NACIONAL", destaque }) => {
  const { width, palcoY, alturaCenario } = useFormato();
  const e = useSubida();
  const larg = Math.min(width * 0.95, alturaCenario / 0.56);
  const base = palcoY - 30;
  const corCupula = (c: "camara" | "senado") => (destaque === c ? cores.acento : "#E9E5DC");
  return (
    <AbsoluteFill>
      <PisoBase />
      <svg viewBox="0 0 1000 560" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: base - larg * 0.56 + (1 - e) * 80, opacity: 0.35 + 0.65 * e }}>
        {/* espelho d'água */}
        <rect x={40} y={520} width={920} height={30} rx={6} fill="#2C4A5C" opacity={0.7} />
        {/* plataforma horizontal */}
        <rect x={60} y={420} width={880} height={50} fill="#D9D4CA" stroke={cores.contorno} strokeWidth={4} />
        <rect x={60} y={470} width={880} height={50} fill="#3A4654" />
        {/* torres gêmeas ligadas por passarela */}
        <rect x={452} y={60} width={40} height={360} fill="#D9D4CA" stroke={cores.contorno} strokeWidth={4} />
        <rect x={508} y={60} width={40} height={360} fill="#D9D4CA" stroke={cores.contorno} strokeWidth={4} />
        {Array.from({ length: 26 }).map((_, i) => (
          <g key={i}>
            <line x1={456} y1={70 + i * 13} x2={488} y2={70 + i * 13} stroke="#8FA3B0" strokeWidth={3} />
            <line x1={512} y1={70 + i * 13} x2={544} y2={70 + i * 13} stroke="#8FA3B0" strokeWidth={3} />
          </g>
        ))}
        <rect x={492} y={200} width={16} height={30} fill="#BDB7AC" stroke={cores.contorno} strokeWidth={3} />
        {/* cúpula côncava (Câmara), à direita das torres */}
        <path d="M 640 420 Q 650 400 700 360 L 900 360 Q 940 400 950 420 Z" fill="none" />
        <path d="M 650 360 Q 760 440 870 360 L 860 420 L 660 420 Z" fill={corCupula("camara")} stroke={cores.contorno} strokeWidth={5} />
        {/* cúpula convexa (Senado), à esquerda */}
        <path d="M 150 420 Q 240 320 330 420 Z" fill={corCupula("senado")} stroke={cores.contorno} strokeWidth={5} />
        <text x={240} y={455} textAnchor="middle" fontFamily={fontes.corpo} fontWeight={800} fontSize={24} fill={cores.contorno}>SENADO</text>
        <text x={760} y={455} textAnchor="middle" fontFamily={fontes.corpo} fontWeight={800} fontSize={24} fill={cores.contorno}>CÂMARA</text>
      </svg>
      <PlacaInstituicao texto={rotulo} />
    </AbsoluteFill>
  );
};

/** Fachada de banco genérica (casos do sistema financeiro). Nome vem do rótulo. */
export const CenarioBanco: React.FC<{ rotulo?: string }> = ({ rotulo = "BANCO" }) => {
  const f = useCurrentFrame();
  const { width, palcoY, alturaCenario } = useFormato();
  const e = useSubida();
  const larg = Math.min(width * 0.85, alturaCenario / 0.75);
  const brilho = interpolate(Math.sin(f / 25), [-1, 1], [0.6, 1]);
  return (
    <AbsoluteFill>
      <PisoBase />
      <svg viewBox="0 0 800 600" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: palcoY - larg * 0.75 + (1 - e) * 80, opacity: 0.4 + 0.6 * e }}>
        <path d="M 60 170 L 400 40 L 740 170 Z" fill="#CFC9BC" stroke={cores.contorno} strokeWidth={6} />
        <rect x={80} y={170} width={640} height={40} fill="#BDB6A8" stroke={cores.contorno} strokeWidth={5} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={110 + i * 105} y={210} width={50} height={300} fill="#E4DFD4" stroke={cores.contorno} strokeWidth={5} />
        ))}
        <rect x={60} y={510} width={680} height={40} fill="#BDB6A8" stroke={cores.contorno} strokeWidth={5} />
        <rect x={40} y={550} width={720} height={40} fill="#A9A294" stroke={cores.contorno} strokeWidth={5} />
        <circle cx={400} cy={120} r={34} fill={cores.acento} opacity={brilho} stroke={cores.contorno} strokeWidth={5} />
        <text x={400} y={132} textAnchor="middle" fontFamily={fontes.display} fontSize={36} fill={cores.contorno}>$</text>
      </svg>
      <PlacaInstituicao texto={rotulo} />
    </AbsoluteFill>
  );
};

/** Sala de comissão (CPI/CPMI): mesa em U, microfones, telão. */
export const CenarioCPI: React.FC<{ rotulo?: string }> = ({ rotulo = "CPI" }) => {
  const { width, palcoY, alturaCenario } = useFormato();
  const e = useSubida();
  const larg = Math.min(width * 0.95, alturaCenario / 0.5);
  return (
    <AbsoluteFill>
      <PisoBase cor="#1E2B26" />
      <svg viewBox="0 0 1000 500" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: palcoY - larg * 0.5 + (1 - e) * 60, opacity: 0.4 + 0.6 * e }}>
        <rect x={250} y={20} width={500} height={200} rx={14} fill="#22303A" stroke={cores.contorno} strokeWidth={6} />
        <rect x={270} y={40} width={460} height={160} rx={8} fill="#2E4A57" />
        <text x={500} y={135} textAnchor="middle" fontFamily={fontes.display} fontSize={80} fill={cores.texto} opacity={0.9}>{rotulo}</text>
        <rect x={120} y={300} width={760} height={60} rx={8} fill="#5B4636" stroke={cores.contorno} strokeWidth={5} />
        <rect x={60} y={300} width={70} height={190} rx={8} fill="#5B4636" stroke={cores.contorno} strokeWidth={5} />
        <rect x={870} y={300} width={70} height={190} rx={8} fill="#5B4636" stroke={cores.contorno} strokeWidth={5} />
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <line x1={170 + i * 82} y1={300} x2={180 + i * 82} y2={262} stroke={cores.contorno} strokeWidth={5} />
            <circle cx={181 + i * 82} cy={258} r={7} fill="#555" />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Sede de polícia genérica (operações). Sem distintivo oficial; giroflex animado. */
export const CenarioPolicia: React.FC<{ rotulo?: string }> = ({ rotulo = "OPERAÇÃO" }) => {
  const f = useCurrentFrame();
  const { width, palcoY, alturaCenario } = useFormato();
  const e = useSubida();
  const larg = Math.min(width * 0.9, alturaCenario / 0.5);
  const pisca = Math.floor(f / 6) % 2;
  return (
    <AbsoluteFill>
      <PisoBase />
      <AbsoluteFill style={{ background: pisca ? "radial-gradient(circle at 25% 60%, #3A6FD833, transparent 45%)" : "radial-gradient(circle at 75% 60%, #D83A3A33, transparent 45%)" }} />
      <svg viewBox="0 0 900 450" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: palcoY - larg * 0.5 + (1 - e) * 60, opacity: 0.4 + 0.6 * e }}>
        <rect x={100} y={60} width={700} height={300} fill="#3A4654" stroke={cores.contorno} strokeWidth={6} />
        {Array.from({ length: 3 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => <rect key={`${r}-${c}`} x={130 + c * 84} y={90 + r * 80} width={56} height={50} fill="#5C7A8C" stroke={cores.contorno} strokeWidth={3} />),
        )}
        {/* viatura genérica */}
        <g transform="translate(470 330)">
          <rect x={0} y={20} width={300} height={70} rx={20} fill="#ECEAE4" stroke={cores.contorno} strokeWidth={6} />
          <path d="M 50 20 L 90 -20 L 220 -20 L 250 20 Z" fill="#ECEAE4" stroke={cores.contorno} strokeWidth={6} />
          <rect x={120} y={-36} width={30} height={16} rx={4} fill={pisca ? "#3A6FD8" : "#555"} />
          <rect x={150} y={-36} width={30} height={16} rx={4} fill={pisca ? "#555" : "#D83A3A"} />
          <circle cx={70} cy={95} r={26} fill={cores.contorno} />
          <circle cx={235} cy={95} r={26} fill={cores.contorno} />
        </g>
      </svg>
      <PlacaInstituicao texto={rotulo} />
    </AbsoluteFill>
  );
};

/** Plenário de tribunal (STF/TSE): bancada em semicírculo elevada, cadeiras altas. */
export const CenarioTribunal: React.FC<{ rotulo?: string; cadeiras?: number; votos?: ("sim" | "nao" | "pendente")[] }> = ({ rotulo = "STF", cadeiras = 11, votos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, palcoY, alturaCenario } = useFormato();
  const larg = Math.min(width * 0.95, alturaCenario / 0.5);
  const corVoto = (i: number) => {
    const v = votos?.[i];
    if (!v || v === "pendente") return "#1D2129";
    return v === "sim" ? cores.status.confirmado : cores.status.divergente;
  };
  return (
    <AbsoluteFill>
      <PisoBase cor="#2A2420" />
      <svg viewBox="0 0 1000 500" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: palcoY - larg * 0.5 }}>
        <path d="M 60 420 Q 500 180 940 420 L 900 470 Q 500 260 100 470 Z" fill="#6B4A32" stroke={cores.contorno} strokeWidth={6} />
        {Array.from({ length: cadeiras }).map((_, i) => {
          const tt = (i + 0.5) / cadeiras;
          const x = 100 + tt * 800;
          const y = 400 - Math.sin(tt * Math.PI) * 150;
          const k = spring({ frame: f - 6 - i * 3, fps, config: movimento.pop });
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
              <rect x={-24} y={-90} width={48} height={90} rx={10} fill={corVoto(i)} stroke={cores.contorno} strokeWidth={4} />
            </g>
          );
        })}
      </svg>
      <PlacaInstituicao texto={rotulo} />
    </AbsoluteFill>
  );
};
