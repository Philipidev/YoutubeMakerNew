import React from "react";
import { AbsoluteFill } from "remotion";
import "../fontes";
import { cores, fontes } from "../theme";
import { Personagem, type PersonagemProps } from "../personagens/Personagem";
import { Fundo } from "../video/Fundo";

type Fig = { titulo: string; dados: PersonagemProps["dados"]; acao: PersonagemProps["acao"] };

/** Presets de figurino (também registrados em biblioteca/figurinos.json). */
export const FIGURINOS: Fig[] = [
  { titulo: "candidato (cor do partido)", acao: "acenar", dados: { id: "f1", rotulo: "Candidato 13", numero: "13", cor: "PT", roupa: "camisa" } },
  { titulo: "candidato (cor do partido)", acao: "acenar", dados: { id: "f2", rotulo: "Candidato 22", numero: "22", cor: "PL", roupa: "camisa" } },
  { titulo: "ministro / autoridade", acao: "falar", dados: { id: "f3", rotulo: "Ministro", numero: "", cor: "servidor", roupa: "terno", acessorio: "documento" } },
  { titulo: "ministro do STF / TSE", acao: "idle", dados: { id: "f4", rotulo: "Ministro STF", numero: "", cor: "neutro", roupa: "toga" } },
  { titulo: "aposentado (INSS)", acao: "idle", dados: { id: "f5", rotulo: "Aposentado", numero: "", cor: "cidadao", roupa: "simples", idade: "idoso", acessorio: "bengala" } },
  { titulo: "renda baixa", acao: "idle", dados: { id: "f6", rotulo: "Renda baixa", numero: "", cor: "cidadao", roupa: "simples", acessorio: "carteiraVazia" } },
  { titulo: "renda alta", acao: "idle", dados: { id: "f7", rotulo: "Renda alta", numero: "", cor: "cidadao", roupa: "terno", acessorio: "carteiraCheia" } },
  { titulo: "dinheiro apreendido (só com fato)", acao: "idle", dados: { id: "f8", rotulo: "Investigado", numero: "", cor: "neutro", roupa: "terno", acessorio: "maletaDinheiro" } },
  { titulo: "cidadão", acao: "sorrir", dados: { id: "f9", rotulo: "Cidadão", numero: "", cor: "cidadao", roupa: "simples" } },
];

export const Figurinos: React.FC = () => (
  <AbsoluteFill>
    <Fundo />
    <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", alignContent: "center", rowGap: 30, padding: "140px 20px" }}>
      {FIGURINOS.map((f) => (
        <div key={f.dados.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Personagem dados={f.dados} acao={f.acao} altura={380} />
          <div style={{ fontFamily: fontes.corpo, fontWeight: 600, color: cores.textoSecundario, fontSize: 20, marginTop: 6, textAlign: "center" }}>{f.titulo}</div>
        </div>
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);
