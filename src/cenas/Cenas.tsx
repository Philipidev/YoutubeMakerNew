import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cores, fontes, movimento } from "../theme";
import { useFormato } from "../layout/useFormato";
import type { Cena } from "../schema/episodio";
import type { CenaProps } from "../video/CenaRouter";
import { CenarioFundo, Palco } from "../cenarios/Palco";
import {
  CardCitacao,
  CardEncerramento,
  CardFato,
  CardLadoALadoB,
  CardNaoSeSabe,
  FonteLowerThird,
  GraficoPesquisa,
  LinhaDoTempo,
} from "../cards/Cards";
import { Card, Chip, Rotulo, TextoPop, useSaida } from "../cards/ui";
import { Personagem, corDoPersonagem } from "../personagens/Personagem";
import { GraficoBarras, GraficoLinha, GraficoRosca, MapaDados, Pictograma, PiramideEtaria } from "../graficos/Graficos";

type P<T extends Cena["tipo"]> = CenaProps<Extract<Cena, { tipo: T }>>;

/** Câmera viva: zoom lento em toda cena + saída suave. */
const Camera: React.FC<{ duracao: number; children: React.ReactNode }> = ({ duracao, children }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, duracao], [movimento.zoomLento.de, movimento.zoomLento.ate]);
  const saida = useSaida(duracao);
  return <AbsoluteFill style={{ transform: `scale(${z})`, opacity: 0.25 + 0.75 * saida }}>{children}</AbsoluteFill>;
};

/** Área de conteúdo acima do palco (ou a tela útil inteira, sem personagens). */
const AreaConteudo: React.FC<{ comPalco: boolean; children: React.ReactNode; centralizar?: boolean; semZoom?: boolean }> = ({ comPalco, children, centralizar = true, semZoom }) => {
  const { height, area, palcoY, alturaBoneco, formato } = useFormato();
  // sem palco, o card ocupa a tela: escala maior no vertical para não sobrar vazio
  const zoom = !comPalco && !semZoom && formato === "vertical" ? 1.3 : 1;
  const topo = height * (formato === "vertical" ? 0.1 : 0.12);
  const fim = comPalco ? palcoY - alturaBoneco - 24 : area.y + area.h;
  return (
    <div style={{ position: "absolute", left: area.x, width: area.w, top: topo, height: fim - topo, display: "flex", flexDirection: "column", justifyContent: centralizar ? "center" : "flex-start" }}>
      <div style={{ zoom }}>{children}</div>
    </div>
  );
};

type Item = { tipo: "fato"; fato: NonNullable<Cena["fatos"]>[number] } | { tipo: "citacao"; a: NonNullable<Cena["atribuicoes"]>[number] };

/** Fatos e citações da cena, um de cada vez, com tempo igual (mudança visual a cada 2–3 s). */
const SequenciaItens: React.FC<{ cena: Cena; props: CenaProps; comPalco: boolean }> = ({ cena, props, comPalco }) => {
  const itens: Item[] = [
    ...(cena.fatos ?? []).map((fato) => ({ tipo: "fato" as const, fato })),
    ...(cena.atribuicoes ?? []).map((a) => ({ tipo: "citacao" as const, a })),
  ];
  if (!itens.length) return null;
  const dur = Math.ceil(props.duracaoFrames / itens.length);
  return (
    <>
      {itens.map((it, i) => {
        const fonteIds = it.tipo === "fato" ? it.fato.fonteIds : [it.a.fonteId];
        const p = it.tipo === "citacao" ? props.episodio.personagens.find((x) => x.id === it.a.quem) : undefined;
        return (
          <Sequence key={i} from={i * dur} durationInFrames={i === itens.length - 1 ? props.duracaoFrames - i * dur : dur} layout="none">
            <AreaConteudo comPalco={comPalco}>
              {it.tipo === "fato" ? (
                <CardFato fato={it.fato} episodio={props.episodio} />
              ) : (
                <CardCitacao quem={p?.rotulo ?? it.a.quem} disse={it.a.disse} cor={p ? corDoPersonagem(p.cor) : undefined} />
              )}
            </AreaConteudo>
            <FonteLowerThird episodio={props.episodio} fonteIds={fonteIds} status={it.tipo === "fato" ? it.fato.status : undefined} />
          </Sequence>
        );
      })}
    </>
  );
};

const temPalco = (c: Cena) => (c.personagens?.length ?? 0) > 0;

export const CenaGancho: React.FC<P<"gancho">> = (props) => {
  const { cena, duracaoFrames } = props;
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = useFormato();
  const punch = spring({ frame: f, fps, config: movimento.pop });
  const comPalco = temPalco(cena);
  return (
    <Camera duracao={duracaoFrames}>
      <CenarioFundo id={cena.cenario} opcoes={cena.cenarioOpcoes} />
      {comPalco ? <Palco cena={cena} episodio={props.episodio} palavras={props.palavras} /> : null}
      <AreaConteudo comPalco={comPalco}>
        <div style={{ transform: `scale(${1.25 - 0.25 * punch})` }}>
          {cena.dados.destaque ? <Chip>{cena.dados.destaque}</Chip> : null}
          <TextoPop
            texto={cena.dados.manchete}
            passo={2}
            style={{ fontFamily: fontes.display, fontSize: t.manchete * 1.15, color: cores.texto, lineHeight: 1.02, marginTop: 18, textTransform: "uppercase" }}
          />
          <div style={{ height: 14, width: `${interpolate(f, [8, 30], [0, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`, background: cores.acento, borderRadius: 7, marginTop: 18 }} />
        </div>
      </AreaConteudo>
      {cena.fatos?.[0] ? <FonteLowerThird episodio={props.episodio} fonteIds={cena.fatos[0].fonteIds} status={cena.fatos[0].status} /> : null}
    </Camera>
  );
};

export const CenaFato: React.FC<P<"fato">> = (props) => {
  const { cena } = props;
  const comPalco = temPalco(cena);
  return (
    <Camera duracao={props.duracaoFrames}>
      <CenarioFundo id={cena.cenario} opcoes={{ ...cena.cenarioOpcoes, ufs: cena.dados?.ufs ?? cena.cenarioOpcoes?.ufs, rotulo: cena.dados?.rotuloCenario ?? cena.cenarioOpcoes?.rotulo }} />
      {comPalco ? <Palco cena={cena} episodio={props.episodio} palavras={props.palavras} /> : null}
      {cena.cenario && cena.cenario !== "neutro" && !comPalco ? (
        <SequenciaItensRodape cena={cena} props={props} />
      ) : (
        <SequenciaItens cena={cena} props={props} comPalco={comPalco} />
      )}
    </Camera>
  );
};

export const CenaContexto: React.FC<P<"contexto">> = (props) => {
  const { cena } = props;
  const { t } = useFormato();
  const comPalco = temPalco(cena);
  const numero = cena.dados?.numero;
  // com número: número ocupa a primeira metade, depois fatos/citações
  const meio = numero ? Math.round(props.duracaoFrames * 0.45) : 0;
  return (
    <Camera duracao={props.duracaoFrames}>
      <CenarioFundo id={cena.cenario} opcoes={cena.cenarioOpcoes} />
      {comPalco ? <Palco cena={cena} episodio={props.episodio} palavras={props.palavras} /> : null}
      {numero ? (
        <Sequence durationInFrames={meio || 1} layout="none">
          <AreaConteudo comPalco={comPalco}>
            <div style={{ textAlign: "center" }}>
              <TextoPop texto={numero} style={{ fontFamily: fontes.display, fontSize: t.numero, color: cores.acento, lineHeight: 1 }} />
              {cena.dados?.rotulo ? <TextoPop texto={cena.dados.rotulo} atraso={8} style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.destaque, color: cores.texto, marginTop: 10 }} /> : null}
            </div>
          </AreaConteudo>
          {cena.fatos?.[0] ? <FonteLowerThird episodio={props.episodio} fonteIds={cena.fatos[0].fonteIds} /> : null}
        </Sequence>
      ) : null}
      <Sequence from={meio} layout="none">
        <SequenciaItens cena={cena} props={{ ...props, duracaoFrames: props.duracaoFrames - meio }} comPalco={comPalco} />
      </Sequence>
    </Camera>
  );
};

export const CenaLinhaDoTempo: React.FC<P<"linhaDoTempo">> = (props) => {
  const { cena } = props;
  const { t } = useFormato();
  const ids = [...new Set(cena.dados.eventos.flatMap((e) => e.fonteIds))];
  return (
    <Camera duracao={props.duracaoFrames}>
      <AreaConteudo comPalco={false}>
        <Rotulo>Linha do tempo</Rotulo>
        <div style={{ height: 20 }} />
        <div style={{ fontSize: t.corpo }}>
          <LinhaDoTempo cena={cena} duracao={props.duracaoFrames} />
        </div>
      </AreaConteudo>
      <FonteLowerThird episodio={props.episodio} fonteIds={ids.slice(0, 3)} />
    </Camera>
  );
};

export const CenaLadoALadoB: React.FC<P<"ladoA_ladoB">> = (props) => {
  const { cena } = props;
  const { area, height, formato } = useFormato();
  const topo = height * (formato === "vertical" ? 0.1 : 0.12);
  return (
    <Camera duracao={props.duracaoFrames}>
      <div style={{ position: "absolute", left: area.x, width: area.w, top: topo, height: area.y + area.h - topo }}>
        <CardLadoALadoB cena={cena} episodio={props.episodio} duracao={props.duracaoFrames} />
      </div>
    </Camera>
  );
};

export const CenaPesquisa: React.FC<P<"pesquisa">> = (props) => (
  <Camera duracao={props.duracaoFrames}>
    <AreaConteudo comPalco={false}>
      <GraficoPesquisa cena={props.cena} episodio={props.episodio} />
    </AreaConteudo>
  </Camera>
);

/**
 * Debate. Com atribuições de personagens em cena, vira debate dinâmico: cada fala ganha o mesmo tempo,
 * quem fala aparece falando/apontando e o outro escuta. O balão mostra o que foi dito, com fonte.
 */
export const CenaDebate: React.FC<P<"debate">> = (props) => {
  const { cena } = props;
  const { fps } = useVideoConfig();
  const c = { ...cena, cenario: cena.cenario ?? ("pulpitos" as const) };
  const presentes = new Set((cena.personagens ?? []).map((p) => p.id));
  const falas = (cena.atribuicoes ?? []).filter((a) => presentes.has(a.quem));
  if (falas.length) {
    const dur = Math.ceil(props.duracaoFrames / falas.length);
    return (
      <Camera duracao={props.duracaoFrames}>
        <CenarioFundo id={c.cenario} opcoes={cena.cenarioOpcoes} />
        {falas.map((fala, i) => {
          const turno = {
            ...c,
            personagens: (c.personagens ?? []).map((p) =>
              p.id === fala.quem ? { ...p, acao: i % 2 ? ("apontar" as const) : ("falar" as const), fala: true } : { ...p, acao: "idle" as const, fala: false },
            ),
          };
          const quem = props.episodio.personagens.find((x) => x.id === fala.quem);
          const pos = c.personagens?.find((p) => p.id === fala.quem)?.posicao ?? "centro";
          const desloc = (i * dur) / fps;
          return (
            <Sequence key={i} from={i * dur} durationInFrames={i === falas.length - 1 ? props.duracaoFrames - i * dur : dur} layout="none">
              <Palco cena={turno} episodio={props.episodio} palavras={props.palavras.map((p) => ({ ...p, inicio: p.inicio - desloc, fim: p.fim - desloc }))} />
              <AreaConteudo comPalco>
                <BalaoFala lado={pos}>
                  <CardCitacao quem={quem?.rotulo ?? fala.quem} disse={fala.disse} cor={quem ? corDoPersonagem(quem.cor) : undefined} />
                </BalaoFala>
              </AreaConteudo>
              <FonteLowerThird episodio={props.episodio} fonteIds={[fala.fonteId]} />
            </Sequence>
          );
        })}
      </Camera>
    );
  }
  return (
    <Camera duracao={props.duracaoFrames}>
      <CenarioFundo id={c.cenario} opcoes={cena.cenarioOpcoes} />
      <Palco cena={c} episodio={props.episodio} palavras={props.palavras} ausentes={cena.dados?.ausentes} />
      {cena.dados?.titulo ? (
        <AreaConteudo comPalco>
          <TextoPop texto={cena.dados.titulo} style={{ fontFamily: fontes.display, fontSize: 84, color: cores.texto, textAlign: "center", lineHeight: 1.05 }} />
        </AreaConteudo>
      ) : (
        <SequenciaItens cena={cena} props={props} comPalco />
      )}
    </Camera>
  );
};

/** Balão: card com ponta voltada para quem fala. */
const BalaoFala: React.FC<{ lado: "esq" | "dir" | "centro"; children: React.ReactNode }> = ({ lado, children }) => (
  <div style={{ position: "relative" }}>
    {children}
    <div
      style={{
        position: "absolute",
        bottom: -26,
        left: lado === "esq" ? "22%" : lado === "dir" ? "72%" : "48%",
        width: 0,
        height: 0,
        borderLeft: "22px solid transparent",
        borderRight: "22px solid transparent",
        borderTop: "28px solid " + cores.superficie,
      }}
    />
  </div>
);

/** Propostas numeradas por personagem. Itens entram alternando os lados, no mesmo ritmo para todos. */
export const CenaPropostas: React.FC<P<"propostas">> = (props) => {
  const { cena, episodio } = props;
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t, formato } = useFormato();
  const lados = cena.dados.lados;
  const maxItens = Math.max(...lados.map((l) => l.propostas.length));
  const passo = Math.max(10, Math.floor((props.duracaoFrames * 0.75) / (maxItens * lados.length)));
  const ids = [...new Set(lados.flatMap((l) => l.propostas.map((p) => p.fonteId)))];
  return (
    <Camera duracao={props.duracaoFrames}>
      <AreaConteudo comPalco={false} centralizar={false}>
        <div style={{ fontFamily: fontes.display, fontSize: t.titulo, color: cores.texto, lineHeight: 1, marginBottom: 24 }}>{cena.dados.titulo}</div>
        <div style={{ display: "flex", flexDirection: formato === "vertical" ? "column" : "row", gap: 20 }}>
          {lados.map((l, li) => {
            const p = episodio.personagens.find((x) => x.id === l.personagemId);
            const cor = p ? corDoPersonagem(p.cor) : cores.textoSecundario;
            return (
              <Card key={l.personagemId} borda={cor} style={{ flex: 1, padding: 24, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {p ? <Personagem dados={p} acao="idle" altura={120} mostrarRotulo={false} /> : null}
                  <div style={{ fontFamily: fontes.display, fontSize: t.destaque, color: cores.texto, lineHeight: 1 }}>{p?.rotulo ?? l.personagemId}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                  {l.propostas.map((pr, i) => {
                    const k = spring({ frame: f - 8 - (i * lados.length + li) * passo, fps, config: movimento.entrada });
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, opacity: k, transform: "translateY(" + (1 - k) * 24 + "px)" }}>
                        <span
                          style={{
                            flexShrink: 0,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            background: cor,
                            color: cores.contorno,
                            fontFamily: fontes.display,
                            fontSize: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ fontFamily: fontes.corpo, fontWeight: 600, fontSize: t.corpo * 0.8, color: cores.texto, lineHeight: 1.25 }}>{pr.texto}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </AreaConteudo>
      <FonteLowerThird episodio={episodio} fonteIds={ids.slice(0, 3)} />
    </Camera>
  );
};

/** Cena de gráfico: escolhe o componente pelo tipo; a fonte do episódio vira rodapé. */
export const CenaGrafico: React.FC<P<"grafico">> = (props) => {
  const { cena, episodio } = props;
  const g = cena.dados;
  const fo = episodio.fontes.find((x) => x.id === g.fonteId);
  const fonte = fo ? fo.veiculo + " · " + fo.titulo : g.fonteId;
  const comum = { titulo: g.titulo, fonte, nota: g.nota };
  return (
    <Camera duracao={props.duracaoFrames}>
      <AreaConteudo comPalco={false} semZoom>
        {g.grafico === "barras" ? <GraficoBarras {...comum} unidade={g.unidade} pontos={g.pontos} /> : null}
        {g.grafico === "linha" ? <GraficoLinha {...comum} unidade={g.unidade} pontos={g.pontos} zeroNoEixo={g.zeroNoEixo} /> : null}
        {g.grafico === "piramide" ? <PiramideEtaria {...comum} faixas={g.faixas} /> : null}
        {g.grafico === "pictograma" ? <Pictograma {...comum} percentual={g.percentual} rotuloDestaque={g.rotuloDestaque} /> : null}
        {g.grafico === "rosca" ? <GraficoRosca {...comum} pontos={g.pontos} /> : null}
        {g.grafico === "mapa" ? <MapaDados {...comum} unidade={g.unidade} valores={g.valores} /> : null}
      </AreaConteudo>
      <FonteLowerThird episodio={episodio} fonteIds={[g.fonteId]} />
    </Camera>
  );
};

export const CenaVotacao: React.FC<P<"votacao">> = (props) => {
  const { cena } = props;
  const f = useCurrentFrame();
  const { t } = useFormato();
  const d = cena.dados;
  const cenario = cena.cenario ?? (d.casa === "senado" ? "plenarioSenado" : d.casa === "camara" ? "plenarioCamara" : d.casa === "stf" || d.casa === "tse" ? "tribunal" : "urna");
  const conta = (n: number) => Math.round(n * interpolate(f, [10, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const temItens = (cena.fatos?.length ?? 0) + (cena.atribuicoes?.length ?? 0) > 0;
  return (
    <Camera duracao={props.duracaoFrames}>
      <CenarioFundo id={cenario} placar={d.placar} opcoes={{ rotulo: d.casa === "stf" || d.casa === "tse" ? d.orgao : undefined, ...cena.cenarioOpcoes }} />
      <AreaConteudo comPalco centralizar={false}>
        <Card style={{ padding: 30 }}>
          <Rotulo>{d.orgao}</Rotulo>
          {d.etapa ? <div style={{ fontFamily: fontes.display, fontSize: t.titulo * 0.8, color: cores.texto, marginTop: 8, lineHeight: 1.05 }}>{d.etapa}</div> : null}
          {d.placar ? (
            <div style={{ display: "flex", gap: 30, marginTop: 16 }}>
              {(
                [
                  ["sim", d.placar.sim, cores.status.confirmado],
                  ["não", d.placar.nao, cores.status.divergente],
                  ["abst.", d.placar.abst, cores.status.naoSeSabe],
                ] as const
              ).map(([n, v, c]) => (
                <div key={n} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fontes.display, fontSize: t.titulo, color: c }}>{conta(v)}</div>
                  <div style={{ fontFamily: fontes.corpo, fontWeight: 800, fontSize: t.legenda, color: cores.textoSecundario, textTransform: "uppercase" }}>{n}</div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </AreaConteudo>
      {temItens ? (
        <Sequence from={Math.round(props.duracaoFrames * 0.35)} layout="none">
          <SequenciaItensRodape cena={cena} props={{ ...props, duracaoFrames: Math.round(props.duracaoFrames * 0.65) }} />
        </Sequence>
      ) : null}
    </Camera>
  );
};

/** Variante dos itens para cenas com cenário grande: só o selo de fonte + citação compacta no rodapé útil. */
const SequenciaItensRodape: React.FC<{ cena: Cena; props: CenaProps }> = ({ cena, props }) => {
  const { area, palcoY } = useFormato();
  const itens = [...(cena.fatos ?? []).map((f) => ({ texto: f.texto, ids: f.fonteIds })), ...(cena.atribuicoes ?? []).map((a) => ({ texto: `${a.quem}: “${a.disse}”`, ids: [a.fonteId] }))];
  const dur = Math.ceil(props.duracaoFrames / Math.max(1, itens.length));
  return (
    <>
      {itens.map((it, i) => (
        <Sequence key={i} from={i * dur} durationInFrames={dur} layout="none">
          <div style={{ position: "absolute", left: area.x, width: area.w, top: palcoY + 10 }}>
            <Card style={{ padding: "18px 26px" }}>
              <TextoPop texto={it.texto} passo={1} style={{ fontFamily: fontes.corpo, fontWeight: 700, fontSize: 40, color: cores.texto, lineHeight: 1.25 }} />
            </Card>
          </div>
          <FonteLowerThird episodio={props.episodio} fonteIds={it.ids} />
        </Sequence>
      ))}
    </>
  );
};

export const CenaNaoSeSabe: React.FC<P<"naoSeSabe">> = (props) => (
  <Camera duracao={props.duracaoFrames}>
    <AreaConteudo comPalco={false}>
      <CardNaoSeSabe itens={props.cena.dados.itens} duracao={props.duracaoFrames} />
    </AreaConteudo>
  </Camera>
);

export const CenaEncerramento: React.FC<P<"encerramento">> = (props) => (
  <Camera duracao={props.duracaoFrames}>
    <AreaConteudo comPalco={false}>
      <CardEncerramento episodio={props.episodio} />
    </AreaConteudo>
  </Camera>
);
