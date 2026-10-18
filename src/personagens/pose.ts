/**
 * Pose do rig. Ângulos em graus.
 * Braço: `ombro` 0 = pendurado; positivo = abre para fora do corpo; negativo = para dentro.
 * `cotovelo` soma ao ombro (positivo para fora/cima, negativo cruza para dentro).
 */
export type Pose = {
  ombroE: number;
  cotoveloE: number;
  ombroD: number;
  cotoveloD: number;
  cabecaRot: number;
  cabecaY: number;
  corpoY: number;
  respiracao: number;
  sobrancelhaY: number; // 0 neutro, 1 bem levantada
  sobrancelhaAng: number; // graus, positivo = interno para baixo
  sorriso: number; // -1..1
  boca: number; // 0 fechada .. 1 bem aberta
  olhos: number; // 0 fechado, 1 normal, 1.25 arregalado
  olharX: number; // -1..1
};

export const POSE_BASE: Pose = {
  ombroE: 6,
  cotoveloE: 4,
  ombroD: 6,
  cotoveloD: 4,
  cabecaRot: 0,
  cabecaY: 0,
  corpoY: 0,
  respiracao: 0,
  sobrancelhaY: 0,
  sobrancelhaAng: 0,
  sorriso: 0.15,
  boca: 0,
  olhos: 1,
  olharX: 0,
};

export const misturar = (a: Pose, b: Pose, k: number): Pose => {
  const out = { ...a };
  for (const key of Object.keys(a) as (keyof Pose)[]) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
};

export type ContextoAcao = {
  /** frame relativo ao início da ação */
  f: number;
  fps: number;
  /** semente estável por personagem (desfasa piscadas/respiração sem mudar o rig) */
  semente: number;
  /** lado para o qual o personagem aponta/olha (centro do palco) */
  ladoCentro: 1 | -1;
};
