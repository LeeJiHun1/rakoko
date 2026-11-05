// 방송 중 화면: 사건 카드 + 선택지(잠금 사유 표시).
import {activeBonus, CORNERS, NOTABLE_BONUS, prepBonus, projectProgressLocks, STYLES, unmet} from '../../engine.js';
import {money} from '../dom.js';
import {escape, tag} from '../dom.js';
import {store} from '../store.js';

/** 선택지별 잠금 사유. 엔진의 applyChoice 와 같은 기준이어야 한다. */
function choiceLocks(event, c) {
  const {state, catalog} = store;
  const locks = unmet(state, c.requirements || c.eligibility?.all || [], catalog, event.kind === 'module' ? state.module?.gameId : undefined);
  if (event.kind === 'project' && !c.postpone) locks.push(...projectProgressLocks(state, catalog));
  return locks;
}

/** 선택지 성향 라벨(대략 표시 — 정확한 확률은 숨김) */
const priceTag = c => c.cost ? `<span class="choice-style choice-price">${money(c.cost)} · ${escape(c.effectSummary || '')}</span>` : '';
const styleTag = c => c.cost ? priceTag(c) : Object.hasOwn(STYLES, c.style) ? `<span class="choice-style style-${c.style}" title="${STYLES[c.style].hint}">${STYLES[c.style].label} · ${STYLES[c.style].hint}</span>` : '';

function oddsNote(e) {
  if (!e.choices.some(c => c.style && c.style !== 'safe') || prepBonus(store.state, activeBonus(store.state, 'odds')) < NOTABLE_BONUS) return '';
  return `<p class="odds-note">✦ 오늘 준비가 이 ${escape(CORNERS[store.state.plan[store.state.slot]])} 코너와 잘 맞아요 · 보통·모험 선택이 유리해요</p>`;
}

export function choices(event) {
  return `<div class="choices">${event.choices.map((c,i)=>{const locks=choiceLocks(event,c);return `<div class="choice-wrap"><button class="choice" data-action="${event.kind==='ending'?'ending':'choose'}" data-id="${escape(c.id)}" ${locks.length?'disabled':''}><span class="choice-number">${String(i+1).padStart(2,'0')}</span><span>${escape(c.text)}${styleTag(c)}</span><span class="choice-arrow">${locks.length?'⌑':'↗'}</span></button>${locks.length?`<p class="lock-reason">잠금 · ${escape([...new Set(locks)].join(' · '))}</p>`:''}</div>`;}).join('')}</div>`;
}

const CORNER_ICONS = {T: '☕', G: '▣', F: '♡', S: '✦'};

function eventTag(e) {
  if (e.kind === 'project') return '작은 기획의 한 단계';
  if (e.kind === 'module') return '함께 이어가는 콘텐츠';
  if (e.kind === 'shop') return '코너 사이 잠깐, 장보기';
  if (e.kind === 'outfitOffer') return '코너 사이 잠깐, 새 의상 제안';
  if (e.kind === 'outfitFollowup') return '공개 코너 대신';
  if (e.kind === 'reveal') return '신의상 공개';
  return e.provenance === 'adaptation' ? '방송에서 착안한 이야기' : '오늘 찾아온 이야기';
}

export function eventScreen() {
  const {state} = store, e = state.event;
  return `<div class="broadcast-progress">${[0,1,2].map((i)=>`<span class="corner-${escape(state.plan[i])} ${i===state.slot?'current':i<state.slot?'done':''}">${i<state.slot?'✓':String(i+1).padStart(2,'0')} ${CORNERS[state.plan[i]]}</span>`).join('')}</div>
  <article class="event-card corner-${escape(state.plan[state.slot])}"><div class="event-meta"><span class="corner-badge corner-${escape(state.plan[state.slot])}">${CORNER_ICONS[state.plan[state.slot]]||''} ${escape(CORNERS[state.plan[state.slot]])}</span>${tag(eventTag(e))}<span>SCENE ${escape(String(Number(state.slot)+1).padStart(2,'0'))}</span></div><h2>${escape(e.title)}</h2><p class="event-body">${escape(e.body)}</p>${e.kind==='reveal'?'<div class="reveal-stage"><img src="assets/events/outfit-journal/stage-closed-v1.png" alt="닫힌 무대 커튼" width="1672" height="941"/></div>':''}${oddsNote(e)}${e.kind==='leak'?'<div class="clue"><span>▧</span><p>잠깐 스친 작은 단서.<br/>전체 모습은 아직 비밀이에요.</p></div>':''}${choices(e)}</article><p class="quiet-note">선택한 순간이, 다음 방송의 이야기가 됩니다.<span class="key-hint"> · 키보드 1~${escape(Math.min(4,e.choices.length))}로 선택</span></p>`;
}
