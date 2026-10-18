"""Gera os SFX do canal por síntese (sem amostras de terceiros, sem licença a cumprir).

Uso: python scripts/gerar-sfx.py public/sfx
Saída: whoosh.wav (ruído filtrado com varredura), pop.wav (senoide com queda de tom), ding.wav (sino curto).
"""
import math
import random
import struct
import sys
import wave
from pathlib import Path

SR = 44100


def salvar(caminho: Path, amostras: list[float]) -> None:
    pico = max(1e-9, max(abs(a) for a in amostras))
    with wave.open(str(caminho), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(a / pico * 0.9 * 32767)) for a in amostras))


def whoosh(dur: float = 0.45) -> list[float]:
    rnd = random.Random(42)
    n = int(SR * dur)
    out, lp = [], 0.0
    for i in range(n):
        t = i / n
        # passa-baixa com corte que sobe e desce: sensação de passagem
        alfa = 0.02 + 0.25 * math.sin(math.pi * t) ** 2
        lp += alfa * (rnd.uniform(-1, 1) - lp)
        env = math.sin(math.pi * t) ** 1.5
        out.append(lp * env)
    return out


def pop(dur: float = 0.12) -> list[float]:
    n = int(SR * dur)
    out, fase = [], 0.0
    for i in range(n):
        t = i / SR
        freq = 900 * math.exp(-t * 30) + 180
        fase += 2 * math.pi * freq / SR
        out.append(math.sin(fase) * math.exp(-t * 35))
    return out


def ding(dur: float = 0.9) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 5) * min(1, t * 400)
        out.append(env * (math.sin(2 * math.pi * 1320 * t) + 0.5 * math.sin(2 * math.pi * 2640 * t) + 0.25 * math.sin(2 * math.pi * 3960 * t)))
    return out


if __name__ == "__main__":
    destino = Path(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
    destino.mkdir(parents=True, exist_ok=True)
    salvar(destino / "whoosh.wav", whoosh())
    salvar(destino / "pop.wav", pop())
    salvar(destino / "ding.wav", ding())
    print(f"ok: {destino}")
