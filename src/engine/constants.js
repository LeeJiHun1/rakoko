// 게임 전역 상수. 숫자·날짜 규칙을 바꿀 때는 여기부터 확인한다.
export const START_DATE = '2026-01-18';
export const DEADLINE = '2036-01-18'; // 무엔딩 10년 강제 결말 기준일
export const START_YEAR = Number(START_DATE.slice(0, 4));
export const BIRTHDAY = '09-10';
export const ANNIVERSARY = '01-18';
export const LATEST_DATE = '2100-12-31';

export const CORNERS = {T: '잡담', G: '게임 도전', F: '팬 참여', S: '특별 기획'};
export const LABELS = {awareness: '인지도', community: '단골 시청층', planning: '기획력', operation: '방송 운영력', gameSkill: '게임 숙련도'};
/** 코너를 진행하면 기본으로 오르는 능력 */
export const CORNER_BASE_STAT = {T: 'community', G: 'gameSkill', F: 'community', S: 'planning'};
export const PHASES = ['prep', 'event', 'result', 'wrap', 'ending', 'credits'];

export const SEGMENTS_PER_BROADCAST = 3;
export const PREPARATIONS_PER_BROADCAST = 2;
export const GAIN_CAP_PER_BROADCAST = 6; // 능력별 방송 1회 성장 상한
export const DEFAULT_SKILL = 10;
export const INITIAL_CASH = 3000000;

export const OUTFIT_COST = 500000;
export const OUTFIT_PROGRESS_STEP = 25;
export const LEAK_MIN_PROGRESS = 40;

export const MODULE_DURATION_DAYS = 120;
export const PLAYER_SKILL_THRESHOLD = 30;

/** 첫 결말(마지막 특집) 허용 시점: 방송 시작 후 150일 ≈ 주 1회 기준 23회차 (사용자 결정 Q3: 한 판 약 20~25회) */
export const FIRST_ENDING_DAYS = 150;
export const ENDING_RECHECK_DAYS = 30;
export const DEFER_ENDING_DAYS = 90;
export const CONTINUE_COOLDOWN_DAYS = 365;
export const COMMAND_HISTORY_LIMIT = 256;
