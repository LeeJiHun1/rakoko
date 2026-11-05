// 일반 사건 선택지의 결과 편차 (사용자 결정 Q1·Q2, docs/DESIGN-REVIEW.md §4-1).
// 선택지 성향: 안정(safe) · 보통(steady) · 모험(bold) → 결과 등급: 대성공(great) · 성공(success) · 아쉬움(miss)
// 정확한 확률은 화면에 보이지 않고 성향 라벨과 준비 보너스 여부만 보인다.
import {random} from './rng.js';

export const STYLES = {
  safe: {label: '안정', hint: '결과가 일정해요', great: 0, miss: 0, greatScale: 1},
  steady: {label: '보통', hint: '가끔 크게 터져요', great: .2, miss: .15, greatScale: 2},
  bold: {label: '모험', hint: '대박 아니면 아쉬움', great: .35, miss: .4, greatScale: 3},
};
const ORDER = ['safe', 'steady', 'bold'];
const SAFE_WORDS = /확인|점검|차근|설명|정리|기록|백업|천천히|메모|준비/;
const BOLD_WORDS = /즉흥|도전|과감|장난|그대로|밀어|정면|바로|웃으며|한 번에|깜짝|맞붙/;

const hash = str => { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };

/** 사건의 선택지에 성향을 붙인다(결정적). 문구 키워드 우선, 나머지는 사건 ID 로 섞고, 한 사건 안이 전부 같지 않게 한다. */
export function assignStyles(eventId, choices) {
  const styles = choices.map(c => SAFE_WORDS.test(c.text) ? 'safe' : BOLD_WORDS.test(c.text) ? 'bold' : null);
  const rot = hash(eventId) % ORDER.length;
  const rotated = ORDER.slice(rot).concat(ORDER.slice(0, rot));
  const unused = rotated.filter(x => !styles.includes(x));
  for (let i = 0; i < styles.length; i++) if (!styles[i]) styles[i] = unused.shift() || rotated[i % ORDER.length];
  if (styles.length > 1 && new Set(styles).size === 1) styles[hash(eventId + ':b') % styles.length] = styles[0] === 'bold' ? 'safe' : 'bold';
  choices.forEach((c, i) => { c.style = styles[i]; });
  return choices;
}

/** 준비 보너스: 화면 점검 +8%p, 자료 준비 1회당 +4%p(최대 2회), 구매 효과(extra). 아쉬움 확률을 줄이고 대성공을 절반만큼 올린다. */
export const prepBonus = (s, extra = 0) => (s.checked ? .08 : 0) + Math.min(s.dataPrepared, 2) * .04 + extra;

export function oddsFor(style, bonus) {
  const st = STYLES[style];
  return {great: st.great ? Math.min(.9, st.great + bonus / 2) : 0, miss: Math.max(0, st.miss - bonus)};
}

/** 결과 등급 추첨. 안정은 추첨하지 않는다(난수 소비 없음). */
export function rollGrade(s, style, bonus) {
  if (!Object.hasOwn(STYLES, style) || style === 'safe') return 'success';
  const {great, miss} = oddsFor(style, bonus), r = random(s);
  return r < great ? 'great' : r < great + miss ? 'miss' : 'success';
}

export function scaleGains(gain = {}, grade, style) {
  if (grade === 'miss') return {};
  if (grade !== 'great') return gain;
  const k = STYLES[style].greatScale;
  return Object.fromEntries(Object.entries(gain).map(([key, v]) => [key, v * k]));
}

const GREAT_LINES = ['채팅창이 순식간에 불타올랐다!', '클립으로 남길 장면이 하나 생겼다.', '키몽이들이 박수 이모트를 쏟아냈다.', '오늘의 하이라이트가 방금 나왔다.'];
const MISS_LINES = ['생각처럼 되진 않았지만 웃음은 남았다.', '오늘은 살짝 빗나갔다. 그래도 이것도 방송이다.', '키몽이들이 괜찮다고 다독여 줬다.', '다음엔 준비를 조금 더 해 보자.'];

export function gradeOutcome(s, grade, outcome) {
  const lines = grade === 'great' ? GREAT_LINES : MISS_LINES, line = lines[(s.broadcastIndex + s.slot) % lines.length];
  return grade === 'great' ? `대성공! ${outcome} ${line}` : `${outcome}… ${line}`;
}
