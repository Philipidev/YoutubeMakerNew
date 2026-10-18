import React from "react";
import { AbsoluteFill } from "remotion";
import type { Cena, CenarioId, Episodio, Posicao } from "../schema/episodio";
import type { Palavra } from "../schema/timestamps";
import { useFormato } from "../layout/useFormato";
import { cores, fontes } from "../theme";
import { Personagem, corDoPersonagem } from "../personagens/Personagem";
import { CenarioMartelo, CenarioNeutro, CenarioPlanalto, CenarioPlenario, CenarioPulpitos, CenarioUrna, PulpitoFrente } from "./Cenarios";
import { CenarioBanco, CenarioCPI, CenarioCongresso, CenarioPolicia, CenarioTribunal } from "./Instituicoes";
import { MapaBrasil, type ModoMapa } from "../mapas/MapaBrasil";
import { CenarioMundo } from "../mundo/Mundo";
import type { CenarioOpcoes } from "../schema/episodio";

/** Mapa ocupando a área útil acima do rodapé. */
const CenarioMapa: React.FC<{ modo: ModoMapa; opcoes: CenarioOpcoes }> = ({ modo, opcoes }) => {
  const { width, area, palcoY } = useFormato();
  const lado = Math.min(area.w, palcoY - area.y);
  const destaque = Object.fromEntries((opcoes.ufs ?? []).map((uf) => [uf, cores.acento]));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: (width - lado) / 2, top: area.y + 20 }}>
        <MapaBrasil modo={modo} largura={lado} destaque={destaque} valores={opcoes.valores} uf={opcoes.uf} regioes={opcoes.regioes} siglas={modo !== "capitais"} />
      </div>
    </AbsoluteFill>
  );
};

export const CenarioFundo: React.FC<{ id?: CenarioId; opcoes?: CenarioOpcoes; placar?: { sim: number; nao: number; abst: number } }> = ({ id, opcoes = {}, placar }) => {
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
      return <CenarioMartelo rotulo={opcoes.rotulo} />;
    case "planalto":
      return <CenarioPlanalto />;
    case "mapaBrasil":
      return <CenarioMapa modo={opcoes.valores ? "estados" : "estados"} opcoes={opcoes} />;
    case "mapaCapitais":
      return <CenarioMapa modo="capitais" opcoes={opcoes} />;
    case "mapaRegioes":
      return <CenarioMapa modo="regioes" opcoes={opcoes} />;
    case "mapaEstado":
      return <CenarioMapa modo="estado" opcoes={opcoes} />;
    case "congresso":
      return <CenarioCongresso rotulo={opcoes.rotulo} destaque={opcoes.casa} />;
    case "banco":
      return <CenarioBanco rotulo={opcoes.rotulo} />;
    case "cpi":
      return <CenarioCPI rotulo={opcoes.rotulo} />;
    case "policia":
      return <CenarioPolicia rotulo={opcoes.rotulo} />;
    case "tribunal":
      return <CenarioTribunal rotulo={opcoes.rotulo} votos={opcoes.votos} />;
    case "mundo":
      return <CenarioMundo paises={opcoes.paises ?? []} />;
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
                acessorio={p.acessorio}
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
