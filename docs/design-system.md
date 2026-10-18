# Design system do canal

Fonte única no código: [`src/theme.ts`](../src/theme.ts). Referência visual: composição **Studio/DesignSystem** (`npm run studio`).
Nenhum componente define cor, fonte, duração ou spring fora do `theme.ts`.

## Princípios
1. **Sério, mas com movimento constante.** Fundo escuro neutro, um acento quente, nada de cores "de lado".
2. **Simetria visual.** Todo personagem usa o mesmo rig, o mesmo tamanho, as mesmas ações e o mesmo token de movimento. Cores de personagem têm a mesma luminância e croma (OKLCH), só o matiz muda.
3. **Fonte sempre à vista.** Quando há fato na tela, o lower third com veículo e data está visível.

## Paleta
| Token | Valor | Uso |
|---|---|---|
| `fundo` | `#10141A` | fundo base |
| `superficie` / `superficieAlta` | `#1B222C` / `#252E3A` | cards |
| `linha` | `#2E3846` | bordas, grade de fundo |
| `texto` | `#F3EFE6` | texto principal |
| `textoSecundario` | `#9AA4B2` | fontes, datas, rótulos |
| `acento` | `#FFC23D` | barra de progresso, números, palavra ativa, destaques |
| `status.confirmado` | `#3DD68C` | selo "confirmado" |
| `status.divergente` | `#FF8A3D` | selo "fontes divergem" |
| `status.naoSeSabe` | `#A7B1C2` | card "O que ainda não se sabe" |

## Cores de personagem
- **Atores políticos com partido:** camisa (ou gravata, no terno) na cor do partido (`coresPartido` no theme: PT `#C8102E`, PL `#1F4FA0`). Regra de simetria validada automaticamente: se um usa a cor do partido, todos os personagens com partido no episódio usam a do próprio partido.
- **Sem partido:** paleta neutra de mesma luminância `oklch(0.74 0.12 H)` (ciano, magenta, menta, violeta, oliva) ou genéricas (`cidadao`, `servidor`, `neutro`).
- A cor fica no registro `biblioteca/personagens.json` e não muda entre episódios.

## Figurinos
Mesmo rig para todos; muda só a roupa, a idade e o acessório (ver `biblioteca/figurinos.json` e a composição **Bonecos/Figurinos**).
- Roupas: `camisa` (candidato), `terno` (ministro, parlamentar, líder estrangeiro), `toga` (STF/TSE), `simples` (cidadão).
- Idade: `adulto` ou `idoso` (cabelo grisalho e óculos).
- Acessórios: `documento`, `bengala`, `carteiraVazia`/`carteiraCheia` (par simétrico para renda, só com dado e fonte), `maletaDinheiro` (só quando há apreensão com fonte).
- O crachá mostra o número; com `pais` (ISO alfa-2), mostra a bandeira.
- Nada de caricatura: pobreza e riqueza aparecem como indicador de dado, não como estereótipo.

## Tipografia
- **Display:** Anton (OFL). Manchetes, números grandes, rótulos de personagem.
- **Corpo:** Inter 400/600/800 (OFL). Narração em card, fontes, legendas.
- Escala vertical (px): número 180, manchete 96, título 64, destaque 44, corpo 32, legenda 24. Horizontal: 150/84/56/38/28/20.

## Movimento
| Token | Config | Uso |
|---|---|---|
| `entrada` | spring damping 14, mass 0.8, stiffness 140 | entrada padrão de card/personagem |
| `entradaSuave` | spring damping 20, mass 1, stiffness 90 | elementos grandes, cenários |
| `pop` | spring damping 9, mass 0.6, stiffness 180 | números, selos, SFX "pop" |
| `saida` | 8 frames, ease-in cúbico | saída de elementos |
| `zoomLento` | escala 1 → 1.05 ao longo da cena | câmera viva em toda cena |
| `enfase` | escala 1 → 1.08 → 1 | palavra/número chave |

Transições permitidas entre cenas: **corte, slide, wipe diagonal, zoom-punch**. Ritmo: alguma mudança visual a cada 60–90 frames (2–3 s).

## Telas e layout
- Grid de 12 colunas, margens laterais = safe zone.
- **Safe zones** vertical: topo 8% (barra de progresso), base 22% (UI de Shorts/Reels/TikTok), laterais 6%. Horizontal: 6% / 10% / 5%.
- Posições fixas do palco: `esq`, `centro`, `dir`.
- Selo de fonte ("lower third"): slot fixo logo abaixo da barra de progresso. No vertical a base fica coberta pela UI das plataformas, então a fonte sobe.
- Card Lado A / Lado B: metades iguais. A ordem (quem fica à esquerda) vem de `episodio.ordemLados` e alterna entre episódios.
- Legenda queimada (prévia ou `--legendaQueimada`): logo acima da safe zone inferior, palavra ativa em `acento`.

## Telas-tipo
| Cena | Composição |
|---|---|
| gancho | manchete gigante + elemento em movimento, 2 s |
| fato | personagem(ns) + card do fato + lower third de fonte |
| contexto | número/data grande ("9 dias") + rótulo |
| linhaDoTempo | trilho horizontal/vertical antes → fato → reação |
| ladoA_ladoB | duas metades iguais, argumento + quem disse + fonte |
| pesquisa | barras + instituto, campo, registro TSE, margem |
| debate | púlpitos lado a lado (ou púlpito vazio) |
| votacao | plenário/urna + placar |
| naoSeSabe | lista com ícone de interrogação |
| encerramento | lista de fontes + aviso de IA fixo |

## Mapas
Malha oficial do IBGE (`scripts/gerar-mapas.ts` gera `src/mapas/brasil.json`). Modos: estados, capitais, regiões, estado isolado e coroplético. Cores de região com mesma luminância. Capitais usam o centroide do município.

## Gráficos
Barras, linha, pirâmide etária, pictograma (x em cada 100), rosca e mapa coroplético. Regras: fonte e período sempre no rodapé, barras começam em zero, destaque só no item citado na narração.

## Internacional
Bandeiras de `country-flag-icons` (MIT), tremulando no cenário `mundo`. Nomes de país via `Intl.DisplayNames` em pt-BR.
