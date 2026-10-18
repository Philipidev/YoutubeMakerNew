import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import "../fontes";
import { cores, fontes } from "../theme";
import { Fundo } from "../video/Fundo";
import { Personagem, corDoPersonagem } from "../personagens/Personagem";
import { carregarDados, type DadosEpisodio } from "../video/dados";

/**
 * Thumbnail 1280×720 do episódio (YouTube). Regras de imparcialidade:
 * candidatos do mesmo tamanho, mesma pose, cada um no seu lado fixo; texto curto e neutro.
 * Texto vem de episodio.thumbnail (titulo, destaque, rodape); sem isso, usa o gancho.
 */
export const ThumbnailSchema = z.object({
  slug: z.string(),
  /** Sobrescrevem episodio.thumbnail (testar textos sem mexer no episódio). */
  titulo: z.string().optional(),
  destaque: z.string().optional(),
  rodape: z.string().optional(),
});
type Props = z.infer<typeof ThumbnailSchema> & { dados?: DadosEpisodio };

export const calcularMetadataThumbnail: CalculateMetadataFunction<Props> = async ({ props }) => ({
  props: { ...props, dados: await carregarDados(props.slug) },
});

export const Thumbnail: React.FC<Props> = ({ dados, titulo, destaque, rodape }) => {
  if (!dados) return null;
  const ep = dados.episodio;
  const gancho = ep.cenas.find((c) => c.tipo === "gancho");
  const base = ep.thumbnail ?? {
    titulo: gancho?.tipo === "gancho" ? gancho.dados.manchete : ep.titulo,
    destaque: gancho?.tipo === "gancho" ? gancho.dados.destaque : undefined,
    rodape: undefined,
  };
  const th = { titulo: titulo ?? base.titulo, destaque: destaque ?? base.destaque, rodape: rodape ?? base.rodape };
  // candidatos com lado fixo (ou os dois primeiros com número)
  const ids = ep.posicoesFixas ? Object.entries(ep.posicoesFixas).sort(([, a], [, b]) => (a === "esq" ? -1 : b === "esq" ? 1 : 0)).map(([id]) => id) : ep.personagens.filter((p) => p.numero).slice(0, 2).map((p) => p.id);
  const [esq, dir] = ids.map((id) => ep.personagens.find((p) => p.id === id)!);
  const altura = 560;
  const faixa = (p: typeof esq, lado: "esq" | "dir") => (
    <div style={{ position: "absolute", bottom: -40, [lado === "esq" ? "left" : "right"]: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* mesmo frame, mesma ação: pose idêntica para os dois */}
      <Personagem dados={p} acao="apontar" altura={altura} ladoCentro={lado === "esq" ? 1 : -1} mostrarRotulo={false} inicioAcao={0} semente={7} piscar={false} />
    </div>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fundo />
      {/* luz de palco atrás de cada candidato, na cor dele */}
      {esq ? <div style={{ position: "absolute", left: -120, top: 80, width: 560, height: 700, background: `radial-gradient(ellipse, ${corDoPersonagem(esq.cor)}55, transparent 65%)` }} /> : null}
      {dir ? <div style={{ position: "absolute", right: -120, top: 80, width: 560, height: 700, background: `radial-gradient(ellipse, ${corDoPersonagem(dir.cor)}55, transparent 65%)` }} /> : null}
      {esq ? faixa(esq, "esq") : null}
      {dir ? faixa(dir, "dir") : null}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 300px", textAlign: "center" }}>
        {th.destaque ? (
          <div style={{ background: cores.acento, color: cores.contorno, fontFamily: fontes.corpo, fontWeight: 800, fontSize: 34, padding: "8px 22px", borderRadius: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>
            {th.destaque}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: fontes.display,
            fontSize: 118,
            lineHeight: 0.98,
            color: cores.texto,
            textTransform: "uppercase",
            textShadow: "0 6px 0 #000, 0 0 40px rgba(0,0,0,0.6)",
          }}
        >
          {th.titulo}
        </div>
        {esq && dir ? (
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 18, fontFamily: fontes.display, fontSize: 64 }}>
            <span style={{ color: corDoPersonagem(esq.cor), textShadow: "0 4px 0 #000" }}>{esq.numero}</span>
            <span style={{ color: cores.textoSecundario, fontSize: 40 }}>×</span>
            <span style={{ color: corDoPersonagem(dir.cor), textShadow: "0 4px 0 #000" }}>{dir.numero}</span>
          </div>
        ) : null}
        {th.rodape ? <div style={{ marginTop: 14, fontFamily: fontes.corpo, fontWeight: 800, fontSize: 30, color: cores.texto, textTransform: "uppercase", letterSpacing: 2 }}>{th.rodape}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
