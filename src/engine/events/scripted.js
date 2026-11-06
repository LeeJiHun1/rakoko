// 상황이 정해진 사건: 기획 단계 · 기념일 · 의상 공개 · 의상 유출 · 마지막 특집 · 약속.
import {yearsPlayed} from '../dates.js';
import {choice, event} from './factory.js';

const PROJECT_WORK = ['자료와 계획을 준비한다', '시범 코너를 직접 진행한다', '피드백을 반영하고 검수를 마친다'];
const PROJECT_TOGETHER = ['키몽이의 의견을 먼저 듣는다', '차근차근 설명하며 시험한다', '헷갈린 부분을 함께 다시 확인한다'];

export function projectEvent(s, catalog) {
  const p = s.project, def = catalog.projects.find(x => x.id === p.id), step = p.step;
  return event(s, 'project', def.name, def.steps[step], [
    choice('work', PROJECT_WORK[step], def.steps[step], {gain: {planning: 2}}),
    choice('together', PROJECT_TOGETHER[step], `${def.steps[step]} 키몽이의 의견도 함께 기록했다.`, {gain: {community: 2}}),
    choice('postpone', '이번에는 다음 방송으로 미룬다', '현재 기획을 보존했다. 이번 코너는 준비 메모를 정리하며 마쳤다.', {postpone: true, gain: {operation: 1}}),
  ], {projectId: p.id, projectStep: step});
}

export function calendarEvent(s, type) {
  const title = type === 'birthday' ? '오늘은 코코의 생일!' : `${yearsPlayed(s)}주년, 또 한 장의 시작`;
  return event(s, 'calendar', title, '조금 다른 오늘도, 함께 있는 키몽이들이 반갑다. 이번 기념일에는 어떤 장면을 남길까?', [
    choice('letters', '키몽이들의 짧은 축하를 읽는다', '서로 다른 축하와 장난을 모아 기념일의 한 페이지를 만들었다.', {gain: {community: 2}}),
    choice('memory', '지금까지의 일지를 함께 펼친다', '직접 만든 방송 기록을 돌아보고 다음에 하고 싶은 일을 적었다.', {gain: {planning: 2}}),
    choice('normal', '평소처럼, 조금 더 다정하게 방송한다', '크게 꾸미지 않아도 같이 보내는 하루라 좋았다.', {gain: {community: 1, operation: 1}}),
  ], {celebrationKey: `${type}:${s.date.slice(0, 4)}`, celebrationType: type});
}

/** 공개 도입 대사는 유출 대응 기록에 따라 달라진다(설계: 티저 대응 시 도입 대사 변경) */
function revealIntro(s, id) {
  if (s.outfitRevealFailed?.[id]) return '지난번 공개 때 소품이 말썽을 부렸던 바로 그 옷. 키몽이들이 이번엔 괜찮냐며 두근두근 지켜본다.';
  if (s.leaked[id] === 'teaser') return '지난번 짧은 티저로 궁금증만 잔뜩 키워 둔 바로 그 옷. 키몽이들의 추측이 맞았을까? 오늘 드디어 커튼을 연다.';
  if (s.leaked[id]) return '한 번 살짝 들킬 뻔했던 그 옷을 오늘은 제대로 보여준다. 키몽이들이 그때 본 조각을 기억하는 눈치다.';
  return '조금씩 준비해 온 모습을 오늘의 방송에서 처음 보여준다. 공개 후에는 언제든 편하게 갈아입을 수 있다.';
}

export function revealEvent(s, catalog) {
  const outfit = catalog.outfits.find(x => x.id === s.crafting);
  const risk = s.outfitProgress[outfit.id] < 100 ? ` · 준비 ${s.outfitProgress[outfit.id]}%, 실패 위험` : '';
  return event(s, 'reveal', `${outfit.name}, 드디어 공개`, revealIntro(s, outfit.id), [
    choice('show', `새 옷으로 인사한다${risk}`, '커튼을 열고 새 옷을 공개했다. 옷장에 새로운 한 벌이 남았다.'),
    choice('detail', `디테일을 하나씩 소개한다${risk}`, '작은 장식부터 차근차근 소개하며 새 옷을 공개했다.'),
  ], {outfitId: outfit.id});
}

const LEAK_CLUES = {maid: '프릴처럼 보이는 천 한 조각', police: '반짝이는 작은 단추', ghost: '하늘하늘한 흰 천', nun: '흑백으로 나뉜 천의 끝'};
/** 수습 시도 시 조기 공개 확률(유출 발생 확률은 outfit.leakChance) */
const EARLY_REVEAL_RISK = {checked: 0.10, unchecked: 0.25};

export function leakEvent(s) {
  return event(s, 'leak', '어? 방금 화면에…', `작업 화면 구석에 ${LEAK_CLUES[s.crafting]}이 잠깐 보였다. 전체 모습은 아직 나오지 않았다.`, [
    choice('hide', '작업 화면을 닫고 준비를 이어간다', '일부 단서만 남기고 화면을 닫았다. 전체 공개는 원래 준비대로 간다.'),
    choice('teaser', '짧은 티저였다고 설명한다', '키몽이들은 추측을 나눴다. 아직 전체 의상을 공개한 건 아니다.'),
    choice('risky', `화면부터 확인하며 수습한다 · 조기 공개 위험 ${s.checked ? 10 : 25}%`, '화면을 하나씩 확인하며 분위기를 수습했다.', {risk: s.checked ? EARLY_REVEAL_RISK.checked : EARLY_REVEAL_RISK.unchecked}),
    choice('now', `그냥 지금 공개한다${s.outfitProgress[s.crafting] < 100 ? ' · 준비 부족, 실패 위험' : ''}`, '커튼을 걷고 준비 중이던 새 옷을 바로 공개했다! 다듬지 못한 부분은 웃으며 넘겼다.'),
  ], {outfitId: s.crafting});
}

/** 방송 중 새 의상 제안(막간 — 코너를 쓰지 않는다). 공개 전이라 이름 대신 단서만 보인다. */
export function outfitOfferEvent(s, outfitId, cost) {
  return event(s, 'outfitOffer', '새 의상 이야기가 나왔다', `키몽이들이 '다음엔 ${LEAK_CLUES[outfitId]}이 들어간 옷도 보고 싶다'며 채팅창을 채운다. 새 의상을 준비해 볼까?`, [
    choice('start', `새 의상 제작을 시작한다 · ${(cost / 10000).toLocaleString('ko-KR')}만원 (이후 준비는 무료)`, '의상 기획 노트를 펼치고 제작비를 한 번에 맡겼다. 공개 전까지 이름은 비밀이다.', {requirements: [{path: 'economy.cash', op: 'gte', value: cost}], start: true}),
    choice('later', '지금은 미뤄 둔다', '제안은 메모해 두었다. 다음에 또 이야기가 나올지도 모른다.'),
  ], {outfitId});
}

/** 조기 공개 뒤 원래 예약해 둔 공개 코너 대신 진행하는 소개 코너 */
export function outfitFollowupEvent(s, catalog) {
  const outfit = catalog.outfits.find(x => x.id === s.outfitFollowup);
  return event(s, 'outfitFollowup', `급하게 공개한 ${outfit.name}, 다시 소개하기`, '원래 오늘 공개하려던 옷을 이미 보여 버렸다. 못다 한 이야기와 디테일을 천천히 소개해 보자.', [
    choice('detail', '못 보여준 디테일을 소개한다', '작은 장식과 소매 끝까지 하나씩 보여주며 그때 못 한 이야기를 꺼냈다.', {gain: {planning: 1, community: 1}}),
    choice('vote', '의상 별명을 투표로 정한다', '키몽이들이 별명 후보를 쏟아냈다. 투표 끝에 귀여운 이름이 붙었다.', {gain: {community: 2}}),
    choice('story', '급공개 해프닝을 회고한다', '그날의 당황한 순간을 같이 돌아보며 한참 웃었다.', {gain: {awareness: 1, community: 1}}),
  ], {outfitId: outfit.id});
}

export function finaleEvent(s) {
  return event(s, 'finale', '마지막 특집을 준비하며', '충분히 준비한 기획을 오늘 마무리한다. 방송 정산 뒤 마지막 선택을 하게 된다.', [
    choice('ready', '마지막 점검을 마친다', '마지막 기획의 준비를 확인했다.'),
  ]);
}

/** 코너 사이 구매 막간. 유료 선택지는 잔액 조건으로 잠기고, 넘기기는 항상 가능. */
export function shopEvent(s, def, effectsFor, effectText) {
  const paid = def.choices.filter(c => c.cost?.amount);
  return event(s, 'shop', def.title, '코너 사이 잠깐, 방송에 쓸 만한 것을 발견했다. 지금 투자하면 다음 방송들이 달라질지도?', [
    ...paid.map((o, i) => choice(o.id, o.text, `${o.text} — 주문 완료!`, {requirements: [{path: 'economy.cash', op: 'gte', value: o.cost.amount}], cost: o.cost.amount, effectSummary: effectText(effectsFor(def.id, i)), purchase: true})),
    choice('skip', '이번에는 넘긴다', '이번에는 지갑을 지켰다. 다음 기회에 생각해 보자.'),
  ], {moneyEventId: def.id});
}

export function promiseEvent(s, promise) {
  const body = promise.choice ? `지난 ‘${promise.title}’ 때 ‘${promise.choice}’ 하며 다음으로 미뤄 둔 메모가 있다. 키몽이들도 기억하고 있었다는 듯 채팅이 먼저 반응한다.` : `‘${promise.title}’라는 메모가 오늘의 코너를 기다리고 있다.`;
  return event(s, 'promise', `약속 메모 · ${promise.title}`, body, [
    choice('fulfill', '약속했던 작은 기획을 진행한다', '지난 메모를 따라 코너를 진행하고 결과를 기록했다.', {gain: {planning: 1}}),
    choice('later', '기록을 남기고 한 번 더 미룬다', '약속은 지우지 않고 다음 방송으로 옮겼다.'),
  ], {promiseId: promise.id});
}
