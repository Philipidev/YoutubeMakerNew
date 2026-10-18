import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import "../fontes";
import { cores, fontes } from "../theme";
import { Fundo } from "../video/Fundo";
import { Personagem } from "../personagens/Personagem";

/**
 * Arte do canal (YouTube):
 * - Banner 2560×1440. Área segura que aparece em TODOS os aparelhos: 1546×423 no centro.
 *   Nome e slogan ficam dentro dela; o resto é decorativo (TV mostra a imagem inteira).
 * - Avatar 800×800, exibido em círculo.
 * Personagens genéricos (sem número e sem cor de partido): o canal não é de nenhum candidato.
 */
export const CanalSchema = z.object({ nome: z.string(), slogan: z.string() });

const CIDADAO_A = { id: "canal-a", rotulo: "", numero: "", cor: "cidadao", roupa: "simples" as const };
const CIDADAO_B = { id: "canal-b", rotulo: "", numero: "", cor: "servidor", roupa: "camisa" as const };
const CIDADAO_C = { id: "canal-c", rotulo: "", numero: "", cor: "neutro", roupa: "terno" as const };

export const BannerCanal: React.FC<z.infer<typeof CanalSchema>> = ({ nome, slogan }) => {
  const W = 2560;
  const SEGURA = { w: 1546, h: 423 };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fundo />
      {/* faixas decorativas fora da área segura */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1440 / 2 + SEGURA.h / 2 + 30, height: 10, background: cores.acento, opacity: 0.85 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1440 / 2 - SEGURA.h / 2 - 40, height: 4, background: cores.linha }} />
      {/* bonecos genéricos nas laterais (fora da área segura no celular; visíveis no desktop/TV) */}
      <div style={{ position: "absolute", left: W / 2 - SEGURA.w / 2 - 420, top: 1440 / 2 - 330 }}>
        <Personagem dados={CIDADAO_A} acao="acenar" altura={640} ladoCentro={1} mostrarRotulo={false} semente={3} piscar={false} />
      </div>
      <div style={{ position: "absolute", left: W / 2 + SEGURA.w / 2 + 70, top: 1440 / 2 - 330 }}>
        <Personagem dados={CIDADAO_C} acao="apontar" altura={640} ladoCentro={-1} mostrarRotulo={false} semente={3} piscar={false} />
      </div>
      {/* área segura */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - SEGURA.w / 2,
          top: 1440 / 2 - SEGURA.h / 2,
          width: SEGURA.w,
          height: SEGURA.h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div style={{ fontFamily: fontes.display, fontSize: 168, color: cores.texto, lineHeight: 0.95, textTransform: "uppercase", textShadow: "0 8px 0 #000" }}>{nome}</div>
        <div style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: 46, color: cores.acento, letterSpacing: 2 }}>{slogan}</div>
      </div>
    </AbsoluteFill>
  );
};

export const AvatarCanal: React.FC<z.infer<typeof CanalSchema>> = ({ nome }) => {
  const sigla = nome
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁ-Ú]/.test(p))
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <AbsoluteFill style={{ background: cores.fundo }}>
      {/* círculo de destaque (o YouTube recorta em círculo) */}
      <div style={{ position: "absolute", inset: 40, borderRadius: "50%", background: cores.acento }} />
      <div style={{ position: "absolute", left: 400 - 230, top: 150 }}>
        <Personagem dados={CIDADAO_B} acao="sorrir" altura={830} ladoCentro={1} mostrarRotulo={false} semente={5} piscar={false} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 165,
          top: 150,
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: cores.fundo,
          border: `10px solid ${cores.texto}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontes.display,
          fontSize: 96,
          color: cores.texto,
        }}
      >
        {sigla}
      </div>
    </AbsoluteFill>
  );
};
