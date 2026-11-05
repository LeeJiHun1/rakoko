// 목표 고르기 화면: 기획 선택·보류 · 장기 콘텐츠 · 주문 기록. (구매는 방송 중 랜덤 사건으로만 등장)
import {effectText, endingUnlocked, firstEndingDate, LABELS, projectLocks, skill} from '../../engine.js';
import {btn, escape, money} from '../dom.js';
import {currentProject, gameName, store} from '../store.js';
import {projectMini} from './project-mini.js';

const RECOMMENDED = ['END-001', 'END-003', 'END-007'];
const MODULE_SYMBOLS = ['▧', '⌂', '♧', '⚑', '♜', '♞', '☕', '▥'];
const MODULE_PHASES = {invited: '참가 안내', orientation: '역할과 규칙', working: '함께 준비 중', project_ready: '기획 준비 완료', rehearsed: '리허설 완료', closed: '마무리'};

function startButton(p) {
  const {state} = store;
  const active=state.project?.id===p.id,locks=projectLocks(state,p),disabled=state.phase!=='prep'||(state.project&&state.project.step<3)||locks.length;
  return btn(active?'진행 중':'이 기획 시작','project',`data-id="${p.id}" ${disabled||active?'disabled':''}`,'button small secondary');
}

function projectCard(p) {
  const locks = projectLocks(store.state, p);
  return `<article class="project-option"><div><h3>${escape(p.name)}</h3><p>${escape(p.steps[0])}</p>${locks.length?`<small>${escape(locks.join(' · '))}</small>`:''}</div>${startButton(p)}</article>`;
}

/** 결말별 능력 요구치 달성률 (진행 중인 기획은 그 게임, 아니면 오늘 게임 기준) */
function endingProgress(state, p) {
  const gameId = state.project?.id === p.id ? state.project.gameId : state.gameId;
  const parts = p.requirements.filter(r => r.path.startsWith('stats.')).map(r => {
    const key = r.path.includes('gameSkill') ? 'gameSkill' : r.path.split('.')[1];
    const current = key === 'gameSkill' ? skill(state, gameId) : state.stats[key];
    return {key, current, need: r.value};
  });
  const ratio = parts.length ? parts.reduce((a, x) => a + Math.min(1, x.current / x.need), 0) / parts.length : 1;
  return {parts, ratio};
}

/** 곧 열 수 있는 결말 TOP3 — 아직 만나지 않은 결말 중 달성률 순 */
function endingHints(state, catalog) {
  const seen = new Set(state.reachedEndings.map(e => e.id));
  const top = catalog.projects.filter(p => !seen.has(p.id) && !projectLocks(state, p).length)
    .map(p => ({p, ...endingProgress(state, p)})).sort((a, b) => b.ratio - a.ratio).slice(0, 3);
  if (!top.length) return '';
  const gate = endingUnlocked(state) ? '' : `<p class="view-description">결말은 방송 150일째(${escape(firstEndingDate())})부터 열 수 있어요. 지금은 능력을 쌓아 두세요.</p>`;
  return `<section class="ending-hints"><h2 class="subheading">곧 열 수 있는 결말</h2>${gate}${top.map(({p,parts,ratio})=>`<article class="ending-hint"><div class="ending-hint-head"><b>${escape(p.name)}</b><span>${escape(Math.round(ratio*100))}%</span></div><div class="meter"><i style="width:${escape(Math.round(ratio*100))}%"></i></div><div class="ending-hint-reqs">${parts.map(x=>`<span class="${x.current>=x.need?'met':''}">${escape(LABELS[x.key]||x.key)} ${escape(x.current)}/${escape(x.need)}</span>`).join('')}</div>${startButton(p)}</article>`).join('')}</section>`;
}

function activeProject(state) {
  if (!state.project) return '';
  return `<div class="active-project">${projectMini()}<p>${escape(currentProject().steps[Math.min(state.project.step,2)])}</p>${state.project.boundGame?`<small>기획에 연결된 게임 · ${escape(gameName(state.project.gameId))}</small>`:''}${btn('이 기획은 보류해 두기','pauseProject',state.phase!=='prep'?'disabled':'','text-button')}</div>`;
}

function pausedProjects(state, catalog) {
  if (!state.projectArchive.some(p => p.paused)) return '';
  return `<details class="optional-options"><summary>보류해 둔 기획</summary>${state.projectArchive.filter(p=>p.paused).map(p=>`<div class="paused-row"><span>${escape(catalog.projects.find(d=>d.id===p.id)?.name)} · ${escape(p.step)}/3</span>${btn('이어가기','resumeProject',`data-id="${escape(p.instanceId)}" ${state.project||state.phase!=='prep'?'disabled':''}`,'button small secondary')}</div>`).join('')}</details>`;
}

function activeModule(state) {
  const m = state.module;
  if (!m) return '';
  return `<div class="module-active"><h3>진행 중 · ${escape(m.name)}</h3><p>${escape(MODULE_PHASES[m.phase])} · ${escape(m.participation)}회 참여</p><p>게임 코너에서 이어서 참여해요. 참가 기간: ${escape(m.deadline)}까지</p>${m.expired?'<p>참가 기간이 지났어요. 새로 참여할 수 있어요.</p>':''}<div>${m.phase==='working'?btn(m.practiceOnly?'다음 단계로 진행하기':'이번에는 기본 연습만 하기','practiceModule',state.phase!=='prep'?'disabled':'','button small secondary'):''}${btn('이번 참여 마치기','leaveModule',state.phase!=='prep'?'disabled':'','text-button')}</div></div>`;
}

function moduleList(state, catalog) {
  return `<details class="optional-options"><summary>장기 콘텐츠에 참여하기 <small>마을·협동·대회</small></summary><p class="view-description">다른 가상 동료들과 여러 방송에 걸쳐 진행해요. 한 번에 하나씩 참여할 수 있어요.</p><div class="module-grid">${catalog.modules.map((m,i)=>`<article><span class="module-symbol">${MODULE_SYMBOLS[i]}</span><h3>${escape(m.name)}</h3><p>최소 5회 참여 · 초보도 가능</p>${btn('참여하기','joinModule',`data-id="${m.id}" ${state.phase!=='prep'||(state.module&&!state.module.expired)?'disabled':''}`,'button small secondary')}</article>`).join('')}</div></details>`;
}

function orders(state) {
  if (!state.purchases.length) return '';
  return `<details class="optional-options"><summary>주문 기록 <small>${state.purchases.length}건</small></summary><div class="order-list">${state.purchases.slice().reverse().map(p=>`<div><span>${escape(p.choice)}<small>${money(p.cost)}</small></span><b>${p.status==='delivered'?(p.effects?.length?escape(effectText(p.effects)):'준비물 도착'):`${escape(Math.max(0,p.dueBroadcast-state.completedBroadcasts))}회 방송 뒤 도착`}</b></div>`).join('')}</div></details>`;
}

export function projects() {
  const {state, catalog} = store;
  return `<p class="simple-guide">목표를 하나 고르면 <b>특별 기획 코너가 자동으로 편성</b>돼요.<br/>자료 준비 → 시범 방송 → 피드백, 세 방송에 걸쳐 만들어요.</p>
  ${activeProject(state)}
  ${endingHints(state, catalog)}
  <h2 class="subheading">처음이라면 이 기획부터</h2><div class="project-list recommended-projects">${catalog.projects.filter(p=>RECOMMENDED.includes(p.id)).map(projectCard).join('')}</div>
  <details class="optional-options"><summary>다른 기획 둘러보기 <small>29가지</small></summary><div class="project-list">${catalog.projects.filter(p=>!RECOMMENDED.includes(p.id)).map(projectCard).join('')}</div></details>
  ${pausedProjects(state, catalog)}
  ${activeModule(state)}
  ${moduleList(state, catalog)}
  ${orders(state)}`;
}
