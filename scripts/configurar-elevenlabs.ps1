<#
.SYNOPSIS
  Configura a ElevenLabs para o pipeline do canal: pede a chave e a voz, valida na API e salva.

.DESCRIPTION
  - Pede a API key (entrada oculta) e o voice_id (padrão: voz escolhida para o canal).
  - Valida a chave consultando a assinatura (mostra plano e caracteres restantes).
  - Confere se a voz existe e está acessível para a sua conta.
  - Salva em:
      1) .env do projeto (lido pelo pipeline; o .env está no .gitignore e nunca vai para o git);
      2) variáveis de ambiente do USUÁRIO do Windows (persistem entre terminais).
  A chave nunca é impressa na tela.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\configurar-elevenlabs.ps1
#>

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$arquivoEnv = Join-Path $raiz '.env'

$VOZ_PADRAO = 'Qrdut83w0Cr152Yb4Xn3'      # voz escolhida no painel (Paulo)
$MODELO_PADRAO = 'eleven_v4'               # recomendado pela doc oficial para narração (ver docs/narracao.md); plano B: eleven_multilingual_v2

Write-Host ''
Write-Host '== Configuração da ElevenLabs ==' -ForegroundColor Yellow
Write-Host 'Onde pegar cada dado:'
Write-Host '  API key : elevenlabs.io > Developers (canto inferior esquerdo) > API Keys > Create API Key'
Write-Host '            (pode restringir a chave só a Text to Speech e Voices: leitura)'
Write-Host '  Voice ID: elevenlabs.io > Voices > clique na voz > botão "ID" (copia o identificador)'
Write-Host ''

# 1) API key (oculta)
$seguro = Read-Host 'Cole a API key (não aparece na tela)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
try { $chave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
if ([string]::IsNullOrWhiteSpace($chave)) { throw 'Nenhuma chave informada.' }

# 2) voice_id e modelo
$voz = Read-Host "Voice ID [Enter = $VOZ_PADRAO]"
if ([string]::IsNullOrWhiteSpace($voz)) { $voz = $VOZ_PADRAO }
$modelo = Read-Host "Modelo [Enter = $MODELO_PADRAO]"
if ([string]::IsNullOrWhiteSpace($modelo)) { $modelo = $MODELO_PADRAO }

$headers = @{ 'xi-api-key' = $chave }

# 3) valida a chave (assinatura e saldo)
Write-Host ''
Write-Host 'Validando a chave...'
try {
  $sub = Invoke-RestMethod -Uri 'https://api.elevenlabs.io/v1/user/subscription' -Headers $headers -Method Get
  $restante = [int]$sub.character_limit - [int]$sub.character_count
  Write-Host ("  OK. Plano: {0} | usados: {1} de {2} | restantes: {3}" -f $sub.tier, $sub.character_count, $sub.character_limit, $restante) -ForegroundColor Green
} catch {
  $codigo = $_.Exception.Response.StatusCode.value__
  if ($codigo -eq 401) {
    Write-Host '  A chave foi recusada (401). Se você restringiu as permissões da chave, a leitura de "User" pode estar bloqueada: tudo bem, seguimos para o teste da voz.' -ForegroundColor DarkYellow
  } else { throw "Falha ao validar a chave (HTTP $codigo): $($_.Exception.Message)" }
}

# 4) testa a voz de verdade (gera 13 caracteres: "Teste de voz.")
#    No plano free, vozes da Voice Library NÃO funcionam pela API (doc oficial): dá erro 402.
function Testar-Voz([string]$id) {
  $corpo = @{ text = 'Teste de voz.'; model_id = $modelo } | ConvertTo-Json
  try {
    $null = Invoke-WebRequest -Uri "https://api.elevenlabs.io/v1/text-to-speech/$id" -Headers $headers -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) -UseBasicParsing
    return 0
  } catch { return [int]$_.Exception.Response.StatusCode.value__ }
}

Write-Host 'Testando a voz (gasta ~13 caracteres)...'
$status = Testar-Voz $voz
while ($status -ne 0) {
  if ($status -eq 402) {
    Write-Host '  Esta voz exige plano pago pela API (no free, vozes da Voice Library não funcionam).' -ForegroundColor DarkYellow
  } else {
    Write-Host "  A voz falhou (HTTP $status). Confira o ID e o modelo." -ForegroundColor DarkYellow
  }
  try {
    $lista = (Invoke-RestMethod -Uri 'https://api.elevenlabs.io/v1/voices' -Headers $headers -Method Get).voices |
      Where-Object { $_.category -in @('premade', 'generated', 'cloned') } |
      Select-Object name, voice_id, category, @{ n = 'sotaque'; e = { $_.labels.accent } }
    Write-Host 'Vozes da sua conta (premade = padrão da ElevenLabs; generated = criada por você no Voice Design):'
    $lista | Format-Table -AutoSize | Out-String | Write-Host
  } catch { Write-Host '  (não consegui listar as vozes)' }
  $outra = Read-Host 'Cole outro Voice ID (ou Enter para manter a atual e salvar mesmo assim)'
  if ([string]::IsNullOrWhiteSpace($outra)) { break }
  $voz = $outra.Trim()
  $status = Testar-Voz $voz
}
if ($status -eq 0) { Write-Host "  OK. A voz $voz funciona com o modelo $modelo." -ForegroundColor Green }

# 5) salva no .env (substitui as linhas existentes, mantém o resto)
$linhas = @()
if (Test-Path $arquivoEnv) { $linhas = Get-Content $arquivoEnv -Encoding UTF8 | Where-Object { $_ -notmatch '^(ELEVENLABS_API_KEY|ELEVENLABS_VOICE_ID|ELEVENLABS_MODEL_ID)=' } }
$linhas += "ELEVENLABS_API_KEY=$chave"
$linhas += "ELEVENLABS_VOICE_ID=$voz"
$linhas += "ELEVENLABS_MODEL_ID=$modelo"
[IO.File]::WriteAllLines($arquivoEnv, $linhas, (New-Object Text.UTF8Encoding $false))
Write-Host "Salvo em $arquivoEnv" -ForegroundColor Green

# 6) variáveis de ambiente do usuário (persistentes)
[Environment]::SetEnvironmentVariable('ELEVENLABS_API_KEY', $chave, 'User')
[Environment]::SetEnvironmentVariable('ELEVENLABS_VOICE_ID', $voz, 'User')
[Environment]::SetEnvironmentVariable('ELEVENLABS_MODEL_ID', $modelo, 'User')
Write-Host 'Variáveis de ambiente do usuário atualizadas (abra um terminal novo para enxergá-las).' -ForegroundColor Green

$chave = $null
Write-Host ''
Write-Host 'Pronto. Próximo passo, pelo chat: pedir o teste de UMA cena antes de gerar o episódio inteiro.' -ForegroundColor Yellow
