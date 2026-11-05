// 지난 기록: 방송별 일지 · 결말 수집 · 내보내기.
import {btn, escape, money} from '../dom.js';
import {store} from '../store.js';

export const TOTAL_ENDINGS = 33; // 일반 32 + 10년 강제 결말 1

function entry(j, catalog) {
  return `<article class="journal-entry"><div class="journal-entry-date"><span>VOL.${String(j.id).padStart(3,'0')}</span><time>${j.date}</time></div><h2>${escape(j.events[j.representative]?.title||'작은 한 페이지')}</h2><p>${escape(j.events[j.representative]?.outcome)}</p><details><summary>그날의 장면 ${j.events.length}개 펼치기</summary>${j.events.map((e,i)=>`<div class="journal-scene"><span>0${i+1}</span><div><b>${escape(e.title)}</b><p>${escape(e.choice)} → ${escape(e.outcome)}</p></div></div>`).join('')}</details><footer><span>${escape(catalog.outfits.find(o=>o.id===j.outfit)?.name||'기본 의상')}</span><span>+${money(j.income.net)}</span></footer></article>`;
}

const EMPTY = `<div class="empty-state"><span>▥</span><h2>첫 페이지는 아직 비어 있어요.</h2><p>방송을 마치면 선택한 장면과 약속이<br/>이곳에 차곡차곡 쌓여요.</p>${btn('첫 방송 준비하기 ↗','broadcast','','button primary')}</div>`;

export function journal() {
  const {state, catalog} = store;
  return `<div class="journal-controls"><span>총 ${state.journal.length}번의 방송 · 만난 결말 ${state.reachedEndings.length}/${TOTAL_ENDINGS}</span><div>${btn('모은 결말','collection','','button small secondary')}${btn('일지 내보내기 ↓','export','','button small secondary')}</div></div>${state.journal.length?state.journal.slice().reverse().map(j=>entry(j,catalog)).join(''):EMPTY}`;
}
