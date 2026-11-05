// 시작: 카탈로그 로드 → 저장본 불러오기(실패 시 직전 저장으로 복구) → 첫 화면.
import {newGame, validateSave} from '../engine.js';
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
    return {state: saved ? validateSave(saved, catalog) : newGame(), fresh: !saved};
  } catch (error) {
    const backup = await storage.recover();
    if (!backup) throw error;
    const state = validateSave(backup, catalog);
    await storage.save(state, null, {replace: true});
    toast('직전의 정상 기록을 복구했어요.');
    return {state, fresh: false};
  }
}

function showBootError(error) {
  document.querySelector('#app').innerHTML = `<div class="boot error"><span>▥</span><h1>일지를 펼치지 못했어요.</h1><p>${escape(error.message)}</p><p>브라우저 저장이 허용되어 있는지 확인하고 다시 열어주세요.</p><button class="button primary" onclick="location.reload()">다시 시도</button></div>`;
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
    render();
    if (state.phase === 'credits') showCredits();
  } catch (error) {
    showBootError(error);
  }
}
