// 브라우저별 편의 설정(글자 크기·글꼴·동작 줄이기·효과음). 게임 진행과 무관하므로 localStorage 사용.
const KEY = 'rakoko-preferences';
export const preferences = {font: 'readable', textSize: 100, reducedMotion: false, sound: false};
try { Object.assign(preferences, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}

export function savePreferences() { localStorage.setItem(KEY, JSON.stringify(preferences)); }

export function applyPreferences() {
  document.documentElement.style.setProperty('--text-scale', String(preferences.textSize / 100));
  document.body.classList.toggle('reduce-motion', preferences.reducedMotion);
  document.body.classList.toggle('pixel-text', preferences.font === 'pixel');
}
