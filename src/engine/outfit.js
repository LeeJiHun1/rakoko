// 신의상: 방송 중 제안 이벤트 → 시작(비용 200만원 전액, +25) → 준비 행동으로 진행(무료·+25) → 공개 예약 → 공개(해금) → 무료 환복.
// 준비 중(40%↑)에는 의상당 한 번 유출 사건이 날 수 있다. 설계: outputs/rakoko_outfit_feature_design.md
import {LEAK_MIN_PROGRESS, OUTFIT_COST, OUTFIT_PROGRESS_STEP} from './constants.js';
import {bumpMission} from './missions.js';
import {random} from './rng.js';

/** 방송당 제안 이벤트 확률 (진행 중인 의상이 없을 때) */
export const OUTFIT_OFFER_CHANCE = .2;
export const LEAK_RESPONSES = ['hide', 'teaser', 'risky', 'now'];

/** 유출 기본 확률(준비도 40%↑): 점검 안 함 8% / 점검 3% — 설계 초깃값 */
export const LEAK_BASE = {checked: .03, unchecked: .08};
/** 준비 소홀: 준비 중인 옷이 있는데 그 방송에 의상 준비를 안 하면 +1, 하면 -1. 1점당 유출 +4%p(최대 +24%p) */
export const NEGLECT_LEAK_STEP = .04, NEGLECT_LEAK_CAP = .24;
/** 덜 준비된 공개의 실패 확률: (100 - 준비도) × 0.4% → 75% 10% · 50% 20% · 25% 30% */
export const revealFailChance = progress => progress >= 100 ? 0 : Math.min(.4, (100 - progress) * .004);

export const neglectOf = (s, id) => s.outfitNeglect?.[id] || 0;

/** 지금 준비 중인 옷의 이번 방송 유출 확률(시작한 미공개 옷만, 유출은 의상당 1회) */
export function leakChance(s) {
  const id = s.crafting;
  if (!isStarted(s, id) || s.wardrobe[id] || s.leaked[id]) return 0;
  const base = s.outfitProgress[id] >= LEAK_MIN_PROGRESS ? (s.checked ? LEAK_BASE.checked : LEAK_BASE.unchecked) : 0;
  return base + Math.min(NEGLECT_LEAK_CAP, neglectOf(s, id) * NEGLECT_LEAK_STEP);
}

/** 방송이 끝날 때 소홀 점수 갱신(준비도 100% 이전까지만) */
export function updateNeglect(s) {
  const id = pendingOutfit(s);
  if (id && s.outfitProgress[id] < 100) {
    const n = neglectOf(s, id);
    s.outfitNeglect[id] = s.outfitPreparedToday ? Math.max(0, n - 1) : Math.min(20, n + 1);
  }
  s.outfitPreparedToday = false;
}

/** 공개 시도: 준비가 덜 됐으면 확률로 실패(해금 안 됨, 예약 소진, 준비도 유지). 성공하면 true. */
export function attemptReveal(s, id, options) {
  const chance = revealFailChance(s.outfitProgress[id]);
  if (chance > 0 && random(s) < chance) {
    s.outfitRevealFailed[id] = true;
    s.outfitReserved = false;
    for (const key of Object.keys(s.reservations)) if (s.reservations[key] === 'outfit') delete s.reservations[key];
    return false;
  }
  reveal(s, id, options);
  return true;
}

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
  s.outfitPreparedToday = true; // 시작한 방송은 소홀로 치지 않는다
}

/** 준비 행동 1회로 준비도를 올린다(무료 — 비용은 시작할 때 전액 냈다). 시작하지 않은 옷이면 아무것도 바꾸지 않는다. */
export function prepareOutfit(s) {
  if (s.wardrobe[s.crafting]) throw Error('이미 공개한 옷이에요.');
  if (!isStarted(s, s.crafting)) throw Error('방송 중 새 의상 제안을 받아 준비를 시작해주세요.');
  if (s.outfitProgress[s.crafting] >= 100) throw Error('준비가 끝났어요. 공개 방송을 예약해주세요.');
  addProgress(s, s.crafting);
  s.outfitPreparedToday = true;
  bumpMission(s, 'outfit');
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
  /** 공개 예약: 덜 준비돼도 예약할 수 있지만 공개가 실패할 수 있다 */
  reserveOutfit: {prepOnly: true, run(s) {
    if (!isStarted(s, s.crafting) || s.wardrobe[s.crafting]) throw Error('준비 중인 새 옷이 필요해요.');
    s.outfitReserved = !s.outfitReserved;
  }},
};
