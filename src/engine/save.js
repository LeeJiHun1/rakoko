// 저장본 검증. 불러오기·가져오기 때 반드시 거친다. 신뢰할 수 없는 입력(공유받은 파일)으로 취급한다.
import {CASH_MAXIMUM, CORNERS, LABELS, LATEST_DATE, MAX_BROADCASTS, PHASES, START_DATE} from './constants.js';
import {isValidIsoDate} from './dates.js';
import {SCHEMA_VERSION} from './state.js';
import {clone} from './util.js';
import {emptyRecords} from './audience.js';

const LIST_KEYS = ['journal', 'commands', 'promises', 'purchases', 'experienceRecords', 'reachedEndings', 'projectArchive', 'moduleArchive', 'celebrations', 'seenOnce'];

/**
 * 저장 형식 변환표. MIGRATIONS[v] 는 schemaVersion v 저장본을 v+1 로 바꿔 돌려준다.
 * state.js 의 SCHEMA_VERSION 을 올릴 때 반드시 여기에 변환을 추가하고 테스트를 붙인다.
 * 예) 1: s => ({...s, schemaVersion: 2, newField: 기본값}),
 */
export const MIGRATIONS = {
  /** 1 → 2: 역대 기록(records) 추가. 지난 일지의 최고 수입은 복원하고 나머지는 0에서 시작 */
  1: s => ({...s, schemaVersion: 2, records: {...emptyRecords(), bestGross: Math.max(0, ...s.journal.map(j => j.income?.gross || 0))}}),
};

/** 예전 형식 저장본을 현재 형식으로 올린다. 더 새로운 버전의 저장본은 거부한다. */
export function migrateSave(raw, migrations = MIGRATIONS) {
  if (!raw || typeof raw !== 'object') return raw;
  if (Number.isInteger(raw.schemaVersion) && raw.schemaVersion > SCHEMA_VERSION) throw Error('더 새로운 버전의 게임에서 만든 일지예요. 페이지를 새로고침해 최신 버전으로 열어주세요.');
  let s = raw;
  while (Number.isInteger(s.schemaVersion) && s.schemaVersion < SCHEMA_VERSION && Object.hasOwn(migrations, s.schemaVersion)) s = migrations[s.schemaVersion](clone(s));
  return s;
}

/** 저장소·파일에서 읽은 값을 쓸 수 있는 상태로: 변환 → 검증. */
export const loadSave = (raw, catalog) => validateSave(migrateSave(raw), catalog);

const MODULE_PHASES = ['invited', 'orientation', 'working', 'project_ready', 'rehearsed', 'closed'];
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isStr = (v, max = 2000) => typeof v === 'string' && v.length <= max;
const isDate = v => typeof v === 'string' && isValidIsoDate(v);
const optStr = v => v == null || isStr(v);

/** 화면에 그려지는 기록 항목의 형식 검사. 문자열 내용은 화면에서 escape 하므로 형식만 본다. */
const RECORD_CHECKS = {
  journal: j => isInt(j?.id, 1, MAX_BROADCASTS) && isDate(j.date) && Array.isArray(j.events) && j.events.length <= 3
    && j.events.every(e => isStr(e?.title) && isStr(e.choice) && optStr(e.outcome)) && isInt(j.representative, 0, 2)
    && Number.isFinite(j.income?.gross) && Number.isFinite(j.income?.cost) && Number.isFinite(j.income?.net) && optStr(j.outfit) && optStr(j.ending)
    && (j.viewers == null || isInt(j.viewers, 0, 1e9)) && (j.grade == null || ['S', 'A', 'B', 'C'].includes(j.grade)) && (j.donations == null || Number.isSafeInteger(j.donations)),
  projectArchive: (p, catalog) => isProject(p, catalog),
  reachedEndings: e => isStr(e?.id, 64) && isStr(e.title) && optStr(e.epilogue) && optStr(e.resolution),
  purchases: p => isStr(p?.id, 80) && isStr(p.choice) && Number.isSafeInteger(p.cost) && isInt(p.dueBroadcast, 0, 20000) && ['pending', 'delivered'].includes(p.status)
    && (p.effects == null || (Array.isArray(p.effects) && p.effects.every(e => ['odds', 'viewers', 'donation'].includes(e?.kind) && Number.isFinite(e.amount) && isInt(e.broadcasts, 1, 100))))
    && (p.deliveredAt == null || isInt(p.deliveredAt, 0, 20000)),
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

const STAT_KEYS = ['awareness', 'community', 'planning', 'operation'];
const GRADES = ['S', 'A', 'B', 'C'];
const RECORD_NAMES = ['viewers', 'gross', 'grade'];
const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
const onlyKeys = (obj, allowed) => isPlainObject(obj) && Object.keys(obj).every(k => allowed.includes(k));

/** 화면에 숫자로 그리는 값·id 를 허용 목록으로 검사 (가져온 파일로 마크업·CSS·프로토타입 키를 넣지 못하게) */
function validateShape(s, catalog) {
  const fail = message => { throw Error(message); };
  const gameIds = catalog.games.map(g => g.id), outfitIds = catalog.outfits.map(o => o.id);
  if (!onlyKeys(s.stats, STAT_KEYS) || Object.keys(s.stats).length !== STAT_KEYS.length) fail('능력 값이 올바르지 않아요.');
  if (s.date < START_DATE || s.date > LATEST_DATE) fail('진행 상태가 올바르지 않아요.');
  if (!isInt(s.slot, 0, 3)) fail('진행 상태가 올바르지 않아요.'); // 정산 단계에서는 3
  if (!isInt(s.scaleIndex, 0, catalog.economy.income.scaleTiers.length - 1)) fail('방송 규모가 올바르지 않아요.');
  if (!gameIds.includes(s.gameId) || !onlyKeys(s.gameSkillById, gameIds)) fail('게임 기록이 올바르지 않아요.');
  if (s.project && !gameIds.includes(s.project.gameId)) fail('현재 기획을 확인할 수 없어요.');
  if (!onlyKeys(s.wardrobe, outfitIds) || !Object.values(s.wardrobe).every(v => v === true) || !s.wardrobe[s.equipped]) fail('옷장 기록이 올바르지 않아요.');
  if (!onlyKeys(s.outfitProgress, outfitIds) || !Object.values(s.outfitProgress).every(v => isInt(v, 0, 100))) fail('옷장 기록이 올바르지 않아요.');
  if (!isPlainObject(s.reservations) || !Object.entries(s.reservations).every(([k, v]) => ['0', '1', '2'].includes(k) && ['calendar', 'outfit', 'finale'].includes(v))) fail('예약 기록이 올바르지 않아요.');
  if (!isInt(s.dataPrepared, 0, 2) || !(s.practicedToday == null || isInt(s.practicedToday, 0, 2))) fail('준비 기록이 올바르지 않아요.');
  if (['event', 'ending'].includes(s.phase) && !isStr(s.event?.title)) fail('진행 중 사건이 없어요.');
  if (s.phase === 'result' && !isResult(s.result)) fail('선택 결과 기록이 올바르지 않아요.');
  if (s.phase === 'wrap' && (!s.journal.length || !isSettlement(s.result))) fail('방송 정산 기록이 올바르지 않아요.');
  if (s.phase === 'credits' && !s.lastEnding) fail('결말 기록이 올바르지 않아요.');
}

function isResult(r) {
  return isPlainObject(r) && isStr(r.title) && isStr(r.choice) && isStr(r.outcome) && isStr(r.kind, 32)
    && onlyKeys(r.changes, Object.keys(LABELS)) && Object.values(r.changes).every(Number.isFinite)
    && (r.grade == null || ['great', 'success', 'miss'].includes(r.grade))
    && (r.reactions == null || (Array.isArray(r.reactions) && r.reactions.length <= 10 && r.reactions.every(x => isStr(x?.speaker, 40) && isStr(x.text, 200))))
    && (r.donation == null || (['jackpot', 'medium', 'small'].includes(r.donation.tier) && Number.isSafeInteger(r.donation.amount) && isStr(r.donation.from, 40) && isStr(r.donation.message, 200)));
}

function isSettlement(r) {
  return isPlainObject(r) && ['gross', 'cost', 'net'].every(k => Number.isFinite(r[k]))
    && (r.grade == null || GRADES.includes(r.grade)) && (r.viewers == null || isInt(r.viewers, 0, 1e9))
    && (r.newRecords == null || (Array.isArray(r.newRecords) && r.newRecords.every(x => RECORD_NAMES.includes(x))));
}

function validateRecords(s, catalog) {
  for (const [key, check] of Object.entries(RECORD_CHECKS)) if (!s[key].every(x => check(x, catalog))) throw Error('일지 기록 형식이 올바르지 않아요.');
  if (s.project && !isProject(s.project, catalog)) throw Error('현재 기획을 확인할 수 없어요.');
  if (s.module && !isModule(s.module)) throw Error('장기 콘텐츠 기록이 올바르지 않아요.');
  const r = s.records;
  if (!r || !['bestViewers', 'bestGross', 'greats', 'donations', 'donationTotal'].every(k => Number.isSafeInteger(r[k]) && r[k] >= 0) || !(r.bestGrade == null || ['S', 'A', 'B', 'C'].includes(r.bestGrade))) throw Error('역대 기록이 올바르지 않아요.');
  if (s.lastEnding && !isEnding(s.lastEnding)) throw Error('결말 기록이 올바르지 않아요.');
  if (s.phase === 'event' && !s.event.choices.every(c => isStr(c?.id, 80) && isStr(c.text))) throw Error('진행 중 사건이 없어요.');
}

export function validateSave(s, catalog) {
  if (!s || s.schemaVersion !== SCHEMA_VERSION || typeof s.runId !== 'string' || s.runId.length > 160) throw Error('지원하지 않는 일지 파일이에요.');
  if (!PHASES.includes(s.phase) || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || Number.isNaN(Date.parse(s.date + 'T00:00:00Z'))) throw Error('진행 상태가 올바르지 않아요.');
  for (const key of ['awareness', 'community', 'planning', 'operation']) if (!Number.isFinite(s.stats?.[key]) || s.stats[key] < 0 || s.stats[key] > 100) throw Error('능력 값이 올바르지 않아요.');
  if (!Number.isSafeInteger(s.cash) || s.cash < 0 || s.cash > CASH_MAXIMUM || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295) throw Error('저장 값이 올바르지 않아요.');
  for (const key of LIST_KEYS) if (!Array.isArray(s[key]) || s[key].length > MAX_BROADCASTS) throw Error('일지 목록이 올바르지 않아요.');
  if (!Number.isInteger(s.broadcastIndex) || s.broadcastIndex < 1 || s.broadcastIndex > MAX_BROADCASTS || !Number.isInteger(s.completedBroadcasts) || s.completedBroadcasts < 0 || s.completedBroadcasts > MAX_BROADCASTS || !Number.isInteger(s.preparations) || s.preparations < 0 || s.preparations > 2) throw Error('방송 회차가 올바르지 않아요.');
  if (!Array.isArray(s.plan) || s.plan.length !== 3 || s.plan.some(x => !Object.hasOwn(CORNERS, x))) throw Error('편성표가 올바르지 않아요.');
  if (!s.wardrobe || !s.wardrobe.base || !catalog.outfits.some(x => x.id === s.crafting) || !s.gameSkillById || !s.story || !s.gainTotals || !s.familyLast || !s.groupLast) throw Error('필수 기록이 없어요.');
  if (s.project && !catalog.projects.some(x => x.id === s.project.id)) throw Error('현재 기획을 확인할 수 없어요.');
  for (const v of Object.values(s.gameSkillById)) if (!Number.isFinite(v) || v < 0 || v > 100) throw Error('게임 숙련도가 올바르지 않아요.');
  if (s.phase === 'event' && (!s.event || !Array.isArray(s.event.choices))) throw Error('진행 중 사건이 없어요.');
  validateShape(s, catalog);
  validateRecords(s, catalog);
  return s;
}
