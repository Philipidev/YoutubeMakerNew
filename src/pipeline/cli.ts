import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { caminhos } from "./caminhos";
import { validarEpisodio, type Problema } from "./validar";
import { calcularTempos } from "./duracoes";
import { renderizar } from "./render";
import { mockProvider } from "./narracao/mock";
import type { NarracaoProvider } from "./narracao/provider";
import type { Episodio } from "../schema/episodio";
import type { Timestamps } from "../schema/timestamps";
import { gerarSaidasTexto } from "./saidas";

type Flags = Record<string, string | boolean>;

const parseArgs = (argv: string[]) => {
  const [comando, slug, ...resto] = argv;
  const flags: Flags = {};
  for (const a of resto) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? true;
  }
  return { comando, slug, flags };
};

const lerJson = async (p: string) => JSON.parse(await fs.readFile(p, "utf8"));
const escreverJson = (p: string, v: unknown) => fs.writeFile(p, JSON.stringify(v, null, 2) + "\n", "utf8");
const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

const imprimir = (problemas: Problema[]) => {
  for (const p of problemas) console.log(`  ${p.nivel === "erro" ? "ERRO " : "aviso"} ${p.cenaId ? `[${p.cenaId}] ` : ""}${p.msg}`);
};

const etapaValidar = async (slug: string) => {
  const c = caminhos(slug);
  const bruto = await fs.readFile(c.episodioJson, "utf8");
  const { episodio, problemas } = validarEpisodio(JSON.parse(bruto));
  console.log(`▸ validar ${slug}: ${problemas.filter((p) => p.nivel === "erro").length} erro(s), ${problemas.filter((p) => p.nivel === "aviso").length} aviso(s)`);
  imprimir(problemas);
  if (!episodio || problemas.some((p) => p.nivel === "erro")) throw new Error("validação falhou");
  return { episodio, problemas, hashEpisodio: hash(bruto) };
};

const obterProvider = async (nome: string): Promise<NarracaoProvider> => {
  if (nome === "mock") return mockProvider;
  if (nome === "elevenlabs") return (await import("./narracao/elevenlabs")).elevenLabsProvider;
  if (nome === "gravada") return (await import("./narracao/gravada")).gravadaProvider;
  throw new Error(`provider desconhecido: ${nome}`);
};

/** Copia episódio e tempos para public/ (lido pelas composições). */
const sincronizarPublic = async (slug: string, episodio: Episodio, ts: Timestamps) => {
  const c = caminhos(slug);
  await fs.mkdir(c.publicDir, { recursive: true });
  await escreverJson(path.join(c.publicDir, "episodio.json"), episodio);
  await escreverJson(path.join(c.publicDir, "timestamps.json"), ts);
  await escreverJson(path.join(c.publicDir, "cenas.json"), calcularTempos(ts));
};

const composicoes = (flags: Flags) => {
  const f = String(flags.formato ?? "vertical");
  return f === "ambos" ? ["Vertical", "Horizontal"] : f === "horizontal" ? ["Horizontal"] : ["Vertical"];
};

const previa = async (slug: string, flags: Flags) => {
  const { episodio, problemas } = await etapaValidar(slug);
  const c = caminhos(slug);
  const { timestamps } = await mockProvider.gerar(episodio, c.publicDir, c.episodioDir);
  // prévia nunca usa áudio: remove sobras de narração anterior do public
  await fs.rm(path.join(c.publicDir, "audio.wav"), { force: true });
  await sincronizarPublic(slug, episodio, timestamps);
  await fs.mkdir(c.previaDir, { recursive: true });
  console.log(`▸ prévia: ${timestamps.duracaoSeg.toFixed(1)} s estimados`);
  if (!flags.semRender) {
    for (const comp of composicoes(flags)) {
      const nome = comp === "Vertical" ? "previa.mp4" : "previa-horizontal.mp4";
      await renderizar({ composicao: comp, props: { slug, legendaQueimada: true, semAudio: true, zonas: Boolean(flags.zonas) }, saida: path.join(c.previaDir, nome), semAudio: true, crf: 28 });
    }
  }
  await gerarSaidasTexto({ slug, episodio, timestamps, problemas, dir: c.previaDir, previa: true });
  console.log(`✔ prévia em ${c.previaDir}`);
};

const aprovar = async (slug: string) => {
  const { hashEpisodio } = await etapaValidar(slug);
  const c = caminhos(slug);
  await escreverJson(c.aprovadoJson, { hashEpisodio, aprovadoEm: new Date().toISOString() });
  console.log(`✔ ${slug} aprovado (hash ${hashEpisodio})`);
};

const episodioCompleto = async (slug: string, flags: Flags) => {
  const { episodio, problemas, hashEpisodio } = await etapaValidar(slug);
  const c = caminhos(slug);
  const nomeProvider = String(flags.narracao ?? "elevenlabs");
  if (nomeProvider !== "mock" && !flags.forcar) {
    const ap = await lerJson(c.aprovadoJson).catch(() => null);
    if (!ap) throw new Error("episódio sem aprovação da prévia. Rode `previa`, revise e `aprovar` (ou --forcar).");
    if (ap.hashEpisodio !== hashEpisodio) throw new Error("episodio.json mudou depois da aprovação. Gere nova prévia e aprove de novo (ou --forcar).");
  }
  const provider = await obterProvider(nomeProvider);
  await fs.mkdir(c.publicDir, { recursive: true });
  console.log(`▸ narração: ${provider.nome}`);
  const { timestamps, audioPath } = await provider.gerar(episodio, c.publicDir, c.episodioDir);
  if (!audioPath) await fs.rm(path.join(c.publicDir, "audio.wav"), { force: true });
  await sincronizarPublic(slug, episodio, timestamps);
  await fs.mkdir(c.outDir, { recursive: true });
  const legendaQueimada = Boolean(flags.legendaQueimada);
  // --semRender: só narração + legendas + descrição (render depois)
  for (const comp of flags.semRender ? [] : composicoes(flags)) {
    const nome = comp === "Vertical" ? "video.mp4" : "video-horizontal.mp4";
    await renderizar({ composicao: comp, props: { slug, legendaQueimada, semAudio: false }, saida: path.join(c.outDir, nome) });
  }
  await gerarSaidasTexto({ slug, episodio, timestamps, problemas, dir: c.outDir, previa: false });
  console.log(`✔ episódio em ${c.outDir}`);
};

/** Saldo de caracteres da conta ElevenLabs. */
const saldo = async () => {
  const { saldoElevenLabs, configElevenLabs } = await import("./narracao/elevenlabs");
  const c = configElevenLabs();
  const sd = await saldoElevenLabs();
  console.log(`▸ ElevenLabs · voz ${c.voz} · modelo ${c.modelo}`);
  console.log(sd ? `  plano ${sd.plano}: ${sd.usados} de ${sd.limite} caracteres usados; restam ${sd.restantes}` : "  chave sem permissão de leitura do saldo");
};

/** Gera uma frase curta (~150 caracteres) para ouvir a voz e confirmar que ela funciona no plano, sem gastar o episódio. */
const testeVoz = async (texto?: string) => {
  const { sintetizarTrecho, configElevenLabs } = await import("./narracao/elevenlabs");
  const { prepararFala } = await import("./narracao/normalizar");
  const { tokenizar } = await import("./narracao/estimativa");
  const { escreverWav, normalizarParaWav } = await import("./narracao/audio");
  const c = configElevenLabs();
  const original = texto ?? "Neste domingo, 18/10, às 20h, Flávio e Lula se enfrentam no debate. No 1º turno, Flávio teve 47,03% dos votos válidos, segundo o TSE.";
  const { texto: falado } = prepararFala(tokenizar(original));
  console.log(`▸ teste de voz (${c.modelo}, voz ${c.voz}), ${falado.length} caracteres`);
  console.log(`  texto falado: ${falado}`);
  const { res } = await sintetizarTrecho({ texto: falado });
  const dir = path.join(process.cwd(), "out");
  await fs.mkdir(dir, { recursive: true });
  const bruto = path.join(dir, "teste-voz-24k.wav");
  await escreverWav(bruto, Buffer.from(res.audio_base64, "base64"), 24000);
  const final = path.join(dir, "teste-voz.wav");
  await normalizarParaWav(bruto, final);
  await fs.rm(bruto, { force: true });
  console.log(`✔ ouça: ${final}`);
};

const main = async () => {
  const { comando, slug, flags } = parseArgs(process.argv.slice(2));
  if (comando === "saldo") return saldo();
  if (comando === "teste-voz") return testeVoz(slug);
  if (!slug) throw new Error("uso: <validar|previa|aprovar|episodio> <slug> | saldo | teste-voz [texto] [--narracao=elevenlabs|gravada|mock] [--formato=vertical|horizontal|ambos] [--legendaQueimada] [--forcar] [--semRender] [--zonas]");
  if (comando === "validar") await etapaValidar(slug);
  else if (comando === "previa") await previa(slug, flags);
  else if (comando === "aprovar") await aprovar(slug);
  else if (comando === "episodio") await episodioCompleto(slug, flags);
  else throw new Error(`comando desconhecido: ${comando}`);
};

main().catch((e) => {
  console.error(`✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
