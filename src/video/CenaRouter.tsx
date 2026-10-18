import React from "react";
import type { Cena, Episodio } from "../schema/episodio";
import type { Palavra } from "../schema/timestamps";
import { componentesCena } from "../cenas";
import { CenaGenerica } from "../cenas/CenaGenerica";

export type CenaProps<C extends Cena = Cena> = {
  cena: C;
  episodio: Episodio;
  /** Palavras com tempos relativos ao início da cena (s). */
  palavras: Palavra[];
  duracaoFrames: number;
};

export const CenaRouter: React.FC<CenaProps> = (props) => {
  const Comp = (componentesCena[props.cena.tipo] ?? CenaGenerica) as React.FC<CenaProps>;
  return <Comp {...props} />;
};
