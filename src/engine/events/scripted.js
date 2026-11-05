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

export function revealEvent(s, catalog) {
  const outfit = catalog.outfits.find(x => x.id === s.crafting);
  return event(s, 'reveal', `${outfit.name}, 드디어 공개`, '조금씩 준비해 온 모습을 오늘의 방송에서 처음 보여준다. 공개 후에는 언제든 편하게 갈아입을 수 있다.', [
    choice('show', '새 옷으로 인사한다', '커튼을 열고 새 옷을 공개했다. 옷장에 새로운 한 벌이 남았다.'),
    choice('detail', '디테일을 하나씩 소개한다', '작은 장식부터 차근차근 소개하며 새 옷을 공개했다.'),
  ], {outfitId: outfit.id});
}

const LEAK_CLUES = {maid: '프릴처럼 보이는 천 한 조각', police: '반짝이는 작은 단추', ghost: '하늘하늘한 흰 천', nun: '흑백으로 나뉜 천의 끝'};
/** 점검 여부에 따른 유출 사건 발생 확률 / 장난스러운 수습 시 조기 공개 확률 */
export const LEAK_CHANCE = {checked: 0.03, unchecked: 0.08};
const EARLY_REVEAL_RISK = {checked: 0.10, unchecked: 0.25};

export function leakEvent(s) {
  return event(s, 'leak', '어? 방금 화면에…', `작업 화면 구석에 ${LEAK_CLUES[s.crafting]}이 잠깐 보였다. 전체 모습은 아직 나오지 않았다.`, [
    choice('hide', '작업 화면을 닫고 준비를 이어간다', '일부 단서만 남기고 화면을 닫았다. 전체 공개는 원래 준비대로 간다.'),
    choice('teaser', '짧은 티저였다고 설명한다', '키몽이들은 추측을 나눴다. 아직 전체 의상을 공개한 건 아니다.'),
    choice('risky', `장난스럽게 수습한다 · 조기 공개 위험 ${s.checked ? 10 : 25}%`, '가볍게 분위기를 바꿔 보았다.', {risk: s.checked ? EARLY_REVEAL_RISK.checked : EARLY_REVEAL_RISK.unchecked}),
  ], {outfitId: s.crafting});
}

export function finaleEvent(s) {
  return event(s, 'finale', '마지막 특집을 준비하며', '충분히 준비한 기획을 오늘 마무리한다. 방송 정산 뒤 마지막 선택을 하게 된다.', [
    choice('ready', '마지막 점검을 마친다', '마지막 기획의 준비를 확인했다.'),
  ]);
}

export function promiseEvent(s, promise) {
  return event(s, 'promise', '지난 방송에서 적어 둔 다음에', `‘${promise.title}’라는 메모가 오늘의 코너를 기다리고 있다.`, [
    choice('fulfill', '약속했던 작은 기획을 진행한다', '지난 메모를 따라 코너를 진행하고 결과를 기록했다.', {gain: {planning: 1}}),
    choice('later', '기록을 남기고 한 번 더 미룬다', '약속은 지우지 않고 다음 방송으로 옮겼다.'),
  ], {promiseId: promise.id});
}
