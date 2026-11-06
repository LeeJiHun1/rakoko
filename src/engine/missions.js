// 이번 달 미션: 달이 바뀐 뒤 첫 방송 시작 때 3개를 뽑는다(저장 시드 난수 — 다시 불러와도 같음).
// 방송 중 실제로 해낸 일로만 진행되고(날짜 건너뛰기로는 진행 안 됨), 달성하면 자금·도장, 3개 모두면 단골 시청층 +2.
// 미션 보상은 경험·결말 조건을 대신하지 않는다(AGENTS.md 일반 결말 규칙).
import {CASH_MAXIMUM, CORNERS} from './constants.js';
import {gain} from './growth.js';
import {random} from './rng.js';

const MISSION_TYPES = {
  greats: {targets: [2, 3], label: n => `대성공 ${n}번 내기`},
  topGrade: {targets: [1, 2], label: n => `A등급 이상 방송 ${n}번`},
  donation: {targets: [1, 2], label: n => `응원 ${n}번 받기`},
  corner: {targets: [3, 4], label: (n, c) => `${CORNERS[c]} 코너 ${n}번 진행`},
  record: {targets: [1], label: () => '최고 시청자 기록 경신'},
  broadcasts: {targets: [3, 4], label: n => `방송 ${n}번 하기`},
  outfit: {targets: [2], label: n => `의상 준비 ${n}번`, when: s => Object.keys(s.outfitProgress).some(id => s.outfitStarted?.[id] && !s.wardrobe[id] && s.outfitProgress[id] < 100)},
  projectStep: {targets: [2], label: n => `기획 단계 ${n}번 진행`, when: s => !!s.project && s.project.step < 3},
};
export const MISSION_IDS = Object.keys(MISSION_TYPES);
const MISSION_REWARD = 100000; // × 방송 규모 배율

export const monthOf = date => date.slice(0, 7);
const pick = (s, list) => list[Math.floor(random(s) * list.length)];

/** 방송 시작 때 호출: 새 달이면 미션 3개 생성 */
export function refreshMissions(s) {
  if (s.missions?.month === monthOf(s.date)) return;
  const pool = MISSION_IDS.filter(id => !MISSION_TYPES[id].when || MISSION_TYPES[id].when(s));
  const list = [];
  while (list.length < 3 && pool.length) {
    const id = pool.splice(Math.floor(random(s) * pool.length), 1)[0], type = MISSION_TYPES[id];
    const target = pick(s, type.targets), corner = id === 'corner' ? pick(s, Object.keys(CORNERS)) : undefined;
    list.push({id, label: type.label(target, corner), target, progress: 0, done: false, ...(corner ? {corner} : {})});
  }
  s.missions = {month: monthOf(s.date), list, allDone: false};
}

/** 미션 진행. 달성하면 보상(자금·도장), 3개 모두면 단골 시청층 +2. */
export function bumpMission(s, id, {corner, amount = 1} = {}) {
  if (!s.missions || s.missions.month !== monthOf(s.date)) return;
  for (const m of s.missions.list) {
    if (m.id !== id || m.done || (m.corner && m.corner !== corner)) continue;
    m.progress = Math.min(m.target, m.progress + amount);
    if (m.progress < m.target) continue;
    m.done = true;
    const reward = MISSION_REWARD * (s.incomeSnapshot?.multiplier || 1);
    s.cash = Math.min(CASH_MAXIMUM, s.cash + reward);
    s.ledger.push({id: `mission:${s.missions.month}:${m.id}`, date: s.date, net: reward});
    s.records.missionStamps = (s.records.missionStamps || 0) + 1;
  }
  if (!s.missions.allDone && s.missions.list.length && s.missions.list.every(m => m.done)) {
    s.missions.allDone = true;
    s.records.missionPerfect = (s.records.missionPerfect || 0) + 1;
    gain(s, 'community', 2);
  }
}

export function isMission(m) {
  return !!m && MISSION_IDS.includes(m.id) && typeof m.label === 'string' && m.label.length <= 80 && Number.isInteger(m.target) && m.target >= 1 && m.target <= 10
    && Number.isInteger(m.progress) && m.progress >= 0 && m.progress <= m.target && typeof m.done === 'boolean' && (m.corner == null || Object.hasOwn(CORNERS, m.corner));
}
