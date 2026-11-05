// 브라우저별 편의 설정(글자 크기·글꼴·동작 줄이기·효과음). 게임 진행과 무관하므로 localStorage 사용.
const KEY = 'rakoko-preferences';
export const preferences = {font: 'readable', textSize: 100, reducedMotion: false, sound: false};
/** 저장된 설정은 허용 값만 받는다 */
function normalize(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  return {
    font: p.font === 'pixel' ? 'pixel' : 'readable',
    textSize: [100, 125, 150, 200].includes(Number(p.textSize)) ? Number(p.textSize) : 100,
    reducedMotion: p.reducedMotion === true,
    sound: p.sound === true,
  };
}
try { Object.assign(preferences, normalize(JSON.parse(localStorage.getItem(KEY) || '{}'))); } catch {}

export function savePreferences() { localStorage.setItem(KEY, JSON.stringify(preferences)); }

export function applyPreferences() {
  document.documentElement.style.setProperty('--text-scale', String(preferences.textSize / 100));
  document.body.classList.toggle('reduce-motion', preferences.reducedMotion);
  document.body.classList.toggle('pixel-text', preferences.font === 'pixel');
  document.body.classList.toggle('text-large', preferences.textSize >= 150); // 큰 글자용 모바일 레이아웃
}
