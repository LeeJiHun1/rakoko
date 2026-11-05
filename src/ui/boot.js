// 시작: 카탈로그 로드 → 저장본 불러오기(실패 시 직전 저장으로 복구) → 첫 화면.
import {loadSave, newGame} from '../engine.js';
import * as storage from '../storage.js';
import {installEventHandlers} from './actions.js';
import {showCredits} from './dialogs.js';
import {escape} from './dom.js';
import {toast} from './feedback.js';
import {installBackdropClose} from './modal.js';
import {render} from './render.js';
import {store} from './store.js';
import {listenForOtherTabs} from './sync.js';

async function loadCatalog() {
  const response = await fetch('./src/data/catalog.json');
  if (!response.ok) throw Error('게임 이야기를 불러오지 못했어요.');
  return response.json();
}

/** 저장본이 깨졌으면 직전 저장본으로 복구한다. 둘 다 없거나 깨졌으면 예외. */
async function loadState(catalog) {
  const saved = await storage.load();
  try {
    return {state: saved ? loadSave(saved, catalog) : newGame(), fresh: !saved};
  } catch (error) {
    const backup = await storage.recover();
    if (!backup) throw error;
    const state = loadSave(backup, catalog);
    await storage.save(state, null, {replace: true});
    toast('직전의 정상 기록을 복구했어요.');
    return {state, fresh: false};
  }
}

/** 저장본·백업이 모두 쓸 수 없을 때의 탈출구: 다시 시도 / 원본 내보내기 / 새 일지 (actions.js 의 boot* 동작) */
function showBootError(error) {
  document.querySelector('#app').innerHTML = `<div class="boot error"><span>▥</span><h1>일지를 펼치지 못했어요.</h1><p>${escape(error.message)}</p><p>브라우저 저장이 허용되어 있는지 확인하고 다시 열어주세요.</p><div class="boot-actions"><button class="button primary" data-action="bootRetry">다시 시도</button><button class="button secondary" data-action="bootRecover">직전 저장으로 되돌리기</button><button class="button secondary" data-action="bootExportRaw">저장된 일지 원본 내보내기</button><button class="text-button danger" data-action="bootReset">새 일지로 시작하기</button></div><p class="boot-note">새 일지로 시작해도 직전 정상 저장(백업)은 남겨 둬요. 먼저 원본을 내보내 두는 것을 권해요.</p></div>`;
}

export async function boot() {
  listenForOtherTabs(render);
  installEventHandlers();
  installBackdropClose();
  try {
    store.catalog = await loadCatalog();
    const {state, fresh} = await loadState(store.catalog);
    store.state = state;
    if (fresh) await storage.save(state, null, {replace: true});
    try { render(); } catch (renderError) {
      // 검증은 통과했지만 그릴 수 없는 저장본 → 부팅 실패 화면(되돌리기·내보내기·새 일지)
      store.state = null;
      throw renderError;
    }
    if (state.phase === 'credits') showCredits();
  } catch (error) {
    showBootError(error);
  }
}
