// 방송 준비 화면: 준비 행동 2회 · 방송 켜기 · (선택) 편성/게임 변경 · 마지막 특집 예약.
import {activeEffects, celebrationOn, CORNERS, EFFECT_LABELS, finaleLocks, neglectOf, OUTFIT_PROGRESS_STEP, pendingOutfit} from '../../engine.js';
import {btn, escape} from '../dom.js';
import {store} from '../store.js';
import {projectMini} from './project-mini.js';

const PREP_ACTIONS = [['data', '▤', '자료 준비', '기획력 +2 · 잡담·팬 참여·특별 기획 코너가 유리'], ['practice', '▣', '게임 연습', '숙련 +2 · 게임 도전 코너가 크게 유리'], ['check', '◉', '화면 점검', '운영력 +1 · 모든 코너의 실수 감소']];

/** 준비 중인 새 옷이 있으면 네 번째 준비 행동 '의상 준비' */
function outfitAction(state) {
  const id = pendingOutfit(state), p = id ? state.outfitProgress[id] : 0;
  if (!id || p >= 100) return '';
  const disabled = !state.preparations;
  return `<button class="prep-action outfit-prep" data-action="prepare" data-kind="outfit" ${disabled?'disabled':''}><span class="action-icon">♧</span><span><b>의상 준비 <small class="secret-tag">비밀</small></b><small>비용 없음 · 준비도 ${escape(p)}% → ${escape(Math.min(100,p+OUTFIT_PROGRESS_STEP))}%</small></span><span class="arrow">+</span></button>`;
}

/** 준비 중인 새 옷 카드: 준비도·소홀 경고·공개 예약(덜 준비돼도 가능하지만 실패 위험 — 대략 표시) */
function outfitReady(state) {
  const id = pendingOutfit(state);
  if (!id) return '';
  const p = state.outfitProgress[id], done = p >= 100, neglect = neglectOf(state, id);
  const title = state.outfitReserved ? `이번 방송 3번째 코너에서 공개해요${done?'':' · 준비 부족, 실패 위험'}` : done ? '커튼 뒤에서 새 옷이 기다리고 있어요' : `준비 ${p}% · 지금 공개하면 실패할 수도 있어요`;
  const label = state.outfitReserved ? '공개 예약 해제' : done ? '이번 방송에서 공개하기' : '이대로 공개 예약하기';
  return `<div class="outfit-ready${done?' done':''}"><span class="eyebrow">${done?'새 의상 준비 완료':'준비 중인 새 의상 · 이름은 비밀'}</span><div class="meter"><i data-meter="${escape(p)}"></i></div><b>${escape(title)}</b>${!done&&neglect?'<small class="neglect-hint">준비를 미루는 중 · 유출 위험이 커지고 있어요</small>':''}${btn(label,'reserveOutfit','',done&&!state.outfitReserved?'button primary small':'button secondary small')}</div>`;
}

function prepButtons(state) {
  return PREP_ACTIONS.map(([id,icon,title,sub])=>{const disabled=!state.preparations||(id==='check'&&state.checked);return `<button class="prep-action" data-action="prepare" data-kind="${id}" ${disabled?'disabled':''}><span class="action-icon">${icon}</span><span><b>${title}</b><small>${sub}</small></span><span class="arrow">${id==='check'&&state.checked?'✓':'+'}</span></button>`;}).join('') + outfitAction(state);
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

/** 이번 달 미션 카드(첫 방송을 시작하면 생김) */
function missionCard(state) {
  const m = state.missions;
  if (!m || m.month !== state.date.slice(0, 7)) return `<div class="mission-card empty"><span class="eyebrow">이번 달 미션</span><p>이번 달 첫 방송을 켜면 미션 3개가 도착해요.</p></div>`;
  const done = m.list.filter(x => x.done).length;
  return `<div class="mission-card${m.allDone?' all-done':''}"><div class="mission-head"><span class="eyebrow">${escape(Number(m.month.slice(5)))}월의 미션</span><b>${escape(done)}/${escape(m.list.length)}${m.allDone?' · 모두 달성!':''}</b></div>${m.list.map(x=>`<div class="mission-row ${x.done?'done':''}"><span>${x.done?'✓':'·'} ${escape(x.label)}</span><small>${escape(x.progress)}/${escape(x.target)}</small><div class="meter"><i data-meter="${escape(Math.round(x.progress/x.target*100))}"></i></div></div>`).join('')}<small class="mission-note">달성할 때마다 방송 자금, 3개 모두 달성하면 단골 시청층이 늘어요.</small></div>`;
}

function finaleNote(state, catalog) {
  if (state.project?.step !== 3) return '';
  const locks = finaleLocks(state, catalog);
  const others = state.projectArchive.filter(p => p.paused && p.step >= 3).length;
  return `<div class="finale-note"><span>기획의 시험과 검수를 마쳤어요.${others?` 보관한 완성 기획 ${others}개도 목표 화면에서 고를 수 있어요.`:''}</span>${btn(state.finaleScheduled?'특집 예약 해제':'기획 마무리 방송 예약','finale',locks.length?'disabled':'','button small')}<small>${escape(locks.join(' · ')||'이번 방송을 마친 뒤 마지막 선택으로 이어져요.')}</small></div>`;
}

export function prep() {
  const {state, catalog} = store;
  const calendar = celebrationOn(state);
  const summary = state.plan.map(x => CORNERS[x]).join(' → ');
  return `<div class="simple-flow" aria-label="방송 진행 순서"><span class="active">1 준비</span><i>→</i><span>2 방송</span><i>→</i><span>3 일지</span></div>
  <p class="simple-guide">준비를 최대 2번 고른 뒤, <b>방송 켜기</b>를 눌러주세요.</p>
  <div class="section-heading space-top"><h2>오늘은 무엇을 준비할까요?</h2><span class="remaining"><b>${state.preparations}</b>번 남음</span></div>
  ${outfitReady(state)}
  <div class="prep-grid simple-preps">${prepButtons(state)}</div>${activeEffectList(state)}
  <div class="simple-broadcast-start">${btn('방송 켜기 <span>→</span>','start','','button primary full')}<p>준비를 건너뛰고 바로 시작해도 괜찮아요.</p></div>
  ${projectMini()}
  ${missionCard(state)}
  ${state.project&&state.project.step<3&&!state.plan.includes('S')?`<p class="next-task">기획을 진행하려면 특별 기획 코너가 필요해요. ${btn('편성에 넣기','includeProject','','text-button')}</p>`:''}
  <details class="optional-options"><summary>코너·게임 바꾸기 <small>선택사항</small></summary><p class="view-description">기본 편성은 ${summary}. 원하는 경우에만 바꿔주세요.</p>
  <div class="program">${programSlots(state, calendar)}</div>
  <label class="game-select"><span>오늘의 게임</span><select data-change="game" aria-label="오늘의 게임">${catalog.games.map(g=>`<option value="${g.id}" ${g.id===state.gameId?'selected':''}>${escape(g.name)}</option>`).join('')}</select></label></details>
  <div class="simple-secondary">${btn('옷장 열기','wardrobe','','button secondary')}${btn('방송 날짜 바꾸기','datePicker','','text-button')}</div>
  ${finaleNote(state, catalog)}`;
}
