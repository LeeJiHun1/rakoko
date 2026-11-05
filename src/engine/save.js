// 저장본 검증. 불러오기·가져오기 때 반드시 거친다. 신뢰할 수 없는 입력(공유받은 파일)으로 취급한다.
import {CORNERS, PHASES} from './constants.js';
import {SCHEMA_VERSION} from './state.js';

const LIST_KEYS = ['journal', 'commands', 'promises', 'purchases', 'experienceRecords', 'reachedEndings', 'projectArchive', 'moduleArchive', 'celebrations', 'seenOnce'];

export function validateSave(s, catalog) {
  if (!s || s.schemaVersion !== SCHEMA_VERSION || typeof s.runId !== 'string' || s.runId.length > 160) throw Error('지원하지 않는 일지 파일이에요.');
  if (!PHASES.includes(s.phase) || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || Number.isNaN(Date.parse(s.date + 'T00:00:00Z'))) throw Error('진행 상태가 올바르지 않아요.');
  for (const key of ['awareness', 'community', 'planning', 'operation']) if (!Number.isFinite(s.stats?.[key]) || s.stats[key] < 0 || s.stats[key] > 100) throw Error('능력 값이 올바르지 않아요.');
  if (!Number.isSafeInteger(s.cash) || s.cash < 0 || s.cash > 9000000000000 || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295) throw Error('저장 값이 올바르지 않아요.');
  for (const key of LIST_KEYS) if (!Array.isArray(s[key]) || s[key].length > 10000) throw Error('일지 목록이 올바르지 않아요.');
  if (!Number.isInteger(s.broadcastIndex) || s.broadcastIndex < 1 || s.broadcastIndex > 10000 || !Number.isInteger(s.completedBroadcasts) || s.completedBroadcasts < 0 || s.completedBroadcasts > 10000 || !Number.isInteger(s.preparations) || s.preparations < 0 || s.preparations > 2) throw Error('방송 회차가 올바르지 않아요.');
  if (!Array.isArray(s.plan) || s.plan.length !== 3 || s.plan.some(x => !Object.hasOwn(CORNERS, x))) throw Error('편성표가 올바르지 않아요.');
  if (!s.wardrobe || !s.wardrobe.base || !catalog.outfits.some(x => x.id === s.crafting) || !s.gameSkillById || !s.story || !s.gainTotals || !s.familyLast || !s.groupLast) throw Error('필수 기록이 없어요.');
  if (s.project && !catalog.projects.some(x => x.id === s.project.id)) throw Error('현재 기획을 확인할 수 없어요.');
  for (const v of Object.values(s.gameSkillById)) if (!Number.isFinite(v) || v < 0 || v > 100) throw Error('게임 숙련도가 올바르지 않아요.');
  if (s.phase === 'event' && (!s.event || !Array.isArray(s.event.choices))) throw Error('진행 중 사건이 없어요.');
  return s;
}
