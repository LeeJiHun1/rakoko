// 게임 엔진 공개 진입점(façade). UI·테스트·스크립트는 이 파일에서만 가져온다.
// 내부 구현은 src/engine/* 에 도메인별로 나뉘어 있다 — 구조는 docs/ARCHITECTURE.md 참고.
// 원칙: 상태 변경은 dispatch 만, 게임 난수는 저장되는 시드(random)만 사용한다.
export {START_DATE, DEADLINE, CORNERS, LABELS, OUTFIT_COST, OUTFIT_PROGRESS_STEP} from './engine/constants.js';
export {addDays, daysBetween, yearsPlayed, nextMilestone, celebrationOn, celebrationKey} from './engine/dates.js';
export {random} from './engine/rng.js';
export {newGame, skill} from './engine/state.js';
export {unmet} from './engine/requirements.js';
export {projectLocks, projectProgressLocks, finaleLocks} from './engine/project.js';
export {scheduleDate} from './engine/calendar.js';
export {dispatch} from './engine/dispatch.js';
export {validateSave, migrateSave, loadSave} from './engine/save.js';
export {GATED_EVENT_IDS} from './engine/events/eligibility.js';
