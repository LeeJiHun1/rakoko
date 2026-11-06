// 화면 연출(F5, 사용자 결정 Q6: CSS·효과음 수준). 게임 상태는 바꾸지 않는다.
// 같은 장면을 다시 그릴 때는 반복하지 않고, "동작 줄이기"(설정·OS)면 최종 값만 보여 준다.
import {hideToast, playCue} from './feedback.js';
import {preferences} from './preferences.js';

let lastSceneKey = null, sceneStartedAt = 0;
/** 명령 직후 연달아 그리는 경우(같은 장면 0.6초 이내)는 연출을 이어간다 */
const CONTINUATION_MS = 600;

const reducedMotion = () => preferences.reducedMotion || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const sceneKey = s => `${s.runId}:${s.broadcastIndex}:${s.slot}:${s.phase}`;

/** data-count-to 숫자를 0 → 목표로 올린다. 원래 문구의 앞(+)·뒤(원) 표기는 유지. */
function countUp(el, duration = 700) {
  const target = Number(el.dataset.countTo), original = el.textContent;
  if (!Number.isFinite(target) || target <= 0) return;
  const prefix = original.startsWith('+') ? '+' : '', suffix = original.endsWith('원') ? '원' : '';
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration), eased = 1 - (1 - t) ** 3;
    el.textContent = t < 1 ? `${prefix}${Math.round(target * eased).toLocaleString('ko-KR')}${suffix}` : original;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** render() 직후 호출. 새 장면일 때만 연출·효과음을 낸다. */
export function playSceneEffects(root, state) {
  const key = sceneKey(state), now = performance.now();
  const sameScene = key === lastSceneKey;
  if (sameScene && now - sceneStartedAt > CONTINUATION_MS) { root.classList.add('fx-settled'); return; }
  root.classList.remove('fx-settled');
  if (!sameScene && lastSceneKey) hideToast(); // 장면이 바뀌면 이전 화면 알림은 닫는다(첫 화면의 복구 알림은 유지)
  if (reducedMotion()) { root.classList.add('fx-settled'); lastSceneKey = key; return; }
  root.querySelectorAll('[data-count-to]').forEach(el => countUp(el));
  if (sameScene) return; // 연달아 그린 경우: 애니메이션만 이어가고 효과음은 한 번만
  lastSceneKey = key;
  sceneStartedAt = now;
  const r = state.result;
  if (state.phase === 'result' && r) {
    if (r.kind === 'reveal') playCue('curtain');
    else if (r.donation) playCue('donation');
    else if (r.grade === 'great') playCue('great');
    else if (r.grade === 'miss' || r.kind === 'revealFailed') playCue('miss');
  }
  if (state.phase === 'wrap' && r?.newRecords?.length) playCue('record');
}
