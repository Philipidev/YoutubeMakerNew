import { Easing } from "remotion";

/**
 * Fonte única do design system do canal. Documentado em docs/design-system.md.
 * Nenhum componente define cor, fonte, duração ou spring fora daqui.
 */

export const FPS = 30;

export const cores = {
  fundo: "#10141A",
  fundoAlt: "#151B23",
  superficie: "#1B222C",
  superficieAlta: "#252E3A",
  linha: "#2E3846",
  texto: "#F3EFE6",
  textoSecundario: "#9AA4B2",
  acento: "#FFC23D",
  acentoEscuro: "#B38627",
  status: {
    confirmado: "#3DD68C",
    divergente: "#FF8A3D",
    naoSeSabe: "#A7B1C2",
  },
  pele: "#E9DCC9",
  peleSombra: "#D4C4AD",
  contorno: "#0B0E12",
} as const;

/**
 * Cores de personagem: mesma luminância e croma (OKLCH), só o matiz muda.
 * Nenhuma é cor oficial de partido (evita vermelho ~25° e azul ~255°).
 * A cor de cada personagem é fixada no registro biblioteca/personagens.json.
 */
export const coresPersonagem = {
  ciano: "oklch(0.74 0.12 200)",
  magenta: "oklch(0.74 0.12 330)",
  menta: "oklch(0.74 0.12 160)",
  violeta: "oklch(0.74 0.12 290)",
  oliva: "oklch(0.74 0.12 115)",
} as const;
/**
 * Cores de partido (camisa do boneco). Regra de simetria: se um personagem usa a cor do partido,
 * todos os personagens do episódio usam a cor do próprio partido. Valores aproximados da identidade visual de cada sigla.
 */
export const coresPartido = {
  PT: "#C8102E",
  PL: "#1F4FA0",
} as const;

/** Cores de figuras genéricas (sem partido). */
export const coresGenericas = {
  cidadao: "#6B8299",
  servidor: "#7A6F99",
  neutro: "#8A8F98",
} as const;

export type CorPersonagem = keyof typeof coresPersonagem;

export const fontes = {
  display: "Anton",
  corpo: "Inter",
} as const;

/** Escala tipográfica em px, por formato. */
export const tipos = {
  vertical: { manchete: 96, titulo: 64, destaque: 44, corpo: 32, legenda: 24, numero: 180 },
  horizontal: { manchete: 84, titulo: 56, destaque: 38, corpo: 28, legenda: 20, numero: 150 },
} as const;

export const raio = { card: 28, chip: 999, pequeno: 12 } as const;

/** Tokens de movimento. Mesmo token para todos os lados, sempre. */
export const movimento = {
  entrada: { damping: 14, mass: 0.8, stiffness: 140 },
  entradaSuave: { damping: 20, mass: 1, stiffness: 90 },
  pop: { damping: 9, mass: 0.6, stiffness: 180 },
  duracaoEntrada: 12,
  duracaoSaida: 8,
  easingSaida: Easing.in(Easing.cubic),
  easingPadrao: Easing.bezier(0.2, 0.8, 0.2, 1),
  zoomLento: { de: 1, ate: 1.05 },
  enfaseEscala: 1.08,
  /** Intervalo entre mudanças visuais (retenção): 2–3 s. */
  ritmoMin: 60,
  ritmoMax: 90,
} as const;

export const transicoes = ["corte", "slide", "wipeDiagonal", "zoomPunch"] as const;
export type Transicao = (typeof transicoes)[number];

/** Safe zones em fração da tela (UI das plataformas cobre topo/base). */
export const safe = {
  vertical: { topo: 0.08, base: 0.22, lados: 0.06 },
  horizontal: { topo: 0.06, base: 0.1, lados: 0.05 },
} as const;

export const audio = {
  /** SFX ficam ~18 dB abaixo da voz. */
  volumeSfx: 0.12,
  volumeVoz: 1,
} as const;

export const AVISO_IA =
  "Roteiro, narração e animação produzidos com auxílio de IA. Fontes na descrição.";
