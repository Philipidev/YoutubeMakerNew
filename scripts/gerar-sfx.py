"""Gera os SFX do canal por síntese (sem amostras de terceiros, sem licença a cumprir).

Uso: python scripts/gerar-sfx.py public/sfx
Saída: whoosh-1..3.wav (ruído filtrado com varredura), pop-1..3.wav (senoide com queda de tom), ding-1..3.wav (sino curto).
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


def whoosh(dur: float = 0.45, semente: int = 42, agudo: float = 0.25) -> list[float]:
    rnd = random.Random(semente)
    n = int(SR * dur)
    out, lp = [], 0.0
    for i in range(n):
        t = i / n
        # passa-baixa com corte que sobe e desce: sensação de passagem
        alfa = 0.02 + agudo * math.sin(math.pi * t) ** 2
        lp += alfa * (rnd.uniform(-1, 1) - lp)
        env = math.sin(math.pi * t) ** 1.5
        out.append(lp * env)
    return out


def pop(dur: float = 0.12, f0: float = 900, f1: float = 180) -> list[float]:
    n = int(SR * dur)
    out, fase = [], 0.0
    for i in range(n):
        t = i / SR
        freq = f0 * math.exp(-t * 30) + f1
        fase += 2 * math.pi * freq / SR
        out.append(math.sin(fase) * math.exp(-t * 35))
    return out


def ding(dur: float = 0.9, base: float = 1320) -> list[float]:
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 5) * min(1, t * 400)
        out.append(env * (math.sin(2 * math.pi * base * t) + 0.5 * math.sin(2 * math.pi * 2 * base * t) + 0.25 * math.sin(2 * math.pi * 3 * base * t)))
    return out


if __name__ == "__main__":
    destino = Path(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
    destino.mkdir(parents=True, exist_ok=True)
    # 3 variações de cada (o vídeo sorteia uma por evento)
    for i, (dur, sem, agudo) in enumerate([(0.45, 42, 0.25), (0.35, 7, 0.4), (0.6, 99, 0.15)], 1):
        salvar(destino / f"whoosh-{i}.wav", whoosh(dur, sem, agudo))
    for i, (f0, f1) in enumerate([(900, 180), (1300, 260), (650, 140)], 1):
        salvar(destino / f"pop-{i}.wav", pop(0.12, f0, f1))
    for i, base in enumerate([1320, 1568, 1046], 1):
        salvar(destino / f"ding-{i}.wav", ding(0.9, base))
    print(f"ok: {destino}")
