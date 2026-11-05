// 방송 한 회의 흐름: 편성 → 시작(예약·수입 스냅샷) → 코너 3개(선택→결과) → 정산 → 날짜 이동.
import {CORNERS, PREPARATIONS_PER_BROADCAST, SEGMENTS_PER_BROADCAST} from './constants.js';
import {celebrationKey, celebrationOn} from './dates.js';
import {scheduleDate} from './calendar.js';
import {applyChoice} from './choices.js';
import {broadcastGrade, GRADE_AWARENESS, GRADE_INCOME, peakViewers, updateRecords} from './audience.js';
import {gain} from './growth.js';
import {activeBonus} from './purchases.js';
import {deliverOrders, settleIncome, snapshotIncome} from './economy.js';
import {offerEndingIfReady} from './ending.js';
import {nextEvent} from './events/next.js';
import {clone} from './util.js';

/** 예약 사건이 들어가는 코너 위치 */
const RESERVATION_SLOT = {calendar: 0, finale: 1, outfit: 2};

function reserveSpecials(s) {
  const type = celebrationOn(s);
  if (type && !s.celebrations.includes(celebrationKey(type, s.date))) s.reservations[RESERVATION_SLOT.calendar] = 'calendar';
  if (s.outfitReserved && !s.wardrobe[s.crafting]) s.reservations[RESERVATION_SLOT.outfit] = 'outfit';
  if (s.finaleScheduled) s.reservations[RESERVATION_SLOT.finale] = 'finale';
  for (const key of Object.keys(s.reservations)) s.plan[Number(key)] = 'S';
}

function settle(s, catalog) {
  const grade = broadcastGrade(s.currentLog);
  const {gross, cost, net} = settleIncome(s, catalog, GRADE_INCOME[grade]);
  const viewers = peakViewers(s, grade, activeBonus(s, 'viewers'));
  const newRecords = updateRecords(s, {viewers, gross, grade});
  const donations = s.currentLog.reduce((a, r) => a + (r.donation?.amount || 0), 0);
  const fame = GRADE_AWARENESS[grade] ? gain(s, 'awareness', GRADE_AWARENESS[grade]) : 0;
  s.completedBroadcasts++;
  deliverOrders(s);
  s.journal.push({id: s.broadcastIndex, date: s.date, events: clone(s.currentLog), income: {gross, cost, net}, outfit: s.equipped, representative: 0, viewers, grade, donations});
  if (s.module?.phase === 'closed') { s.moduleArchive.push(clone(s.module)); s.module = null; }
  s.phase = 'wrap';
  s.result = {gross, cost, net, grade, viewers, donations, newRecords, fame};
  s.event = null;
  offerEndingIfReady(s, catalog);
}

/** 정산 화면에서 날짜를 옮기면 다음 회차 준비 상태로 초기화 */
function beginNextBroadcast(s) {
  s.broadcastIndex++;
  s.phase = 'prep';
  s.preparations = PREPARATIONS_PER_BROADCAST;
  s.checked = false;
  s.dataPrepared = 0;
  s.gainTotals = {};
  s.event = null;
  s.result = null;
  s.currentLog = [];
  s.reservations = {};
  s.finaleScheduled = false;
  if (s.planBeforeReservations) s.plan = s.planBeforeReservations;
  delete s.planBeforeReservations;
}

export const commands = {
  plan: {prepOnly: true, run(s, c) {
    if (!Object.hasOwn(CORNERS, c.corner) || c.index < 0 || c.index > 2) throw Error('올바른 코너를 골라주세요.');
    s.plan[c.index] = c.corner;
  }},
  game: {prepOnly: true, run(s, c, catalog) {
    if (!catalog.games.some(g => g.id === c.gameId)) throw Error('게임을 찾을 수 없어요.');
    s.gameId = c.gameId;
    s.gameSkillById[c.gameId] ??= 10;
  }},
  start: {prepOnly: true, run(s, c, catalog) {
    s.currentLog = [];
    s.slot = 0;
    s.reservations = {};
    s.leakChecked = false;
    s.planBeforeReservations = clone(s.plan);
    reserveSpecials(s);
    snapshotIncome(s, catalog);
    if (s.module) s.module.usedThisBroadcast = 0;
    nextEvent(s, catalog);
  }},
  choose: {run(s, c, catalog) {
    if (s.phase !== 'event') throw Error('현재 선택할 사건이 없어요.');
    applyChoice(s, c.id, catalog);
  }},
  advance: {run(s, c, catalog) {
    if (s.phase !== 'result') throw Error('결과를 먼저 확인해주세요.');
    if (s.result?.interlude) { nextEvent(s, catalog, {allowShop: false}); return; } // 막간 뒤에는 같은 코너 진행
    s.slot++;
    if (s.slot < SEGMENTS_PER_BROADCAST) nextEvent(s, catalog);
    else settle(s, catalog);
  }},
  representative: {run(s, c) {
    if (s.phase !== 'wrap') throw Error('방송을 마친 뒤 고를 수 있어요.');
    if (!Number.isInteger(c.index) || c.index < 0 || c.index > 2) throw Error('기록을 골라주세요.');
    s.journal.at(-1).representative = c.index;
  }},
  date: {run(s, c) {
    if (!['prep', 'wrap'].includes(s.phase)) throw Error('현재 방송을 마무리한 뒤 날짜를 바꿀 수 있어요.');
    const wasWrap = s.phase === 'wrap';
    scheduleDate(s, c.date);
    if (s.phase === 'credits') return;
    if (wasWrap) beginNextBroadcast(s);
  }},
};
