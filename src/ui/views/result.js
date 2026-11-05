// 선택 결과 화면: 결과 문장 · 능력 변화 · 키몽이 채팅 3줄.
import {LABELS} from '../../engine.js';
import {btn, escape, tag} from '../dom.js';
import {store} from '../store.js';

export function reactionRows(rows) {
  return `<div class="chat-reactions"><div class="chat-label"><span>LIVE CHAT</span><i></i> 키몽이들의 한마디</div>${rows.map((r,i)=>`<div class="chat-row"><img src="assets/characters/kimongi-base-v1.png" alt="" width="32" height="32"/><span class="chat-name color-${i}">${escape(r.speaker)}</span><span>${escape(r.text)}</span></div>`).join('')}</div>`;
}

const GRADE_HEADINGS = {great: ['✦', '대성공!'], miss: ['…', '아쉬움, 그래도 웃음은 남았다']};

function heading(r) {
  const [icon, text] = GRADE_HEADINGS[r.grade] || ['✓', '오늘의 선택을 기록했어요'];
  return `<div class="result-heading grade-${escape(r.grade || 'success')}"><span>${icon}</span><p>${text}</p></div>`;
}

export function resultScreen() {
  const {state} = store, r = state.result;
  return `${heading(r)}<article class="event-card result-card${r.grade ? ' grade-' + escape(r.grade) : ''}"><span class="eyebrow">${escape(r.title)}</span><h2>${escape(r.choice)}</h2><p class="event-body">${escape(r.outcome)}</p><div class="gain-list">${Object.entries(r.changes||{}).map(([key,n])=>`<span>${LABELS[key]} <b>+${n}</b></span>`).join('')}${r.kind==='reveal'?tag('옷장에 새 의상이 추가됐어요'):''}</div></article>${reactionRows(r.reactions||[])}<div class="continue-row"><span>0${state.slot+1} / 03 코너</span>${btn(state.slot<2?'다음 코너로 <span>→</span>':'오늘의 일지 마무리 <span>→</span>','advance','','button primary')}</div>`;
}
