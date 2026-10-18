# Catálogo da biblioteca

_Gerado por `npx tsx scripts/biblioteca.ts`. Não editar à mão._

## Personagens

| id | rótulo | nº | cor | partido | cargo |
|---|---|---|---|---|---|

## Figurinos

- **candidato**: Candidato: camisa na cor do partido, número no peito.
- **ministro**: Ministro de Estado / autoridade do Executivo.
- **ministro-stf**: Ministro do STF ou do TSE.
- **parlamentar**: Deputado ou senador com partido: terno com gravata na cor do partido.
- **aposentado**: Aposentado/pensionista (INSS).
- **cidadao**: Cidadão genérico.
- **renda-baixa**: Indicador de pobreza/renda baixa. Usar só junto de um dado com fonte.
- **renda-alta**: Indicador de riqueza/renda alta. Par simétrico do renda-baixa.
- **investigado**: Pessoa investigada com dinheiro apreendido. Só quando a apreensão é fato com fonte; nunca para sugerir culpa.
- **lider-estrangeiro**: Chefe de Estado/governo estrangeiro: crachá com bandeira (campo pais, ISO alfa-2).

## Ações do boneco

- **idle**: Respiração leve, piscadas. Usar: Personagem presente sem ação no fato. Não usar: Quando o fato descreve uma ação dele.
- **falar**: Boca sincronizada com a narração, gestos discretos. Usar: A narração relata o que o personagem disse/anunciou. Não usar: Quando a fala é de outra pessoa.
- **acenar**: Aceno com a mão direita. Usar: Apresentação do personagem, chegada a evento. Não usar: Para sugerir simpatia ou vitória.
- **sorrir**: Sorriso neutro. Usar: Apresentação; mesmo uso para todos. Não usar: Para reagir a número bom/ruim.
- **apontar**: Aponta para card/gráfico ao lado. Usar: Personagem autor do documento/medida mostrado. Não usar: Acusação.
- **pensativo**: Mão no queixo. Usar: Posição ainda não declarada (fato verificável). Não usar: Para sugerir dúvida sobre o caráter.
- **surpreso**: Sobrancelhas e boca abertas. Usar: Raramente; só se o fato for reação pública registrada. Não usar: Como comentário editorial.
- **bracosCruzados**: Braços cruzados. Usar: Personagem declarou oposição/rejeição a algo. Não usar: Para sugerir teimosia.
- **comemorar**: Braços para cima. Usar: Comemoração pública registrada (ex.: resultado oficial). Não usar: Pesquisa, previsão.

## Cenários

- **neutro**: Piso simples; qualquer fato com personagens.
- **pulpitos**: Debates, entrevistas coletivas. Personagens ganham púlpito; ausentes viram púlpito vazio (dados.ausentes).
- **urna**: Votação, apuração, calendário eleitoral.
- **plenarioCamara**: Votações na Câmara; cadeiras acendem conforme o placar.
- **plenarioSenado**: Votações no Senado.
- **congresso**: Tramitação no Congresso. cenarioOpcoes.casa destaca a cúpula (camara|senado).
- **planalto**: Atos do Executivo (MP, decreto, sanção, veto).
- **tribunal**: Julgamentos no STF/TSE. cenarioOpcoes.votos colore as cadeiras (sim|nao|pendente).
- **martelo**: Decisão judicial pontual (liminar, sentença).
- **banco**: Sistema financeiro (liquidação, intervenção, fraude bancária). Nome no rótulo, nunca logo.
- **cpi**: CPI/CPMI, depoimentos, convocações.
- **policia**: Operações policiais (mandados, prisões). Rótulo com o nome da operação.
- **mapaBrasil**: Estados em destaque (cenarioOpcoes.ufs) ou coroplético (valores).
- **mapaCapitais**: Fatos que envolvem capitais.
- **mapaRegioes**: Regiões (cenarioOpcoes.regioes para destacar).
- **mapaEstado**: Um estado isolado com a capital (cenarioOpcoes.uf).
- **mundo**: Internacional: bandeiras tremulando (cenarioOpcoes.paises, ISO alfa-2).

## Momentos (cenas-modelo)

- **assinatura-de-ato** (fato, planalto): Autoridade do Executivo assina/anuncia um ato (MP, decreto, sanção). Slots: autor, ato, data, veiculoOficial, efeito
- **caso-sistema-financeiro** (fato, banco): Caso de instituição financeira (liquidação, fraude, intervenção do Banco Central). Slots: orgao, instituicao, fato, data, valor
- **cpi-depoimento** (fato, cpi): Sessão de CPI/CPMI: quem depôs, o que disse, próximo passo. Slots: comissao, depoente, declaracao, data
- **dado-demografico** (grafico): Indicador social (pobreza, natalidade, população, idade) com gráfico e fonte oficial. Slots: fonte, indicador, valor, periodo
- **debate-dois-lados** (debate, pulpitos): Debate em púlpitos com falas alternadas (atribuicoes), tempo igual por fala. Slots: ladoA, falaA, ladoB, falaB
- **descontos-aposentados** (fato, neutro): Caso de descontos em benefícios (INSS): quem foi afetado, quanto, ressarcimento. Slots: fonte, numeroAfetados, natureza, ressarcimento
- **julgamento-stf** (votacao, tribunal): Julgamento no STF/TSE com placar de votos. Slots: tribunal, votosSim, votosNao, situacao
- **operacao-policial** (fato, policia): Operação policial: mandados, alvos, estados. Investigado não é culpado: sempre 'investigado', 'suspeito', 'segundo a PF'. Slots: orgao, nomeOperacao, mandados, locais, alvo, suspeita
- **pesquisa-nova** (pesquisa): Pesquisa registrada, com metodologia na tela. Sem previsão. Slots: instituto, registro, amostra, inicio, fim, margem
- **propostas-comparadas** (propostas): Propostas numeradas por candidato, mesmo número de itens por lado. Slots: tema
- **reacao-de-lado** (fato, neutro): Um lado reage a um fato; fala sempre atribuída. Slots: quem, meio, declaracao
- **relacao-internacional** (fato, mundo): Fato entre países: bandeiras + líderes com crachá de bandeira. Slots: paisA, paisB, fato, data, fonte
- **tramitacao-congresso** (votacao, congresso): Etapa de tramitação no Congresso (prazo, comissão, votação). Slots: proposicao, casa, etapa, prazo

## Falas aprovadas

- **aviso-ia** (aviso): “Roteiro, narração e animação produzidos com auxílio de IA. Fontes na descrição.”
- **encerramento-fontes** (encerramento): “As fontes estão na descrição.”

## Contexto

_vazio_
