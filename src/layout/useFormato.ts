import { useVideoConfig } from "remotion";
import { safe, tipos } from "../theme";
import type { Posicao } from "../schema/episodio";

export type Formato = "vertical" | "horizontal";

export type Retangulo = { x: number; y: number; w: number; h: number };

/**
 * Fonte única de layout. Regras:
 * - nada essencial nas faixas de UI das plataformas (topo/base) nem na zona da legenda;
 * - vertical: palco embaixo, cards em cima;
 * - horizontal (vídeo do YouTube, padrão telejornal): 1 personagem à esquerda e cards na coluna direita;
 *   2 personagens nas laterais e cards na coluna central; sem personagem, cards centralizados com largura máxima.
 */
export const useFormato = () => {
  const { width, height } = useVideoConfig();
  const formato: Formato = height > width ? "vertical" : "horizontal";
  const vertical = formato === "vertical";
  const s = safe[formato];
  /** Faixa reservada para legenda (YouTube/.srt ou queimada). */
  const zonaLegenda = { y: height * s.legenda.inicio, h: height * (s.legenda.fim - s.legenda.inicio) };
  /** Selo de fonte: logo abaixo da faixa de UI do topo. */
  const seloY = height * (vertical ? 0.085 : 0.065);
  /** Topo do conteúdo (abaixo do selo de fonte). */
  const conteudoTopo = height * (vertical ? 0.125 : 0.13);
  /** Fim do conteúdo: margem antes da zona da legenda. */
  const conteudoFim = zonaLegenda.y - height * 0.015;
  /** Área útil de conteúdo (sem palco). */
  const area: Retangulo = {
    x: width * s.lados,
    y: height * s.topo,
    w: width * (1 - 2 * s.lados),
    h: zonaLegenda.y - height * s.topo,
  };
  /** Largura máxima de card/gráfico sem palco (no 16:9 não estica de ponta a ponta). */
  const larguraConteudo = vertical ? area.w : Math.min(area.w, 1320);
  /** Altura útil de conteúdo (topo do conteúdo até a zona da legenda). */
  const alturaConteudo = conteudoFim - conteudoTopo;

  /** Linha dos pés dos personagens: rótulos terminam antes da zona da legenda. */
  const palcoY = vertical ? height * 0.635 : height * 0.735;
  /** Altura padrão do boneco (sem rótulo). Igual para todos. */
  const alturaBoneco = vertical ? 600 : 470;
  /** Altura disponível para cenários ancorados no palco (deixa a faixa de cima para o card). */
  const alturaCenario = palcoY - height * (vertical ? 0.28 : 0.3);

  const posXPadrao: Record<Posicao, number> = vertical
    ? { esq: width * 0.27, centro: width * 0.5, dir: width * 0.73 }
    : { esq: width * 0.25, centro: width * 0.5, dir: width * 0.75 };

  /** X do personagem conforme quantos estão no palco (no 16:9 eles vão para as laterais). */
  const xPersonagem = (pos: Posicao, n: number): number => {
    if (vertical || n >= 3) return posXPadrao[pos];
    if (n === 1) return width * 0.2;
    return pos === "dir" ? width * 0.83 : pos === "esq" ? width * 0.17 : width * 0.5;
  };

  /**
   * Retângulo de conteúdo quando há palco. Vertical: faixa acima das cabeças.
   * Horizontal: coluna ao lado (1 personagem) ou entre (2 personagens), altura toda.
   */
  const colunaComPalco = (n: number): Retangulo => {
    if (!vertical && n === 1) return { x: width * 0.38, y: conteudoTopo, w: width * 0.57, h: alturaConteudo };
    if (!vertical && n === 2) return { x: width * 0.315, y: conteudoTopo, w: width * 0.37, h: alturaConteudo };
    return { x: area.x, y: conteudoTopo, w: area.w, h: palcoY - alturaBoneco - 24 - conteudoTopo };
  };

  return {
    formato,
    width,
    height,
    area,
    zonaLegenda,
    seloY,
    conteudoTopo,
    conteudoFim,
    larguraConteudo,
    alturaConteudo,
    posX: posXPadrao,
    xPersonagem,
    colunaComPalco,
    palcoY,
    alturaBoneco,
    alturaCenario,
    t: tipos[formato],
  };
};
