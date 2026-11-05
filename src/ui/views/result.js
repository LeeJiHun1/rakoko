// 선택 결과 화면: 결과 문장 · 능력 변화 · 키몽이 채팅 3줄.
import {LABELS} from '../../engine.js';
import {btn, escape, tag} from '../dom.js';
import {store} from '../store.js';

export function reactionRows(rows) {
  return `<div class="chat-reactions"><div class="chat-label"><span>LIVE CHAT</span><i></i> 키몽이들의 한마디</div>${rows.map((r,i)=>`<div class="chat-row"><img src="assets/characters/kimongi-base-v1.png" alt="" width="32" height="32"/><span class="chat-name color-${i}">${escape(r.speaker)}</span><span>${escape(r.text)}</span></div>`).join('')}</div>`;
}

export function resultScreen() {
  const {state} = store, r = state.result;
  return `<div class="result-heading"><span>✓</span><p>오늘의 선택을 기록했어요</p></div><article class="event-card result-card"><span class="eyebrow">${escape(r.title)}</span><h2>${escape(r.choice)}</h2><p class="event-body">${escape(r.outcome)}</p><div class="gain-list">${Object.entries(r.changes||{}).map(([key,n])=>`<span>${LABELS[key]} <b>+${n}</b></span>`).join('')}${r.kind==='reveal'?tag('옷장에 새 의상이 추가됐어요'):''}</div></article>${reactionRows(r.reactions||[])}<div class="continue-row"><span>0${state.slot+1} / 03 코너</span>${btn(state.slot<2?'다음 코너로 <span>→</span>':'오늘의 일지 마무리 <span>→</span>','advance','','button primary')}</div>`;
}
