import React, { useContext } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, coresGenericas, coresPartido, coresPersonagem, fontes, movimento } from "../theme";
import type { Acao, Personagem as PersonagemDados } from "../schema/episodio";
import type { Palavra } from "../schema/timestamps";
import { Boneco, BONECO_H, BONECO_W } from "./Boneco";
import { ACOES_POSE } from "./acoes";
import { misturar } from "./pose";
import { aberturaBoca } from "./useLipSync";
import { uriBandeira } from "../mundo/Mundo";
import { MovimentoCena } from "../movimento/plano";
import { useVariante } from "../movimento/vida";
import { hash } from "../movimento/aleatorio";

const paletas: Record<string, string> = { ...coresPersonagem, ...coresGenericas, ...coresPartido };

/** Resolve a cor: chave de paleta (ciano, PT, cidadao…) ou CSS literal. */
export const corDoPersonagem = (cor: string) => paletas[cor] ?? cor;



export type PersonagemProps = {
  dados: Pick<PersonagemDados, "id" | "rotulo" | "numero" | "cor" | "roupa" | "idade" | "acessorio" | "pais">;
  acao: Acao;
  /** altura em px do boneco (sem o rótulo) */
  altura: number;
  /** +1 se o centro do palco está à direita do personagem, -1 se à esquerda */
  ladoCentro?: 1 | -1;
  /** palavras da narração (tempo relativo à Sequence) para sincronizar a boca */
  palavras?: Palavra[];
  fala?: boolean;
  /** frame (relativo) em que a ação começa; antes disso fica em idle */
  inicioAcao?: number;
  mostrarRotulo?: boolean;
  /** sobrescreve o acessório do registro nesta cena */
  acessorio?: PersonagemDados["acessorio"];
};

/** Boneco + rótulo. Entrada com spring, transição idle→ação suave, boca sincronizada se `fala`. */
export const Personagem: React.FC<PersonagemProps> = ({
  dados,
  acao,
  altura,
  ladoCentro = 1,
  palavras,
  fala,
  inicioAcao = 0,
  mostrarRotulo = true,
  acessorio,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // semente por personagem + cena: estilo de gesto e microgestos variam de cena para cena
  const { semente: sementeCena } = useContext(MovimentoCena);
  const ctx = { f, fps, semente: hash(sementeCena + ":" + dados.id) % 997, ladoCentro };
  const fa = Math.max(0, f - inicioAcao);
  const k = f < inicioAcao ? 0 : spring({ frame: fa, fps, config: movimento.entradaSuave });
  let pose = misturar(ACOES_POSE.idle(ctx), ACOES_POSE[acao]({ ...ctx, f: fa }), k);
  if (fala && palavras?.length) pose = { ...pose, boca: Math.max(pose.boca, aberturaBoca(palavras, f / fps)) };
  // piscada periódica, desfasada por personagem
  const ciclo = (f + ctx.semente * 7) % 110;
  if (ciclo < 4 && pose.olhos > 0.5) pose = { ...pose, olhos: 0.1 };
  const entrada = spring({ frame: f, fps, config: movimento.entrada });
  // entrada do boneco (4 variantes): sobe, chega pelo lado, cai com quique, surge em escala
  const vEntrada = useVariante("boneco-entrada:" + dados.id, ["subir", "lado", "cair", "surgir"] as const);
  const q = 1 - entrada;
  const estiloEntradaBoneco: React.CSSProperties =
    vEntrada === "subir"
      ? { transform: `translateY(${q * 120}px)`, opacity: entrada }
      : vEntrada === "lado"
        ? { transform: `translateX(${-q * 160 * ladoCentro}px)`, opacity: entrada }
        : vEntrada === "cair"
          ? { transform: `translateY(${-q * 160}px)`, opacity: Math.min(1, entrada * 2) }
          : { transform: `scale(${0.6 + 0.4 * entrada})`, transformOrigin: "50% 100%", opacity: entrada };
  const cor = corDoPersonagem(dados.cor);
  const largura = (altura * BONECO_W) / BONECO_H;
  return (
    <div
      style={{
        width: largura,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...estiloEntradaBoneco,
      }}
    >
      <div style={{ width: largura, height: altura }}>
        <Boneco pose={pose} numero={dados.numero} cor={cor} roupa={dados.roupa} idade={dados.idade} acessorio={acessorio ?? dados.acessorio} bandeira={dados.pais ? uriBandeira(dados.pais) : undefined} />
      </div>
      {mostrarRotulo ? (
        <div
          style={{
            marginTop: altura * 0.02,
            background: cores.superficie,
            border: `3px solid ${cor}`,
            borderRadius: 999,
            padding: `${altura * 0.012}px ${altura * 0.04}px`,
            fontFamily: fontes.corpo,
            fontWeight: 800,
            fontSize: Math.max(18, altura * 0.05),
            color: cores.texto,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {dados.rotulo}
        </div>
      ) : null}
    </div>
  );
};
