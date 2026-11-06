// 사건 선택 반영: 잠금 확인 → 사건 종류별 효과 → 공통 성장 → 결과·채팅 기록.
import {CORNER_BASE_STAT} from './constants.js';
import {activeBonus, buyOption} from './purchases.js';
import {rollDonation} from './audience.js';
import {bumpMission} from './missions.js';
import {gain} from './growth.js';
import {commitModuleChoice} from './module.js';
import {gradeOutcome, prepBonus, rollGrade, scaleGains} from './outcome.js';
import {attemptReveal, reveal, startOutfit} from './outfit.js';
import {advanceProject, projectProgressLocks} from './project.js';
import {reactions} from './reactions.js';
import {unmet} from './requirements.js';
import {random} from './rng.js';
import {skill} from './state.js';
import {clone} from './util.js';

const REVEAL_FAIL_TEXT = [
  '커튼을 여는 순간 리본이 툭 풀려 버렸다. 키몽이들의 \'괜찮아!\' 속에 공개는 다음으로 미뤘다.',
  '소품 단추가 데구루루 굴러가 버렸다. 웃음바다 속에 오늘 공개는 리허설로 남기기로 했다.',
  '조명이 맞지 않아 실루엣만 보였다. 제대로 보여주고 싶어 공개를 한 번 더 준비하기로 했다.',
];

/** 사건 종류(kind)별 고유 효과. routine·finale 은 공통 성장만 있다.
 *  {gain} 을 돌려주면 선택지의 기본 성장(c.gain) 대신 그 값을 쓴다(결과 편차). */
const KIND_EFFECTS = {
  general(s, e, c) {
    s.familyLast[e.family] = s.broadcastIndex;
    s.groupLast[e.group] = s.broadcastIndex;
    if (!s.familyMemory[e.family]) gain(s, 'awareness', 1); // 처음 만난 사건 계열은 인지도 +1
    s.familyMemory[e.family] = {choice: c.text, outcome: c.outcome};
    s.seenOnce.push(e.definitionId);
    if (c.promise) s.promises.push({id: `promise:${s.broadcastIndex}:${s.slot}`, title: e.title, status: 'pending', dueBroadcast: s.broadcastIndex + 1, createdBroadcast: s.broadcastIndex, choice: c.text});
    if (!c.style) return undefined;
    const grade = rollGrade(s, c.style, prepBonus(s, activeBonus(s, 'odds')));
    s.result.grade = grade;
    s.result.style = c.style;
    if (grade !== 'success') s.result.outcome = gradeOutcome(s, grade, s.result.outcome);
    return {gain: scaleGains(c.gain, grade, c.style)};
  },
  project(s, e, c, catalog) { if (!c.postpone) advanceProject(s, c, catalog); },
  calendar(s, e) { s.celebrations.push(e.celebrationKey); },
  /** 공개: 덜 준비됐으면 확률로 실패(해금 안 됨) — 실패는 가벼운 해프닝 */
  reveal(s, e) {
    if (attemptReveal(s, e.outfitId)) { s.result.unlockedOutfit = e.outfitId; return; }
    s.result.kind = 'revealFailed';
    s.result.outcome = REVEAL_FAIL_TEXT[s.broadcastIndex % REVEAL_FAIL_TEXT.length];
  },
  /** 유출 대응: 대응 종류를 기록(공개 대사에 반영), '지금 공개'·수습 실패는 조기 공개 */
  leak(s, e, c) {
    s.leaked[e.outfitId] = c.id;
    if (c.id === 'now') {
      if (!attemptReveal(s, e.outfitId, {mode: 'early'})) {
        s.result.kind = 'revealFailed';
        s.result.outcome = '바로 공개하려던 순간 준비가 덜 된 소품이 말썽을 부렸다. 일단 커튼을 닫고 준비를 마저 하기로 했다.';
        return;
      }
    } else if (c.risk && random(s) < c.risk) reveal(s, e.outfitId, {mode: 'early'}); // 수습 실패 = 사고로 전체 노출(공개 성립)
    else return;
    if (c.id !== 'now') s.result.outcome = '앗, 전체 화면까지 나와 버렸다! 예상보다 이른 공개였지만 새 옷은 옷장에 남았다.';
    s.result.kind = 'reveal';
    s.result.unlockedOutfit = e.outfitId;
  },
  outfitFollowup(s) { s.outfitFollowup = null; },
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

/** 막간(구매·새 의상 제안): 코너가 아니므로 성장·응원·코너 기록 없이 결과만 남기고 같은 코너로 돌아간다. */
function applyInterludeChoice(s, e, c, catalog) {
  let outcome = c.outcome;
  if (e.kind === 'shop') {
    const def = catalog.moneyEvents.find(x => x.id === e.moneyEventId), option = def?.choices.find(x => x.id === c.id);
    if (c.purchase) { buyOption(s, def, option); outcome = `${c.outcome} ${c.effectSummary}`; }
  } else if (c.start) {
    startOutfit(s, e.outfitId);
    outcome = `${c.outcome} 준비도 ${s.outfitProgress[e.outfitId]}%.`;
  }
  s.result = {title: e.title, choice: c.text, outcome, kind: e.kind, interlude: true, changes: {}};
  s.result.reactions = reactions(s, c);
  s.phase = 'result';
}

export function applyChoice(s, id, catalog) {
  const e = s.event, c = e.choices.find(c => c.id === id);
  if (!c) throw Error('선택지를 찾을 수 없어요.');
  if (['shop', 'outfitOffer'].includes(e.kind)) {
    const locks = unmet(s, c.requirements || [], catalog);
    if (locks.length) throw Error(locks.join(' · '));
    applyInterludeChoice(s, e, c, catalog);
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
  if (s.result.grade === 'great') { s.records.greats++; bumpMission(s, 'greats'); }
  const donation = rollDonation(s, activeBonus(s, 'donation'));
  if (donation) { s.result.donation = donation; bumpMission(s, 'donation'); }
  bumpMission(s, 'corner', {corner});
  s.result.changes = Object.fromEntries(Object.entries({...s.stats, gameSkill: skill(s, segmentGame)}).map(([k, v]) => [k, v - before[k]]).filter(([, v]) => v));
  // reactions() 가 s.result.chatContext 를 먼저 기록한 뒤 reactions 가 붙는다(저장 키 순서 유지).
  s.result.reactions = reactions(s, c);
  s.currentLog.push(clone(s.result));
  s.phase = 'result';
}
