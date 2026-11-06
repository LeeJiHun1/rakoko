// 버튼(data-action)·입력(data-change) 처리표.
// - UI_ACTIONS: 화면 전환·대화상자처럼 UI 안에서 끝나는 동작
// - 그 밖의 data-action 은 같은 이름의 엔진 명령으로 실행한다(runCommand).
import {addDays, loadSave, newGame, nextMilestone} from '../engine.js';
import * as storage from '../storage.js';
import {replaceState, runCommand} from './commands.js';
import {maybeShowGuide, openAbout, openAchievements, openCollection, openConfirmNew, openDatePicker, openEndingConfirm, openImportConfirm, openSettings, showCredits, updateDateWarning} from './dialogs.js';
import {$} from './dom.js';
import {clickSound, toast} from './feedback.js';
import {closeDialog} from './modal.js';
import {preferences, savePreferences} from './preferences.js';
import {focusScene, goView, render} from './render.js';
import {clearPendingImport, downloadJournal, exportSave, getPendingImport, readImportFile} from './save-files.js';
import {store} from './store.js';
import {announceSaved} from './sync.js';

const nearestCelebration = date => [nextMilestone(date, 'birthday'), nextMilestone(date, 'anniversary')].sort()[0];

async function moveDate(date) {
  await runCommand('date', {date});
  store.view = 'broadcast';
  render();
}

const UI_ACTIONS = {
  broadcast: () => goView('broadcast'),
  projects: () => goView('projects'),
  wardrobe: () => goView('wardrobe'),
  closeModal: () => closeDialog(),
  credits: () => showCredits(),
  viewJournal: () => { closeDialog(); store.view = 'journal'; render(); },
  export: () => exportSave(),
  async reload() {
    const loaded = await storage.load();
    if (!loaded) return;
    store.state = loadSave(loaded, store.catalog);
    store.stale = false;
    store.saveError = false;
    render();
    toast('최신 일지를 불러왔어요.');
  },
  datePicker: () => openDatePicker(),
  includeProject: () => runCommand('plan', {index: 1, corner: 'S'}),
  quickDate(button) { $('#next-date').value = nextMilestone(store.state.date, button.dataset.kind); updateDateWarning(); },
  async submitDate() {
    await runCommand('date', {date: $('#next-date').value});
    if (store.state.phase !== 'credits') closeDialog();
    store.view = 'broadcast';
    render();
  },
  nextWeek: () => moveDate(addDays(store.state.date, 7)),
  nextCelebration: () => moveDate(nearestCelebration(store.state.date)),
  settings: () => openSettings(),
  about: () => openAbout(),
  collection: () => openCollection(),
  achievements: () => openAchievements(),
  moreJournal() { store.journalLimit = (store.journalLimit || 20) + 20; render(); },
  confirmNew: () => openConfirmNew(),
  async new() {
    await replaceState(newGame());
    closeDialog();
    announceSaved(store.state);
    render();
    try { localStorage.removeItem('rakoko-guide-seen'); } catch {}
    maybeShowGuide();
  },
  async commitImport() {
    const before = store.state;
    await replaceState(getPendingImport());
    clearPendingImport();
    closeDialog();
    try { render(); } catch (error) {
      // 검증은 통과했지만 화면에 그릴 수 없는 일지 → 원래 일지로 되돌린다
      await replaceState(before, {keepPrevious: true});
      render();
      throw Error('이 일지는 화면에 표시할 수 없어 가져오지 않았어요.');
    }
    announceSaved(store.state);
  },
  ending: button => openEndingConfirm(button.dataset.id),
  confirmEnding: button => runCommand('ending', {id: button.dataset.id}),
  // 부팅 실패 화면 전용
  bootRetry: () => location.reload(),
  async bootExportRaw() {
    const raw = await storage.load();
    if (!raw) { toast('저장된 일지가 없어요.'); return; }
    downloadJournal(raw, 'rakoko-journal-original.json');
    toast('저장된 원본을 파일로 내보냈어요.');
  },
  async bootRecover() {
    if (!store.catalog) { location.reload(); return; }
    const backup = await storage.recover();
    if (!backup) { toast('되돌릴 직전 저장이 없어요.'); return; }
    const state = loadSave(backup, store.catalog);
    await replaceState(state, {keepPrevious: true});
    announceSaved(store.state);
    render();
    toast('직전 저장으로 되돌렸어요.');
  },
  async bootReset() {
    if (!confirm('새 일지로 시작할까요? 직전 정상 저장(백업)은 그대로 남겨 둬요.')) return;
    if (!store.catalog) { location.reload(); return; }
    await replaceState(newGame(), {keepPrevious: true}); // 깨진 현재본이 정상 백업을 덮지 않게
    announceSaved(store.state);
    render();
    toast('새 일지를 펼쳤어요. 직전 정상 저장은 백업 칸에 남아 있어요.');
  },
  async continue() {
    await runCommand('continue');
    closeDialog();
    store.view = 'broadcast';
    render();
  },
};

/** 명령 후 방송하기 탭으로 돌아가는 동작 */
const RETURN_TO_BROADCAST = ['start', 'project', 'joinModule', 'resumeProject'];
const COMMAND_TOASTS = {
  craftAndPrepare: '새 옷의 준비도가 25 올랐어요.',
  prepare: '오늘의 준비를 기록했어요.',
  equip: '새로운 분위기로, 오늘의 코코.',
};

async function runEngineAction(action, button) {
  const d = button.dataset;
  await runCommand(action, {id: d.id, index: Number(d.index), action: d.kind, eventId: d.event, choiceId: d.id, outfitId: d.id});
  if (RETURN_TO_BROADCAST.includes(action)) { store.view = 'broadcast'; focusScene(); }
  render();
  if (Object.hasOwn(COMMAND_TOASTS, action)) toast(COMMAND_TOASTS[action]);
}

async function onClick(e) {
  const button = e.target.closest('[data-action],[data-view]');
  if (!button || button.disabled) return;
  e.preventDefault();
  if (button.dataset.view) { goView(button.dataset.view); return; }
  const action = button.dataset.action;
  try {
    if (Object.hasOwn(UI_ACTIONS, action)) await UI_ACTIONS[action](button);
    else await runEngineAction(action, button);
  } catch (error) {
    toast(error.message || '일지를 처리하지 못했어요.');
  }
}

const PREFERENCE_INPUTS = ['font-size', 'font-style', 'motion-toggle', 'sound-toggle', 'music-toggle'];

async function onChange(e) {
  try {
    const el = e.target;
    if (el.dataset.change === 'plan') await runCommand('plan', {index: Number(el.dataset.index), corner: el.value});
    if (el.dataset.change === 'game') await runCommand('game', {gameId: el.value});
    if (el.id === 'next-date') updateDateWarning();
    if (el.id === 'import-file' && el.files[0]) openImportConfirm(await readImportFile(el.files[0]));
    if (PREFERENCE_INPUTS.includes(el.id)) {
      preferences.textSize = Number($('#font-size').value);
      preferences.font = $('#font-style').value;
      preferences.reducedMotion = $('#motion-toggle').checked;
      preferences.sound = $('#sound-toggle').checked;
      preferences.music = $('#music-toggle').checked;
      savePreferences();
      render();
      clickSound();
    }
  } catch (error) {
    toast(error.message);
  }
}

/** 키보드: 1~4 선택지, Enter/→ 지금 화면의 주 버튼(방송 켜기·다음 코너·7일 뒤). 입력 중·대화상자 열림·다른 탭이면 무시 */
const PRIMARY_ACTIONS = ['[data-action="advance"]', '[data-action="start"]', '[data-action="nextWeek"]'];
function onKeydown(e) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || store.view !== 'broadcast' || document.querySelector('#modal')?.open) return;
  const el = document.activeElement;
  if (el && (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable)) return;
  let target = null;
  if (/^[1-4]$/.test(e.key)) target = document.querySelectorAll('#app .choice')[Number(e.key) - 1];
  else if ((e.key === 'Enter' || e.key === 'ArrowRight') && !(el && el.tagName === 'BUTTON')) target = PRIMARY_ACTIONS.map(s => document.querySelector(`#app ${s}`)).find(Boolean);
  if (!target || target.disabled) return;
  e.preventDefault();
  target.click();
}

export function installEventHandlers() {
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
}
