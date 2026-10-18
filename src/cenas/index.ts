import type React from "react";
import type { Cena } from "../schema/episodio";
import type { CenaProps } from "../video/CenaRouter";

type Mapa = { [T in Cena["tipo"]]?: React.FC<CenaProps<Extract<Cena, { tipo: T }>>> };

/** Registro tipo de cena → componente. Tipos ausentes usam CenaGenerica. */
export const componentesCena: Mapa = {};
