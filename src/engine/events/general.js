// 일반 사건 추첨. 초반엔 방송 착안(adaptation) 사건 비중을 높이고, 후반엔 게임 사건 가중치를 높인다.
import {random} from '../rng.js';
import {clone} from '../util.js';
import {assignStyles} from '../outcome.js';
import {normalEligible} from './eligibility.js';
import {choice, event} from './factory.js';

/** 진행 단계별 [adaptation 비중, gameplay 가중치] — 완료 방송 10회 / 25회 기준 */
const ADAPTATION_SHARE = [.9, .55, .4];
const GAMEPLAY_WEIGHT = [.35, 1, 4];
const stageOf = s => s.completedBroadcasts < 10 ? 0 : s.completedBroadcasts < 25 ? 1 : 2;

/** 조건에 맞는 사건이 없을 때의 코너별 소소한 장면(방송 회차로 번갈아, 난수 미사용) */
const ROUTINES = {
  T: [['느긋한 수다 한 조각', '오늘은 큰 사건 없이 근황 이야기가 이어진다. 키몽이들이 각자 오늘 있었던 일을 하나씩 꺼낸다.'], ['채팅창 단어 맞히기', '수다 중에 채팅창에 같은 단어가 연달아 올라온다. 무슨 이야기를 하고 싶은 걸까?']],
  G: [['손 풀기 한 판', '본 게임 전에 가볍게 한 판. 키몽이들이 오늘 컨디션을 점쳐 본다.'], ['어제의 나와 대결', '지난번 기록을 띄워 두고 같은 구간에 다시 도전한다.']],
  F: [['키몽이 한 줄 소개', '처음 온 키몽이와 오래 본 키몽이가 섞여 한 줄씩 인사를 남긴다.'], ['오늘의 질문 하나', '방송 끝나기 전에 키몽이들에게 물어볼 질문 하나를 고른다.']],
  S: [['기획 노트 정리', '다음 특별 기획을 위해 아이디어 노트를 펼쳤다. 써 둔 메모가 생각보다 많다.'], ['작은 특집 리허설', '본 기획 전에 짧게 순서를 맞춰 본다.']],
};

function routineEvent(s) {
  const corner = s.plan[s.slot], options = ROUTINES[corner] || ROUTINES.T;
  const [title, body] = options[s.broadcastIndex % options.length];
  return event(s, 'routine', title, body, [
    choice('note', '오늘의 팁을 메모한다', '다음에 꺼내 볼 수 있는 짧은 메모를 남겼다. 키몽이 한 명이 메모장 캡처를 부탁했다.', {gain: {planning: 1}}),
    choice('question', '키몽이의 한 줄을 듣는다', '여러 키몽이의 생각이 한 줄씩 모였다. 같은 질문에도 대답이 제각각이라 웃음이 났다.', {gain: {community: 1}}),
  ]);
}

/** 같은 계열 사건을 다시 만나면 원래 상황 설명은 그대로 두고, 지난 선택을 떠올리는 한 줄을 덧붙인다. */
function recallBody(s, selected) {
  const previous = s.familyMemory[selected.family];
  if (!previous) return selected.body;
  const tail = s.completedBroadcasts % 2 ? '새 코너에 맞춰 이번의 방법을 다시 골라 보자.' : '이번에는 그 메모를 곁에 두고 코너를 이어간다.';
  return `${selected.body} — 지난 방송에서는 ‘${previous.choice}’를 골랐다. ${tail}`;
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
  return event(s, 'general', selected.title, recallBody(s, selected), assignStyles(selected.id, clone(selected.choices)),
    {definitionId: selected.id, family: selected.family, group: selected.group, provenance: selected.provenance});
}
