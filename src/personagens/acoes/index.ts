import type { Acao } from "../../schema/episodio";
import { POSE_BASE, type ContextoAcao, type Pose } from "../pose";

/**
 * Cada ação é uma função pura frame → pose. O mesmo conjunto vale para todos os personagens
 * (regra de neutralidade: nenhuma ação é exclusiva de alguém).
 */
const sen = Math.sin;
const tempo = (c: ContextoAcao) => c.f / c.fps;

const idle = (c: ContextoAcao): Pose => {
  const t = tempo(c) + c.semente;
  return {
    ...POSE_BASE,
    respiracao: sen(t * 2.2) * 0.5 + 0.5,
    cabecaRot: sen(t * 0.9) * 1.5,
    ombroE: 6 + sen(t * 1.3) * 1.5,
    ombroD: 6 + sen(t * 1.3 + 1) * 1.5,
    olharX: sen(t * 0.5) * 0.3,
  };
};

const acenar = (c: ContextoAcao): Pose => {
  const t = tempo(c);
  const braco = c.ladoCentro === 1 ? "D" : "E";
  const onda = sen(t * 11) * 22;
  const base = { ...idle(c), sorriso: 0.6, cabecaRot: 4 * c.ladoCentro, olharX: 0.4 * c.ladoCentro };
  return braco === "D"
    ? { ...base, ombroD: 105, cotoveloD: 70 + onda }
    : { ...base, ombroE: 105, cotoveloE: 70 + onda };
};

const sorrir = (c: ContextoAcao): Pose => ({
  ...idle(c),
  sorriso: 1,
  sobrancelhaY: 0.25,
  cabecaRot: 5 * c.ladoCentro,
  olhos: 0.85,
});

const falar = (c: ContextoAcao): Pose => {
  const t = tempo(c) + c.semente;
  const g = sen(t * 2.4);
  return {
    ...idle(c),
    sorriso: 0.2,
    sobrancelhaY: Math.max(0, sen(t * 1.7)) * 0.3,
    ombroD: 18 + g * 8,
    cotoveloD: -55 + sen(t * 3.1) * 18,
    ombroE: 12 - g * 5,
    cotoveloE: -25 + sen(t * 2.7 + 1) * 10,
    cabecaRot: sen(t * 1.9) * 3,
    olharX: 0.2 * c.ladoCentro,
  };
};

const apontar = (c: ContextoAcao): Pose => {
  const t = tempo(c);
  const base = { ...idle(c), olharX: 0.8 * c.ladoCentro, cabecaRot: 6 * c.ladoCentro, sobrancelhaY: 0.2 };
  const ajuste = sen(t * 2) * 3;
  return c.ladoCentro === 1
    ? { ...base, ombroD: 82 + ajuste, cotoveloD: 4 }
    : { ...base, ombroE: 82 + ajuste, cotoveloE: 4 };
};

const pensativo = (c: ContextoAcao): Pose => {
  const t = tempo(c);
  // mão na têmpora, cotovelo para fora: nunca cobre o número do peito
  return {
    ...idle(c),
    ombroD: 120,
    cotoveloD: 93 + sen(t * 1.5) * 3,
    cabecaRot: -7,
    olharX: 0.5,
    sobrancelhaY: 0.2,
    sobrancelhaAng: 6,
    sorriso: -0.05,
  };
};

const surpreso = (c: ContextoAcao): Pose => {
  const salto = Math.max(0, sen(Math.min(1, tempo(c) / 0.35) * Math.PI)) * -18;
  return {
    ...idle(c),
    corpoY: salto,
    sobrancelhaY: 1,
    olhos: 1.25,
    boca: 0.55,
    sorriso: 0,
    ombroE: 28,
    cotoveloE: 55,
    ombroD: 28,
    cotoveloD: 55,
  };
};

const bracosCruzados = (c: ContextoAcao): Pose => ({
  ...idle(c),
  ombroE: 8,
  cotoveloE: -78,
  ombroD: 8,
  cotoveloD: -78,
  sorriso: 0,
  sobrancelhaAng: 4,
  cabecaRot: -2 * c.ladoCentro,
});

const comemorar = (c: ContextoAcao): Pose => {
  const t = tempo(c);
  const pulo = -Math.abs(sen(t * 6)) * 22;
  return {
    ...idle(c),
    corpoY: pulo,
    ombroE: 150 + sen(t * 6) * 8,
    cotoveloE: 15,
    ombroD: 150 + sen(t * 6 + 0.5) * 8,
    cotoveloD: 15,
    sorriso: 1,
    olhos: 0.4,
    boca: 0.35,
  };
};

export const ACOES_POSE: Record<Acao, (c: ContextoAcao) => Pose> = {
  idle,
  acenar,
  sorrir,
  falar,
  apontar,
  pensativo,
  surpreso,
  bracosCruzados,
  comemorar,
};
