// 날짜 계산. 모든 날짜는 UTC 기준 'YYYY-MM-DD' 문자열이다.
import {ANNIVERSARY, BIRTHDAY, FIRST_ENDING_DAYS, START_DATE, START_YEAR} from './constants.js';

const DAY_MS = 86400000;
const toTime = date => Date.parse(date + 'T00:00:00Z');

export const addDays = (date, n) => new Date(toTime(date) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY_MS);
export const monthDay = date => date.slice(5);
export const yearOf = date => date.slice(0, 4);
export const yearsPlayed = s => Math.max(0, Number(yearOf(s.date)) - START_YEAR - (monthDay(s.date) < ANNIVERSARY ? 1 : 0));

export const daysPlayed = s => daysBetween(START_DATE, s.date);
export const firstEndingDate = () => addDays(START_DATE, FIRST_ENDING_DAYS);
export const endingUnlocked = s => daysPlayed(s) >= FIRST_ENDING_DAYS;

export function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toTime(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}

/** date 이후(당일 제외)의 가장 가까운 생일/주년 */
export function nextMilestone(date, type) {
  let y = Number(yearOf(date));
  const md = type === 'birthday' ? BIRTHDAY : ANNIVERSARY;
  if (`${y}-${md}` <= date) y++;
  return `${y}-${md}`;
}

/** 오늘이 기념일이면 'birthday' | 'anniversary', 아니면 null (주년은 1주년부터) */
export function celebrationOn(s) {
  if (monthDay(s.date) === BIRTHDAY) return 'birthday';
  if (monthDay(s.date) === ANNIVERSARY && yearsPlayed(s) >= 1) return 'anniversary';
  return null;
}
export const celebrationKey = (type, date) => `${type}:${yearOf(date)}`;
