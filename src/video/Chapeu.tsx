import React from "react";
import { Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento, raio } from "../theme";
import { useFormato } from "../layout/useFormato";
import type { Episodio } from "../schema/episodio";
import type { TempoCena } from "../schema/timestamps";
import { corDoPersonagem } from "../personagens/Personagem";

/**
 * "Chapéu" de telejornal: etiqueta fixa no canto superior esquerdo com a seção (bloco) em curso
 * e, quando houver, a rubrica (de quem é o assunto, na cor do candidato).
 * Fica fora das cenas: não acompanha câmera nem transição, e só reanima quando a seção muda.
 * Some nas cenas de abertura de seção (o card de seção já diz o título) e no gancho.
 */
const Etiqueta: React.FC<{ texto: string; numero?: string }> = ({ texto, numero }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { area, seloY, t } = useFormato();
  const k = spring({ frame: f, fps, config: movimento.entrada });
  return (
    <div style={{ position: "absolute", left: area.x, top: seloY, display: "flex", alignItems: "center", gap: 10, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
      {numero ? (
        <span style={{ background: cores.acento, color: cores.contorno, fontFamily: fontes.display, fontSize: t.legenda * 1.5, borderRadius: raio.pequeno, padding: "2px 12px" }}>{numero}</span>
      ) : null}
      <span style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda * 1.3, color: cores.texto, letterSpacing: 2, textTransform: "uppercase" }}>{texto}</span>
    </div>
  );
};

const Rubrica: React.FC<{ texto: string; cor?: string; deslocX: number }> = ({ texto, cor, deslocX }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { area, seloY, t } = useFormato();
  const k = spring({ frame: f - 4, fps, config: movimento.pop });
  return (
    <div style={{ position: "absolute", left: area.x + deslocX, top: seloY + t.legenda * 2.6, opacity: k, transform: `scale(${0.8 + 0.2 * k})`, transformOrigin: "0 50%" }}>
      <span
        style={{
          background: cor ?? cores.superficieAlta,
          color: cor ? "#FFFFFF" : cores.texto,
          fontFamily: fontes.corpo,
          fontWeight: 800,
          fontSize: t.legenda * 1.15,
          borderRadius: raio.chip,
          padding: "4px 14px",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {texto}
      </span>
    </div>
  );
};

/** Número da seção: o rótulo do bloco começa com "N. Título". */
const separar = (bloco: string) => {
  const m = bloco.match(/^(\d+)\.\s*(.*)$/);
  return m ? { numero: m[1], titulo: m[2] } : { numero: undefined, titulo: bloco };
};

export const Chapeu: React.FC<{ episodio: Episodio; tempos: TempoCena[] }> = ({ episodio, tempos }) => {
  const { formato } = useFormato();
  // no vertical a faixa do topo é da plataforma; os Shorts saem por bloco, então o chapéu não é necessário
  if (formato === "vertical") return null;
  const cenas = episodio.cenas.map((c, i) => ({ c, t: tempos[i] }));
  // faixas contíguas de cenas do mesmo bloco, ignorando gancho e cartões de seção
  const faixas: { bloco: string; ini: number; fim: number }[] = [];
  for (const { c, t } of cenas) {
    if (!c.bloco || c.tipo === "secao" || c.tipo === "gancho") continue;
    const ult = faixas[faixas.length - 1];
    if (ult && ult.bloco === c.bloco && ult.fim === t.inicioFrame) ult.fim = t.inicioFrame + t.duracaoFrames;
    else faixas.push({ bloco: c.bloco, ini: t.inicioFrame, fim: t.inicioFrame + t.duracaoFrames });
  }
  return (
    <>
      {faixas.map((fx) => {
        const { numero, titulo } = separar(fx.bloco);
        return (
          <Sequence key={fx.bloco + fx.ini} from={fx.ini} durationInFrames={fx.fim - fx.ini} layout="none">
            <Etiqueta texto={titulo} numero={numero} />
          </Sequence>
        );
      })}
      {cenas.map(({ c, t }) =>
        c.rubrica && c.tipo !== "secao" ? (
          <Sequence key={"rub-" + c.id} from={t.inicioFrame} durationInFrames={t.duracaoFrames} layout="none">
            <Rubrica
              texto={c.rubrica.texto}
              cor={c.rubrica.personagemId ? corDoPersonagem(episodio.personagens.find((p) => p.id === c.rubrica!.personagemId)?.cor ?? "") : undefined}
              deslocX={0}
            />
          </Sequence>
        ) : null,
      )}
    </>
  );
};
