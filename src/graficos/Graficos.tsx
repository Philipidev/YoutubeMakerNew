import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento } from "../theme";
import { useFormato } from "../layout/useFormato";
import { Card, Rotulo } from "../cards/ui";
import { MapaBrasil } from "../mapas/MapaBrasil";
import { Brilho, Ondas, useOnda, usePulso, useVariante } from "../movimento/vida";

/**
 * Gráficos de dados (demografia, economia, pobreza). Regras:
 * - sempre com fonte e período no rodapé;
 * - escala começa em zero (barras), sem eixo truncado;
 * - cores neutras; destaque só no item citado na narração.
 */

const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.min(2, String(v).split(".")[1]?.length ?? 0));
/** Formata no padrão pt-BR com as casas do valor de referência (nunca arredonda 47,03 para 47). */
const fmt = (v: number, ref: number = v) => v.toLocaleString("pt-BR", { minimumFractionDigits: casasDe(ref), maximumFractionDigits: casasDe(ref) });

const useProg = (atraso = 8, dur = 40) => {
  const f = useCurrentFrame();
  return interpolate(f, [atraso, atraso + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: movimento.easingPadrao });
};

export const RodapeFonte: React.FC<{ fonte: string; nota?: string }> = ({ fonte, nota }) => {
  const { t } = useFormato();
  return (
    <div style={{ marginTop: 22, fontFamily: fontes.corpo, fontSize: t.legenda * 0.9, color: cores.textoSecundario, lineHeight: 1.4 }}>
      Fonte: {fonte}
      {nota ? <><br />{nota}</> : null}
    </div>
  );
};

const Moldura: React.FC<{ titulo: string; fonte: string; nota?: string; children: React.ReactNode }> = ({ titulo, fonte, nota, children }) => {
  const { t } = useFormato();
  return (
    <Card style={{ padding: 36 }}>
      <Rotulo>Dados</Rotulo>
      <div style={{ fontFamily: fontes.display, fontSize: t.titulo * 0.8, color: cores.texto, lineHeight: 1.05, marginTop: 8, marginBottom: 22 }}>{titulo}</div>
      {children}
      <RodapeFonte fonte={fonte} nota={nota} />
    </Card>
  );
};

export type Ponto = { rotulo: string; valor: number; destaque?: boolean };

export const GraficoBarras: React.FC<{ titulo: string; fonte: string; nota?: string; unidade?: string; pontos: Ponto[] }> = ({ titulo, fonte, nota, unidade = "", pontos }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const max = Math.max(...pontos.map((p) => p.valor), 1e-9);
  // vida da barra em destaque: reflexo, número pulsando ou contorno aceso
  const vida = useVariante("barras", ["brilho", "pulsoValor", "contorno"] as const);
  const pulso = usePulso("barras", 50);
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {pontos.map((p, i) => {
          const k = spring({ frame: f - 8 - i * 4, fps, config: movimento.entradaSuave });
          return (
            <div key={p.rotulo}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontes.corpo, fontWeight: 700, fontSize: t.corpo * 0.85, color: cores.texto }}>
                <span>{p.rotulo}</span>
                <span style={{ fontFamily: fontes.display, color: p.destaque ? cores.acento : cores.texto, display: "inline-block", transform: p.destaque && vida === "pulsoValor" ? `scale(${1 + 0.12 * pulso})` : undefined }}>
                  {fmt(p.valor * k, p.valor)}
                  {unidade}
                </span>
              </div>
              <div style={{ height: 26, background: cores.fundo, borderRadius: 8, marginTop: 6 }}>
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    width: `${(p.valor / max) * 100 * k}%`,
                    height: "100%",
                    borderRadius: 8,
                    background: p.destaque ? cores.acento : cores.textoSecundario,
                    boxShadow: p.destaque && vida === "contorno" ? `0 0 ${6 + 14 * pulso}px ${cores.acento}` : undefined,
                  }}
                >
                  {p.destaque && vida === "brilho" ? <Brilho chave={"barra-" + p.rotulo} atraso={50} intensidade={0.45} /> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Moldura>
  );
};

/** Série temporal: linha desenhada da esquerda para a direita; último ponto em destaque. */
export const GraficoLinha: React.FC<{ titulo: string; fonte: string; nota?: string; unidade?: string; pontos: Ponto[]; zeroNoEixo?: boolean }> = ({ titulo, fonte, nota, unidade = "", pontos, zeroNoEixo = true }) => {
  const { t, larguraConteudo, alturaConteudo } = useFormato();
  const prog = useProg(8, 50);
  // largura limitada também pela altura disponível (16:9 tem pouca altura)
  const W = Math.min(larguraConteudo - 72, (alturaConteudo - 280) / 0.55);
  const H = W * 0.55;
  const vals = pontos.map((p) => p.valor);
  const min = zeroNoEixo ? 0 : Math.min(...vals);
  const max = Math.max(...vals);
  const x = (i: number) => (i / Math.max(1, pontos.length - 1)) * (W - 40) + 20;
  const y = (v: number) => H - 30 - ((v - min) / Math.max(1e-9, max - min)) * (H - 90);
  const d = pontos.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.valor)}`).join(" ");
  const comp = pontos.reduce((s, p, i) => (i ? s + Math.hypot(x(i) - x(i - 1), y(p.valor) - y(pontos[i - 1].valor)) : 0), 0);
  const visiveis = Math.floor(prog * (pontos.length - 1) + 1e-6);
  const f = useCurrentFrame();
  const vida = useVariante("linha", ["ondas", "quique", "tracejado"] as const);
  const quique = prog >= 1 && vida === "quique" ? Math.abs(Math.sin((f - 60) / 9)) * 5 : 0;
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <svg width={W} height={H}>
        <line x1={0} y1={H - 30} x2={W} y2={H - 30} stroke={cores.linha} strokeWidth={3} />
        <path d={d} fill="none" stroke={cores.acento} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - prog)} />
        {prog >= 1 && vida === "tracejado" ? (
          <path d={d} fill="none" stroke={cores.texto} strokeWidth={3} strokeLinecap="round" strokeDasharray="10 26" strokeDashoffset={-f * 2} opacity={0.55} />
        ) : null}
        {pontos.map((p, i) =>
          i <= visiveis ? (
            <g key={i}>
              {i === pontos.length - 1 && prog >= 1 && vida === "ondas" ? <Ondas cx={x(i)} cy={y(p.valor)} raio={13} cor={cores.acento} chave="linha-ultimo" /> : null}
              <circle cx={x(i)} cy={y(p.valor) - (i === pontos.length - 1 ? quique : 0)} r={i === pontos.length - 1 ? 13 : 8} fill={i === pontos.length - 1 ? cores.acento : cores.texto} stroke={cores.contorno} strokeWidth={3} />
              {i === 0 || i === pontos.length - 1 || p.destaque ? (
                <text x={x(i)} y={y(p.valor) - 22} textAnchor="middle" fontFamily={fontes.display} fontSize={t.corpo} fill={cores.texto}>
                  {fmt(p.valor)}
                  {unidade}
                </text>
              ) : null}
              <text x={x(i)} y={H - 4} textAnchor="middle" fontFamily={fontes.corpo} fontSize={t.legenda * 0.85} fill={cores.textoSecundario}>
                {p.rotulo}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Moldura>
  );
};

export type FaixaEtaria = { faixa: string; homens: number; mulheres: number };

/** Pirâmide etária (percentual da população por faixa e sexo). */
export const PiramideEtaria: React.FC<{ titulo: string; fonte: string; nota?: string; faixas: FaixaEtaria[] }> = ({ titulo, fonte, nota, faixas }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const max = Math.max(...faixas.flatMap((x) => [x.homens, x.mulheres]));
  const ordem = [...faixas].reverse(); // mais velhos no topo
  const corH = "oklch(0.70 0.10 230)";
  const corM = "oklch(0.70 0.10 330)";
  const vida = useVariante("piramide", ["varredura", "respirar", "maior"] as const);
  const onda = useOnda("piramide", 70, 100);
  const linhaVarrida = f > 50 ? Math.floor(((f - 50) / 10) % (ordem.length + 6)) : -1;
  const maior = ordem.reduce((m, x, i) => (x.homens + x.mulheres > ordem[m].homens + ordem[m].mulheres ? i : m), 0);
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda, color: cores.textoSecundario, marginBottom: 8 }}>
        <span style={{ color: corH }}>HOMENS</span>
        <span style={{ color: corM }}>MULHERES</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {ordem.map((x, i) => {
          const k = spring({ frame: f - 6 - (ordem.length - i) * 2, fps, config: movimento.entradaSuave });
          return (
            <div
              key={x.faixa}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 1fr",
                alignItems: "center",
                height: 26,
                filter: (vida === "varredura" && i === linhaVarrida) || (vida === "maior" && i === maior && f > 50) ? `brightness(${vida === "maior" ? 1.15 + 0.15 * onda : 1.35})` : undefined,
                transform: vida === "respirar" && f > 50 ? `scaleX(${1 + 0.015 * onda})` : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: `${(x.homens / max) * 100 * k}%`, height: 22, background: corH, borderRadius: "6px 0 0 6px" }} />
              </div>
              <div style={{ textAlign: "center", fontFamily: fontes.corpo, fontSize: t.legenda * 0.75, color: cores.texto }}>{x.faixa}</div>
              <div>
                <div style={{ width: `${(x.mulheres / max) * 100 * k}%`, height: 22, background: corM, borderRadius: "0 6px 6px 0" }} />
              </div>
            </div>
          );
        })}
      </div>
    </Moldura>
  );
};

/** Pictograma: 100 pessoas, `percentual` delas em destaque ("x em cada 100"). */
export const Pictograma: React.FC<{ titulo: string; fonte: string; nota?: string; percentual: number; rotuloDestaque: string }> = ({ titulo, fonte, nota, percentual, rotuloDestaque }) => {
  const f = useCurrentFrame();
  const { t, formato, larguraConteudo, alturaConteudo } = useFormato();
  const n = Math.round(percentual);
  // vertical: 10×10; 16:9: 20×5 (cabe na altura)
  const colunas = formato === "vertical" ? 10 : 20;
  const linhas = 100 / colunas;
  const lado = Math.min((larguraConteudo - 72) / colunas, (alturaConteudo - 300) / linhas / 0.95);
  const acesos = Math.floor(interpolate(f, [10, 55], [0, n], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const vida = useVariante("pictograma", ["ola", "piscar", "respirar"] as const);
  const cheio = acesos >= n;
  const estiloIcone = (i: number): React.CSSProperties | undefined => {
    if (!cheio || i >= n) return undefined;
    if (vida === "ola") return { transform: `translateY(${Math.min(0, Math.sin((f - 60) / 5 - (i % colunas) * 0.5 - Math.floor(i / colunas) * 0.9)) * 6}px)` };
    if (vida === "piscar") return { filter: (Math.floor(f / 4) * 7 + i * 13) % 37 === 0 ? "brightness(1.6)" : undefined };
    return { transform: `scale(${1 + 0.06 * Math.sin((f - 60) / 12)})` };
  };
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, ${lado}px)`, gap: 2, justifyContent: "center" }}>
        {Array.from({ length: 100 }).map((_, i) => (
          <svg
            key={i}
            style={estiloIcone(i)}
            viewBox="0 0 40 60" width={lado - 8} height={(lado - 8) * 0.95} preserveAspectRatio="xMidYMid meet">
            <circle cx={20} cy={13} r={10} fill={i < acesos ? cores.acento : cores.linha} />
            <path d="M 6 58 L 6 34 Q 6 24 20 24 Q 34 24 34 34 L 34 58 Z" fill={i < acesos ? cores.acento : cores.linha} />
          </svg>
        ))}
      </div>
      <div style={{ marginTop: 18, fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.destaque * 0.8, color: cores.texto }}>
        <span style={{ fontFamily: fontes.display, color: cores.acento, fontSize: t.destaque * 1.3 }}>{fmt(percentual)}%</span> {rotuloDestaque}
      </div>
    </Moldura>
  );
};

/** Rosca: partes de um todo (soma 100). */
export const GraficoRosca: React.FC<{ titulo: string; fonte: string; nota?: string; pontos: Ponto[] }> = ({ titulo, fonte, nota, pontos }) => {
  const { t } = useFormato();
  const prog = useProg(8, 45);
  const f = useCurrentFrame();
  const total = pontos.reduce((s, p) => s + p.valor, 0);
  const paleta = [cores.acento, "oklch(0.70 0.10 230)", "oklch(0.70 0.10 160)", "oklch(0.70 0.10 330)", cores.textoSecundario, "oklch(0.70 0.10 40)"];
  const R = 160;
  const C = 2 * Math.PI * R;
  let acum = 0;
  const vida = useVariante("rosca", ["deriva", "fatia", "legenda"] as const);
  const pulso = usePulso("rosca", 55);
  const maior = pontos.reduce((m, p, i) => (p.valor > pontos[m].valor ? i : m), 0);
  const emFoco = f > 55 ? Math.floor((f - 55) / 40) % pontos.length : -1;
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <svg width={2 * R + 60} height={2 * R + 60} viewBox={`${-R - 30} ${-R - 30} ${2 * R + 60} ${2 * R + 60}`} style={{ flexShrink: 0 }}>
          <g transform={`rotate(${-90 + (vida === "deriva" ? Math.sin(f / 70) * 5 : 0)})`}>
            {pontos.map((p, i) => {
              const frac = (p.valor / total) * prog;
              const el = <circle key={p.rotulo} r={R} fill="none" stroke={paleta[i % paleta.length]} strokeWidth={vida === "fatia" && i === maior ? 56 + 12 * pulso : 56} strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acum * C * prog} />;
              acum += p.valor / total;
              return el;
            })}
          </g>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pontos.map((p, i) => (
            <div
              key={p.rotulo}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: fontes.corpo,
                fontWeight: 700,
                fontSize: t.corpo * 0.8,
                color: cores.texto,
                opacity: vida === "legenda" && emFoco >= 0 && emFoco !== i ? 0.55 : 1,
                transform: vida === "legenda" && emFoco === i ? "translateX(8px)" : undefined,
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 6, background: paleta[i % paleta.length], flexShrink: 0 }} />
              {p.rotulo} <span style={{ fontFamily: fontes.display, color: cores.acento }}>{fmt(p.valor)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Moldura>
  );
};

/** Mapa coroplético por UF com legenda de escala. */
export const MapaDados: React.FC<{ titulo: string; fonte: string; nota?: string; unidade?: string; valores: Record<string, number> }> = ({ titulo, fonte, nota, unidade = "", valores }) => {
  const { t, larguraConteudo, alturaConteudo } = useFormato();
  const vs = Object.values(valores);
  const [mn, mx] = [Math.min(...vs), Math.max(...vs)];
  return (
    <Moldura titulo={titulo} fonte={fonte} nota={nota}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <MapaBrasil modo="estados" valores={valores} largura={Math.min(larguraConteudo - 72, 800, alturaConteudo - 300)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontFamily: fontes.corpo, fontSize: t.legenda, color: cores.textoSecundario }}>
        {fmt(mn)}
        {unidade}
        <div style={{ flex: 1, height: 16, borderRadius: 8, background: `linear-gradient(90deg, ${cores.superficieAlta}, ${cores.acento})` }} />
        {fmt(mx)}
        {unidade}
      </div>
    </Moldura>
  );
};
