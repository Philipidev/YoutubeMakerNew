/**
 * Gera src/mapas/brasil.json (paths SVG dos estados + capitais) a partir da malha do IBGE.
 *
 * Fontes (dados públicos do IBGE):
 *   ufs.json       https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=intermediaria&intrarregiao=UF
 *   ufs-meta.json  https://servicodados.ibge.gov.br/api/v1/localidades/estados
 *   capitais.json  [{ meta: /api/v3/malhas/municipios/<id>/metadados, mun: /api/v1/localidades/municipios/<id> }]
 *
 * Uso: npx tsx scripts/gerar-mapas.ts <dir-com-os-3-arquivos>
 * Capitais usam o centroide do município (não o ponto da sede); diferença irrelevante na escala do vídeo.
 */
import fs from "node:fs";
import path from "node:path";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";

const dir = process.argv[2];
if (!dir) throw new Error("uso: tsx scripts/gerar-mapas.ts <dir>");
const ler = (n: string) => JSON.parse(fs.readFileSync(path.join(dir, n), "utf8"));

const malha = ler("ufs.json");
// d3-geo espera anel externo em sentido horário (oposto à RFC 7946 do GeoJSON do IBGE): inverte os anéis.
type Anel = [number, number][];
for (const f of malha.features) {
  const g = f.geometry;
  if (g.type === "Polygon") g.coordinates = g.coordinates.map((r: Anel) => [...r].reverse());
  if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map((p: Anel[]) => p.map((r) => [...r].reverse()));
}
const meta: { id: number; sigla: string; nome: string; regiao: { sigla: string; nome: string } }[] = ler("ufs-meta.json");
const caps: { meta: { centroide: { longitude: number; latitude: number } }[] | { centroide: { longitude: number; latitude: number } }; mun: { nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } } }[] = ler("capitais.json");

const W = 1000;
const H = 1000;
const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], malha as GeoPermissibleObjects);
const gp = geoPath(proj);
const arred = (d: string) => d.replace(/(\d+\.\d{1})\d+/g, "$1");

const ufs = malha.features.map((f: { properties: { codarea: string } }) => {
  const m = meta.find((x) => String(x.id) === f.properties.codarea);
  if (!m) throw new Error(`UF desconhecida ${f.properties.codarea}`);
  const [cx, cy] = gp.centroid(f as GeoPermissibleObjects);
  const [[x0, y0], [x1, y1]] = gp.bounds(f as GeoPermissibleObjects);
  return {
    sigla: m.sigla,
    nome: m.nome,
    regiao: m.regiao.sigla,
    path: arred(gp(f as GeoPermissibleObjects) ?? ""),
    centro: [Math.round(cx), Math.round(cy)],
    caixa: [Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0)],
  };
});

const capitais = caps.map((c) => {
  const meta0 = Array.isArray(c.meta) ? c.meta[0] : c.meta;
  const [x, y] = proj([meta0.centroide.longitude, meta0.centroide.latitude])!;
  return { nome: c.mun.nome, uf: c.mun.microrregiao.mesorregiao.UF.sigla, x: Math.round(x), y: Math.round(y) };
});

const saida = path.resolve("src/mapas/brasil.json");
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(
  saida,
  JSON.stringify({ viewBox: [0, 0, W, H], fonte: "IBGE, malha territorial (API v3), qualidade intermediária", ufs, capitais }) + "\n",
);
console.log(`ok: ${ufs.length} UFs, ${capitais.length} capitais, ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`);
