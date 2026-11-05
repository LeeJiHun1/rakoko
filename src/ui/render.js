// 화면 그리기. 매번 #app 전체를 다시 그리되(가상 DOM 없음), 열린 접힘 패널과 포커스는 유지한다.
import {$, btn, money} from './dom.js';
import {applyPreferences} from './preferences.js';
import {store} from './store.js';
import {endingChoices, creditsScreen} from './views/ending.js';
import {eventScreen} from './views/event.js';
import {journal} from './views/journal.js';
import {dayHeader, isLive, navigation, studio, topbar} from './views/layout.js';
import {prep} from './views/prep.js';
import {projects} from './views/projects.js';
import {resultScreen} from './views/result.js';
import {wardrobe} from './views/wardrobe.js';
import {wrap} from './views/wrap.js';

/** 탭 화면(방송하기 제외) */
const TAB_SCREENS = {projects, wardrobe, journal};
/** 방송하기 탭: 진행 단계별 화면 */
const PHASE_SCREENS = {prep, event: eventScreen, result: resultScreen, ending: endingChoices, credits: creditsScreen, wrap};

function currentScreen() {
  const {view, state} = store;
  if (Object.hasOwn(TAB_SCREENS, view)) return TAB_SCREENS[view]();
  return (Object.hasOwn(PHASE_SCREENS, state.phase) ? PHASE_SCREENS[state.phase] : wrap)();
}

/** 열린 <details> 식별 키: summary 문구 + 같은 문구 중 순번 (HTML 에 별도 id 를 넣지 않기 위함) */
function detailsWithKeys(root) {
  const seen = {};
  return [...root.querySelectorAll('details')].map(d => {
    const label = d.querySelector(':scope > summary')?.textContent.trim() || '';
    seen[label] = (seen[label] || 0) + 1;
    return [d, `${label}#${seen[label]}`];
  });
}

const FOCUS_ATTRS = ['action', 'view', 'change', 'id', 'kind', 'index', 'event'];
/** 포커스된 컨트롤을 다시 찾을 선택자(data-* 조합). 다시 그린 뒤 키보드 위치를 잃지 않게 한다. */
function focusSelector(root) {
  const el = document.activeElement;
  if (!el || el === document.body || !root.contains(el)) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts = FOCUS_ATTRS.filter(a => el.dataset[a] != null).map(a => `[data-${a}="${CSS.escape(el.dataset[a])}"]`);
  return parts.length ? el.tagName.toLowerCase() + parts.join('') : null;
}

/** 다시 그리기 전 화면 상태(열린 패널·포커스)를 기억했다가 복원하는 함수를 돌려준다. */
function preserveUiState(root) {
  const open = new Set(detailsWithKeys(root).filter(([d]) => d.open).map(([, key]) => key));
  const focus = focusSelector(root);
  return () => {
    for (const [d, key] of detailsWithKeys(root)) if (open.has(key)) d.open = true;
    if (focus) root.querySelector(focus)?.focus({preventScroll: true});
  };
}

export function render() {
  const {state, catalog, stale} = store;
  if (!state || !catalog) return;
  applyPreferences();
  const active = isLive(state);
  const screen = currentScreen();
  const app = $('#app');
  const restore = preserveUiState(app);
  app.innerHTML = `${topbar()}<main class="shell">${stale?'<div class="stale-banner">다른 탭에서 새로운 일지를 저장했어요. '+btn('최신 기록 불러오기','reload','','text-button')+'</div>':''}<div class="page-kicker"><span>STORY SIMULATION <i>✦</i> FAN MADE WITH LOVE</span><span class="episode-label">${state.broadcastIndex}번째 방송${active?' · 진행 중':''}</span></div><div class="game-layout">${studio()}<section class="notebook">${navigation()}<div class="notebook-inner">${dayHeader()}<div class="wallet"><span>방송 자금 <b>${money(state.cash)}</b></span><span>${state.date.slice(0,4)}년의 기록</span></div>${screen}</div></section></div><footer class="site-footer"><span>작은 선택들이 모여, 우리만의 방송이 된다.</span><button data-action="about">라코코와 키몽이들을 위한 비공식 팬게임 · v0.1</button></footer></main>`;
  restore();
  for (const img of app.querySelectorAll('img')) img.addEventListener('error', () => { img.classList.add('image-unavailable'); img.alt = img.alt || '이미지를 불러오지 못했어요'; }, {once: true});
}

/** 장면이 바뀌면 일지 패널로 스크롤하고 제목에 포커스(스크린리더용) */
export function focusScene() {
  requestAnimationFrame(() => {
    const panel = $('.notebook');
    panel?.scrollIntoView({block: 'start', behavior: 'auto'});
    const heading = panel?.querySelector('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({preventScroll: true});
  });
}

export function goView(next) { store.view = next; render(); focusScene(); }
