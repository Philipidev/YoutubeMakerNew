import { interpolate, Easing } from "remotion";
import type React from "react";

/**
 * Pool de câmeras: movimento contínuo durante a cena (nada fica estático).
 * Amplitudes pequenas: o conteúdo nunca sai da safe zone.
 */
export const CAMERAS = ["zoomIn", "zoomOut", "panEsq", "panDir", "panCima", "panBaixo", "kenBurns", "respirar", "deriva"] as const;
export type Camera = (typeof CAMERAS)[number];

const suave = Easing.inOut(Easing.sin);

export const estiloCamera = (tipo: Camera, f: number, dur: number, alcance = 1): React.CSSProperties => {
  const p = interpolate(f, [0, Math.max(1, dur)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const a = alcance;
  switch (tipo) {
    case "zoomIn":
      return { transform: `scale(${1 + 0.06 * a * p})` };
    case "zoomOut":
      return { transform: `scale(${1 + 0.06 * a * (1 - p)})` };
    case "panEsq":
      return { transform: `scale(${1 + 0.03 * a}) translateX(${(18 - 36 * p) * a}px)` };
    case "panDir":
      return { transform: `scale(${1 + 0.03 * a}) translateX(${(-18 + 36 * p) * a}px)` };
    case "panCima":
      return { transform: `scale(${1 + 0.03 * a}) translateY(${(16 - 32 * p) * a}px)` };
    case "panBaixo":
      return { transform: `scale(${1 + 0.03 * a}) translateY(${(-16 + 32 * p) * a}px)` };
    case "kenBurns":
      return { transform: `scale(${1 + 0.05 * a * p}) translate(${-12 * a * p}px, ${-10 * a * p}px)` };
    case "respirar":
      return { transform: `scale(${1 + 0.015 * a * Math.sin((f / 45) * Math.PI)})` };
    case "deriva":
      return {
        transform: `translate(${Math.sin(f / 50) * 10 * a}px, ${Math.cos(f / 63) * 8 * a}px) rotate(${Math.sin(f / 80) * 0.5 * a}deg) scale(${1 + 0.02 * a})`,
      };
  }
};
