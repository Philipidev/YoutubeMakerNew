import React from "react";
import { AbsoluteFill } from "remotion";
import type { Cena, CenarioId, Episodio, Posicao } from "../schema/episodio";
import type { Palavra } from "../schema/timestamps";
import { useFormato } from "../layout/useFormato";
import { cores, fontes } from "../theme";
import { Personagem, corDoPersonagem } from "../personagens/Personagem";
import {
  CenarioMapaBrasil,
  CenarioMartelo,
  CenarioNeutro,
  CenarioPlanalto,
  CenarioPlenario,
  CenarioPulpitos,
  CenarioUrna,
  PulpitoFrente,
} from "./Cenarios";

export const CenarioFundo: React.FC<{ id?: CenarioId; rotulo?: string; placar?: { sim: number; nao: number; abst: number }; destaqueUfs?: Record<string, string> }> = ({ id, rotulo, placar, destaqueUfs }) => {
  switch (id) {
    case "pulpitos":
    case "pulpitoVazio":
      return <CenarioPulpitos />;
    case "urna":
      return <CenarioUrna />;
    case "plenarioCamara":
      return <CenarioPlenario casa="camara" placar={placar} />;
    case "plenarioSenado":
      return <CenarioPlenario casa="senado" placar={placar} />;
    case "martelo":
      return <CenarioMartelo rotulo={rotulo} />;
    case "planalto":
      return <CenarioPlanalto />;
    case "mapaBrasil":
      return <CenarioMapaBrasil destaque={destaqueUfs} />;
    case "neutro":
      return <CenarioNeutro />;
    default:
      return null;
  }
};

const ladoCentro = (pos: Posicao): 1 | -1 => (pos === "dir" ? -1 : 1);

/**
 * Palco: personagens nas posições fixas, todos na mesma altura e escala.
 * Com cenário de púlpitos, cada um ganha púlpito; `ausentes` aparecem como púlpito vazio.
 */
export const Palco: React.FC<{
  cena: Cena;
  episodio: Episodio;
  palavras: Palavra[];
  ausentes?: string[];
  /** posição vertical extra (px), para cenas que usam o topo inteiro */
  deslocY?: number;
  escala?: number;
}> = ({ cena, episodio, palavras, ausentes = [], deslocY = 0, escala = 1 }) => {
  const { posX, palcoY, alturaBoneco } = useFormato();
  const pulpitos = cena.cenario === "pulpitos" || cena.cenario === "pulpitoVazio";
  const altura = alturaBoneco * escala;
  const largPulpito = altura * 0.5;
  const presentes = cena.personagens ?? [];
  const posOcupadas = new Set(presentes.map((p) => p.posicao));
  const livres = (["esq", "dir", "centro"] as Posicao[]).filter((p) => !posOcupadas.has(p));
  return (
    <AbsoluteFill style={{ transform: `translateY(${deslocY}px)` }}>
      {presentes.map((p) => {
        const dados = episodio.personagens.find((x) => x.id === p.id);
        if (!dados) return null;
        const x = posX[p.posicao];
        return (
          <React.Fragment key={p.id}>
            <div style={{ position: "absolute", left: x - (altura * 400) / 720 / 2, top: palcoY - altura }}>
              <Personagem
                dados={dados}
                acao={p.acao}
                altura={altura}
                ladoCentro={ladoCentro(p.posicao)}
                palavras={palavras}
                fala={p.fala}
                inicioAcao={8}
                mostrarRotulo={!pulpitos}
              />
            </div>
            {pulpitos ? <PulpitoFrente x={x} largura={largPulpito} cor={corDoPersonagem(dados.cor)} /> : null}
            {pulpitos ? <RotuloPulpito x={x} texto={dados.rotulo} /> : null}
          </React.Fragment>
        );
      })}
      {ausentes.map((id, i) => {
        const dados = episodio.personagens.find((x) => x.id === id);
        const pos = livres[i] ?? "centro";
        return (
          <React.Fragment key={id}>
            <PulpitoFrente x={posX[pos]} largura={largPulpito} vazio rotulo="AUSENTE" />
            <RotuloPulpito x={posX[pos]} texto={dados?.rotulo ?? id} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

const RotuloPulpito: React.FC<{ x: number; texto: string }> = ({ x, texto }) => {
  const { palcoY, t } = useFormato();
  return (
    <div style={{ position: "absolute", left: x - 250, width: 500, top: palcoY + 16, textAlign: "center", fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda, color: cores.texto, textTransform: "uppercase", letterSpacing: 1 }}>
      {texto}
    </div>
  );
};
