// 일지 파일 내보내기/가져오기. 가져온 파일은 신뢰할 수 없는 입력이므로 validateSave 를 반드시 거친다.
import {validateSave} from '../engine.js';
import {toast} from './feedback.js';
import {store} from './store.js';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
let pendingImport = null;

export function exportSave() {
  const {state} = store;
  const blob = new Blob([JSON.stringify({kind: 'rakoko-journal', version: 1, state}, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = `rakoko-${state.date}-${state.broadcastIndex}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('일지를 파일로 내보냈어요.');
}

/** 파일을 읽고 검증해 가져오기 대기 상태로 둔다. 저장에 성공한 뒤 clearPendingImport() 한다. */
export async function readImportFile(file) {
  if (file.size > MAX_IMPORT_BYTES) throw Error('5MB 이하의 일지 파일을 골라주세요.');
  const doc = JSON.parse(await file.text());
  if (doc.kind !== 'rakoko-journal') throw Error('라코코 방송일지 파일이 아니에요.');
  pendingImport = validateSave(doc.state, store.catalog);
  return pendingImport;
}

export const getPendingImport = () => pendingImport;
export function clearPendingImport() { pendingImport = null; }
