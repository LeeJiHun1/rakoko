// 일반 사건 추첨. 초반엔 방송 착안(adaptation) 사건 비중을 높이고, 후반엔 게임 사건 가중치를 높인다.
import {CORNERS} from '../constants.js';
import {random} from '../rng.js';
import {clone} from '../util.js';
import {normalEligible} from './eligibility.js';
import {choice, event} from './factory.js';

/** 진행 단계별 [adaptation 비중, gameplay 가중치] — 완료 방송 10회 / 25회 기준 */
const ADAPTATION_SHARE = [.9, .55, .4];
const GAMEPLAY_WEIGHT = [.35, 1, 4];
const stageOf = s => s.completedBroadcasts < 10 ? 0 : s.completedBroadcasts < 25 ? 1 : 2;

function routineEvent(s) {
  return event(s, 'routine', `${CORNERS[s.plan[s.slot]]}의 작은 한 페이지`, '큰 사건이 없는 날도 좋은 방송이 된다. 오늘 남길 작은 기록을 골라 보자.', [
    choice('note', '오늘의 팁을 메모한다', '다음에 꺼내 볼 수 있는 짧은 메모를 남겼다.', {gain: {planning: 1}}),
    choice('question', '키몽이의 한 줄을 듣는다', '여러 키몽이의 생각을 듣고 오늘의 코너를 마쳤다.', {gain: {community: 1}}),
  ]);
}

function recallBody(s, selected) {
  const previous = s.familyMemory[selected.family];
  if (!previous) return selected.body;
  return `지난 방송에서 ‘${previous.choice}’를 선택했던 기록을 펼쳤다. ${s.completedBroadcasts % 2 ? '새 코너에 맞춰 이번의 방법을 다시 골라 보자.' : '이번에는 그 메모를 곁에 두고 코너를 이어간다.'}`;
}

export function pickGeneral(s, catalog) {
  const list = catalog.events.filter(e => normalEligible(s, e));
  if (!list.length) return routineEvent(s);
  const stage = stageOf(s);
  const rk = list.filter(e => e.provenance === 'adaptation'), fiction = list.filter(e => e.provenance === 'fiction');
  // 난수 호출 순서: ① 출처 선택 ② 가중 추첨
  const candidates = random(s) < ADAPTATION_SHARE[stage] ? (rk.length ? rk : fiction) : (fiction.length ? fiction : rk);
  const weights = candidates.map(e => e.topic === 'gameplay' ? GAMEPLAY_WEIGHT[stage] : 1);
  let draw = random(s) * weights.reduce((a, b) => a + b, 0), selected = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    draw -= weights[i];
    if (draw <= 0) { selected = candidates[i]; break; }
  }
  return event(s, 'general', selected.title, recallBody(s, selected), clone(selected.choices),
    {definitionId: selected.id, family: selected.family, group: selected.group, provenance: selected.provenance});
}
