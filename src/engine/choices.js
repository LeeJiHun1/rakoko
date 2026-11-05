// 사건 선택 반영: 잠금 확인 → 사건 종류별 효과 → 공통 성장 → 결과·채팅 기록.
import {CORNER_BASE_STAT} from './constants.js';
import {activeBonus, buyOption} from './purchases.js';
import {rollDonation} from './audience.js';
import {gain} from './growth.js';
import {commitModuleChoice} from './module.js';
import {gradeOutcome, prepBonus, rollGrade, scaleGains} from './outcome.js';
import {reveal} from './outfit.js';
import {advanceProject, projectProgressLocks} from './project.js';
import {reactions} from './reactions.js';
import {unmet} from './requirements.js';
import {random} from './rng.js';
import {skill} from './state.js';
import {clone} from './util.js';

/** 사건 종류(kind)별 고유 효과. routine·finale 은 공통 성장만 있다.
 *  {gain} 을 돌려주면 선택지의 기본 성장(c.gain) 대신 그 값을 쓴다(결과 편차). */
const KIND_EFFECTS = {
  general(s, e, c) {
    s.familyLast[e.family] = s.broadcastIndex;
    s.groupLast[e.group] = s.broadcastIndex;
    if (!s.familyMemory[e.family]) gain(s, 'awareness', 1); // 처음 만난 사건 계열은 인지도 +1
    s.familyMemory[e.family] = {choice: c.text, outcome: c.outcome};
    s.seenOnce.push(e.definitionId);
    if (c.promise) s.promises.push({id: `promise:${s.broadcastIndex}:${s.slot}`, title: e.title, status: 'pending', dueBroadcast: s.broadcastIndex + 1, createdBroadcast: s.broadcastIndex});
    if (!c.style) return undefined;
    const grade = rollGrade(s, c.style, prepBonus(s, activeBonus(s, 'odds')));
    s.result.grade = grade;
    s.result.style = c.style;
    if (grade !== 'success') s.result.outcome = gradeOutcome(s, grade, s.result.outcome);
    return {gain: scaleGains(c.gain, grade, c.style)};
  },
  project(s, e, c, catalog) { if (!c.postpone) advanceProject(s, c, catalog); },
  calendar(s, e) { s.celebrations.push(e.celebrationKey); },
  reveal(s, e) { reveal(s, e.outfitId); },
  leak(s, e, c) {
    s.leaked[e.outfitId] = true;
    if (c.risk && random(s) < c.risk) {
      reveal(s, e.outfitId);
      s.result.outcome = '앗, 전체 화면까지 나와 버렸다! 예상보다 이른 공개였지만 새 옷은 옷장에 남았다.';
      s.result.kind = 'reveal';
    }
  },
  promise(s, e, c) {
    const p = s.promises.find(x => x.id === e.promiseId);
    if (c.id === 'fulfill') p.status = 'fulfilled';
    else { p.dueBroadcast = s.broadcastIndex + 1; s.result.kind = 'routine'; }
  },
  module(s, e, c, catalog) { commitModuleChoice(s, c, catalog); },
  match(s, e, c, catalog) { commitModuleChoice(s, c, catalog); },
};

/** 이 코너의 성장이 적용될 게임 */
function segmentGameOf(s, e) {
  if (['module', 'match'].includes(e.kind)) return s.module.gameId;
  return s.project && e.kind === 'project' ? s.project.gameId : s.gameId;
}

/** 구매 막간: 코너가 아니므로 성장·응원·코너 기록 없이 결과만 남기고 같은 코너로 돌아간다. */
function applyShopChoice(s, e, c, catalog) {
  const def = catalog.moneyEvents.find(x => x.id === e.moneyEventId), option = def?.choices.find(x => x.id === c.id);
  if (c.purchase) buyOption(s, def, option);
  s.result = {title: e.title, choice: c.text, outcome: c.purchase ? `${c.outcome} ${c.effectSummary}` : c.outcome, kind: 'shop', interlude: true, changes: {}};
  s.result.reactions = reactions(s, c);
  s.phase = 'result';
}

export function applyChoice(s, id, catalog) {
  const e = s.event, c = e.choices.find(c => c.id === id);
  if (!c) throw Error('선택지를 찾을 수 없어요.');
  if (e.kind === 'shop') {
    const locks = unmet(s, c.requirements || [], catalog);
    if (locks.length) throw Error(locks.join(' · '));
    applyShopChoice(s, e, c, catalog);
    return;
  }
  const reasons = unmet(s, c.requirements || [], catalog, e.kind === 'module' ? s.module?.gameId : undefined);
  if (e.kind === 'project' && !c.postpone) reasons.push(...projectProgressLocks(s, catalog));
  if (reasons.length) throw Error(reasons.join(' · '));

  const segmentGame = segmentGameOf(s, e);
  const before = {...s.stats, gameSkill: skill(s, segmentGame)};
  s.result = {title: e.title, choice: c.text, outcome: c.outcome || '오늘의 기록을 남겼다.', kind: e.kind, provenance: e.provenance};
  const effect = (Object.hasOwn(KIND_EFFECTS, e.kind) && KIND_EFFECTS[e.kind](s, e, c, catalog)) || {};

  for (const [key, amount] of Object.entries(effect.gain ?? c.gain ?? {})) gain(s, key, amount);
  const corner = s.plan[s.slot];
  gain(s, CORNER_BASE_STAT[corner], 1, segmentGame);
  if (corner === 'G') s.gameHistory[s.gameId] = {last: s.broadcastIndex};
  if (s.result.grade === 'great') s.records.greats++;
  const donation = rollDonation(s, activeBonus(s, 'donation'));
  if (donation) s.result.donation = donation;
  s.result.changes = Object.fromEntries(Object.entries({...s.stats, gameSkill: skill(s, segmentGame)}).map(([k, v]) => [k, v - before[k]]).filter(([, v]) => v));
  // reactions() 가 s.result.chatContext 를 먼저 기록한 뒤 reactions 가 붙는다(저장 키 순서 유지).
  s.result.reactions = reactions(s, c);
  s.currentLog.push(clone(s.result));
  s.phase = 'result';
}
