// 지난 기록: 방송별 일지 · 결말 수집 · 내보내기.
import {ACHIEVEMENTS, eventsSeen} from '../../engine.js';
import {btn, escape, money} from '../dom.js';
import {store} from '../store.js';

/** 한 번에 그리는 일지 수(오래 플레이해도 가볍게) — '이전 기록 더 보기'로 20개씩 */
export const JOURNAL_PAGE = 20;

export const TOTAL_ENDINGS = 33; // 일반 32 + 10년 강제 결말 1

function entry(j, catalog) {
  return `<article class="journal-entry"><div class="journal-entry-date"><span>VOL.${escape(String(j.id).padStart(3,'0'))}</span><time>${escape(j.date)}</time></div><h2>${escape(j.events[j.representative]?.title||'작은 한 페이지')}</h2><p>${escape(j.events[j.representative]?.outcome)}</p><details><summary>그날의 장면 ${escape(j.events.length)}개 펼치기</summary>${j.events.map((e,i)=>`<div class="journal-scene"><span>0${i+1}</span><div><b>${escape(e.title)}</b><p>${escape(e.choice)} → ${escape(e.outcome)}</p></div></div>`).join('')}</details><footer><span>${escape(catalog.outfits.find(o=>o.id===j.outfit)?.name||'기본 의상')}</span>${j.grade?`<span class="journal-grade">${escape(j.grade)} · 시청 ${escape(Number(j.viewers).toLocaleString('ko-KR'))}명</span>`:''}<span>+${money(j.income.net)}</span></footer></article>`;
}

/** 결산: 최근 30회 시청자 추이(단일 계열 꺾은선, 방송마다 마우스 오버 툴팁) + 주요 숫자 */
function trendCard(state) {
  const points = state.journal.filter(j => Number.isFinite(j.viewers)).slice(-30);
  if (points.length < 2) return '';
  const W = 320, H = 84, P = 8, max = Math.max(...points.map(j => j.viewers)), n = points.length;
  const x = i => P + i * (W - 2 * P) / (n - 1), y = v => H - P - (v / max) * (H - 2 * P);
  const line = points.map((j, i) => `${x(i).toFixed(1)},${y(j.viewers).toFixed(1)}`).join(' ');
  const last = points.at(-1), colW = (W - 2 * P) / (n - 1);
  const hits = points.map((j, i) => `<rect class="trend-hit" x="${(x(i) - colW / 2).toFixed(1)}" y="0" width="${colW.toFixed(1)}" height="${H}"><title>VOL.${escape(j.id)} · ${escape(j.date)} · 시청 ${escape(Number(j.viewers).toLocaleString('ko-KR'))}명${j.grade ? ` · ${escape(j.grade)}등급` : ''}</title></rect>`).join('');
  const grades = ['S', 'A', 'B', 'C'].map(g => `${g} ${state.journal.filter(j => j.grade === g).length}`).join(' · ');
  const r = state.records || {};
  return `<section class="trend-card"><div class="trend-head"><h2>시청자 추이 <small>최근 ${n}회</small></h2><b>${escape(Number(last.viewers).toLocaleString('ko-KR'))}명</b></div>
  <svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 ${n}회 방송의 최고 동시 시청자 추이, 마지막 ${escape(last.viewers)}명, 최고 ${escape(max)}명"><line class="trend-base" vector-effect="non-scaling-stroke" x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}"/><polyline class="trend-line" vector-effect="non-scaling-stroke" points="${line}"/><circle class="trend-end" cx="${x(n - 1).toFixed(1)}" cy="${y(last.viewers).toFixed(1)}" r="4"/>${hits}</svg>
  <div class="trend-stats"><span>최고 시청 <b>${escape((r.bestViewers || 0).toLocaleString('ko-KR'))}명</b></span><span>등급 <b>${escape(grades)}</b></span><span>대성공 <b>${escape(r.greats || 0)}회</b></span><span>응원 누적 <b>${money(r.donationTotal || 0)}</b></span><span>미션 도장 <b>${escape(r.missionStamps || 0)}개</b></span></div></section>`;
}

const EMPTY = `<div class="empty-state"><span>▥</span><h2>첫 페이지는 아직 비어 있어요.</h2><p>방송을 마치면 선택한 장면과 약속이<br/>이곳에 차곡차곡 쌓여요.</p>${btn('첫 방송 준비하기 ↗','broadcast','','button primary')}</div>`;

export function journal() {
  const {state, catalog} = store;
  const got = Object.keys(state.achievements || {}).length;
  return `<div class="journal-controls"><span>총 ${state.journal.length}번의 방송 · 만난 결말 ${state.reachedEndings.length}/${TOTAL_ENDINGS} · 업적 ${got}/${ACHIEVEMENTS.length} · 사건 도감 ${eventsSeen(state)}/${catalog.events.length}</span><div>${btn('업적','achievements','','button small secondary')}${btn('모은 결말','collection','','button small secondary')}${btn('일지 내보내기 ↓','export','','button small secondary')}</div></div>${trendCard(state)}${state.journal.length?state.journal.slice().reverse().slice(0,store.journalLimit||JOURNAL_PAGE).map(j=>entry(j,catalog)).join('')+(state.journal.length>(store.journalLimit||JOURNAL_PAGE)?btn(`이전 기록 더 보기 (${state.journal.length-(store.journalLimit||JOURNAL_PAGE)}개 남음)`,'moreJournal','','button secondary full'):''):EMPTY}`;
}
