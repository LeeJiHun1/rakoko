// 짧은 알림(토스트)과 클릭 효과음.
import {$} from './dom.js';
import {preferences} from './preferences.js';

let toastTimer;
export function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
}

/** 장면이 바뀌면 이전 화면의 알림을 닫는다 */
export function hideToast() { clearTimeout(toastTimer); $('#toast').classList.remove('show'); }

let audio;
/** 짧은 음 여러 개를 이어 낸다: [[주파수, 시작(초), 길이(초)], ...] */
function tones(notes, volume = .04) {
  if (!preferences.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    for (const [freq, at, len] of notes) {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + at;
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(volume, t0);
      g.gain.exponentialRampToValueAtTime(.001, t0 + len);
      o.connect(g); g.connect(audio.destination);
      o.start(t0); o.stop(t0 + len + .02);
    }
  } catch {}
}

const CUES = {
  great: [[523, 0, .12], [659, .08, .12], [784, .16, .2]],
  miss: [[392, 0, .14], [311, .12, .22]],
  donation: [[988, 0, .08], [1319, .07, .18]],
  record: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .3]],
};
/** 장면 효과음 (효과음 설정이 켜져 있을 때만) */
export const playCue = name => tones(CUES[name] || []);

export function clickSound() {
  if (!preferences.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(580, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(360, audio.currentTime + .07);
    g.gain.setValueAtTime(.045, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .09);
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + .1);
  } catch {}
}
