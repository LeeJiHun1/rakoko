// 옷장: 공개 의상 무료 환복 · 미공개 의상 제작(준비 행동 1회 + 50만원) · 공개 예약.
import {isStarted, OUTFIT_COST} from '../../engine.js';
import {money} from '../dom.js';
import {btn, escape} from '../dom.js';
import {store} from '../store.js';
import {OUTFIT_LOCKED} from '../assets.js';

function craftHint(state, progress) {
  if (progress >= 100) return '준비 완료 · 방송 준비 화면에서 공개를 예약해요';
  if (state.phase !== 'prep') return '방송 준비 중에 만들 수 있어요';
  if (!state.preparations) return '오늘의 준비 행동을 모두 썼어요';
  return '준비 행동 1회 · 준비도 +25 · 비용 없음';
}

function card(state, o, index) {
  const open=!!state.wardrobe[o.id],progress=Math.max(0,Math.min(100,Number(state.outfitProgress[o.id])||0));const started=isStarted(state,o.id);const canCraft=started&&state.phase==='prep'&&state.preparations>0&&progress<100;
  return `<article class="wardrobe-card ${open?'unlocked':'locked'} ${state.equipped===o.id?'equipped':''}"><div class="outfit-preview">${open?`<img src="${o.image}" alt="${escape(o.name)}" loading="lazy" width="1024" height="1536"/>`:`<span class="sealed-outfit has-img"><img src="${OUTFIT_LOCKED}" alt="천으로 덮인 미공개 의상" loading="lazy" width="512" height="768"/>???<small>미공개 의상 ${String(index).padStart(2,'0')}</small></span>`}${state.equipped===o.id?'<span class="equipped-label">입고 있는 옷</span>':''}</div><div class="outfit-info"><h2>${open?escape(o.name):'???'}</h2><p>${open?escape(o.description):'공개하면 이 옷의 이야기가 열려요.'}</p>${open?btn(state.equipped===o.id?'입고 있어요':'갈아입기 · 무료','equip',`data-id="${o.id}" ${state.equipped===o.id?'disabled':''}`,'button secondary full'):(started?`<div class="craft-progress"><span>준비 ${progress}%</span><div class="meter"><i data-meter="${progress}"></i></div></div>${progress>=100?btn('공개할 옷으로 선택','craft',`data-id="${o.id}" ${state.phase!=='prep'?'disabled':''}`,'button secondary full'):btn('준비하기','craftAndPrepare',`data-id="${o.id}" ${canCraft?'':'disabled'}`,'button secondary full')}<small class="craft-cost">${craftHint(state,progress)}</small>`:'<small class="craft-cost">방송 중 새 의상 제안이 오면 준비를 시작할 수 있어요.</small>')}</div></article>`;
}

function revealToolbar(state) {
  if (!(state.phase==='prep'&&!state.wardrobe[state.crafting]&&isStarted(state,state.crafting))) return '';
  const done=(state.outfitProgress[state.crafting]||0)>=100;
  return `<div class="craft-toolbar"><span><b>???</b> · ${done?'준비를 모두 마쳤어요.':'아직 준비 중이에요 · 지금 공개하면 실패할 수도 있어요'}</span>${btn(state.outfitReserved?'공개 예약 해제':done?'이번 방송에서 공개하기':'이대로 공개 예약하기','reserveOutfit','',done?'button primary':'button secondary')}</div>`;
}

export function wardrobe() {
  const {state, catalog} = store;
  return `<p class="view-description">새 옷은 방송 중 제안 이벤트로 시작해요(비용 ${money(OUTFIT_COST)}을 시작할 때 한 번에) → 준비 행동으로 완성(무료) → 방송에서 공개. 공개 전에는 이름도 비밀이고, 공개 후에는 언제든 무료로 입을 수 있어요.</p><div class="wardrobe-grid">${catalog.outfits.map((o,index)=>card(state,o,index)).join('')}</div>${revealToolbar(state)}`;
}
