import React from "react";
import { AbsoluteFill } from "remotion";
import "../fontes";
import { cores, fontes } from "../theme";
import { Fundo } from "../video/Fundo";
import { MapaBrasil, type MapaBrasilProps } from "../mapas/MapaBrasil";

/** Revisão dos modos do mapa. */
export const MapaDemo: React.FC<Omit<MapaBrasilProps, "largura"> & { titulo: string }> = ({ titulo, ...p }) => (
  <AbsoluteFill>
    <Fundo />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ fontFamily: fontes.display, fontSize: 80, color: cores.texto }}>{titulo}</div>
      <MapaBrasil {...p} largura={1000} />
    </AbsoluteFill>
  </AbsoluteFill>
);

export const MAPAS_DEMO: { id: string; props: Omit<MapaBrasilProps, "largura"> & { titulo: string } }[] = [
  { id: "estados", props: { titulo: "Estados", modo: "estados", destaque: { SP: cores.acento, BA: cores.acento } } },
  { id: "capitais", props: { titulo: "Capitais", modo: "capitais", siglas: false } },
  { id: "regioes", props: { titulo: "Regiões", modo: "regioes" } },
  { id: "estado-mg", props: { titulo: "Minas Gerais", modo: "estado", uf: "MG" } },
  { id: "coropletico", props: { titulo: "Coroplético", modo: "estados", valores: { SP: 46, MG: 21, RJ: 17, BA: 15, PR: 11, RS: 11, PE: 9, CE: 9, PA: 8, SC: 8, GO: 7, MA: 7, AM: 4, PB: 4, ES: 4, MT: 4, RN: 3, PI: 3, AL: 3, DF: 3, MS: 3, SE: 2, RO: 2, TO: 2, AC: 1, AP: 1, RR: 1 } } },
];
