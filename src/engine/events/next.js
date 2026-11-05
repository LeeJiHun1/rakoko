// 다음 코너의 사건 결정. 우선순위:
// ① 예약(기념일 → 의상 공개 → 마지막 특집) ② 특별 기획 단계 ③ 장기 콘텐츠 ④ 약속 메모 ⑤ 의상 유출 ⑥ 일반 사건
import {LEAK_MIN_PROGRESS} from '../constants.js';
import {random} from '../rng.js';
import {pickGeneral} from './general.js';
import {moduleEvent} from './module-events.js';
import {calendarEvent, finaleEvent, LEAK_CHANCE, leakEvent, projectEvent, promiseEvent, revealEvent} from './scripted.js';

const duePromise = s => s.promises.find(p => p.status === 'pending' && p.dueBroadcast <= s.broadcastIndex && p.createdBroadcast < s.broadcastIndex);

/** 방송마다 한 번만, 준비도 40% 이상인 미공개 의상에 대해 유출 사건을 굴린다. */
function rollLeak(s) {
  if (s.leakChecked || !(s.outfitProgress[s.crafting] >= LEAK_MIN_PROGRESS) || s.wardrobe[s.crafting]) return false;
  s.leakChecked = true;
  return random(s) < (s.checked ? LEAK_CHANCE.checked : LEAK_CHANCE.unchecked);
}

function chooseEvent(s, catalog) {
  const reservation = s.reservations[s.slot], corner = s.plan[s.slot];
  if (reservation === 'calendar') return calendarEvent(s, s.date.slice(5) === '09-10' ? 'birthday' : 'anniversary');
  if (reservation === 'outfit' && !s.wardrobe[s.crafting]) return revealEvent(s, catalog);
  if (reservation === 'finale') return finaleEvent(s);
  if (corner === 'S' && s.project && s.project.step < 3 && s.project.lastProgress !== s.broadcastIndex) return projectEvent(s, catalog);
  if (['G', 'S'].includes(corner) && s.module) {
    const e = moduleEvent(s, catalog);
    if (e) return e;
  }
  const promise = duePromise(s);
  if (promise) return promiseEvent(s, promise);
  if (rollLeak(s)) return leakEvent(s);
  return pickGeneral(s, catalog);
}

export function nextEvent(s, catalog) {
  s.event = chooseEvent(s, catalog);
  s.phase = 'event';
}
