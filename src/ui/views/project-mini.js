// 진행 중인 기획 요약 카드(방송 준비·목표 화면 공용).
import {btn, escape} from '../dom.js';
import {currentProject, store} from '../store.js';

const STEP_NAMES = ['자료 준비', '시범 방송', '피드백 반영'];
const STEP_DOTS = ['자료', '시범', '피드백'];

export function projectMini() {
  const p = store.state.project, def = currentProject();
  return `<section class="project-mini"><div class="project-mini-icon">${p?'✦':'✧'}</div><div><span class="eyebrow">${p?'만들고 있는 다음 이야기':'작은 계획 하나가 긴 이야기가 돼요'}</span><b>${p?escape(def.name):'어떤 방송을 남기고 싶나요?'}</b>${p?`<p class="project-next-step">${p.step<3?'다음 특별 코너: '+STEP_NAMES[p.step]:'이 기획의 준비를 마쳤어요.'}</p><div class="step-dots">${STEP_DOTS.map((label,i)=>`<span class="${p.step>i?'done':''}">${p.step>i?'✓':'·'} ${label}</span>`).join('')}</div>`:'<p>계획 없이 바로 방송해도 괜찮아요.</p>'}</div>${btn(p?'목표 확인':'목표 고르기','projects','','text-button')}</section>`;
}
