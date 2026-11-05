// 날짜 이동. 건너뛴 날에는 성장·수입이 없고, 중간의 생일·주년에서 먼저 멈춘다.
import {DEADLINE, LATEST_DATE} from './constants.js';
import {isValidIsoDate, nextMilestone} from './dates.js';
import {forceEnding} from './ending.js';

export function scheduleDate(s, target) {
  if (!isValidIsoDate(target) || target <= s.date || target > LATEST_DATE) throw Error('오늘 이후의 올바른 날짜를 골라주세요.');
  if (!s.endingSeenEver && target >= DEADLINE) { s.date = DEADLINE; forceEnding(s); return; }
  const nearest = [nextMilestone(s.date, 'birthday'), nextMilestone(s.date, 'anniversary')].filter(x => x <= target).sort()[0];
  s.date = nearest || target;
  if (s.module && s.date > s.module.deadline) s.module.expired = true;
}
