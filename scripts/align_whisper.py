"""Transcreve um áudio com faster-whisper e imprime tempos por palavra em JSON (stdout).

Uso: python scripts/align_whisper.py <audio.wav>
Saída: [{"palavra": "...", "inicio": 0.12, "fim": 0.40}, ...]
Variáveis: WHISPER_MODEL (padrão large-v3), WHISPER_DEVICE (cuda|cpu, padrão cuda com fallback para cpu).
O texto da legenda NÃO vem daqui: o pipeline alinha estes tempos ao texto exato do roteiro.
"""
import json
import os
import sys


def main() -> None:
    from faster_whisper import WhisperModel

    audio = sys.argv[1]
    modelo = os.environ.get("WHISPER_MODEL", "large-v3")
    device = os.environ.get("WHISPER_DEVICE", "cuda")
    try:
        m = WhisperModel(modelo, device=device, compute_type="float16" if device == "cuda" else "int8")
    except Exception as e:  # sem CUDA disponível: cai para CPU
        print(f"aviso: {device} indisponível ({e}); usando cpu", file=sys.stderr)
        m = WhisperModel(modelo, device="cpu", compute_type="int8")
    segmentos, _ = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True, beam_size=5)
    palavras = [
        {"palavra": w.word.strip(), "inicio": round(w.start, 3), "fim": round(w.end, 3)}
        for s in segmentos
        for w in (s.words or [])
    ]
    json.dump(palavras, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
