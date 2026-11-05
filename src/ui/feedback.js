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

let audio;
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
