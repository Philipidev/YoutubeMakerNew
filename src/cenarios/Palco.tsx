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
  const { width, height, formato, composicao, area, palcoY, conteudoTopo } = useFormato();
  // vertical/topo: faixa de cima livre para o card; 16:9 esq/dir: mapa do lado oposto à coluna de cards
  const lateral = formato === "horizontal" && composicao !== "topo";
  const topo = lateral ? conteudoTopo : conteudoTopo + height * (formato === "vertical" ? 0.06 : 0.17);
  const lado = Math.min(area.w, palcoY - topo);
  const centroX = lateral ? width * (composicao === "dir" ? 0.36 : 0.64) : width / 2;
  const destaque = Object.fromEntries((opcoes.ufs ?? []).map((uf) => [uf, cores.acento]));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: centroX - lado / 2, top: topo }}>
        <MapaBrasil modo={modo} largura={lado} destaque={destaque} valores={opcoes.valores} uf={opcoes.uf} regioes={opcoes.regioes} siglas={modo !== "capitais"} />
      </div>
    </AbsoluteFill>
  );
};

/** Cenários que ocupam o centro: no 16:9 vão para a direita, liberando a coluna de cards à esquerda. */
const CENTRAIS: CenarioId[] = ["planalto", "urna", "plenarioCamara", "plenarioSenado", "martelo", "congresso", "banco", "cpi", "policia", "tribunal"];

export const CenarioFundo: React.FC<{ id?: CenarioId; opcoes?: CenarioOpcoes; placar?: { sim: number; nao: number; abst: number }; comPersonagens?: boolean }> = (props) => {
  const { formato, ajusteCenario, escalaCenarioTopo, palcoY } = useFormato();
  const desloca = formato === "horizontal" && props.id && CENTRAIS.includes(props.id) && !props.comPersonagens;
  // composição da cena: cards à esquerda → cenário à direita; à direita → cenário à esquerda; no topo → cenário menor
  const transform = escalaCenarioTopo !== 1 ? `scale(${escalaCenarioTopo})` : ajusteCenario();
  return desloca && transform ? (
    <AbsoluteFill style={{ transform, transformOrigin: `50% ${palcoY}px` }}>
      <CenarioFundoBase {...props} />
    </AbsoluteFill>
  ) : (
    <CenarioFundoBase {...props} />
  );
};

const CenarioFundoBase: React.FC<{ id?: CenarioId; opcoes?: CenarioOpcoes; placar?: { sim: number; nao: number; abst: number } }> = ({ id, opcoes = {}, placar }) => {
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
  const { xPersonagem, palcoY, alturaBoneco } = useFormato();
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
        const x = xPersonagem(p.posicao, presentes.length + ausentes.length);
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
            <PulpitoFrente x={xPersonagem(pos, presentes.length + ausentes.length)} largura={largPulpito} vazio rotulo="AUSENTE" />
            <RotuloPulpito x={xPersonagem(pos, presentes.length + ausentes.length)} texto={dados?.rotulo ?? id} />
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
