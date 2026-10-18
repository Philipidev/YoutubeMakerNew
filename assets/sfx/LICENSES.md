# Origem dos SFX

Todos os efeitos sonoros do canal são **gerados por síntese** em `scripts/gerar-sfx.py` (ruído filtrado e senoides).
Não há amostras de terceiros, então não há licença a cumprir. Saída em `public/sfx/`.

| Arquivo | Como é gerado | Uso |
|---|---|---|
| `whoosh-1..3.wav` | ruído branco com passa-baixa variável e envelope senoidal | transições entre cenas |
| `pop-1..3.wav` | senoide com queda de tom (900 → 180 Hz) | entrada de card de fato/citação |
| `ding-1..3.wav` | 1320 Hz + harmônicos com decaimento | números (contexto, placar, pesquisa, gráfico) |

Mixagem: `theme.audio.volumeSfx` (~18 dB abaixo da voz). Para trocar por um arquivo externo, use só licença CC0 e registre a origem aqui.
