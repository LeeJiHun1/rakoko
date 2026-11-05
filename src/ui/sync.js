// 여러 탭 동기화: 다른 탭이 더 새로운 일지를 저장하면 stale 표시.
import {store} from './store.js';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rakoko-journal') : null;

export function announceSaved(state) { channel?.postMessage({runId: state.runId, revision: state.revision}); }

export function listenForOtherTabs(onStale) {
  channel?.addEventListener('message', e => {
    const s = store.state, d = e.data;
    if (!d || typeof d.runId !== 'string' || !Number.isSafeInteger(d.revision)) return; // 형식이 다른 메시지는 무시
    if (s && (d.runId !== s.runId || d.revision > s.revision)) { store.stale = true; onStale(); }
  });
}
