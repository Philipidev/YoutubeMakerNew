import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AVISO_IA, cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";
import type { Cena, Episodio, Fonte } from "../schema/episodio";
import { Personagem, corDoPersonagem } from "../personagens/Personagem";
import { Card, Chip, Rotulo, TextoPop, formatarData, useEntrada } from "./ui";

type Fato = NonNullable<Cena["fatos"]>[number];
const fontesDe = (ep: Episodio, ids: string[]) => ids.map((id) => ep.fontes.find((f) => f.id === id)).filter(Boolean) as Fonte[];

/**
 * Selo de fonte. Slot fixo logo abaixo da barra de progresso (no vertical a base é coberta pela UI da plataforma).
 * Sempre visível enquanto há fato na tela.
 */
export const FonteLowerThird: React.FC<{ episodio: Episodio; fonteIds: string[]; status?: Fato["status"] }> = ({ episodio, fonteIds, status }) => {
  const { formato, width, height, t } = useFormato();
  const e = useEntrada(4);
  const fs = fontesDe(episodio, fonteIds);
  if (!fs.length) return null;
  const top = height * (formato === "vertical" ? 0.045 : 0.05);
  const texto = fs.map((f) => `${f.veiculo} · ${formatarData(f.data)}`).join("  |  ");
  return (
    <div style={{ position: "absolute", top, left: width * 0.06, right: width * 0.06, display: "flex", justifyContent: "center", opacity: e, transform: `translateY(${(1 - e) * -30}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${cores.fundo}F0`, border: `2px solid ${cores.linha}`, borderRadius: raio.chip, padding: "10px 22px", maxWidth: "100%" }}>
        <span style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda * 0.85, color: cores.acento, letterSpacing: 2 }}>FONTE</span>
        <span style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.legenda, color: cores.texto, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{texto}</span>
        {status === "divergente" ? <Chip cor={cores.status.divergente} style={{ fontSize: t.legenda * 0.75 }}>fontes divergem</Chip> : null}
      </div>
    </div>
  );
};

/** Card do fato. Divergência aparece com a versão de cada fonte. */
export const CardFato: React.FC<{ fato: Fato; episodio: Episodio; atraso?: number }> = ({ fato, episodio, atraso = 0 }) => {
  const { t } = useFormato();
  const e = useEntrada(atraso);
  const div = fato.status === "divergente";
  return (
    <Card borda={div ? cores.status.divergente : cores.linha} style={{ transform: `translateY(${(1 - e) * 60}px) scale(${0.94 + 0.06 * e})`, opacity: e }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Rotulo cor={div ? cores.status.divergente : cores.status.confirmado}>{div ? "Fontes divergem" : "Fato"}</Rotulo>
      </div>
      <div style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.destaque, color: cores.texto, marginTop: 14, lineHeight: 1.2 }}>{fato.texto}</div>
      {div && fato.divergencia ? (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {fato.divergencia.map((d) => {
            const f = episodio.fontes.find((x) => x.id === d.fonteId);
            return (
              <div key={d.fonteId} style={{ fontFamily: fontes.corpo, fontSize: t.corpo * 0.85, color: cores.texto }}>
                <b style={{ color: cores.status.divergente }}>{f?.veiculo ?? d.fonteId}:</b> {d.versao}
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
};

/** Citação atribuída: quem disse + o quê, com aspas. */
export const CardCitacao: React.FC<{ quem: string; disse: string; cor?: string; atraso?: number }> = ({ quem, disse, cor = cores.acento, atraso = 0 }) => {
  const { t } = useFormato();
  const e = useEntrada(atraso);
  return (
    <Card borda={cor} style={{ opacity: e, transform: `translateX(${(1 - e) * 80}px)` }}>
      <Rotulo cor={cor}>{quem} disse</Rotulo>
      <div style={{ fontFamily: fontes.corpo, fontWeight: 700, fontStyle: "italic", fontSize: t.destaque * 0.9, color: cores.texto, marginTop: 12, lineHeight: 1.25 }}>“{disse}”</div>
    </Card>
  );
};

type Lado = Extract<Cena, { tipo: "ladoA_ladoB" }>["dados"]["ladoA"];

const MetadeLado: React.FC<{ lado: Lado; letra: string; episodio: Episodio; atraso: number; vertical: boolean }> = ({ lado, letra, episodio, atraso, vertical }) => {
  const { t } = useFormato();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - atraso, fps, config: movimento.entrada });
  const pers = lado.personagemId ? episodio.personagens.find((p) => p.id === lado.personagemId) : undefined;
  const cor = pers ? corDoPersonagem(pers.cor) : cores.textoSecundario;
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, opacity: e, transform: vertical ? `translateX(${(1 - e) * (letra === "A" ? -90 : 90)}px)` : `translateY(${(1 - e) * 90}px)` }}>
      <Card chave={"lado-" + letra} borda={cor} style={{ height: "100%", display: "flex", gap: 24, padding: 32 }}>
        {pers ? (
          <div style={{ flexShrink: 0 }}>
            <Personagem dados={pers} acao={"idle"} altura={vertical ? 260 : 220} mostrarRotulo={false} />
          </div>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Chip cor={cor}>Lado {letra}</Chip>
          </div>
          <div style={{ fontFamily: fontes.display, fontSize: t.titulo * 0.75, color: cores.texto, marginTop: 10, lineHeight: 1.05 }}>{lado.titulo}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {lado.argumentos.map((a, i) => {
              const fonte = episodio.fontes.find((x) => x.id === a.fonteId);
              const ea = spring({ frame: f - atraso - 10 - i * 12, fps, config: movimento.entrada });
              return (
                <div key={i} style={{ opacity: ea, transform: `translateY(${(1 - ea) * 20}px)` }}>
                  <div style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.corpo * 0.85, color: cores.texto, lineHeight: 1.25 }}>{a.texto}</div>
                  <div style={{ fontFamily: fontes.corpo, fontSize: t.legenda * 0.85, color: cores.textoSecundario, marginTop: 4 }}>
                    — {a.quem}{fonte ? ` · ${fonte.veiculo}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

/** Lado A / Lado B: metades iguais. Ordem definida por episodio.ordemLados. */
export const CardLadoALadoB: React.FC<{ cena: Extract<Cena, { tipo: "ladoA_ladoB" }>; episodio: Episodio; duracao: number }> = ({ cena, episodio, duracao }) => {
  const { formato } = useFormato();
  const vertical = formato === "vertical";
  const [primeiro, segundo] = episodio.ordemLados === "BA" ? [cena.dados.ladoB, cena.dados.ladoA] : [cena.dados.ladoA, cena.dados.ladoB];
  const [l1, l2] = episodio.ordemLados === "BA" ? ["B", "A"] : ["A", "B"];
  // tempo igual: o segundo lado entra na metade da cena
  const meio = Math.round(duracao * 0.45);
  return (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: 28, height: "100%" }}>
      <MetadeLado lado={primeiro} letra={l1} episodio={episodio} atraso={4} vertical={vertical} />
      <MetadeLado lado={segundo} letra={l2} episodio={episodio} atraso={meio} vertical={vertical} />
    </div>
  );
};

/** Gráfico de pesquisa: metodologia sempre na tela. */
export const GraficoPesquisa: React.FC<{ cena: Extract<Cena, { tipo: "pesquisa" }>; episodio: Episodio }> = ({ cena, episodio }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const d = cena.dados;
  const max = Math.max(...d.resultados.map((r) => r.pct), 1);
  return (
    <Card style={{ padding: 44 }}>
      <Rotulo>Pesquisa · {d.instituto}</Rotulo>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
        {d.resultados.map((r, i) => {
          const p = episodio.personagens.find((x) => x.id === r.personagemId);
          const k = spring({ frame: f - 10 - i * 6, fps, config: movimento.entradaSuave });
          const cor = p ? corDoPersonagem(p.cor) : cores.textoSecundario;
          return (
            <div key={r.personagemId}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.corpo, color: cores.texto }}>
                <span>{p ? `${p.rotulo} (${p.numero})` : r.personagemId}</span>
                <span style={{ fontFamily: fontes.display, fontSize: t.destaque, color: cores.acento }}>{(r.pct * k).toFixed(0)}%</span>
              </div>
              <div style={{ height: 40, background: cores.fundo, borderRadius: 12, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${(r.pct / max) * 100 * k}%`, height: "100%", background: cor, borderRadius: 12 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 30, fontFamily: fontes.corpo, fontSize: t.legenda, color: cores.textoSecundario, lineHeight: 1.5 }}>
        Campo: {formatarData(d.campo.inicio)} a {formatarData(d.campo.fim)} · Margem de erro: {d.margemErro}
        {d.amostra ? ` · ${d.amostra.toLocaleString("pt-BR")} entrevistas` : ""}
        <br />
        Registro TSE: {d.registroTSE}
      </div>
    </Card>
  );
};

const corFase = { antes: cores.textoSecundario, fato: cores.acento, reacao: cores.status.naoSeSabe } as const;
const nomeFase = { antes: "antes", fato: "o fato", reacao: "reação" } as const;

/** Linha do tempo: eventos entram em sequência, distribuídos pela duração da cena. */
export const LinhaDoTempo: React.FC<{ cena: Extract<Cena, { tipo: "linhaDoTempo" }>; duracao: number }> = ({ cena, duracao }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const ev = cena.dados.eventos;
  const passo = Math.max(12, Math.floor((duracao * 0.8) / ev.length));
  const prog = interpolate(f, [0, passo * ev.length], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", paddingLeft: 70 }}>
      <div style={{ position: "absolute", left: 26, top: 10, bottom: 10, width: 8, background: cores.linha, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 26, top: 10, height: `calc(${prog * 100}% - 20px)`, width: 8, background: cores.acento, borderRadius: 4 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {ev.map((e, i) => {
          const k = spring({ frame: f - i * passo, fps, config: movimento.entrada });
          return (
            <div key={i} style={{ position: "relative", opacity: k, transform: `translateX(${(1 - k) * 60}px)` }}>
              <div style={{ position: "absolute", left: -60, top: 16, width: 28, height: 28, borderRadius: 14, background: corFase[e.fase], border: `5px solid ${cores.fundo}` }} />
              <Card chave={"ev-" + i} style={{ padding: "20px 28px" }} borda={e.fase === "fato" ? cores.acento : cores.linha}>
                <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                  <span style={{ fontFamily: fontes.display, fontSize: t.destaque, color: corFase[e.fase] }}>{e.data}</span>
                  <span style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda * 0.8, color: cores.textoSecundario, letterSpacing: 2, textTransform: "uppercase" }}>{nomeFase[e.fase]}</span>
                </div>
                <div style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.corpo * 0.9, color: cores.texto, marginTop: 6, lineHeight: 1.25 }}>{e.rotulo}</div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** "O que ainda não se sabe": tudo que não foi confirmado ou ainda vai acontecer. */
export const CardNaoSeSabe: React.FC<{ itens: string[]; duracao: number }> = ({ itens, duracao }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const passo = Math.max(10, Math.floor((duracao * 0.7) / itens.length));
  return (
    <Card borda={cores.status.naoSeSabe}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: cores.status.naoSeSabe, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontes.display, fontSize: 52, color: cores.contorno }}>?</div>
        <div style={{ fontFamily: fontes.display, fontSize: t.titulo * 0.8, color: cores.texto, lineHeight: 1 }}>O que ainda não se sabe</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26 }}>
        {itens.map((it, i) => {
          const k = spring({ frame: f - 8 - i * passo, fps, config: movimento.entrada });
          return (
            <div key={i} style={{ display: "flex", gap: 14, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
              <span style={{ color: cores.status.naoSeSabe, fontFamily: fontes.display, fontSize: t.corpo }}>?</span>
              <span style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.corpo * 0.9, color: cores.texto, lineHeight: 1.3 }}>{it}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/** Encerramento: fontes + aviso fixo de IA. */
export const CardEncerramento: React.FC<{ episodio: Episodio }> = ({ episodio }) => {
  const { t } = useFormato();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <TextoPop texto="Fontes" style={{ fontFamily: fontes.display, fontSize: t.manchete, color: cores.texto, lineHeight: 1 }} />
      <Card style={{ padding: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {episodio.fontes.slice(0, 10).map((fo, i) => {
            const k = spring({ frame: f - 6 - i * 3, fps, config: movimento.entrada });
            return (
              <div key={fo.id} style={{ opacity: k, fontFamily: fontes.corpo, fontSize: t.legenda, color: cores.texto, lineHeight: 1.3 }}>
                <b style={{ color: fo.tipo === "primaria" ? cores.acento : cores.texto }}>{fo.veiculo}</b>
                <span style={{ color: cores.textoSecundario }}> · {formatarData(fo.data)} · {fo.titulo}</span>
              </div>
            );
          })}
          {episodio.fontes.length > 10 ? <div style={{ fontFamily: fontes.corpo, fontSize: t.legenda, color: cores.textoSecundario }}>+{episodio.fontes.length - 10} na descrição</div> : null}
        </div>
      </Card>
      <div style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.legenda, color: cores.textoSecundario, textAlign: "center", lineHeight: 1.4, padding: "0 20px" }}>{AVISO_IA}</div>
    </div>
  );
};
