// 선택 결과 화면: 결과 문장 · 능력 변화 · 키몽이 채팅 3줄.
import {LABELS} from '../../engine.js';
import {btn, escape, money, tag} from '../dom.js';
import {store} from '../store.js';
import {donationArt, facePath, kimongiAvatar, REVEAL_FAIL} from '../assets.js';

const DONATION_TITLES = {jackpot: '대박 응원!', medium: '응원 도착', small: '응원 도착'};

/** 가상 응원 알림 (실제 플랫폼 화폐명은 쓰지 않는다) */
function donationBanner(d) {
  if (!d) return '';
  const art = donationArt(d.tier);
  return `<div class="donation-banner tier-${escape(d.tier)}${art?' has-art':''}" role="status">${art?`<img class="donation-art" src="${art}" alt="" width="256" height="256"/>`:''}<span class="donation-title">${DONATION_TITLES[d.tier] || '응원 도착'}</span><p><b>${escape(d.from)}</b>님이 응원 <b class="donation-amount" data-count-to="${escape(d.amount)}">${money(d.amount)}</b>을 보냈어요</p><small>“${escape(d.message)}”</small></div>`;
}

/** 공개 연출: 닫힌 커튼이 걷히며 새 옷 등장(동작 줄이기면 바로 열린 상태) + 지금 입기(무료, 자동 환복 없음) */
function revealStage(state, id) {
  const outfit = id && store.catalog.outfits.find(o => o.id === id);
  if (!outfit) return '';
  const wearing = state.equipped === outfit.id;
  return `<div class="reveal-stage open"><img class="stage-bg" src="assets/events/outfit-journal/stage-open-v1.png" alt="" width="1672" height="941"/><img class="stage-outfit" src="${outfit.image}" alt="${escape(outfit.name)}을 입은 라코코" width="1024" height="1536"/><img class="stage-curtain" src="assets/events/outfit-journal/stage-closed-v1.png" alt="" width="1672" height="941"/></div><div class="reveal-actions"><b>${escape(outfit.name)}</b>${wearing?tag('입고 있어요'):btn('지금 입기 · 무료','equip',`data-id="${escape(outfit.id)}"`,'button secondary small')}</div>`;
}

export function reactionRows(rows) {
  return `<div class="chat-reactions"><div class="chat-label"><span>LIVE CHAT</span><i></i> 키몽이들의 한마디</div>${rows.map((r,i)=>`<div class="chat-row"><img src="${kimongiAvatar(r.speaker)}" alt="" width="32" height="32"/><span class="chat-name color-${i}">${escape(r.speaker)}</span><span>${escape(r.text)}</span></div>`).join('')}</div>`;
}

const GRADE_HEADINGS = {great: ['✦', '대성공!'], miss: ['…', '아쉬움, 그래도 웃음은 남았다']};

function heading(r) {
  const [icon, text] = GRADE_HEADINGS[r.grade] || ['✓', '오늘의 선택을 기록했어요'];
  return `<div class="result-heading grade-${escape(r.grade || 'success')}"><span>${icon}</span><p>${text}</p></div>`;
}

/** 결과가 확정된 뒤의 표정(기본 의상일 때만 — 의상별 초상은 v2) */
function resultExpression(r) {
  if (r.kind === 'revealFailed' || r.grade === 'miss') return 'flustered';
  if (r.donation?.tier === 'jackpot' || r.kind === 'reveal') return 'proud';
  if (r.donation) return 'surprised';
  if (r.grade === 'great') return 'smile';
  return 'default';
}

export function resultScreen() {
  const {state} = store, r = state.result;
  const face = facePath(state, resultExpression(r));
  return `${heading(r)}<article class="event-card result-card${r.grade ? ' grade-' + escape(r.grade) : ''}${face ? ' has-face' : ''}">${face ? `<img class="card-face" src="${face}" alt="" width="512" height="512"/>` : ''}<span class="eyebrow">${escape(r.title)}</span><h2>${escape(r.choice)}</h2><p class="event-body">${escape(r.outcome)}</p><div class="gain-list">${Object.entries(r.changes||{}).map(([key,n])=>`<span>${escape(LABELS[key])} <b>+${escape(Number(n))}</b></span>`).join('')}${r.kind==='reveal'?tag('옷장에 새 의상이 추가됐어요'):''}${r.kind==='revealFailed'?tag('공개 실패 · 준비도는 그대로, 다시 예약할 수 있어요'):''}</div>${r.kind==='revealFailed'?`<div class="event-art art-photo"><img src="${REVEAL_FAIL}" alt="풀린 리본과 굴러가는 단추" width="640" height="360"/></div>`:''}${revealStage(state, r.unlockedOutfit)}</article>${donationBanner(r.donation)}${reactionRows(r.reactions||[])}<div class="continue-row"><span>0${escape(Number(state.slot)+1)} / 03 코너<span class="key-hint"> · Enter</span></span>${btn(r.interlude?'코너 이어서 진행 <span>→</span>':state.slot<2?'다음 코너로 <span>→</span>':'오늘의 일지 마무리 <span>→</span>','advance','','button primary')}</div>`;
}
