import { describe, expect, it } from "vitest";
import { extenso, falarToken, prepararFala } from "../src/pipeline/narracao/normalizar";

describe("números por extenso (pt-BR)", () => {
  it.each([
    [0, "zero"], [13, "treze"], [21, "vinte e um"], [100, "cem"], [101, "cento e um"], [461, "quatrocentos e sessenta e um"],
    [513, "quinhentos e treze"], [1000, "mil"], [2018, "dois mil e dezoito"], [2026, "dois mil e vinte e seis"],
    [2520, "dois mil quinhentos e vinte"], [2154, "dois mil cento e cinquenta e quatro"], [1500, "mil e quinhentos"],
  ])("%i → %s", (n, s) => expect(extenso(n)).toBe(s));
});

describe("tokens falados", () => {
  it.each([
    ["47,03%", "quarenta e sete vírgula zero três por cento"],
    ["45,16%.", "quarenta e cinco vírgula dezesseis por cento."],
    ["51,2%", "cinquenta e um vírgula dois por cento"],
    ["47%", "quarenta e sete por cento"],
    ["18/10", "dezoito de outubro"],
    ["1º", "primeiro"],
    ["20h.", "vinte horas."],
    ["6x1", "seis por um"],
    ["12,6", "doze vírgula seis"],
    ["2.520", "dois mil quinhentos e vinte"],
    ["TSE”.", "tê-esse-é”."],
    ["STF,", "esse-tê-éfe,"],
    ["CNT/MDA,", "cê-ene-tê eme-dê-á,"],
    ["Lula", "Lula"],
  ])("%s → %s", (t, s) => expect(falarToken(t)).toBe(s));
});

describe("prepararFala", () => {
  it("mantém o intervalo de cada token original no texto falado", () => {
    const tokens = ["Flávio", "teve", "47,03%", "dos", "votos."];
    const { texto, spans } = prepararFala(tokens);
    expect(texto).toBe("Flávio teve quarenta e sete vírgula zero três por cento dos votos.");
    expect(texto.slice(...spans[2])).toBe("quarenta e sete vírgula zero três por cento");
    expect(texto.slice(...spans[4])).toBe("votos.");
  });

  it("R$ com escala vira '... de reais'", () => {
    const { texto } = prepararFala(["perdão", "de", "R$", "12,6", "bilhões."]);
    expect(texto).toBe("perdão de doze vírgula seis bilhões de reais.");
  });
});
