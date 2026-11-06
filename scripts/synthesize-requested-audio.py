"""Original journal-game music/SFX. Offline synthesis, no samples or network calls.

Development-only dependencies: numpy, soundfile (Ogg Vorbis encoder).
python scripts/synthesize-requested-audio.py [--encoder-path <optional package dir>]
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--encoder-path', type=Path)
args = parser.parse_args()
if args.encoder_path:
    sys.path.insert(0, str(args.encoder_path.resolve()))
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
SR = 44100
RNG = np.random.default_rng(20261106)
report = []


def hz(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69) / 12)


def voice(note: float, seconds: float, kind: str = 'keys') -> np.ndarray:
    t = np.arange(round(SR * seconds)) / SR
    f = hz(note)
    attack = 1.0 - np.exp(-t / .012)
    release = np.minimum(1, np.maximum(0, (seconds - t) / .08))
    if kind == 'pad':
        wave = np.sin(2*np.pi*f*t) + .18*np.sin(2*np.pi*2*f*t)
        env = np.sin(np.pi*np.minimum(t / seconds, 1)) ** .7
    elif kind == 'bass':
        wave = np.sin(2*np.pi*f*t) + .12*np.sin(2*np.pi*2*f*t)
        env = attack * np.exp(-t / .32) * release
    elif kind == 'pluck':
        wave = (np.sin(2*np.pi*f*t) + .27*np.sin(2*np.pi*3*f*t) / 3
                + .12*np.sin(2*np.pi*5*f*t) / 5)
        env = attack * np.exp(-t / .24) * release
    elif kind == 'bell':
        wave = np.sin(2*np.pi*f*t) + .26*np.sin(2*np.pi*f*2*t) + .1*np.sin(2*np.pi*f*3*t)
        env = (1-np.exp(-t/.003)) * np.exp(-t/.27) * release
    else:
        wave = np.sin(2*np.pi*f*t) + .2*np.sin(2*np.pi*f*2*t) + .07*np.sin(2*np.pi*f*3*t)
        env = attack * np.exp(-t/.46) * release
    return wave * env


def put(track: np.ndarray, sound: np.ndarray, start: float, gain: float, loop: bool = True):
    pos = round(start * SR)
    if loop:
        indices = (np.arange(len(sound)) + pos) % len(track)
        np.add.at(track, indices, sound * gain)
    else:
        n = max(0, min(len(sound), len(track)-pos))
        if n:
            track[pos:pos+n] += sound[:n] * gain


def stereo(mono: np.ndarray, *, loop: bool) -> np.ndarray:
    delay = round(.027 * SR)
    if loop:
        side = np.roll(mono, delay)
    else:
        side = np.concatenate((np.zeros(delay), mono[:-delay]))
    return np.column_stack((mono*.91+side*.09, mono*.89+side*.11))


def save(name: str, mono: np.ndarray, loop: bool, description: str):
    mono = mono - np.mean(mono)
    if not loop:
        fade = min(round(.012*SR), len(mono)//4)
        mono[:fade] *= np.linspace(0,1,fade)
        mono[-fade:] *= np.linspace(1,0,fade)
    # Headroom for lossy-codec overshoot; no limiting/clipping.
    target = .43 if loop else .59
    mono *= target / max(float(np.max(np.abs(mono))), 1e-9)
    samples = stereo(mono, loop=loop)
    target_path = OUT / (name + '.ogg')
    assert np.isfinite(samples).all()
    print(f'Encoding {name}...', flush=True)
    # Small blocks keep encoder memory bounded on Windows.
    with sf.SoundFile(target_path, mode='w', samplerate=SR, channels=2,
                      format='OGG', subtype='VORBIS') as output:
        for offset in range(0,len(samples),8192):
            output.write(samples[offset:offset+8192].astype(np.float32))
    decoded, rate = sf.read(target_path, always_2d=True)
    peak = float(np.max(np.abs(decoded)))
    rms = float(np.sqrt(np.mean(decoded**2)))
    duration = len(decoded)/rate
    assert rate == SR and decoded.shape[1] == 2
    assert peak < .98 and rms > .005
    assert abs(duration-len(mono)/SR) < 1/SR
    boundary = float(np.max(np.abs(decoded[0]-decoded[-1])))
    if loop:
        assert boundary < .025, (name, boundary)
    report.append(dict(path=str(target_path.relative_to(ROOT)).replace('\\','/'),
        sampleRate=rate, channels=2, frames=len(decoded), seconds=duration,
        peak=round(peak,6), rms=round(rms,6), loop=loop,
        loopBoundaryDelta=round(boundary,6),
        sha256=hashlib.sha256(target_path.read_bytes()).hexdigest(),
        description=description, externalSamples=False))
    print(f'OK {name}: {duration:.2f}s, peak={peak:.3f}, rms={rms:.3f}, loop seam={boundary:.5f}')


# Original 8-bar chord route. MIDI notes are a recipe, not an audio transcription.
CHORDS = [(48,52,55,59),(45,48,52,55),(50,53,57,60),(43,47,50,53),
          (52,55,59,62),(45,48,52,55),(41,45,48,52),(43,47,50,53)]
PREP_MELODY = [
    [(0,76),(.75,79),(2,74),(3,72)], [(0,76),(1.5,72),(2.5,69)],
    [(.5,74),(1.5,77),(3,76)], [(0,74),(1,71),(2.5,67)],
    [(0,76),(1,79),(2.5,83)], [(.5,81),(1.5,76),(3,72)],
    [(0,77),(1.5,76),(2.5,72)], [(0,74),(1.5,71),(3,67)]
]
LIVE_MELODY = [
    [(0,72),(.5,76),(1.5,79),(2.5,76),(3.5,74)],
    [(0,69),(.75,72),(1.5,76),(2.5,79),(3.25,76)],
    [(0,74),(.5,77),(1.5,81),(2.25,77),(3.5,76)],
    [(0,71),(1,74),(1.75,79),(2.75,77),(3.5,74)],
    [(0,76),(.5,79),(1.25,83),(2.25,79),(3.5,76)],
    [(0,72),(.75,76),(1.5,81),(2.5,79),(3.25,76)],
    [(0,69),(.5,72),(1.5,77),(2.25,76),(3.5,72)],
    [(0,71),(.75,74),(1.5,79),(2.5,74),(3.5,71)]
]


def bgm(name: str, bpm: int, bars: int, live: bool):
    beat = 60 / bpm
    duration = bars * 4 * beat
    track = np.zeros(round(SR*duration))
    for bar in range(bars):
        origin = bar*4*beat
        chord = CHORDS[bar%8]
        # Soft breathing chord bed crosses boundaries circularly.
        for n in chord:
            put(track, voice(n+12, beat*4.5,'pad'),origin-.2,.026 if live else .038)
        for b in [0,2]:
            put(track, voice(chord[0]-12,.48,'bass'),origin+b*beat,.15 if live else .12)
        # Original broken-chord accompaniment. Melodies vary by 8-bar phrase.
        offsets = [0,.5,1,1.5,2,2.5,3,3.5] if live else [0,1,2,3]
        for i,b in enumerate(offsets):
            put(track,voice(chord[i%4]+12,.52,'pluck' if live else 'keys'),origin+b*beat,.065 if live else .05)
        melody = LIVE_MELODY[bar%8] if live else PREP_MELODY[bar%8]
        phrase = bar//8
        for b,n in melody:
            octave = 12 if phrase%4==3 and b==0 else 0
            # Leave breathing room in alternating phrases.
            if not live and phrase%2==1 and b==3:
                continue
            put(track,voice(n+octave,.68 if live else .92,'pluck' if live else 'keys'),origin+b*beat,.105 if live else .095)
        if live:
            for b in [0,2]:
                t=np.arange(round(SR*.15))/SR
                kick=np.sin(2*np.pi*(60*t+25*.022*(1-np.exp(-t/.022))))*np.exp(-t/.035)
                put(track,kick,origin+b*beat,.12)
            for b in [.5,1.5,2.5,3.5]:
                noise=RNG.normal(0,1,round(SR*.055))
                noise=np.diff(noise,prepend=0)*np.exp(-np.arange(len(noise))/SR/.012)
                put(track,noise,origin+b*beat,.012)
    save(name,track,True,'직접 쓴 코드·멜로디와 합성 악기. '+('경쾌한 방송용 플럭·베이스·가벼운 리듬' if live else '차분한 준비용 건반·패드·베이스'))


bgm('bgm-prep',80,32,False)
bgm('bgm-live',100,40,True)


def sfx(name,seconds,notes):
    track=np.zeros(round(SR*seconds))
    for start,n,length,gain,kind in notes:
        put(track,voice(n,length,kind),start,gain,False)
    save(name,track,False,'직접 합성한 짧은 상황 알림. 외부 샘플·목소리 없음.')


sfx('sfx-click',.09,[(0,81,.085,.3,'pluck')])
sfx('sfx-great',.95,[(0,72,.32,.5,'bell'),(.12,76,.36,.5,'bell'),(.24,79,.42,.5,'bell'),(.38,84,.56,.47,'bell')])
sfx('sfx-miss',.55,[(0,69,.25,.4,'keys'),(.15,65,.3,.36,'keys'),(.3,64,.24,.24,'keys')])
sfx('sfx-donation',.8,[(0,76,.3,.4,'bell'),(.12,79,.35,.45,'bell'),(.25,81,.4,.43,'bell'),(.39,88,.4,.3,'bell')])
curtain=np.zeros(round(SR*1.2))
t=np.arange(len(curtain))/SR
noise=RNG.normal(0,1,len(t))
soft=np.convolve(noise,np.ones(24)/24,mode='same')
curtain+=soft*np.sin(np.pi*t/1.2)**2*.22
for pos,n in [(0.28,67),(.46,72),(.65,76)]:
    put(curtain,voice(n,.48,'keys'),pos,.3,False)
save('sfx-curtain',curtain,False,'직접 만든 부드러운 천 스침 잡음과 짧은 상승 건반 화음.')
sfx('sfx-badge',1.1,[(0,79,.35,.42,'bell'),(.12,84,.4,.45,'bell'),(.26,88,.55,.4,'bell'),(.5,84,.55,.35,'bell')])
(ROOT/'docs'/'audio-validation-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
