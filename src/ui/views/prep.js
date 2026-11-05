// 방송 준비 화면: 준비 행동 2회 · 방송 켜기 · (선택) 편성/게임 변경 · 마지막 특집 예약.
import {activeEffects, celebrationOn, CORNERS, EFFECT_LABELS, finaleLocks} from '../../engine.js';
import {btn, escape} from '../dom.js';
import {store} from '../store.js';
import {projectMini} from './project-mini.js';

const PREP_ACTIONS = [['data', '▤', '자료 준비', '기획력 +2'], ['practice', '▣', '게임 연습', '오늘의 게임 숙련 +2'], ['check', '◉', '화면 점검', '운영력 +1 · 화면 사고 대비']];

function prepButtons(state) {
  return PREP_ACTIONS.map(([id,icon,title,sub])=>{const disabled=!state.preparations||(id==='check'&&state.checked);return `<button class="prep-action" data-action="prepare" data-kind="${id}" ${disabled?'disabled':''}><span class="action-icon">${icon}</span><span><b>${title}</b><small>${sub}</small></span><span class="arrow">${id==='check'&&state.checked?'✓':'+'}</span></button>`;}).join('');
}

/** 예약된 특집이 들어갈 코너는 편성 변경을 막고 이름을 바꿔 보여준다. */
function reservedLabel(state, i, calendar) {
  if (i === 0 && calendar && !state.celebrations.includes(`${calendar}:${state.date.slice(0,4)}`)) return '기념일 특집';
  if (i === 2 && state.outfitReserved) return '신의상 공개';
  if (i === 1 && state.finaleScheduled) return '마지막 특집';
  return null;
}

function programSlots(state, calendar) {
  return state.plan.map((corner,i)=>{const reserved=reservedLabel(state,i,calendar);return `<div class="program-slot"><span class="slot-no">${i+1}</span><select data-change="plan" data-index="${i}" aria-label="${i+1}번째 코너" ${reserved?'disabled':''}>${Object.entries(CORNERS).map(([key,label])=>`<option value="${key}" ${key===(reserved?'S':corner)?'selected':''}>${key==='S'&&reserved?reserved:label}</option>`).join('')}</select></div>`;}).join('');
}

/** 지금 적용 중인 구매 효과 (대략 표시) */
function activeEffectList(state) {
  const list = activeEffects(state);
  if (!list.length) return '';
  return `<div class="active-effects"><span class="eyebrow">적용 중인 준비물 효과</span>${list.map(e=>`<p><b>${escape(e.title)}</b> · ${EFFECT_LABELS[e.kind]} · ${escape(e.remaining)}회 남음</p>`).join('')}</div>`;
}

function finaleNote(state, catalog) {
  if (state.project?.step !== 3) return '';
  const locks = finaleLocks(state, catalog);
  return `<div class="finale-note"><span>기획의 시험과 검수를 마쳤어요.</span>${btn(state.finaleScheduled?'특집 예약 해제':'기획 마무리 방송 예약','finale',locks.length?'disabled':'','button small')}<small>${escape(locks.join(' · ')||'이번 방송을 마친 뒤 마지막 선택으로 이어져요.')}</small></div>`;
}

export function prep() {
  const {state, catalog} = store;
  const calendar = celebrationOn(state);
  const summary = state.plan.map(x => CORNERS[x]).join(' → ');
  return `<div class="simple-flow" aria-label="방송 진행 순서"><span class="active">1 준비</span><i>→</i><span>2 방송</span><i>→</i><span>3 일지</span></div>
  <p class="simple-guide">준비를 최대 2번 고른 뒤, <b>방송 켜기</b>를 눌러주세요.</p>
  <div class="section-heading space-top"><h2>오늘은 무엇을 준비할까요?</h2><span class="remaining"><b>${state.preparations}</b>번 남음</span></div>
  <div class="prep-grid simple-preps">${prepButtons(state)}</div>${activeEffectList(state)}
  <div class="simple-broadcast-start">${btn('방송 켜기 <span>→</span>','start','','button primary full')}<p>준비를 건너뛰고 바로 시작해도 괜찮아요.</p></div>
  ${projectMini()}
  ${state.project&&state.project.step<3&&!state.plan.includes('S')?`<p class="next-task">기획을 진행하려면 특별 기획 코너가 필요해요. ${btn('편성에 넣기','includeProject','','text-button')}</p>`:''}
  <details class="optional-options"><summary>코너·게임 바꾸기 <small>선택사항</small></summary><p class="view-description">기본 편성은 ${summary}. 원하는 경우에만 바꿔주세요.</p>
  <div class="program">${programSlots(state, calendar)}</div>
  <label class="game-select"><span>오늘의 게임</span><select data-change="game" aria-label="오늘의 게임">${catalog.games.map(g=>`<option value="${g.id}" ${g.id===state.gameId?'selected':''}>${escape(g.name)}</option>`).join('')}</select></label></details>
  <div class="simple-secondary">${btn('새 의상 준비하기','wardrobe','','button secondary')}${btn('방송 날짜 바꾸기','datePicker','','text-button')}</div>
  ${finaleNote(state, catalog)}`;
}
