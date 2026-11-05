// 특별 기획: 시작 → 자료(0) → 시범(1) → 피드백(2) → 완료(3) → 마지막 특집 예약.
import {endingUnlocked, firstEndingDate} from './dates.js';
import {awardExperience, gain} from './growth.js';
import {unmet} from './requirements.js';
import {clone, setPath} from './util.js';

export const PROJECT_DONE_STEP = 3;
/** 시범 단계(1) 전에 같은 게임 연습이 필요한 경험 */
const NEEDS_PRACTICE = ['EX-003', 'EX-004', 'EX-005', 'EX-014'];
const PROMISE_EXPERIENCE = 'EX-019';

const findProject = (catalog, id) => catalog.projects.find(p => p.id === id);

export function projectLocks(s, def) {
  const reasons = [];
  if (def.requiresOutfit && Object.keys(s.wardrobe).length < 2) reasons.push('기본 의상 외에 공개한 옷 한 벌이 필요해요');
  if (def.eventId === 'EF-011' && !s.celebrations.some(x => x.startsWith('birthday:'))) reasons.push('같은 일지에서 생일 방송을 먼저 해주세요');
  return reasons;
}

export function projectProgressLocks(s, catalog) {
  if (!s.project) return [];
  const def = findProject(catalog, s.project.id), reasons = projectLocks(s, def);
  if (s.project.step === 1 && NEEDS_PRACTICE.includes(def.experienceId) && !s.project.practiced) reasons.push('이 기획과 같은 게임을 준비 행동으로 한 번 연습해주세요');
  return reasons;
}

export function finaleLocks(s, catalog) {
  const reasons = [];
  if (!s.project || s.project.step < PROJECT_DONE_STEP) reasons.push('현재 기획의 자료·시범·피드백을 먼저 마쳐주세요');
  if (!endingUnlocked(s)) reasons.push(`방송 150일째(${firstEndingDate()})부터 마지막 특집을 열 수 있어요`);
  if (s.deferUntil && s.date < s.deferUntil) reasons.push(`${s.deferUntil} 이후 다시 마무리 기획을 정할 수 있어요`);
  if (s.project) {
    const def = findProject(catalog, s.project.id);
    reasons.push(...unmet(s, def.requirements, catalog, s.project.gameId));
  }
  return [...new Set(reasons)];
}

const applyStoryConditions = (s, def) => { for (const f of def.storyConditions) setPath(s, f.path, f.value); };

/** 기획 사건에서 진행 선택을 했을 때 한 단계 전진 */
export function advanceProject(s, c, catalog) {
  const def = findProject(catalog, s.project.id);
  s.project.step++;
  s.project.lastProgress = s.broadcastIndex;
  s.project.log.push({date: s.date, text: c.outcome});
  if (s.project.step === 1 && def.experienceId === PROMISE_EXPERIENCE) s.project.promise = {createdBroadcast: s.broadcastIndex, fulfilled: false};
  if (s.project.step === 2 && s.project.promise) s.project.promise.fulfilled = true;
  if (s.project.step === PROJECT_DONE_STEP) {
    if (def.experienceId === PROMISE_EXPERIENCE && !s.project.promise?.fulfilled) throw Error('먼저 약속했던 기획을 진행해주세요.');
    applyStoryConditions(s, def);
    awardExperience(s, def.experienceId, `project:${s.project.instanceId}`, s.project.gameId, catalog);
    gain(s, 'awareness', 1);
    s.result.outcome += ' 기획 경험을 기록했다. 마무리에 필요한 능력이 갖춰지면 마지막 특집을 예약할 수 있다.';
  }
}

export const commands = {
  project: {prepOnly: true, run(s, c, catalog) {
    if (s.project && s.project.step < PROJECT_DONE_STEP) throw Error('현재 기획을 마치거나 보류해주세요.');
    const def = findProject(catalog, c.id);
    if (!def) throw Error('기획을 찾을 수 없어요.');
    const locks = projectLocks(s, def);
    if (locks.length) throw Error(locks.join(' · '));
    // 완료한 기획은 '보류한 기획'으로 남겨 언제든 이어서 그 결말로 갈 수 있게(새 기획을 시작해도 잃지 않음)
    if (s.project) s.projectArchive.push({...clone(s.project), paused: true});
    s.story = {endingProject: {accepted: true, eventId: def.eventId}};
    s.project = {id: def.id, eventId: def.eventId, boundGame: def.boundGame, instanceId: `${s.broadcastIndex}:${s.revision}`, gameId: s.gameId, step: 0, lastProgress: -1, practiced: false, log: []};
    s.plan[1] = 'S';
  }},
  pauseProject: {prepOnly: true, run(s) {
    if (!s.project) return;
    s.projectArchive.push({...s.project, paused: true});
    s.project = null;
    s.story = {};
  }},
  resumeProject: {prepOnly: true, run(s, c, catalog) {
    if (s.project) throw Error('현재 기획을 먼저 마무리하거나 보류해주세요.');
    const index = s.projectArchive.findIndex(p => p.instanceId === c.id && p.paused);
    if (index < 0) throw Error('보류한 기획을 찾지 못했어요.');
    s.project = s.projectArchive.splice(index, 1)[0];
    delete s.project.paused;
    s.story = {endingProject: {accepted: true, eventId: s.project.eventId}};
    if (s.project.step === PROJECT_DONE_STEP) applyStoryConditions(s, findProject(catalog, s.project.id));
    else s.plan[1] = 'S';
  }},
  /** 마지막 특집 예약 토글 */
  finale: {prepOnly: true, run(s, c, catalog) {
    const locks = finaleLocks(s, catalog);
    if (locks.length) throw Error(locks.join(' · '));
    s.finaleScheduled = !s.finaleScheduled;
  }},
};
