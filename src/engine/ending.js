// 결말: 일반 결말 제안(정산 직후) · 마지막 선택 · 미루기 · 계속하기 · 10년 강제 결말.
import {CONTINUE_COOLDOWN_DAYS, DEFER_ENDING_DAYS, ENDING_RECHECK_DAYS, FIRST_ENDING_DAYS} from './constants.js';
import {addDays, daysBetween, daysPlayed, endingUnlocked} from './dates.js';
import {unmet} from './requirements.js';
import {random} from './rng.js';
import {clone} from './util.js';

/** 예약이 없으면 30일마다 확률(150일째 5% + 120일마다 3%p, 최대 35%)로 결말을 제안한다. */
const endingChance = s => Math.min(.35, .05 + Math.floor((daysPlayed(s) - FIRST_ENDING_DAYS) / 120) * .03);

/** 방송 정산 직후 호출. 조건이 맞으면 phase 를 'ending' 으로 바꾼다. */
export function offerEndingIfReady(s, catalog) {
  if (!s.project || s.project.step < 3 || !endingUnlocked(s)) return;
  const e = catalog.endingEvents.find(e => e.id === s.project.eventId);
  if (unmet(s, e.eligibility.all, catalog).length || !e.choices.some(c => !unmet(s, c.prerequisites.all, catalog).length)) return;
  if (s.deferUntil && s.date < s.deferUntil) return;
  if (!s.finaleScheduled && s.lastEndingCheck && daysBetween(s.lastEndingCheck, s.date) < ENDING_RECHECK_DAYS) return;
  s.lastEndingCheck = s.date;
  if (s.finaleScheduled || random(s) < endingChance(s)) {
    s.phase = 'ending';
    s.event = clone(e);
    s.event.kind = 'ending';
  }
  s.finaleScheduled = false;
}

/** 결말 없이 2036-01-18 에 도달하면 강제 결말. 자산·능력 조건 없음(AGENTS.md 규칙). */
export function forceEnding(s) {
  const spouse = 1 + Math.floor(random(s) * 8);
  s.lastEnding = {id: 'END-FORCED-10Y', title: '10년의 방송, 둘의 엔딩', forced: true, spouse,
    resolution: `다수의 키몽이 중 한 명, 키몽이 ${String(spouse).padStart(2, '0')}와 함께 새로운 일상을 시작한다.`,
    epilogue: '다른 키몽이들의 축하 속에서 단체사진을 남겼다. 길었던 방송일지를 닫으며, 둘의 다음 페이지가 시작된다.'};
  s.reachedEndings.push(clone(s.lastEnding));
  s.endingSeenEver = true;
  s.phase = 'credits';
  s.event = null;
}

export const commands = {
  ending: {run(s, c, catalog) {
    if (s.phase !== 'ending') throw Error('마무리 기획이 아직 없어요.');
    const ch = s.event.choices.find(x => x.id === c.id);
    if (!ch) throw Error('마지막 선택을 골라주세요.');
    const locks = unmet(s, ch.eligibility.all, catalog);
    if (locks.length) throw Error(locks.join(' · '));
    s.lastEnding = {id: ch.endingId, title: ch.endingTitle, resolution: ch.resolution, epilogue: ch.epilogue, forced: false, date: s.date, projectLog: clone(s.project.log)};
    if (!s.reachedEndings.some(x => x.id === ch.endingId)) s.reachedEndings.push(clone(s.lastEnding));
    s.endingSeenEver = true;
    s.journal.at(-1).ending = ch.endingId;
    s.phase = 'credits';
    s.event = null;
  }},
  deferEnding: {run(s) {
    if (s.phase !== 'ending') throw Error('현재 마무리 선택이 없어요.');
    s.phase = 'wrap';
    s.event = null;
    s.deferUntil = addDays(s.date, DEFER_ENDING_DAYS);
    s.finaleScheduled = false;
  }},
  /** 일반 결말 뒤 같은 일지에서 계속 방송 (강제 결말 뒤에는 불가) */
  continue: {run(s) {
    if (s.phase !== 'credits' || s.lastEnding?.forced) throw Error('이 일지는 마무리되었어요. 새 일지로 시작할 수 있어요.');
    if (s.project) s.projectArchive.push(s.project);
    s.project = null;
    s.story = {};
    s.phase = 'wrap';
    s.deferUntil = addDays(s.date, CONTINUE_COOLDOWN_DAYS);
    s.finaleScheduled = false;
  }},
};
