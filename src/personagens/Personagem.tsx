import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, coresPersonagem, fontes, movimento, type CorPersonagem } from "../theme";
import type { Acao, Personagem as PersonagemDados } from "../schema/episodio";
import type { Palavra } from "../schema/timestamps";
import { Boneco, BONECO_H, BONECO_W } from "./Boneco";
import { ACOES_POSE } from "./acoes";
import { misturar } from "./pose";
import { aberturaBoca } from "./useLipSync";

export const corDoPersonagem = (cor: string) =>
  cor in coresPersonagem ? coresPersonagem[cor as CorPersonagem] : cor;

const semente = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 17;

export type PersonagemProps = {
  dados: Pick<PersonagemDados, "id" | "rotulo" | "numero" | "cor">;
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
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctx = { f, fps, semente: semente(dados.id), ladoCentro };
  const fa = Math.max(0, f - inicioAcao);
  const k = f < inicioAcao ? 0 : spring({ frame: fa, fps, config: movimento.entradaSuave });
  let pose = misturar(ACOES_POSE.idle(ctx), ACOES_POSE[acao]({ ...ctx, f: fa }), k);
  if (fala && palavras?.length) pose = { ...pose, boca: Math.max(pose.boca, aberturaBoca(palavras, f / fps)) };
  // piscada periódica, desfasada por personagem
  const ciclo = (f + ctx.semente * 7) % 110;
  if (ciclo < 4 && pose.olhos > 0.5) pose = { ...pose, olhos: 0.1 };
  const entrada = spring({ frame: f, fps, config: movimento.entrada });
  const cor = corDoPersonagem(dados.cor);
  const largura = (altura * BONECO_W) / BONECO_H;
  return (
    <div
      style={{
        width: largura,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `translateY(${(1 - entrada) * 120}px)`,
        opacity: entrada,
      }}
    >
      <div style={{ width: largura, height: altura }}>
        <Boneco pose={pose} numero={dados.numero} cor={cor} />
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
