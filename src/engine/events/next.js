// 다음 코너의 사건 결정. 우선순위:
// ① 예약(기념일 → 의상 공개 → 마지막 특집) ② 특별 기획 단계 ③ 장기 콘텐츠 ④ 약속 메모 ⑤ 의상 유출 ⑥ 일반 사건
import {LEAK_MIN_PROGRESS} from '../constants.js';
import {OUTFIT_COST} from '../constants.js';
import {rollOutfitOffer} from '../outfit.js';
import {effectsFor, effectText, rollShopOffer} from '../purchases.js';
import {random} from '../rng.js';
import {pickGeneral} from './general.js';
import {moduleEvent} from './module-events.js';
import {calendarEvent, finaleEvent, LEAK_CHANCE, leakEvent, outfitFollowupEvent, outfitOfferEvent, projectEvent, promiseEvent, revealEvent, shopEvent} from './scripted.js';

const duePromise = s => s.promises.find(p => p.status === 'pending' && p.dueBroadcast <= s.broadcastIndex && p.createdBroadcast < s.broadcastIndex);

/** 방송마다 한 번만, 준비도 40% 이상인 미공개 의상에 대해 유출 사건을 굴린다. */
function rollLeak(s) {
  // 시작한 미공개 의상이 40% 이상일 때, 방송당 한 번, 의상당 최대 한 번(설계 maxLeaksPerOutfit:1)
  if (s.leakChecked || !s.outfitStarted?.[s.crafting] || s.leaked[s.crafting] || !(s.outfitProgress[s.crafting] >= LEAK_MIN_PROGRESS) || s.wardrobe[s.crafting]) return false;
  s.leakChecked = true;
  return random(s) < (s.checked ? LEAK_CHANCE.checked : LEAK_CHANCE.unchecked);
}

function chooseEvent(s, catalog) {
  const reservation = s.reservations[s.slot], corner = s.plan[s.slot];
  if (reservation === 'calendar') return calendarEvent(s, s.date.slice(5) === '09-10' ? 'birthday' : 'anniversary');
  if (reservation === 'outfit' && !s.wardrobe[s.crafting]) return revealEvent(s, catalog);
  if (reservation === 'finale') return finaleEvent(s);
  if (reservation === 'outfitFollowup' && s.outfitFollowup) return outfitFollowupEvent(s, catalog);
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

/** 코너 시작 전, 예약이 없는 코너면 방송당 한 번 구매 막간을 굴린다(막간은 코너를 소비하지 않는다). */
function shopInterlude(s, catalog) {
  if (s.reservations[s.slot]) return null;
  const outfitId = rollOutfitOffer(s, catalog);
  if (outfitId) return outfitOfferEvent(s, outfitId, OUTFIT_COST);
  const def = rollShopOffer(s, catalog);
  return def ? shopEvent(s, def, effectsFor, effectText) : null;
}

export function nextEvent(s, catalog, {allowShop = true} = {}) {
  s.event = (allowShop && shopInterlude(s, catalog)) || chooseEvent(s, catalog);
  s.phase = 'event';
}
