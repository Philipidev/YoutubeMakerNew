/**
 * Valida a biblioteca contra os schemas e gera biblioteca/CATALOGO.md.
 * Uso: npx tsx scripts/biblioteca.ts
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { AcaoCatalogoSchema, ContextoSchema, FalaSchema, MomentoSchema, PersonagemRegistroSchema } from "../src/schema/biblioteca";

const B = path.resolve("biblioteca");
const ler = (f: string) => JSON.parse(fs.readFileSync(path.join(B, f), "utf8"));
const dir = (d: string) => fs.readdirSync(path.join(B, d)).filter((f) => f.endsWith(".json")).map((f) => ler(path.join(d, f)));

const personagens = z.array(PersonagemRegistroSchema).parse(ler("personagens.json"));
const acoes = z.array(AcaoCatalogoSchema).parse(ler("acoes.json"));
const falas = z.array(FalaSchema).parse(ler("falas.json"));
const momentos = dir("momentos").map((m) => MomentoSchema.parse(m));
const contextos = dir("contexto").map((c) => ContextoSchema.parse(c));
const figurinos: { id: string; descricao: string }[] = ler("figurinos.json");
const cenarios: { id: string; uso: string }[] = ler("cenarios.json");

const hoje = new Date();
const vencido = (c: z.infer<typeof ContextoSchema>) => (hoje.getTime() - new Date(c.checadoEm).getTime()) / 86_400_000 > c.validadeDias;

const l: string[] = ["# Catálogo da biblioteca", "", "_Gerado por `npx tsx scripts/biblioteca.ts`. Não editar à mão._", ""];
l.push("## Personagens", "", "| id | rótulo | nº | cor | partido | cargo |", "|---|---|---|---|---|---|");
for (const p of personagens) l.push(`| ${p.id} | ${p.rotulo} | ${p.numero} | ${p.cor} | ${p.partido ?? ""} | ${p.cargo ?? ""} |`);
l.push("", "## Figurinos", "", ...figurinos.map((f) => `- **${f.id}**: ${f.descricao}`));
l.push("", "## Ações do boneco", "", ...acoes.map((a) => `- **${a.id}**: ${a.descricao} Usar: ${a.quandoUsar} Não usar: ${a.quandoNaoUsar}`));
l.push("", "## Cenários", "", ...cenarios.map((c) => `- **${c.id}**: ${c.uso}`));
l.push("", "## Momentos (cenas-modelo)", "", ...momentos.map((m) => `- **${m.id}** (${m.tipo}${m.cenario ? `, ${m.cenario}` : ""}): ${m.descricao} Slots: ${m.slots.join(", ")}`));
l.push("", "## Falas aprovadas", "", ...falas.map((f) => `- **${f.id}** (${f.uso}): “${f.texto}”`));
l.push("", "## Contexto", "");
if (!contextos.length) l.push("_vazio_");
for (const c of contextos) l.push(`- **${c.id}**: ${c.descricao} (checado em ${c.checadoEm}${vencido(c) ? ", **VENCIDO: rechecar**" : ""})`);
fs.writeFileSync(path.join(B, "CATALOGO.md"), l.join("\n") + "\n");
console.log(`ok: ${personagens.length} personagens, ${figurinos.length} figurinos, ${acoes.length} ações, ${cenarios.length} cenários, ${momentos.length} momentos, ${falas.length} falas, ${contextos.length} contextos`);
