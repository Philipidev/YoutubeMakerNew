import { describe, expect, it } from "vitest";
import { palavrasDeCaracteres, alinharRoteiro } from "../src/pipeline/narracao/alinhamento";
import { estimarTimestamps } from "../src/pipeline/narracao/estimativa";
import { gerarBlocos, MAX_CHARS_LINHA, MAX_LINHAS } from "../src/pipeline/legenda-blocos";
import { gerarSrt } from "../src/pipeline/legenda";
import { validarEpisodio } from "../src/pipeline/validar";
import { calcularTempos } from "../src/pipeline/duracoes";
import { planejarMovimento } from "../src/movimento/plano";
import { EpisodioSchema } from "../src/schema/episodio";

const alinhamentoFalso = (texto: string, dur = 0.05) => ({
  characters: [...texto],
  character_start_times_seconds: [...texto].map((_, i) => i * dur),
  character_end_times_seconds: [...texto].map((_, i) => (i + 1) * dur),
});

describe("alinhamento ElevenLabs (caractere → palavra)", () => {
  it("usa os tokens exatos do roteiro e os tempos do primeiro/último caractere", () => {
    const texto = "Lula assinou a MP, segundo o Planalto.";
    const p = palavrasDeCaracteres(texto, alinhamentoFalso(texto), 10);
    expect(p.map((x) => x.texto)).toEqual(["Lula", "assinou", "a", "MP,", "segundo", "o", "Planalto."]);
    expect(p[0].inicio).toBeCloseTo(10);
    expect(p[0].fim).toBeCloseTo(10 + 4 * 0.05);
    expect(p[1].inicio).toBeCloseTo(10 + 5 * 0.05);
  });

  it("tolera alinhamento com caracteres diferentes do texto", () => {
    const texto = "Fim da escala 6x1.";
    const al = alinhamentoFalso("Fim da escala seis por um.");
    const p = palavrasDeCaracteres(texto, al);
    expect(p).toHaveLength(4);
    expect(p.every((x) => Number.isFinite(x.inicio) && x.fim >= x.inicio)).toBe(true);
  });
});

describe("alinhamento Whisper (roteiro × reconhecido)", () => {
  it("casa palavras iguais e interpola as que o Whisper errou", () => {
    const tokens = ["O", "Flávio", "Bolsonaro", "criticou", "a", "MP."];
    const rec = [
      { palavra: "O", inicio: 0, fim: 0.1 },
      { palavra: "Flavio", inicio: 0.1, fim: 0.5 },
      { palavra: "Bolsonaro", inicio: 0.5, fim: 1.0 },
      { palavra: "criticou", inicio: 1.0, fim: 1.5 },
      { palavra: "a", inicio: 1.5, fim: 1.6 },
      { palavra: "emepê", inicio: 1.6, fim: 2.0 },
    ];
    const p = alinharRoteiro(tokens, rec);
    expect(p.map((x) => x.texto)).toEqual(tokens);
    expect(p[1].inicio).toBe(0.1); // acento ignorado na comparação
    expect(p[5].inicio).toBeGreaterThanOrEqual(1.6);
    for (let i = 1; i < p.length; i++) expect(p[i].inicio).toBeGreaterThanOrEqual(p[i - 1].inicio);
  });
});

describe("legenda", () => {
  const ts = estimarTimestamps([
    { id: "a", narracao: "A medida provisória proíbe a exploração, a oferta, a intermediação e a publicidade de apostas de quota fixa em todo o território nacional." },
    { id: "b", narracao: "Segundo o governo, a decisão responde ao endividamento das famílias." },
  ]);

  it("respeita 42 caracteres por linha e 2 linhas por bloco", () => {
    for (const b of gerarBlocos(ts)) {
      expect(b.linhas.length).toBeLessThanOrEqual(MAX_LINHAS);
      for (const l of b.linhas) expect(l.length).toBeLessThanOrEqual(MAX_CHARS_LINHA);
    }
  });

  it("preserva o texto exato da narração", () => {
    const texto = gerarBlocos(ts).flatMap((b) => b.linhas).join(" ");
    expect(texto).toBe(ts.cenas.map((c) => c.palavras.map((p) => p.texto).join(" ")).join(" "));
  });

  it("blocos em ordem e sem sobreposição", () => {
    const bs = gerarBlocos(ts);
    for (let i = 1; i < bs.length; i++) expect(bs[i].inicio).toBeGreaterThanOrEqual(bs[i - 1].fim);
    expect(gerarSrt(ts)).toMatch(/^1\n00:00:00,000 --> /);
  });
});

const base = {
  slug: "t",
  titulo: "T",
  dataPublicacao: "2026-10-17",
  resumo: "r",
  fontes: [{ id: "f1", veiculo: "V", titulo: "T", url: "https://example.com", data: "2026-10-17", tipo: "primaria" }],
  personagens: [
    { id: "a", rotulo: "A", numero: "13", cor: "PT", partido: "PT" },
    { id: "b", rotulo: "B", numero: "22", cor: "PL", partido: "PL" },
  ],
};
const fim = { id: "fim", tipo: "encerramento", narracao: "Fontes na descrição." };
const erros = (cenas: unknown[]) => validarEpisodio({ ...base, cenas: [...cenas, fim] }).problemas.filter((p) => p.nivel === "erro");

describe("validação editorial", () => {
  it("bloqueia adjetivo opinativo na voz do canal", () => {
    expect(erros([{ id: "g", tipo: "gancho", narracao: "Uma medida populista.", dados: { manchete: "x" } }])).not.toHaveLength(0);
  });

  it("aceita o mesmo termo atribuído a quem disse", () => {
    const c = {
      id: "g",
      tipo: "gancho",
      narracao: "Para a oposição, a medida é populista.",
      dados: { manchete: "x" },
      atribuicoes: [{ quem: "b", disse: "É populista", fonteId: "f1", termos: ["populista"] }],
    };
    expect(erros([c])).toHaveLength(0);
  });

  it("não confunde palavra que contém o termo (regulamentada ≠ lament)", () => {
    expect(erros([{ id: "g", tipo: "gancho", narracao: "A atividade foi regulamentada.", dados: { manchete: "x" } }])).toHaveLength(0);
  });

  it("bloqueia fato sem fonte, fonte inexistente, pedido de voto e previsão", () => {
    expect(erros([{ id: "f", tipo: "fato", narracao: "x", fatos: [{ texto: "x", fonteIds: ["nao-existe"] }] }])).not.toHaveLength(0);
    expect(erros([{ id: "g", tipo: "gancho", narracao: "Vote no dia 25.", dados: { manchete: "x" } }])).not.toHaveLength(0);
    expect(erros([{ id: "g", tipo: "gancho", narracao: "Ele vai ganhar a eleição.", dados: { manchete: "x" } }])).not.toHaveLength(0);
  });

  it("exige metodologia completa na pesquisa", () => {
    const r = validarEpisodio({
      ...base,
      cenas: [{ id: "p", tipo: "pesquisa", narracao: "x", dados: { instituto: "I", campo: { inicio: "2026-10-01", fim: "2026-10-02" }, registroTSE: "", margemErro: "2", resultados: [{ personagemId: "a", pct: 40 }] } }, fim],
    });
    expect(r.problemas.some((p) => p.nivel === "erro")).toBe(true);
  });

  it("avisa assimetria de cor de partido", () => {
    const r = validarEpisodio({ ...base, personagens: [base.personagens[0], { ...base.personagens[1], cor: "ciano" }], cenas: [fim] });
    expect(r.problemas.some((p) => p.msg.includes("simetria de cor"))).toBe(true);
  });
});

describe("tempos e movimento", () => {
  it("durações vêm do áudio e cobrem a narração inteira", () => {
    const ts = estimarTimestamps([
      { id: "a", narracao: "Primeira cena curta." },
      { id: "b", narracao: "Segunda cena um pouco mais longa que a primeira." },
    ]);
    const t = calcularTempos(ts);
    expect(t[0].inicioFrame).toBe(0);
    expect(t[1].inicioFrame).toBe(t[0].duracaoFrames);
    expect((t[1].inicioFrame + t[1].duracaoFrames) / 30).toBeGreaterThanOrEqual(ts.duracaoSeg);
  });

  it("plano de movimento é determinístico e não repete família de transição seguida", () => {
    const ep = EpisodioSchema.parse({
      ...base,
      cenas: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, tipo: "naoSeSabe", narracao: "x", dados: { itens: ["y"] } })).concat([fim as never]),
    });
    const p1 = planejarMovimento(ep);
    const p2 = planejarMovimento(ep);
    expect(p1).toEqual(p2);
    const fam = (t: string) => (/slide|push/.test(t) ? "desliza" : /wipe|iris/.test(t) ? "mascara" : /dissolve|flash/.test(t) ? "fade" : t);
    for (let i = 1; i < p1.length; i++) expect(fam(p1[i].entrada)).not.toBe(fam(p1[i - 1].entrada));
    for (let i = 1; i < p1.length; i++) expect(p1[i].camera).not.toBe(p1[i - 1].camera);
  });
});
