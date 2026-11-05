// 방송 정산 화면: 대표 장면 고르기 · 수입 · 다음 방송 날짜.
import {btn, escape, money} from '../dom.js';
import {store} from '../store.js';

const GRADE_TEXT = {S: '전설의 방송', A: '반응 최고', B: '알찬 방송', C: '다음엔 더 잘할 거야'};
const RECORD_TEXT = {viewers: '최고 시청자', gross: '최고 수입', grade: '최고 등급'};

/** 방송 등급 도장 + 최고 시청자 + 새 기록 (구버전 일지에는 등급이 없을 수 있음) */
function broadcastSummary(journal, result) {
  if (!journal.grade) return '';
  const fresh = journal.id > 1 ? (result?.newRecords || []) : []; // 첫 방송은 무조건 갱신이라 표시하지 않음
  return `<div class="broadcast-summary grade-${escape(journal.grade)}"><div class="grade-stamp"><b>${escape(journal.grade)}</b><small>${GRADE_TEXT[journal.grade] || ''}</small></div><div class="viewer-peak"><span>최고 동시 시청</span><strong data-count-to="${escape(journal.viewers)}">${escape(Number(journal.viewers).toLocaleString('ko-KR'))}</strong><small>명</small>${journal.growth!=null?`<em class="growth ${journal.growth>=8?'up':journal.growth<=-8?'down':''}">지난 방송 대비 ${journal.growth>=0?'▲':'▼'}${escape(Math.abs(journal.growth))}%</em>`:''}${journal.donations?`<em>응원 ${money(journal.donations)}</em>`:''}</div>${fresh.length?`<div class="new-records">${fresh.map(k=>`<span>NEW RECORD · ${RECORD_TEXT[k]}</span>`).join('')}</div>`:''}</div>`;
}

export function wrap() {
  const {state} = store, journal = state.journal.at(-1);
  return `<div class="wrap-title"><span>✦</span><h2>오늘도 한 페이지가 쌓였어.</h2><p>마음에 드는 대표 장면을 고르거나, 그대로 다음 방송으로 넘어가도 돼요.</p></div>${broadcastSummary(journal, state.result)}<div class="memory-choices">${journal.events.map((e,i)=>`<button class="memory ${journal.representative===i?'selected':''}" data-action="representative" data-index="${i}"><span>0${i+1}</span><div><b>${escape(e.title)}${e.grade==='great'?`<em class="clip-tag">${journal.clipped===i?'클립 공유됨 · 인지도 +1':journal.clipped==null?'대성공 · 대표로 고르면 클립 공유':'대성공'}</em>`:''}</b><small>${escape(e.choice)}</small></div><span>${journal.representative===i?'✓':'○'}</span></button>`).join('')}</div><div class="settlement"><div><span>오늘의 방송 정산</span><strong data-count-to="${escape(journal.income.net)}">+${money(journal.income.net)}</strong></div><small>방송 수입 ${money(journal.income.gross)} · 운영비 ${money(journal.income.cost)}</small></div>
  ${state.purchases.some(p=>p.status==='delivered'&&p.dueBroadcast===state.completedBroadcasts)?'<p class="delivery-note">▣ 기다리던 주문이 도착했어요. 기획 노트에서 확인할 수 있어요.</p>':''}
  <div class="next-broadcast"><h3>다음에는 언제 만날까?</h3>${btn('7일 뒤에 만나기 →','nextWeek','','button primary')}${btn('다음 기념일로 →','nextCelebration','','button secondary')}${btn('직접 날짜 고르기','datePicker','','text-button')}</div>`;
}
