// 구매 효과와 방송 중 구매 막간 (사용자 결정 Q5, docs/DESIGN-REVIEW.md §4-1).
// 효과 종류: odds(선택 결과 유리) · viewers(시청자) · donation(응원 확률). 구매 후 N회 방송 동안 지속.
// 원래 설계(countsAsIncomeEligibleSegmentByItself:false)대로 구매 막간은 수입 코너로 세지 않는다.
// 구매는 방송 중 랜덤 사건으로만 등장한다(상점 메뉴 없음). 비싼 상품일수록 후반에 등장하도록 가중치를 둔다.
import {random} from './rng.js';

/** 고급 선택지(첫 번째 유료 선택) 기준. 저렴한 선택지는 효과·기간 절반. */
export const PURCHASE_EFFECTS = {
  'ME-001': [{kind: 'viewers', amount: .10, broadcasts: 4}],
  'ME-002': [{kind: 'viewers', amount: .08, broadcasts: 3}],
  'ME-003': [{kind: 'odds', amount: .08, broadcasts: 5}],
  'ME-004': [{kind: 'odds', amount: .05, broadcasts: 6}],
  'ME-005': [{kind: 'viewers', amount: .15, broadcasts: 4}],
  'ME-006': [{kind: 'viewers', amount: .20, broadcasts: 6}],
  'ME-007': [{kind: 'odds', amount: .06, broadcasts: 4}],
  'ME-008': [{kind: 'donation', amount: .10, broadcasts: 3}],
  'ME-009': [{kind: 'donation', amount: .08, broadcasts: 5}],
  'ME-010': [{kind: 'viewers', amount: .20, broadcasts: 5}],
  'ME-011': [{kind: 'viewers', amount: .25, broadcasts: 6}],
  'ME-012': [{kind: 'odds', amount: .10, broadcasts: 4}],
  'ME-013': [{kind: 'odds', amount: .12, broadcasts: 12}],
  'ME-014': [{kind: 'viewers', amount: .50, broadcasts: 6}],
  'ME-015': [{kind: 'viewers', amount: .40, broadcasts: 8}, {kind: 'donation', amount: .10, broadcasts: 8}],
  'ME-016': [{kind: 'donation', amount: .20, broadcasts: 8}, {kind: 'viewers', amount: .30, broadcasts: 8}],
};
const BONUS_CAP = {odds: .25, viewers: 1, donation: .2};
export const EFFECT_LABELS = {odds: '선택이 유리해짐', viewers: '시청자 증가', donation: '응원 증가'};

/** 선택지 위치(0 = 고급, 1 = 저렴)에 따른 효과 */
export function effectsFor(eventId, optionIndex) {
  const base = PURCHASE_EFFECTS[eventId] || [];
  if (optionIndex === 0) return base.map(e => ({...e}));
  return base.map(e => ({...e, amount: Math.round(e.amount * 500) / 1000, broadcasts: Math.max(1, Math.ceil(e.broadcasts / 2))}));
}

/** 대략 표시용 문구 (정확한 수치는 숨김): "시청자 증가 ↑↑ · 6회" */
export const effectText = effects => effects.map(e => `${EFFECT_LABELS[e.kind]} ${e.amount >= .15 ? '↑↑' : '↑'} · ${e.broadcasts}회`).join(' / ');

const remainingOf = (s, p, e) => p.deliveredAt == null ? 0 : e.broadcasts - (s.completedBroadcasts - p.deliveredAt);

/** 지금 적용 중인 효과 목록 (준비 화면 표시용) */
export function activeEffects(s) {
  return s.purchases.flatMap(p => (p.status === 'delivered' && Array.isArray(p.effects) ? p.effects : [])
    .map(e => ({...e, title: p.title, remaining: remainingOf(s, p, e)})).filter(e => e.remaining > 0));
}

export function activeBonus(s, kind) {
  return Math.min(BONUS_CAP[kind], activeEffects(s).filter(e => e.kind === kind).reduce((a, e) => a + e.amount, 0));
}

export const purchaseTarget = (s, e) => e.id + ':' + (s.project?.instanceId || s.gameId);
const paidOptions = e => e.choices.filter(c => c.cost?.amount);

/** 구매 실행(상점 명령·방송 중 막간 공용). 잔액 부족이면 아무것도 바꾸지 않고 예외. */
export function buyOption(s, e, option) {
  const cost = option.cost?.amount || 0;
  const target = purchaseTarget(s, e);
  if (s.purchases.some(x => x.target === target)) throw Error('이 기획에 이미 주문한 항목이에요.');
  if (s.cash < cost) throw Error('잔액이 부족해요. 이번 구매는 포기할 수 있어요.');
  const p = option.effects.find(x => x.op === 'purchase.record');
  const delivered = !p.deliveryAfterBroadcasts;
  s.cash -= cost;
  s.purchases.push({id: `order:${s.broadcastIndex}:${s.purchases.length}`, target, title: e.title, choice: option.text, cost,
    status: delivered ? 'delivered' : 'pending', dueBroadcast: s.completedBroadcasts + (p.deliveryAfterBroadcasts || 0),
    effects: effectsFor(e.id, paidOptions(e).indexOf(option)), deliveredAt: delivered ? s.completedBroadcasts : null});
  s.ledger.push({id: `purchase:${target}`, date: s.date, net: -cost});
}

/** 방송당 구매 사건 확률 (상점 메뉴 없이 이벤트로만 등장 — 사용자 요청 2026-11-05) */
const SHOP_CHANCE = .25;
/** 가격대: 가장 싼 선택지 기준 10만 미만 / 100만 미만 / 1,000만 미만 / 그 이상 */
const PRICE_TIERS = [100000, 1000000, 10000000];
/** 완료 방송 수에 따라 열리는 가격대: 0~5회 → 0, 6~11 → 1, 12~19 → 2, 20↑ → 3 */
const TIER_UNLOCK_AT = [0, 6, 12, 20];

const cheapest = e => Math.min(...paidOptions(e).map(c => c.cost.amount));
export const priceTier = e => PRICE_TIERS.filter(limit => cheapest(e) >= limit).length;
export const unlockedTier = s => TIER_UNLOCK_AT.filter(at => s.completedBroadcasts >= at).length - 1;

/** 비쌀수록 후반에: 열린 가격대 안에서는 비싼 쪽 가중치↑((단계+1)²), 바로 다음 단계는 드물게(0.15), 그 위는 0 */
export function offerWeight(s, e) {
  const tier = priceTier(e), open = unlockedTier(s);
  if (tier <= open) return (tier + 1) ** 2;
  return tier === open + 1 ? .15 : 0;
}

/** 방송당 한 번, 코너 시작 전에 구매 사건을 굴린다. 살 수 있는(가장 싼 선택 ≤ 자금) 상품 중 가중 추첨. */
export function rollShopOffer(s, catalog) {
  if (s.lastShopBroadcast === s.broadcastIndex) return null;
  s.lastShopBroadcast = s.broadcastIndex;
  if (random(s) >= SHOP_CHANCE) return null;
  const candidates = catalog.moneyEvents
    .filter(e => paidOptions(e).length && cheapest(e) <= s.cash && !s.purchases.some(x => x.target === purchaseTarget(s, e)))
    .map(e => [e, offerWeight(s, e)]).filter(([, w]) => w > 0);
  if (!candidates.length) return null;
  let draw = random(s) * candidates.reduce((a, [, w]) => a + w, 0);
  for (const [e, w] of candidates) { draw -= w; if (draw <= 0) return e; }
  return candidates.at(-1)[0];
}
