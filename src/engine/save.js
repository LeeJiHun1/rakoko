// 저장본 검증. 불러오기·가져오기 때 반드시 거친다. 신뢰할 수 없는 입력(공유받은 파일)으로 취급한다.
import {CORNERS, PHASES} from './constants.js';
import {isValidIsoDate} from './dates.js';
import {SCHEMA_VERSION} from './state.js';

const LIST_KEYS = ['journal', 'commands', 'promises', 'purchases', 'experienceRecords', 'reachedEndings', 'projectArchive', 'moduleArchive', 'celebrations', 'seenOnce'];

const MODULE_PHASES = ['invited', 'orientation', 'working', 'project_ready', 'rehearsed', 'closed'];
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isStr = (v, max = 2000) => typeof v === 'string' && v.length <= max;
const isDate = v => typeof v === 'string' && isValidIsoDate(v);
const optStr = v => v == null || isStr(v);

/** 화면에 그려지는 기록 항목의 형식 검사. 문자열 내용은 화면에서 escape 하므로 형식만 본다. */
const RECORD_CHECKS = {
  journal: j => isInt(j?.id, 1, 10000) && isDate(j.date) && Array.isArray(j.events) && j.events.length <= 3
    && j.events.every(e => isStr(e?.title) && isStr(e.choice) && optStr(e.outcome)) && isInt(j.representative, 0, 2)
    && Number.isFinite(j.income?.gross) && Number.isFinite(j.income?.cost) && Number.isFinite(j.income?.net) && optStr(j.outfit) && optStr(j.ending),
  projectArchive: (p, catalog) => isProject(p, catalog),
  reachedEndings: e => isStr(e?.id, 64) && isStr(e.title) && optStr(e.epilogue) && optStr(e.resolution),
  purchases: p => isStr(p?.id, 80) && isStr(p.choice) && Number.isSafeInteger(p.cost) && isInt(p.dueBroadcast, 0, 20000) && ['pending', 'delivered'].includes(p.status),
};

function isProject(p, catalog) {
  return !!p && catalog.projects.some(x => x.id === p.id) && isInt(p.step, 0, 3) && isStr(p.instanceId, 64)
    && Array.isArray(p.log) && p.log.length <= 10 && p.log.every(l => isDate(l?.date) && isStr(l.text));
}

function isModule(m) {
  return MODULE_PHASES.includes(m.phase) && isStr(m.name, 200) && isStr(m.id, 32) && isDate(m.deadline) && isInt(m.participation, 0, 10000);
}

function isEnding(e) {
  return isStr(e.id, 64) && isStr(e.title) && optStr(e.resolution) && optStr(e.epilogue)
    && (e.projectLog == null || (Array.isArray(e.projectLog) && e.projectLog.every(l => isDate(l?.date) && isStr(l.text))));
}

function validateRecords(s, catalog) {
  for (const [key, check] of Object.entries(RECORD_CHECKS)) if (!s[key].every(x => check(x, catalog))) throw Error('일지 기록 형식이 올바르지 않아요.');
  if (s.project && !isProject(s.project, catalog)) throw Error('현재 기획을 확인할 수 없어요.');
  if (s.module && !isModule(s.module)) throw Error('장기 콘텐츠 기록이 올바르지 않아요.');
  if (s.lastEnding && !isEnding(s.lastEnding)) throw Error('결말 기록이 올바르지 않아요.');
  if (s.phase === 'event' && !s.event.choices.every(c => isStr(c?.id, 80) && isStr(c.text))) throw Error('진행 중 사건이 없어요.');
}

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
  validateRecords(s, catalog);
  return s;
}
