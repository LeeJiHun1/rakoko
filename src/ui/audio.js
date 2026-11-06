// 소리: 효과음(설정 '효과음') · 배경음악(설정 '배경음악', 준비/방송 2곡 반복). 둘 다 기본 꺼짐.
// 음원은 직접 합성한 오리지널(docs/ASSET-DELIVERY-v2.md). Ogg 를 못 읽는 브라우저면 false 를 돌려
// 호출 쪽(feedback.js)이 기존 비프음으로 대신한다. 배경음악은 그런 브라우저에선 조용히 생략.
import {BGM, SFX} from './assets.js';
import {preferences} from './preferences.js';

const SFX_VOLUME = .55, BGM_VOLUME = .32, FADE_MS = 600;
let oggSupport;
export function canPlayOgg() {
  try { oggSupport ??= typeof Audio === 'function' && !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch { oggSupport = false; }
  return oggSupport;
}

const sfxCache = {};
/** 효과음 재생. 재생을 시도했으면 true(설정 꺼짐 포함), 이 브라우저에서 못 쓰면 false */
export function playSfx(name) {
  if (!preferences.sound) return true;
  if (!SFX[name] || !canPlayOgg()) return false;
  try {
    sfxCache[name] ??= new Audio(SFX[name]);
    const a = sfxCache[name].paused ? sfxCache[name] : sfxCache[name].cloneNode(); // 연달아 누르면 겹쳐 재생
    a.volume = SFX_VOLUME; a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
  return true;
}

let music = null, musicTrack = null, wanted = null, unlockArmed = false;
const fades = new WeakMap(); // 곡마다 따로(이전 곡 페이드아웃과 새 곡 페이드인이 겹친다)

function fadeTo(el, target, done) {
  clearInterval(fades.get(el));
  const start = el.volume, t0 = performance.now();
  fades.set(el, setInterval(() => {
    const t = Math.min(1, (performance.now() - t0) / FADE_MS);
    el.volume = start + (target - start) * t;
    if (t >= 1) { clearInterval(fades.get(el)); done?.(); }
  }, 40));
}

/** 자동 재생이 막히면 다음 클릭·키 입력 때 다시 시도한다 */
function armUnlock() {
  if (unlockArmed) return;
  unlockArmed = true;
  const retry = () => { unlockArmed = false; removeEventListener('pointerdown', retry); removeEventListener('keydown', retry); applyMusic(); };
  addEventListener('pointerdown', retry, {once: true});
  addEventListener('keydown', retry, {once: true});
}

function applyMusic() {
  const track = preferences.music && canPlayOgg() && document.visibilityState !== 'hidden' ? wanted : null;
  if (track === musicTrack && (!music || !music.paused)) return;
  const old = music;
  if (old) { music = null; musicTrack = null; fadeTo(old, 0, () => old.pause()); }
  if (!track) return;
  const el = new Audio(BGM[track]);
  el.loop = true; el.volume = 0;
  music = el; musicTrack = track;
  el.play().then(() => fadeTo(el, BGM_VOLUME)).catch(() => { if (music === el) { music = null; musicTrack = null; } armUnlock(); });
}

/** render() 뒤 호출: 방송 중이면 방송 곡, 그 밖에는 준비 곡 */
export function syncMusic(live) {
  wanted = live ? 'live' : 'prep';
  applyMusic();
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', applyMusic);
