/**
 * Normalização para fala em pt-BR (o que a voz deve LER). A legenda continua com o texto original.
 *
 * Trabalha token a token: cada palavra do roteiro vira um trecho falado, e guardamos o intervalo de
 * caracteres de cada uma no texto enviado. Assim os tempos do alinhamento voltam para as palavras
 * exatas do roteiro (a legenda mostra "47,03%", a voz diz "quarenta e sete vírgula zero três por cento").
 *
 * Pronúncia de siglas: biblioteca/pronuncia.json (sigla → como se fala).
 */
import pronunciaPadrao from "../../../biblioteca/pronuncia.json";

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const ate999 = (n: number): string => {
  if (n < 20) return UNIDADES[n];
  if (n < 100) return DEZENAS[Math.floor(n / 10)] + (n % 10 ? " e " + UNIDADES[n % 10] : "");
  if (n === 100) return "cem";
  return CENTENAS[Math.floor(n / 100)] + (n % 100 ? " e " + ate999(n % 100) : "");
};

/** Inteiro por extenso (até bilhões). Feminino opcional para "uma", "duas" (ex.: "duas horas"). */
export const extenso = (n: number, feminino = false): string => {
  if (n === 0) return "zero";
  const partes: string[] = [];
  const grupos: [number, string, string][] = [
    [1e9, "bilhão", "bilhões"],
    [1e6, "milhão", "milhões"],
    [1e3, "mil", "mil"],
  ];
  let resto = n;
  for (const [valor, sing, plur] of grupos) {
    const q = Math.floor(resto / valor);
    if (!q) continue;
    partes.push(valor === 1e3 && q === 1 ? "mil" : `${ate999(q)} ${q === 1 ? sing : plur}`);
    resto %= valor;
  }
  if (resto) partes.push(ate999(resto));
  // "e" antes do último grupo quando ele é < 100 ou centena redonda (ex.: "dois mil e vinte e seis")
  let txt = partes.length > 1 && (resto < 100 || resto % 100 === 0) && resto ? partes.slice(0, -1).join(" ") + " e " + partes[partes.length - 1] : partes.join(" ");
  if (feminino) txt = txt.replace(/\bum$/, "uma").replace(/\bdois$/, "duas").replace(/(\w+)entos\b/g, "$1entas");
  return txt;
};

/** "47,03" → "quarenta e sete vírgula zero três"; "12,6" → "doze vírgula seis". */
const decimal = (s: string, feminino = false): string => {
  const [int, dec] = s.replace(/\./g, "").split(",");
  const parteInt = extenso(parseInt(int, 10), feminino);
  if (!dec) return parteInt;
  // decimais com zero à esquerda são lidos dígito a dígito ("03" → "zero três"); senão, como número ("6" → "seis", "25" → "vinte e cinco")
  const parteDec = dec.startsWith("0") ? [...dec].map((d) => UNIDADES[+d]).join(" ") : extenso(parseInt(dec, 10));
  return `${parteInt} vírgula ${parteDec}`;
};

const ORDINAIS: Record<string, string> = { "1": "primeiro", "2": "segundo", "3": "terceiro", "4": "quarto", "5": "quinto", "6": "sexto", "7": "sétimo", "8": "oitavo", "9": "nono", "10": "décimo" };

type Regra = { re: RegExp; fala: (m: RegExpMatchArray) => string };

/** Regras por token (o token já vem sem a pontuação das pontas). */
const REGRAS: Regra[] = [
  // percentuais: 47,03% · 45%
  { re: /^(\d{1,3}(?:\.\d{3})*(?:,\d+)?)%$/, fala: (m) => `${decimal(m[1])} por cento` },
  // datas dd/mm(/aaaa)
  { re: /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/, fala: (m) => `${+m[1] === 1 ? "primeiro" : extenso(+m[1])} de ${MESES[+m[2] - 1]}${m[3] ? " de " + extenso(+m[3]) : ""}` },
  // horas: 20h · 19h30
  { re: /^(\d{1,2})h(\d{2})?$/, fala: (m) => `${extenso(+m[1], true)} hora${+m[1] === 1 ? "" : "s"}${m[2] ? " e " + extenso(+m[2]) : ""}` },
  // escala 6x1 → seis por um
  { re: /^(\d+)x(\d+)$/i, fala: (m) => `${extenso(+m[1])} por ${extenso(+m[2])}` },
  // ordinais: 1º, 2ª
  { re: /^(\d{1,2})[ºª°]$/, fala: (m) => ORDINAIS[m[1]] ?? extenso(+m[1]) },
  // anos (1900–2099) lidos como número normal
  // números com milhar/decimal: 2.520 · 12,6 · 2,6
  { re: /^(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)$/, fala: (m) => decimal(m[1]) },
  // inteiros simples
  { re: /^(\d+)$/, fala: (m) => extenso(+m[1]) },
];

export type Pronuncia = Record<string, string>;

/** Fala de um token isolado, preservando pontuação nas pontas (vírgula, ponto, aspas). */
export const falarToken = (tok: string, pronuncia: Pronuncia = pronunciaPadrao as Pronuncia): string => {
  const m = tok.match(/^([“"‘'(\[]*)(.*?)([”"’')\].,;:!?…]*)$/u);
  if (!m) return tok;
  const [, pre, nucleo, pos] = m;
  if (!nucleo) return tok;
  // sigla / termo do dicionário (casa exato e também com plural "s")
  if (pronuncia[nucleo]) return pre + pronuncia[nucleo] + pos;
  for (const r of REGRAS) {
    const x = nucleo.match(r.re);
    if (x) return pre + r.fala(x) + pos;
  }
  return tok;
};

/**
 * Prepara o texto de fala de uma lista de tokens.
 * Retorna o texto enviado à API e, para cada token original, o intervalo [inicio, fim) no texto enviado.
 * Regras de contexto: "R$ 12,6 bilhões" → "doze vírgula seis bilhões de reais".
 */
export const prepararFala = (tokens: string[], pronuncia?: Pronuncia): { texto: string; spans: [number, number][] } => {
  const falas = tokens.map((t) => falarToken(t, pronuncia));
  // R$ <número> [mil|milhões|bilhões] → "<número> [escala] de reais"
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] !== "R$") continue;
    const temEscala = /^(mil|milhão|milhões|bilhão|bilhões)[.,;:]?$/.test(tokens[i + 2] ?? "");
    falas[i] = "";
    if (temEscala) {
      const pont = (tokens[i + 2].match(/[.,;:]$/) ?? [""])[0];
      falas[i + 2] = tokens[i + 2].replace(/[.,;:]$/, "") + " de reais" + pont;
    } else {
      const pont = (falas[i + 1].match(/[.,;:]$/) ?? [""])[0];
      falas[i + 1] = falas[i + 1].replace(/[.,;:]$/, "") + " reais" + pont;
    }
  }
  const spans: [number, number][] = [];
  let texto = "";
  for (const f of falas) {
    if (!f) {
      spans.push([texto.length, texto.length]);
      continue;
    }
    if (texto) texto += " ";
    spans.push([texto.length, texto.length + f.length]);
    texto += f;
  }
  return { texto, spans };
};
