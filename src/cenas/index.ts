import type React from "react";
import type { Cena } from "../schema/episodio";
import type { CenaProps } from "../video/CenaRouter";
import {
  CenaContexto,
  CenaDebate,
  CenaEncerramento,
  CenaFato,
  CenaGancho,
  CenaLadoALadoB,
  CenaLinhaDoTempo,
  CenaNaoSeSabe,
  CenaPesquisa,
  CenaVotacao,
} from "./Cenas";

type Mapa = { [T in Cena["tipo"]]?: React.FC<CenaProps<Extract<Cena, { tipo: T }>>> };

/** Registro tipo de cena → componente. Tipos ausentes usam CenaGenerica. */
export const componentesCena: Mapa = {
  gancho: CenaGancho,
  fato: CenaFato,
  contexto: CenaContexto,
  linhaDoTempo: CenaLinhaDoTempo,
  ladoA_ladoB: CenaLadoALadoB,
  pesquisa: CenaPesquisa,
  debate: CenaDebate,
  votacao: CenaVotacao,
  naoSeSabe: CenaNaoSeSabe,
  encerramento: CenaEncerramento,
};
