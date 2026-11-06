// 카탈로그 조건식({path, op, value}) 평가와 잠금 사유 문구.
import {LABELS} from './constants.js';
import {skill} from './state.js';
import {getPath} from './util.js';

/** 조건식 path 를 상태 값으로 해석한다. $game 은 현재 기획(없으면 오늘)의 게임. */
function valueAt(s, path, gameId = s.project?.gameId || s.gameId) {
  if (path === 'stats.gameSkillById.$game') return skill(s, gameId);
  if (path.startsWith('experienceCountsByGame.$game.')) { const g = Object.hasOwn(s.experienceCountsByGame, gameId) ? s.experienceCountsByGame[gameId] : null, k = path.split('.').at(-1); return g && Object.hasOwn(g, k) ? g[k] : 0; }
  if (path.startsWith('experienceCounts.')) return s.experienceCounts[path.split('.').at(-1)] || 0;
  if (path === 'economy.cash') return s.cash;
  if (path.startsWith('module.')) {
    const p = path.slice(7);
    return getPath(s.module, p) ?? getPath(s.module?.local, p);
  }
  return getPath(s, path);
}

function isMet(s, r, gameId) {
  const v = valueAt(s, r.path, gameId);
  if (r.op === 'gte') return typeof v === 'number' && v >= r.value;
  if (r.op === 'eq') return v === r.value;
  return false; // 알 수 없는 연산자는 잠근다
}

function reasonFor(s, r, catalog, gameId) {
  if (r.path.startsWith('stats.')) {
    const key = r.path.includes('gameSkill') ? 'gameSkill' : r.path.split('.')[1];
    return `${LABELS[key] || key} ${valueAt(s, r.path, gameId) ?? 0} / 필요 ${r.value}`;
  }
  if (r.path.startsWith('experience')) {
    const id = r.path.split('.').at(-1);
    return `${catalog?.experienceDefinitions[id]?.label || '선행 경험'} 필요`;
  }
  if (r.path === 'economy.cash') return `방송 자금 부족 (필요 ${Number(r.value).toLocaleString('ko-KR')}원)`;
  if (r.path.startsWith('story.')) return '현재 기획의 준비·검증이 더 필요해요';
  if (r.path.includes('playerConfirmed')) return '선수 참가 자격이 필요해요';
  if (r.path.includes('roleTrack')) return '현재 참가 역할과 맞지 않아요';
  if (r.path.includes('projectProgress')) return `현지 기획 준비 ${valueAt(s, r.path) || 0} / ${r.value}`;
  return '현재 기획의 역할·검증 범위가 맞지 않아요';
}

/** 충족하지 못한 조건의 사유 목록. 빈 배열이면 모두 충족. */
export function unmet(s, requirements = [], catalog, gameId) {
  return requirements.filter(r => !isMet(s, r, gameId)).map(r => reasonFor(s, r, catalog, gameId));
}
