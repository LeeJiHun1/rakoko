// 일지 파일 내보내기/가져오기. 가져온 파일은 신뢰할 수 없는 입력이므로 loadSave(변환+검증)를 반드시 거친다.
import {loadSave} from '../engine.js';
import {toast} from './feedback.js';
import {store} from './store.js';

/** 저장 한도(최대 40,000회 방송)에 맞춘 가져오기 한도 */
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
let pendingImport = null;

/** 일지 파일 다운로드. state 는 검증 전 원본일 수도 있다(부팅 실패 화면의 원본 내보내기). */
export function downloadJournal(state, filename) {
  const blob = new Blob([JSON.stringify({kind: 'rakoko-journal', version: 1, state})], {type: 'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSave() {
  const {state} = store;
  downloadJournal(state, `rakoko-${state.date}-${state.broadcastIndex}.json`);
  toast('일지를 파일로 내보냈어요.');
}

/** 파일을 읽고 검증해 가져오기 대기 상태로 둔다. 저장에 성공한 뒤 clearPendingImport() 한다. */
export async function readImportFile(file) {
  if (file.size > MAX_IMPORT_BYTES) throw Error('64MB 이하의 일지 파일을 골라주세요.');
  const doc = JSON.parse(await file.text());
  if (doc.kind !== 'rakoko-journal') throw Error('라코코 방송일지 파일이 아니에요.');
  pendingImport = loadSave(doc.state, store.catalog);
  return pendingImport;
}

export const getPendingImport = () => pendingImport;
export function clearPendingImport() { pendingImport = null; }
