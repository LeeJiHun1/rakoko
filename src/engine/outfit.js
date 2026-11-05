// 신의상: 방송 중 제안 이벤트 → 시작(비용 200만원 전액, +25) → 준비 행동으로 진행(무료·+25) → 공개 예약 → 공개(해금) → 무료 환복.
// 준비 중(40%↑)에는 의상당 한 번 유출 사건이 날 수 있다. 설계: outputs/rakoko_outfit_feature_design.md
import {OUTFIT_COST, OUTFIT_PROGRESS_STEP} from './constants.js';
import {random} from './rng.js';

/** 방송당 제안 이벤트 확률 (진행 중인 의상이 없을 때) */
export const OUTFIT_OFFER_CHANCE = .2;
export const LEAK_RESPONSES = ['hide', 'teaser', 'risky', 'now'];

export const isStarted = (s, id) => !!s.outfitStarted?.[id];
export const isCraftable = (catalog, id) => catalog.outfits.some(x => x.id === id && x.id !== 'base');
/** 시작했지만 아직 공개하지 않은 의상(동시에 1벌) */
export const pendingOutfit = s => Object.keys(s.outfitProgress).find(id => isStarted(s, id) && !s.wardrobe[id]) || null;

/**
 * 의상을 옷장에 넣는다(해금). 자동으로 갈아입히지 않는다 — '지금 입기'는 따로(설계 revealAutoEquip:false).
 * mode 'early'(유출 대응 조기 공개)면 예약돼 있던 공개 코너를 '다시 소개하기' 코너로 바꾼다.
 */
export function reveal(s, id, {mode = 'planned'} = {}) {
  s.wardrobe[id] = true;
  const wasScheduled = s.outfitReserved;
  s.outfitReserved = false;
  let replaced = false;
  for (const key of Object.keys(s.reservations)) {
    if (s.reservations[key] !== 'outfit') continue;
    if (mode === 'early' && Number(key) > s.slot) { s.reservations[key] = 'outfitFollowup'; replaced = true; } else delete s.reservations[key];
  }
  if (mode === 'early') s.outfitFollowup = replaced || wasScheduled ? id : null;
}

const addProgress = (s, id) => { s.outfitProgress[id] = Math.min(100, s.outfitProgress[id] + OUTFIT_PROGRESS_STEP); };

/** 제안 이벤트에서 제작을 시작한다: 비용 전액을 한 번에 내고 준비도 +25. 잔액이 부족하면 아무것도 바꾸지 않는다. */
export function startOutfit(s, id) {
  if (s.wardrobe[id] || isStarted(s, id)) throw Error('이미 준비를 시작한 옷이에요.');
  if (pendingOutfit(s)) throw Error('준비 중인 새 옷을 먼저 공개해주세요.');
  if (s.cash < OUTFIT_COST) throw Error(`새 의상 비용 ${OUTFIT_COST / 10000}만원이 부족해요.`);
  s.cash -= OUTFIT_COST;
  s.ledger.push({id: `outfit:${id}:${s.broadcastIndex}`, date: s.date, net: -OUTFIT_COST});
  addProgress(s, id);
  s.outfitStarted[id] = true;
  s.crafting = id;
}

/** 준비 행동 1회로 준비도를 올린다(무료 — 비용은 시작할 때 전액 냈다). 시작하지 않은 옷이면 아무것도 바꾸지 않는다. */
export function prepareOutfit(s) {
  if (s.wardrobe[s.crafting]) throw Error('이미 공개한 옷이에요.');
  if (!isStarted(s, s.crafting)) throw Error('방송 중 새 의상 제안을 받아 준비를 시작해주세요.');
  if (s.outfitProgress[s.crafting] >= 100) throw Error('준비가 끝났어요. 공개 방송을 예약해주세요.');
  addProgress(s, s.crafting);
}

/** 방송당 한 번 제안 이벤트를 굴린다. 진행 중인 의상이 없고, 남은 의상이 있고, 비용 전액을 낼 수 있을 때만. */
export function rollOutfitOffer(s, catalog) {
  if (s.lastOutfitOfferBroadcast === s.broadcastIndex) return null;
  s.lastOutfitOfferBroadcast = s.broadcastIndex;
  if (pendingOutfit(s) || s.cash < OUTFIT_COST) return null;
  const candidates = catalog.outfits.map(o => o.id).filter(id => id !== 'base' && !s.wardrobe[id] && !isStarted(s, id));
  if (!candidates.length || random(s) >= OUTFIT_OFFER_CHANCE) return null;
  return candidates[Math.floor(random(s) * candidates.length)];
}

export const commands = {
  craft: {prepOnly: true, run(s, c, catalog) {
    if (!isCraftable(catalog, c.outfitId)) throw Error('의상을 골라주세요.');
    if (!isStarted(s, c.outfitId)) throw Error('방송 중 새 의상 제안을 받아 준비를 시작해주세요.');
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
