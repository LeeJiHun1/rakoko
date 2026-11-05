// 시청자·방송 등급·역대 기록·가상 응원 (사용자 결정 Q4, docs/DESIGN-REVIEW.md §4-1).
// 응원 금액은 방송 중 실제로 진행한 코너에서만 생긴다(날짜 건너뛰기로는 생기지 않음). 실제 플랫폼 화폐명은 쓰지 않는다.
import {random} from './rng.js';

const GRADE_SCORE = {great: 3, success: 2, miss: 1};
export const GRADE_INCOME = {S: 1.3, A: 1.15, B: 1, C: .9};
const GRADE_VIEWERS = {S: 1.5, A: 1.25, B: 1, C: .85};
const TIER_VIEWERS = [1, 2, 4, 8, 15];
const GRADE_RANK = {C: 0, B: 1, A: 2, S: 3};

export const emptyRecords = () => ({bestViewers: 0, bestGross: 0, bestGrade: null, greats: 0, donations: 0, donationTotal: 0});

/** 세 코너 결과 점수 합: 8↑ S · 7 A · 5~6 B · 그 아래 C (등급 없는 고정 사건은 성공 취급) */
export function broadcastGrade(log) {
  const score = log.reduce((a, r) => a + (GRADE_SCORE[r.grade] ?? 2), 0);
  return score >= 8 ? 'S' : score >= 7 ? 'A' : score >= 5 ? 'B' : 'C';
}

/** 방송 최고 동시 시청자. 시작 시 능력 스냅샷·규모 단계·등급·구매 효과(bonus)·±10% 변동 */
export function peakViewers(s, grade, bonus = 0) {
  const snap = s.incomeSnapshot, base = 20 + snap.awareness * 3 + snap.community * 5;
  return Math.round(base * TIER_VIEWERS[s.scaleIndex] * GRADE_VIEWERS[grade] * (1 + bonus) * (0.9 + random(s) * 0.2));
}

/** 역대 기록 갱신. 새로 갱신한 항목 이름 목록을 돌려준다. */
export function updateRecords(s, {viewers, gross, grade}) {
  const r = s.records, fresh = [];
  if (viewers > r.bestViewers) { r.bestViewers = viewers; fresh.push('viewers'); }
  if (gross > r.bestGross) { r.bestGross = gross; fresh.push('gross'); }
  if (r.bestGrade == null || GRADE_RANK[grade] > GRADE_RANK[r.bestGrade]) { r.bestGrade = grade; fresh.push('grade'); }
  return fresh;
}

const DONATION_TIERS = [
  {id: 'jackpot', chance: .04, min: 1000000, steps: 21, step: 100000, messages: ['오늘 방송 레전드 기념!!', '이 장면 평생 기억할게요', '코코 최고! 앞으로도 쭉 함께해요']},
  {id: 'medium', chance: .20, min: 100000, steps: 21, step: 10000, messages: ['방금 거 너무 좋았어요', '오늘 기획 재밌어요!', '맛있는 거 사 드세요 ㅎㅎ']},
  {id: 'small', chance: 1, min: 10000, steps: 41, step: 1000, messages: ['오늘도 잘 보고 가요!', '작지만 응원해요', '퇴근길에 힘이 나요', '항상 고마워요']},
];
const TIER_DONATION = [1, 1.5, 3, 6, 10];

/** 코너가 끝날 때 가상 응원이 터질지 굴린다. 터지면 자금·장부·기록에 반영하고 응원 정보를 돌려준다. */
export function rollDonation(s, bonus = 0) {
  const kind = s.result.kind, grade = s.result.grade;
  const chance = .05 + (grade === 'great' ? .12 : 0) + (['calendar', 'reveal'].includes(kind) ? .1 : 0) + bonus;
  if (random(s) >= chance) return null;
  const r = random(s);
  let acc = 0;
  const tier = DONATION_TIERS.find(t => (acc += t.chance) > r) || DONATION_TIERS.at(-1);
  const amount = Math.round((tier.min + Math.floor(random(s) * tier.steps) * tier.step) * TIER_DONATION[s.scaleIndex] / 1000) * 1000;
  const from = `키몽이 ${String(1 + Math.floor(random(s) * 99)).padStart(2, '0')}`;
  const message = tier.messages[(s.broadcastIndex + s.slot) % tier.messages.length];
  s.cash += amount;
  s.ledger.push({id: `donation:${s.broadcastIndex}:${s.slot}`, date: s.date, net: amount});
  s.records.donations++;
  s.records.donationTotal += amount;
  return {tier: tier.id, amount, from, message};
}
