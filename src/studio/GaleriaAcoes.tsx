import React from "react";
import { AbsoluteFill } from "remotion";
import "../fontes";
import { cores, fontes } from "../theme";
import { ACOES, type Acao } from "../schema/episodio";
import { Personagem } from "../personagens/Personagem";
import { estimarPalavras } from "../pipeline/narracao/estimativa";
import { Fundo } from "../video/Fundo";

/** Personagens fictícios de revisão: mesmo rig, só número e cor mudam. */
export const DEMO_A = { id: "demo-a", rotulo: "Personagem 13", numero: "13", cor: "ciano" };
export const DEMO_B = { id: "demo-b", rotulo: "Personagem 22", numero: "22", cor: "magenta" };
const FALA = estimarPalavras("Este é um teste de sincronia da boca com a narração do episódio.", 0.3);

const Par: React.FC<{ acao: Acao; altura: number }> = ({ acao, altura }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ display: "flex", gap: altura * 0.05, alignItems: "flex-end" }}>
      <Personagem dados={DEMO_A} acao={acao} altura={altura} ladoCentro={1} palavras={FALA} fala={acao === "falar"} mostrarRotulo={false} />
      <Personagem dados={DEMO_B} acao={acao} altura={altura} ladoCentro={-1} palavras={FALA} fala={acao === "falar"} mostrarRotulo={false} />
    </div>
    <div style={{ fontFamily: fontes.corpo, fontWeight: 800, color: cores.acento, fontSize: 26, marginTop: 6 }}>{acao}</div>
  </div>
);

/** Todas as ações, lado a lado para 13 e 22 (checagem visual de simetria). */
export const GaleriaAcoes: React.FC = () => (
  <AbsoluteFill>
    <Fundo />
    <AbsoluteFill
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", alignContent: "center", rowGap: 70, padding: "160px 10px" }}
    >
      {ACOES.map((a) => (
        <Par key={a} acao={a} altura={300} />
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Uma ação isolada, em tamanho grande, com rótulos. */
export const AcaoIsolada: React.FC<{ acao: Acao }> = ({ acao }) => (
  <AbsoluteFill>
    <Fundo />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ fontFamily: fontes.display, fontSize: 96, color: cores.texto }}>{acao}</div>
      <div style={{ display: "flex", gap: 60, alignItems: "flex-end" }}>
        <Personagem dados={DEMO_A} acao={acao} altura={820} ladoCentro={1} palavras={FALA} fala={acao === "falar"} inicioAcao={15} />
        <Personagem dados={DEMO_B} acao={acao} altura={820} ladoCentro={-1} palavras={FALA} fala={acao === "falar"} inicioAcao={15} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
