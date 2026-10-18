# Narração (ElevenLabs)

Fluxo definido a partir da documentação oficial da ElevenLabs (pesquisa de 18/10/2026). [O] = documentação oficial; [U] = relato de usuário.

## Configurar (uma vez)

```powershell
npm run configurar-elevenlabs
```

O script pede a **API key** (entrada oculta) e o **Voice ID**, testa a voz de verdade (13 caracteres) e salva no `.env` (fora do git) e nas variáveis de ambiente do usuário.

- API key: elevenlabs.io → Developers → API Keys → Create. Pode restringir a Text to Speech + Voices (leitura). [O] https://elevenlabs.io/docs/overview/administration/workspaces/api-keys
- Voice ID: elevenlabs.io → Voices → voz → ID.
- **Plano free:** vozes da Voice Library **não** funcionam pela API (erro 402). Use uma voz padrão (premade, expiram em 31/12/2026) ou uma criada no Voice Design. [O] https://elevenlabs.io/docs/overview/capabilities/voices

## Comandos

| Comando | O que faz | Custo |
|---|---|---|
| `npm run saldo` | plano e caracteres restantes | 0 |
| `npm run trechos -- <slug>` | mostra a divisão em trechos e o total de caracteres | 0 |
| `npm run teste-voz` | gera uma frase (~150 car.) em `out/teste-voz.wav` | ~150 |
| `npm run episodio -- <slug> --narracao=elevenlabs --formato=horizontal` | episódio completo (exige prévia aprovada) | total dos trechos |

## Como o fluxo funciona

1. **Modelo `eleven_v4`** (padrão). pt-BR suportado, até 10.000 caracteres por chamada, stitching mais confiável. Aceita só `stability` e `similarity_boost` (sem style/speed) e não aceita `<break>`. Plano B: `eleven_multilingual_v2` ("mais estável em textos longos"). Não trocar de modelo no meio de um projeto. [O] https://elevenlabs.io/docs/models , https://elevenlabs.io/v4
2. **Trechos por seção** (até 2.000 caracteres): a doc recomenda dividir textos longos por parágrafo e encadear. Cena curta isolada soa picotada; o corte na troca de seção cai na pausa natural. [O] https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/request-stitching
3. **Continuidade:** chamadas em sequência; cada uma recebe `previous_request_ids` (até 3, do header `request-id`, válidos por 2 h). Sem IDs válidos (trecho anterior veio do cache), usa `previous_text`/`next_text`. [O] https://elevenlabs.io/docs/api-reference/text-to-speech/convert
4. **Números e siglas por extenso** antes de enviar (`src/pipeline/narracao/normalizar.ts` e `biblioteca/pronuncia.json`): "47,03%" → "quarenta e sete vírgula zero três por cento", "TSE" → "tê-esse-é". A doc recomenda pré-processar. Os tempos voltam para as palavras **originais**, então a legenda mostra "47,03%". [O] https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
5. **Timestamps** pelo endpoint `/with-timestamps` (alinhamento por caractere). [O] https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
6. **Áudio:** `pcm_24000` (o `pcm_44100` exige plano Pro) [O]; meio segundo de silêncio entre trechos; conversão para 44,1 kHz com loudness de YouTube, −14 LUFS e pico −1 dBTP [U].
7. **Cache por trecho** (`episodes/<slug>/.cache-tts/`, fora do git): reprocessar não cobra de novo. Mudou o texto de uma seção → só aquele trecho é regenerado.
8. **Saldo conferido antes** de gerar; aborta se faltar.

## Plano free (teste)

- 10.000 créditos/mês; v4 e v2 gastam 1 crédito por caractere. [O] https://elevenlabs.io/pricing
- Até 2 requisições simultâneas nos modelos v2/v3/v4 (o pipeline faz uma por vez). [O]
- **Sem uso comercial**; se publicar, colocar "elevenlabs.io" no título. Para o canal monetizado: Starter ou superior. [O] https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform

## Ajustes de voz usados

- v4: `stability 0.6`, `similarity_boost 0.75` (mais estável = leitura uniforme, tom de noticiário).
- v2: o mesmo + `style 0` (a doc recomenda 0), `use_speaker_boost true`, `speed 1.0`.

## Pendências a confirmar no primeiro uso real

- Se `language_code` faz diferença no v4 (não está documentado; não enviamos).
- Pronúncia real das siglas e de nomes próprios (ajustar `biblioteca/pronuncia.json`).
