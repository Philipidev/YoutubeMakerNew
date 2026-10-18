import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento } from "../theme";
import { useFormato } from "../layout/useFormato";

/**
 * Cenários estilizados. Todos são camadas de fundo que respeitam o palco (useFormato().palcoY).
 * Paleta neutra; nenhum símbolo partidário ou institucional oficial (brasões, logos).
 */

const Holofotes: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, xPersonagem } = useFormato();
  const osc = Math.sin(f / 40) * 0.04;
  return (
    <svg width={width} height={height} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="feixe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cores.acento} stopOpacity={0.18} />
          <stop offset="1" stopColor={cores.acento} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[xPersonagem("esq", 2) / width, xPersonagem("dir", 2) / width].map((x, i) => (
        <polygon
          key={i}
          points={`${width * (x - 0.03)},0 ${width * (x + 0.03)},0 ${width * (x + 0.2 + (i ? -osc : osc))},${height * 0.8} ${width * (x - 0.2 + (i ? -osc : osc))},${height * 0.8}`}
          fill="url(#feixe)"
        />
      ))}
    </svg>
  );
};

const Piso: React.FC<{ cor?: string }> = ({ cor = cores.superficie }) => {
  const { width, height, palcoY } = useFormato();
  return (
    <div style={{ position: "absolute", left: -width * 0.3, top: palcoY - 10, width: width * 1.6, height: height - palcoY + 10, background: `linear-gradient(${cor}, ${cores.fundo})`, borderTop: `4px solid ${cores.linha}` }} />
  );
};

/** Púlpito à frente do personagem. `vazio` mostra a ausência (sem boneco atrás). */
export const PulpitoFrente: React.FC<{ x: number; largura: number; vazio?: boolean; rotulo?: string; cor?: string }> = ({ x, largura, vazio, rotulo, cor = cores.textoSecundario }) => {
  const { palcoY, t } = useFormato();
  const altura = largura * 1.05;
  const e = spring({ frame: useCurrentFrame(), fps: useVideoConfig().fps, config: movimento.entradaSuave });
  return (
    <div style={{ position: "absolute", left: x - largura / 2, top: palcoY - altura + (1 - e) * 200, width: largura, height: altura, opacity: e }}>
      <svg viewBox="0 0 300 315" width="100%" height="100%">
        <line x1={150} y1={40} x2={175} y2={-30} stroke={cores.contorno} strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={178} cy={-36} rx={12} ry={16} fill="#555" />
        <path d="M 10 30 L 290 30 L 270 315 L 30 315 Z" fill={cores.superficieAlta} stroke={cores.contorno} strokeWidth={8} />
        <rect x={10} y={22} width={280} height={26} rx={6} fill={cores.linha} stroke={cores.contorno} strokeWidth={6} />
        <rect x={60} y={110} width={180} height={8} fill={cor} />
      </svg>
      {vazio ? (
        <div style={{ position: "absolute", top: -largura * 0.55, width: "100%", textAlign: "center", fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda, color: cores.textoSecundario, letterSpacing: 3 }}>
          {rotulo ?? "AUSENTE"}
        </div>
      ) : null}
    </div>
  );
};

export const CenarioPulpitos: React.FC = () => (
  <AbsoluteFill>
    <Holofotes />
    <Piso />
  </AbsoluteFill>
);

/** Urna eletrônica estilizada (sem marca do TSE). */
export const CenarioUrna: React.FC<{ escala?: number }> = ({ escala = 1 }) => {
  const f = useCurrentFrame();
  const { width, palcoY, alturaCenario } = useFormato();
  const larg = Math.min(width * 0.7, 760, alturaCenario / 0.64) * escala;
  const tecla = Math.floor(f / 12) % 12;
  return (
    <AbsoluteFill>
      <Piso />
      <svg viewBox="0 0 500 320" width={larg} style={{ position: "absolute", left: width / 2 - larg / 2, top: palcoY - larg * 0.64 }}>
        <path d="M 20 60 L 480 60 L 490 300 L 10 300 Z" fill="#C9C4B8" stroke={cores.contorno} strokeWidth={8} />
        <rect x={50} y={90} width={230} height={170} rx={10} fill="#E8F0E6" stroke={cores.contorno} strokeWidth={6} />
        <rect x={70} y={115} width={190} height={20} rx={4} fill="#9DB39A" />
        <rect x={70} y={150} width={60} height={60} rx={6} fill="#fff" stroke="#9DB39A" strokeWidth={4} />
        <rect x={140} y={150} width={60} height={60} rx={6} fill="#fff" stroke="#9DB39A" strokeWidth={4} />
        {Array.from({ length: 12 }).map((_, i) => {
          const cx = 320 + (i % 3) * 45;
          const cy = 100 + Math.floor(i / 3) * 42;
          const ativo = i === tecla && i < 9;
          return <rect key={i} x={cx} y={cy} width={36} height={32} rx={5} fill={i === 9 ? "#eee" : i === 10 ? "#E8743B" : i === 11 ? "#3DAA5C" : ativo ? cores.acento : "#2B2F36"} stroke={cores.contorno} strokeWidth={3} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Plenário em semicírculo. Com placar, as cadeiras acendem nas cores de status. */
export const CenarioPlenario: React.FC<{ casa?: "camara" | "senado"; placar?: { sim: number; nao: number; abst: number } }> = ({ casa = "camara", placar }) => {
  const f = useCurrentFrame();
  const { width, height, palcoY } = useFormato();
  const fileiras = casa === "camara" ? 9 : 5;
  const raioMax = Math.min(width * 0.46, height * 0.35);
  const cx = width / 2;
  const cy = palcoY - 40;
  const cadeiras: { x: number; y: number }[] = [];
  for (let r = 0; r < fileiras; r++) {
    const raio = raioMax * (0.45 + (0.55 * r) / Math.max(1, fileiras - 1));
    const n = Math.round(8 + r * (casa === "camara" ? 6 : 5));
    for (let i = 0; i < n; i++) {
      const a = Math.PI - (Math.PI * (i + 0.5)) / n;
      cadeiras.push({ x: cx + Math.cos(a) * raio, y: cy - Math.sin(a) * raio });
    }
  }
  cadeiras.sort((a, b) => Math.atan2(cy - a.y, a.x - cx) - Math.atan2(cy - b.y, b.x - cx)).reverse();
  const total = placar ? placar.sim + placar.nao + placar.abst : 0;
  const prog = interpolate(f, [10, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const corDe = (i: number) => {
    if (!placar || total === 0) return casa === "camara" ? "#3F6B5A" : "#3F566B";
    const frac = i / cadeiras.length;
    if (frac > prog) return cores.linha;
    if (frac < placar.sim / total) return cores.status.confirmado;
    if (frac < (placar.sim + placar.nao) / total) return cores.status.divergente;
    return cores.status.naoSeSabe;
  };
  return (
    <AbsoluteFill>
      <Piso cor={casa === "camara" ? "#1E2B26" : "#1E2530"} />
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {cadeiras.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={casa === "camara" ? 9 : 13} fill={corDe(i)} />
        ))}
        <rect x={cx - 120} y={cy - 30} width={240} height={50} rx={10} fill={cores.superficieAlta} stroke={cores.contorno} strokeWidth={5} />
      </svg>
    </AbsoluteFill>
  );
};

/** Martelo de tribunal batendo (STF/TSE e decisões judiciais). */
export const CenarioMartelo: React.FC<{ rotulo?: string }> = ({ rotulo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, palcoY, alturaCenario, t } = useFormato();
  const batida = (n: number) => spring({ frame: f - 8 - n * 14, fps, config: movimento.pop });
  const ang = -35 + 35 * Math.min(batida(0), 1) - (f > 20 && f < 30 ? 18 * Math.sin(((f - 20) / 10) * Math.PI) : 0);
  const larg = Math.min(width * 0.55, 600, alturaCenario / 0.75);
  return (
    <AbsoluteFill>
      <Piso cor="#2A2420" />
      <svg viewBox="0 0 400 300" width={larg} style={{ position: "absolute", left: width / 2 - larg / 2, top: palcoY - larg * 0.7 }}>
        <rect x={90} y={230} width={220} height={40} rx={10} fill="#6B4A32" stroke={cores.contorno} strokeWidth={6} />
        <g transform={`rotate(${ang} 320 220)`}>
          <rect x={190} y={200} width={150} height={20} rx={8} fill="#8A6040" stroke={cores.contorno} strokeWidth={5} />
          <rect x={140} y={170} width={70} height={80} rx={12} fill="#7A5236" stroke={cores.contorno} strokeWidth={6} />
        </g>
      </svg>
      {rotulo ? (
        <div style={{ position: "absolute", width: "100%", top: palcoY + 20, textAlign: "center", fontFamily: fontes.display, fontSize: t.titulo, color: cores.texto }}>{rotulo}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Sede do Executivo estilizada (pano de fundo): laje fina, fachada de vidro, colunas afinadas e rampa. */
export const CenarioPlanalto: React.FC = () => {
  const { width, palcoY, alturaCenario } = useFormato();
  const larg = Math.min(width * 1.1, alturaCenario / 0.34);
  const e = spring({ frame: useCurrentFrame(), fps: useVideoConfig().fps, config: movimento.entradaSuave });
  const base = palcoY - 140;
  return (
    <AbsoluteFill>
      <Piso />
      <svg viewBox="0 0 1000 320" width={larg} style={{ position: "absolute", left: (width - larg) / 2, top: base - larg * 0.32 + (1 - e) * 60, opacity: 0.5 * e }}>
        <rect x={0} y={300} width={1000} height={20} fill="#3B4654" />
        <rect x={40} y={50} width={920} height={22} fill="#E4E0D6" />
        <rect x={80} y={190} width={840} height={14} fill="#E4E0D6" />
        <rect x={120} y={72} width={760} height={118} fill="#4C6E7E" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={150 + i * 62} y1={72} x2={150 + i * 62} y2={190} stroke="#6E90A0" strokeWidth={3} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const x = 70 + i * 96;
          return <path key={i} d={`M ${x - 16} 72 Q ${x} 150 ${x - 3} 300 L ${x + 3} 300 Q ${x} 150 ${x + 16} 72 Z`} fill="#F2EFE8" />;
        })}
        <path d="M 920 204 L 1000 300 L 960 300 L 890 204 Z" fill="#D2CDC2" />
      </svg>
    </AbsoluteFill>
  );
};

export const CenarioNeutro: React.FC = () => <Piso />;
