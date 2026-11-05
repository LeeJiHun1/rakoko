// 능력 성장과 경험 기록.
import {GAIN_CAP_PER_BROADCAST} from './constants.js';
import {skill} from './state.js';
import {clamp} from './util.js';

/** 능력 상승. 방송 1회에 능력별 GAIN_CAP_PER_BROADCAST 까지만 오르며 실제 오른 값을 돌려준다. */
export function gain(s, key, amount, gameId = s.gameId) {
  const ledgerKey = key === 'gameSkill' ? `game:${gameId}` : key;
  const add = Math.min(amount, Math.max(0, GAIN_CAP_PER_BROADCAST - (s.gainTotals[ledgerKey] || 0)));
  if (key === 'gameSkill') s.gameSkillById[gameId] = clamp(skill(s, gameId) + add);
  else s.stats[key] = clamp(s.stats[key] + add);
  s.gainTotals[ledgerKey] = (s.gainTotals[ledgerKey] || 0) + add;
  return add;
}

/** 같은 출처(source)에서는 한 번만 기록한다. sameGameAsProject 경험은 게임별로도 센다. */
export function awardExperience(s, id, source, gameId, catalog) {
  const bound = catalog.experienceDefinitions[id]?.sameGameAsProject;
  if (s.experienceRecords.some(r => r.experienceId === id && r.source === source)) return;
  s.experienceRecords.push({experienceId: id, source, gameId: bound ? gameId : null, date: s.date, broadcastIndex: s.broadcastIndex});
  s.experienceCounts[id] = (s.experienceCounts[id] || 0) + 1;
  if (bound) {
    s.experienceCountsByGame[gameId] ??= {};
    s.experienceCountsByGame[gameId][id] = (s.experienceCountsByGame[gameId][id] || 0) + 1;
  }
}
