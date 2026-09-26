"""Synthesises a calm, royalty-free soundtrack for the SaltIT promo (video/audio.wav).

Soft pad chords change with each scene, a gentle plucked arpeggio adds motion and a quiet
sea wash nods to Saltdean. Everything is generated here, so there are no licensing questions.

    python3 video/make_audio.py        # needs numpy
"""

import wave
from pathlib import Path

import numpy as np

SR = 44100
DURATION = 38.0
# Scene boundaries mirror data-start in promo.html.
SCENES = [0.0, 4.2, 8.6, 14.4, 20.6, 26.6, 31.6, DURATION]
# One chord per scene, as MIDI note numbers (D major, unhurried).
CHORDS = [
    [50, 57, 61, 64, 66],  # Dmaj9
    [47, 54, 57, 61, 62],  # Bm(add9)
    [43, 50, 54, 59, 62],  # Gmaj7
    [52, 59, 62, 66, 67],  # Em9
    [47, 54, 57, 62, 66],  # Bm7
    [43, 50, 54, 57, 59],  # Gmaj9
    [50, 57, 61, 64, 69],  # Dmaj9 (resolve)
]
BEAT = 0.6  # 100 bpm

rng = np.random.default_rng(7)
n = int(SR * DURATION)
t = np.arange(n) / SR
left = np.zeros(n)
right = np.zeros(n)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def envelope(length, attack, release):
    env = np.ones(length)
    a = min(length, int(attack * SR))
    r = min(length - a, int(release * SR))
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        env[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def add(signal, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    j = min(n, i + len(signal))
    signal = signal[: j - i] * gain
    left[i:j] += signal * np.sqrt((1 - pan) / 2)
    right[i:j] += signal * np.sqrt((1 + pan) / 2)


# Pad: detuned sines with a touch of second harmonic, cross-faded between scenes.
for k, chord in enumerate(CHORDS):
    start = max(0.0, SCENES[k] - 0.5)
    end = min(DURATION, SCENES[k + 1] + 1.2)
    length = int((end - start) * SR)
    tt = np.arange(length) / SR
    env = envelope(length, 1.0 if k else 1.8, 1.6)
    for m, note in enumerate(chord):
        # Voice the upper notes an octave higher so the pad carries on phone speakers.
        f = hz(note + (12 if m else 0))
        for d, pan in ((-5, -0.6), (0, 0.0), (5, 0.6)):
            ff = f * 2 ** (d / 1200)
            phase = rng.uniform(0, 2 * np.pi)
            tone = np.sin(2 * np.pi * ff * tt + phase) + 0.12 * np.sin(4 * np.pi * ff * tt + phase)
            add(tone * env, start, pan, 0.03 if m else 0.022)

# Sub: root an octave down, very soft.
for k, chord in enumerate(CHORDS):
    start = SCENES[k]
    length = int((min(DURATION, SCENES[k + 1] + 0.6) - start) * SR)
    tt = np.arange(length) / SR
    add(np.sin(2 * np.pi * hz(chord[0] - 12) * tt) * envelope(length, 0.4, 0.8), start, 0, 0.02)

# Plucked arpeggio through the chord tones, starting once the logo has landed.
pattern = [0, 2, 3, 4, 3, 2, 1, 3]
beat_time, step = 1.2, 0
while beat_time < DURATION - 3.0:
    k = max(i for i in range(len(CHORDS)) if SCENES[i] <= beat_time)
    chord = CHORDS[k]
    note = chord[pattern[step % len(pattern)]] + 24
    length = int(1.6 * SR)
    tt = np.arange(length) / SR
    f = hz(note)
    pluck = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 9)) * np.exp(-tt * 3.2)
    pluck *= envelope(length, 0.004, 0.2)
    accent = 1.0 if step % 4 == 0 else 0.7
    add(pluck, beat_time, -0.35 if step % 2 else 0.35, 0.045 * accent)
    beat_time += BEAT / 2 if 14.4 <= beat_time < 31.6 else BEAT
    step += 1

# Chimes on each scene change.
for k, start in enumerate(SCENES[1:-1], start=1):
    length = int(3.0 * SR)
    tt = np.arange(length) / SR
    f = hz(CHORDS[k][-1] + 24)
    chime = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 2.2)
    add(chime * envelope(length, 0.003, 0.3), start, 0.2 if k % 2 else -0.2, 0.035)

# Final resolving bell as the call to action lands.
length = int(5.5 * SR)
tt = np.arange(length) / SR
for note, g in ((74, 0.05), (81, 0.035), (86, 0.025)):
    f = hz(note)
    bell = (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 1.1)
    add(bell * envelope(length, 0.003, 1.0), 33.3, 0, g)


def shaped_noise(slope, low, high):
    spectrum = rng.normal(size=n // 2 + 1) + 1j * rng.normal(size=n // 2 + 1)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    shape = np.where(freqs > 0, 1 / np.maximum(freqs, 1) ** slope, 0)
    shape *= (freqs > low) * np.exp(-((freqs / high) ** 2))
    noise = np.fft.irfft(spectrum * shape, n)
    return noise / np.abs(noise).max()


# Sea wash: soft pink noise swelling like waves on the shingle.
swell = 0.5 - 0.5 * np.cos(2 * np.pi * t / 6.5)
swell = swell**2.2
for side, offset in ((left, 0.0), (right, 0.8)):
    wash = shaped_noise(0.5, 150, 4500)
    side += wash * np.roll(swell, int(offset * SR)) * 0.05


def reverb(x, seconds=2.6, mix=0.28):
    length = int(seconds * SR)
    impulse = rng.normal(size=length) * np.exp(-np.arange(length) / SR * (6.9 / seconds))
    impulse[: int(0.012 * SR)] = 0
    impulse /= np.sqrt((impulse**2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + length)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(impulse, size), size)[: len(x)]
    return x * (1 - mix) + wet * mix


left, right = reverb(left), reverb(right)

master = np.stack([left, right], axis=1)
master *= envelope(n, 0.4, 2.8)[:, None]
master = np.tanh(master * 1.4) / 1.4
master *= 0.55 / np.abs(master).max()  # about -16 LUFS: a background bed, not a banger

out = Path(__file__).with_name("audio.wav")
with wave.open(str(out), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(SR)
    wav.writeframes((master * 32767).astype("<i2").tobytes())
print(f"Wrote {out}")
