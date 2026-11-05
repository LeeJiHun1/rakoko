// 방송 수입 정산 · 구매(상점 명령) · 납품 · 대회 상금. 금액은 모두 정수(가상 원화). 구매 효과는 purchases.js.
import {buyOption} from './purchases.js';
/** gradeFactor: 방송 등급 배율(S 1.3 ~ C 0.9). 금액은 정수로 반올림. */
export function settleIncome(s, catalog, gradeFactor = 1) {
  const cfg = catalog.economy.income, snap = s.incomeSnapshot, segments = s.currentLog.length;
  const gross = (cfg.base + snap.awareness * cfg.perAwarenessPoint + snap.community * cfg.perCommunityPoint
    + segments * cfg.perCompletedSegment + (segments === 3 ? cfg.threeSegmentCompletionBonus : 0)) * snap.multiplier;
  const graded = Math.round(gross * gradeFactor);
  const cost = cfg.operatingCostPerSettledBroadcast * snap.multiplier, net = graded - cost;
  s.cash = Math.min(catalog.economy.cashMaximum, s.cash + net);
  s.ledger.push({id: `income:${s.broadcastIndex}`, date: s.date, gross: graded, cost, net});
  return {gross: graded, cost, net};
}

/** 방송 시작 시 규모 단계(최고 도달 단계 유지)와 수입 계산용 능력 스냅샷을 고정한다. */
export function snapshotIncome(s, catalog) {
  const metric = Math.min(s.stats.awareness, s.stats.community), tiers = catalog.economy.income.scaleTiers;
  s.scaleIndex = Math.max(s.scaleIndex, tiers.reduce((best, t, i) => metric >= t.minimumScore ? i : best, 0));
  s.incomeSnapshot = {...s.stats, multiplier: tiers[s.scaleIndex].multiplier};
}

export function deliverOrders(s) {
  for (const order of s.purchases) if (order.status === 'pending' && order.dueBroadcast <= s.completedBroadcasts) { order.status = 'delivered'; order.deliveredAt = s.completedBroadcasts; }
}

export function awardTournamentPrize(s, m, catalog) {
  const amount = catalog.economy.tournamentAwards.find(x => x.moduleId === m.id).winnerPrize;
  s.cash += amount;
  m.prizeAwarded = true;
  s.ledger.push({id: `prize:${m.instanceId}`, date: s.date, net: amount});
}

export const commands = {
  purchase: {prepOnly: true, run(s, c, catalog) {
    const e = catalog.moneyEvents.find(e => e.id === c.eventId), option = e?.choices.find(x => x.id === c.choiceId);
    if (!option) throw Error('상품을 찾을 수 없어요.');
    if (!(option.cost?.amount || 0)) return;
    buyOption(s, e, option);
  }},
};
