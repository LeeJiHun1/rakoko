// 새 일지 상태와 기본 조회. 상태 키를 추가하면 save.js 검증·마이그레이션도 함께 고친다.
// 주의: 키 순서는 골든 테스트 해시에 반영되므로 기존 키 순서를 바꾸지 않는다.
import {emptyRecords} from './audience.js';
import {DEFAULT_SKILL, INITIAL_CASH, PREPARATIONS_PER_BROADCAST, START_DATE} from './constants.js';

/** 저장 형식 버전. 올리면 save.js MIGRATIONS 에 변환을 추가한다. (2: records 추가) */
export const SCHEMA_VERSION = 2;

export function newGame(seed = Date.now() >>> 0) {
  return {
    schemaVersion: SCHEMA_VERSION, contentVersion: '0.1.0', runId: `journal-${seed}-${Date.now().toString(36)}`, revision: 0, seed: seed >>> 0,
    date: START_DATE, phase: 'prep', broadcastIndex: 1, completedBroadcasts: 0, preparations: PREPARATIONS_PER_BROADCAST, checked: false, dataPrepared: 0,
    stats: {awareness: 10, community: 20, planning: 15, operation: 20}, gameSkillById: {puzzle: DEFAULT_SKILL}, gameId: 'puzzle',
    plan: ['T', 'G', 'F'], slot: 0, event: null, result: null, currentLog: [], gainTotals: {},
    cash: INITIAL_CASH, scaleIndex: 0, incomeSnapshot: null, ledger: [], purchases: [],
    wardrobe: {base: true}, outfitProgress: {ghost: 0, maid: 0, police: 0, nun: 0}, equipped: 'base', crafting: 'maid', outfitReserved: false,
    finaleScheduled: false, reservations: {}, leakChecked: false, leaked: {},
    seenOnce: [], familyLast: {}, familyMemory: {}, groupLast: {}, gameHistory: {},
    promises: [], journal: [], celebrations: [], story: {}, project: null, projectArchive: [], module: null, moduleArchive: [],
    experienceRecords: [], experienceCounts: {}, experienceCountsByGame: {},
    reachedEndings: [], lastEnding: null, lastEndingCheck: null, deferUntil: null, endingSeenEver: false, commands: [],
    records: emptyRecords(),
  };
}

export const skill = (s, gameId = s.gameId) => s.gameSkillById[gameId] ?? DEFAULT_SKILL;
