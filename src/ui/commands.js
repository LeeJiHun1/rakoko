// 게임 명령 실행: 엔진 dispatch → 저장 성공 → 화면 교체. 저장이 실패하면 화면은 이전 상태를 유지한다.
import {dispatch} from '../engine.js';
import * as storage from '../storage.js';
import {showCredits} from './dialogs.js';
import {clickSound} from './feedback.js';
import {focusScene, render} from './render.js';
import {store} from './store.js';
import {announceSaved} from './sync.js';

const newCommandId = () => `ui:${Date.now()}:${crypto.getRandomValues(new Uint32Array(1))[0]}`;

export async function runCommand(type, params = {}) {
  if (store.busy) return;
  if (store.stale) throw Error('먼저 최신 일지를 불러와 주세요.');
  store.busy = true;
  let saving = false;
  const previousPhase = store.state.phase;
  try {
    const next = dispatch(store.state, {...params, type, commandId: newCommandId()}, store.catalog);
    saving = true;
    await storage.save(next, store.state);
    store.state = next;
    store.saveError = false;
    store.busy = false;
    announceSaved(store.state);
    clickSound();
    render();
    if (store.state.phase !== previousPhase) focusScene();
    if (store.state.phase === 'credits') showCredits();
  } catch (e) {
    store.saveError = saving;
    store.busy = false;
    render();
    throw e;
  } finally {
    store.busy = false;
  }
}

/** 저장본을 통째로 바꾼다(새 일지·가져오기). 다른 탭의 변경을 덮어쓴다. */
export async function replaceState(next) {
  await storage.save(next, store.state, {replace: true});
  store.state = next;
  store.stale = false;
  store.view = 'broadcast';
}
