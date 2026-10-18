import React, { useContext } from "react";
import { createPortal } from "react-dom";

/**
 * Camada fixa da cena: elementos de interface (selo de fonte) que NÃO acompanham a câmera.
 * Sem isso, zoom/pan empurram o selo para trás da barra de progresso.
 */
export const CamadaFixa = React.createContext<HTMLElement | null>(null);

/** Renderiza os filhos na camada fixa da cena (fora do transform da câmera). */
export const NaCamadaFixa: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const alvo = useContext(CamadaFixa);
  // até a camada montar (primeiro commit), renderiza no lugar para nunca perder o elemento
  return alvo ? createPortal(children, alvo) : <>{children}</>;
};
