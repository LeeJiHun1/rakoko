// 일반 사건(카탈로그 events)이 오늘 나올 수 있는지 판정.
// 카탈로그 데이터만으로 표현하기 어려운 "상태 의존 조건"은 EVENT_GATES 표에 모은다.
// 새 사건 조건을 추가할 때는 여기 한 줄만 추가하면 되고, scripts/check.mjs 가 ID 존재 여부를 검사한다.
import {START_DATE} from '../constants.js';
import {daysBetween} from '../dates.js';

/** when(s) 가 true 일 때만 해당 사건이 후보가 된다. */
export const EVENT_GATES = [
  {ids: ['CE-004', 'CE-010'], note: '화면 점검을 하지 않은 방송', when: s => !s.checked},
  {ids: ['CE-007', 'CE-008', 'CE-009'], note: '자료 준비 1회 이상', when: s => s.dataPrepared >= 1},
  {ids: ['CE-012'], note: '자료 준비 2회', when: s => s.dataPrepared >= 2},
  {ids: ['CE-021', 'RK-022'], note: '퍼즐 게임', when: s => s.gameId === 'puzzle'},
  {ids: ['CE-022', 'RK-007'], note: '전략 게임', when: s => s.gameId === 'strategy'},
  {ids: ['RK-010'], note: '복싱 게임', when: s => s.gameId === 'boxing'},
  {ids: ['CE-060', 'RK-023'], note: '리듬 게임 또는 EF-006 기획', when: s => s.gameId === 'rhythm' || s.project?.eventId === 'EF-006'},
  {ids: ['CE-019', 'RA-004'], note: '같은 게임을 3회 이상 전에 한 적 있음', when: s => !!s.gameHistory[s.gameId] && s.broadcastIndex - s.gameHistory[s.gameId].last >= 3},
  {ids: ['CE-023'], note: '같은 게임을 한 적 있음', when: s => !!s.gameHistory[s.gameId]},
  {ids: ['CE-025', 'CE-026', 'CE-027', 'CE-028', 'CE-029', 'CE-030', 'RK-024'], note: '협동 게임 또는 EF-007 기획', when: s => s.project?.eventId === 'EF-007' || s.gameId === 'coop'},
  {ids: ['CE-033'], note: '세 번째 코너', when: s => s.slot === 2},
  {ids: ['CE-037'], note: '잡담·즉흥 선택을 했거나 지난 일지가 있음', when: s => s.currentLog.some(x => x.choice.includes('잡담') || x.choice.includes('즉흥')) || s.journal.length > 0},
  {ids: ['CE-040', 'CE-041'], note: '약속 메모가 있음', when: s => s.promises.length > 0},
  {ids: ['CE-050'], note: '준비 중인 미공개 의상', when: s => !!s.outfitProgress[s.crafting] && !s.wardrobe[s.crafting]},
  {ids: ['CE-052', 'CE-053', 'CE-054'], note: '공개한 의상 1벌 이상', when: s => Object.keys(s.wardrobe).length >= 2},
  {ids: ['CE-058', 'CE-065', 'RA-002'], note: 'EF-012 기획 진행/완료', when: s => s.project?.eventId === 'EF-012' || s.projectArchive.some(p => p.eventId === 'EF-012')},
  {ids: ['RK-026'], note: '구매 기록 있음', when: s => s.purchases.length > 0},
  {ids: ['RA-001'], note: '마친 기획·장기 콘텐츠가 있음', when: s => s.projectArchive.length > 0 || s.moduleArchive.length > 0},
];

const GATES_BY_ID = new Map();
for (const gate of EVENT_GATES) for (const id of gate.ids) GATES_BY_ID.set(id, [...(GATES_BY_ID.get(id) || []), gate]);
export const GATED_EVENT_IDS = [...GATES_BY_ID.keys()];

export function normalEligible(s, e) {
  if (!e.route.includes(s.plan[s.slot])) return false;
  if (e.minElapsedDay > daysBetween(START_DATE, s.date)) return false;
  if (e.repeat.mode === 'once_per_run' && (s.seenOnce.includes(e.id) || s.familyMemory[e.family])) return false;
  if (s.familyLast[e.family] != null && s.broadcastIndex - s.familyLast[e.family] < (e.repeat.minimumBroadcastGap || 5)) return false;
  if (s.groupLast[e.group] != null && s.broadcastIndex - s.groupLast[e.group] < 1) return false; // 같은 분류는 같은 방송에서만 겹치지 않게
  return (GATES_BY_ID.get(e.id) || []).every(gate => gate.when(s));
}
