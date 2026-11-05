// 의상: 준비(유료) → 공개 예약 → 공개 → 무료 환복.
import {OUTFIT_COST, OUTFIT_PROGRESS_STEP} from './constants.js';

/** 의상을 옷장에 넣고 바로 입힌다. 남은 공개 예약은 지운다. */
export function reveal(s, id) {
  s.wardrobe[id] = true;
  s.equipped = id;
  s.outfitReserved = false;
  for (const key of Object.keys(s.reservations)) if (s.reservations[key] === 'outfit') delete s.reservations[key];
}

export const isCraftable = (catalog, id) => catalog.outfits.some(x => x.id === id && x.id !== 'base');

/** 준비 행동 1회로 의상 준비도를 올린다. 잔액이 부족하면 아무것도 바꾸지 않는다. */
export function prepareOutfit(s) {
  if (s.wardrobe[s.crafting]) throw Error('이미 공개한 옷이에요.');
  if (s.outfitProgress[s.crafting] >= 100) throw Error('준비가 끝났어요. 공개 방송을 예약해주세요.');
  if (s.cash < OUTFIT_COST) throw Error('의상 준비비 50만원이 부족해요.');
  s.cash -= OUTFIT_COST;
  s.outfitProgress[s.crafting] = Math.min(100, s.outfitProgress[s.crafting] + OUTFIT_PROGRESS_STEP);
  s.ledger.push({id: `outfit:${s.broadcastIndex}:${s.preparations}`, date: s.date, net: -OUTFIT_COST});
}

export const commands = {
  craft: {prepOnly: true, run(s, c, catalog) {
    if (!isCraftable(catalog, c.outfitId)) throw Error('의상을 골라주세요.');
    s.crafting = c.outfitId;
    s.outfitReserved = false;
  }},
  equip: {run(s, c) {
    if (!s.wardrobe[c.outfitId]) throw Error('공개한 옷만 입을 수 있어요.');
    s.equipped = c.outfitId;
  }},
  reserveOutfit: {prepOnly: true, run(s) {
    if ((s.outfitProgress[s.crafting] || 0) < 100 || s.wardrobe[s.crafting]) throw Error('준비를 마친 새 옷이 필요해요.');
    s.outfitReserved = !s.outfitReserved;
  }},
};
