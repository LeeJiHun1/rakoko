// 방송 정산 화면: 대표 장면 고르기 · 수입 · 다음 방송 날짜.
import {btn, escape, money} from '../dom.js';
import {store} from '../store.js';

export function wrap() {
  const {state} = store, journal = state.journal.at(-1);
  return `<div class="wrap-title"><span>✦</span><h2>오늘도 한 페이지가 쌓였어.</h2><p>마음에 드는 대표 장면을 고르거나, 그대로 다음 방송으로 넘어가도 돼요.</p></div><div class="memory-choices">${journal.events.map((e,i)=>`<button class="memory ${journal.representative===i?'selected':''}" data-action="representative" data-index="${i}"><span>0${i+1}</span><div><b>${escape(e.title)}</b><small>${escape(e.choice)}</small></div><span>${journal.representative===i?'✓':'○'}</span></button>`).join('')}</div><div class="settlement"><div><span>오늘의 방송 정산</span><strong>+${money(journal.income.net)}</strong></div><small>방송 수입 ${money(journal.income.gross)} · 운영비 ${money(journal.income.cost)}</small></div>
  ${state.purchases.some(p=>p.status==='delivered'&&p.dueBroadcast===state.completedBroadcasts)?'<p class="delivery-note">▣ 기다리던 주문이 도착했어요. 기획 노트에서 확인할 수 있어요.</p>':''}
  <div class="next-broadcast"><h3>다음에는 언제 만날까?</h3>${btn('7일 뒤에 만나기 →','nextWeek','','button primary')}${btn('다음 기념일로 →','nextCelebration','','button secondary')}${btn('직접 날짜 고르기','datePicker','','text-button')}</div>`;
}
