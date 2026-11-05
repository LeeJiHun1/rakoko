// 방송 중 화면: 사건 카드 + 선택지(잠금 사유 표시).
import {CORNERS, projectProgressLocks, unmet} from '../../engine.js';
import {escape, tag} from '../dom.js';
import {store} from '../store.js';

/** 선택지별 잠금 사유. 엔진의 applyChoice 와 같은 기준이어야 한다. */
function choiceLocks(event, c) {
  const {state, catalog} = store;
  const locks = unmet(state, c.requirements || c.eligibility?.all || [], catalog, event.kind === 'module' ? state.module?.gameId : undefined);
  if (event.kind === 'project' && !c.postpone) locks.push(...projectProgressLocks(state, catalog));
  return locks;
}

export function choices(event) {
  return `<div class="choices">${event.choices.map((c,i)=>{const locks=choiceLocks(event,c);return `<div class="choice-wrap"><button class="choice" data-action="${event.kind==='ending'?'ending':'choose'}" data-id="${escape(c.id)}" ${locks.length?'disabled':''}><span class="choice-number">${String(i+1).padStart(2,'0')}</span><span>${escape(c.text)}</span><span class="choice-arrow">${locks.length?'⌑':'↗'}</span></button>${locks.length?`<p class="lock-reason">잠금 · ${escape([...new Set(locks)].join(' · '))}</p>`:''}</div>`;}).join('')}</div>`;
}

function eventTag(e) {
  if (e.kind === 'project') return '작은 기획의 한 단계';
  if (e.kind === 'module') return '함께 이어가는 콘텐츠';
  return e.provenance === 'adaptation' ? '방송에서 착안한 이야기' : '오늘 찾아온 이야기';
}

export function eventScreen() {
  const {state} = store, e = state.event;
  return `<div class="broadcast-progress">${[0,1,2].map((i)=>`<span class="${i===state.slot?'current':i<state.slot?'done':''}">${i<state.slot?'✓':String(i+1).padStart(2,'0')} ${CORNERS[state.plan[i]]}</span>`).join('')}</div>
  <article class="event-card"><div class="event-meta">${tag(eventTag(e))}<span>SCENE ${String(state.slot+1).padStart(2,'0')}</span></div><h2>${escape(e.title)}</h2><p class="event-body">${escape(e.body)}</p>${e.kind==='leak'?'<div class="clue"><span>▧</span><p>잠깐 스친 작은 단서.<br/>전체 모습은 아직 비밀이에요.</p></div>':''}${choices(e)}</article><p class="quiet-note">선택한 순간이, 다음 방송의 이야기가 됩니다.</p>`;
}
