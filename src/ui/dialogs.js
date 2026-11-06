// 대화상자 화면: 크레딧 · 날짜 고르기 · 설정 · 안내 · 결말 모음 · 새 일지 · 가져오기 · 결말 확인.
import {ACHIEVEMENTS, addDays, DEADLINE, eventsSeen} from '../engine.js';
import {$, btn, escape} from './dom.js';
import {openDialog} from './modal.js';
import {preferences} from './preferences.js';
import {outfit, store} from './store.js';
import {endingImage, LOGO} from './assets.js';

/** 결말 ID(END-xxx) → 결말 사건 그림(EF-xxx) */
const endingArt = endingId => endingImage(store.catalog.projects.find(p => p.id === endingId)?.eventId);
import {TOTAL_ENDINGS} from './views/journal.js';

export function showCredits() {
  const e = store.state.lastEnding;
  if (!e) return;
  openDialog('한 장의 마지막',`<div class="credits-scene"><span class="eyebrow">${e.forced?'TEN YEARS, ONE JOURNAL':'A CHAPTER TO REMEMBER'}</span>${!e.forced&&endingArt(e.id)?`<img class="ending-art" src="${endingArt(e.id)}" alt="결말 장면: ${escape(e.title)}" width="960" height="540"/>`:''}<div class="credits-characters${!e.forced&&endingArt(e.id)?' with-art':''}"><img src="${outfit().image}" alt="라코코"/>${e.forced?'<img class="spouse" src="assets/characters/kimongi-base-v1.png" alt="다수 중 한 명인 가상 키몽이"/>':''}</div><h1>${escape(e.title)}</h1><p>${escape(e.resolution)}</p><p class="epilogue">${escape(e.epilogue)}</p>${e.projectLog?`<div class="ending-memories">${e.projectLog.map(l=>`<p><span>${escape(l.date)}</span>${escape(l.text)}</p>`).join('')}</div>`:''}<span class="credit-thanks">라코코와, 서로 다른 목소리의 모든 키몽이들에게.</span><div class="credits-actions">${!e.forced?btn('같은 일지에서 방송 계속하기','continue','','button primary'):''}${btn('일지 돌아보기','viewJournal','','button secondary')}${btn('일지 내보내기','export','','button secondary')}${btn('새 일지 시작하기','confirmNew','','text-button')}</div></div>`);
}

export function openDatePicker() {
  const {state} = store;
  openDialog('다음 페이지의 날짜',`<p class="modal-description">건너뛴 날짜에는 수입이나 경험이 생기지 않아요. 중간의 생일·주년은 먼저 만나게 돼요.</p><label class="field-label">방송 날짜<input id="next-date" type="date" value="${addDays(state.date,7)}" min="${addDays(state.date,1)}" max="2100-12-31"/></label><div class="quick-dates">${btn('다음 생일','quickDate','data-kind="birthday"','button secondary')}${btn('다음 방송 주년','quickDate','data-kind="anniversary"','button secondary')}</div><p id="deadline-warning" class="ending-warning" hidden>이 날짜로 이동하면 이 일지의 마지막 장이 시작돼요. 현재 기록을 먼저 내보내 두는 것을 권해요.</p>${btn('이 날짜로 이동하기 →','submitDate','','button primary full')}`);
  updateDateWarning();
}

/** 10년 기한을 넘기는 날짜를 고르면 경고 표시 */
export function updateDateWarning() {
  const node = $('#deadline-warning');
  if (node) node.hidden = store.state.endingSeenEver || $('#next-date').value < DEADLINE;
}

export function openSettings() {
  openDialog('나에게 편한 방송일지',`<label class="setting-row">글자 크기<select id="font-size"><option value="100">기본</option><option value="125">125%</option><option value="150">150%</option><option value="200">200%</option></select></label><label class="setting-row">본문 글꼴<select id="font-style"><option value="readable">읽기 편한 글꼴</option><option value="pixel">픽셀 글꼴</option></select></label><label class="setting-row">동작 줄이기<input id="motion-toggle" type="checkbox" ${preferences.reducedMotion?'checked':''}/></label><label class="setting-row">작은 효과음<input id="sound-toggle" type="checkbox" ${preferences.sound?'checked':''}/></label><div class="settings-files">${btn('일지 내보내기','export','','button secondary')}<label class="button secondary file-label">일지 가져오기<input type="file" id="import-file" accept="application/json,.json"/></label></div><p class="modal-description">이 브라우저에 자동 저장돼요. 다른 PC로 옮길 때는 일지 파일을 내보내 주세요.</p>${btn('새 일지 시작하기','confirmNew','','text-button danger')}`);
  $('#font-size').value = preferences.textSize;
  $('#font-style').value = preferences.font;
}

const GUIDE_KEY = 'rakoko-guide-seen';
/** 새 일지 첫 방송 전에 한 번만 보여 주는 안내 */
export function maybeShowGuide() {
  const {state} = store;
  let seen = false;
  try { seen = localStorage.getItem(GUIDE_KEY) === '1'; } catch {}
  if (seen || state.completedBroadcasts > 0 || state.phase !== 'prep') return;
  try { localStorage.setItem(GUIDE_KEY, '1'); } catch {}
  openDialog('첫 방송을 켜기 전에',`<img class="guide-logo" src="${LOGO}" alt="라코코의 방송일지" width="1200" height="360"/><ol class="guide-list"><li><b>준비</b> — 방송마다 준비 행동 2번. 자료·연습·점검마다 유리해지는 코너가 달라요.</li><li><b>방송</b> — 코너 3개. 선택지의 <em>안정·보통·모험</em>에 따라 대성공도, 아쉬움도 나와요.</li><li><b>일지</b> — 결과와 시청자 성장으로 방송 등급(S~C)이 매겨지고, 응원이 터지기도 해요.</li><li><b>목표</b> — 기획을 골라 3단계로 완성하고, 방송 150일째부터 마지막 특집으로 결말을 만나요. 여러 기획을 완성해 두고 고를 수도 있어요.</li><li><b>그 밖에</b> — 방송 중 새 의상 제안·구매 이벤트, 이번 달 미션, 업적과 사건 도감이 기다려요.</li></ol><p class="modal-description">키보드: 숫자 1~4로 선택, Enter 로 다음. 설정에서 글자 크기·동작 줄이기·효과음을 바꿀 수 있어요.</p>${btn('첫 방송 준비하기','closeModal','','button primary full')}`);
}

export function openAbout() {
  openDialog('라코코의 방송일지',`<p class="about-intro">오늘의 방송이<br/><b>내일의 이야기가 되는 곳.</b></p><p>준비하고, 함께 방송하고, 기억할 장면을 남기는 비공식 선택형 팬게임이에요.</p><ul class="about-list"><li>준비 행동은 방송마다 2번, 코너는 3개예요. 선택지의 안정·보통·모험에 따라 결과가 갈려요.</li><li>기획은 특별 코너에서 자료·시범·피드백 순으로 만들고, 방송 150일째부터 결말로 이어져요.</li><li>새 옷은 방송 중 제안 → 준비 → 커튼 공개 → 무료 환복. 준비를 미루면 유출될 수도!</li><li>이번 달 미션, 업적과 사건 도감도 모아 보세요.</li><li>키보드: 숫자 1~4로 선택, Enter 로 다음.</li></ul><p class="modal-description"><b>v0.2에서 새로워진 점</b> — 선택지 성향과 대성공, 방송 등급·시청자·응원, 방송 중 구매·새 의상 제안, 커튼 공개 연출, 이번 달 미션, 업적·사건 도감, 시청자 추이 결산, 키보드 단축키.</p><p class="modal-description">캐릭터: 사용자 제공 공식 참조를 바탕으로 만든 도트풍 이미지.<br/>픽셀 글꼴: Neo둥근모 · Eunbin Jeong · SIL OFL 1.1.<br/><a href="assets/fonts/neodgm-LICENSE.txt" target="_blank" rel="noopener">글꼴 라이선스 보기</a></p>`);
}

/** 결말 모음: 33칸(일반 32 + 10년 결말). 못 만난 결말은 제목을 숨기고 어떤 기획으로 갈 수 있는지만 힌트 */
export function openCollection() {
  const {state, catalog} = store, met = new Map(state.reachedEndings.map(e => [e.id, e]));
  const card = (id, hint) => { const e = met.get(id), art = e && endingArt(id); return e ? `<article class="got">${art?`<img class="collection-art" src="${art}" alt="" width="960" height="540" loading="lazy"/>`:'<span>✦</span>'}<h3>${escape(e.title)}</h3><p>${escape(e.epilogue)}</p></article>` : `<article class="locked"><span>?</span><h3>???</h3><p>${escape(hint)}</p></article>`; };
  const cards = catalog.projects.map(p => card(p.id, `기획 「${p.name}」에서 만날 수 있어요`)).join('') + card('END-FORCED-10Y', '결말 없이 10년을 방송하면…');
  openDialog('함께 만난 이야기들',`<p class="modal-description">만난 결말 ${met.size} / ${TOTAL_ENDINGS}. 한 기획에서도 마지막 선택에 따라 다른 결말을 만날 수 있어요.</p><div class="collection-list">${cards}</div>`);
}

export function openAchievements() {
  const {state, catalog} = store, got = state.achievements || {};
  openDialog('업적과 사건 도감',`<p class="modal-description">업적 ${Object.keys(got).length} / ${ACHIEVEMENTS.length} · 만난 사건 ${eventsSeen(state)} / ${catalog.events.length}</p><div class="achievement-grid">${ACHIEVEMENTS.map(a=>got[a.id]?`<article class="achievement got"><span>✦</span><h3>${escape(a.label)}</h3><p>${escape(a.desc)}</p><small>${escape(got[a.id])}</small></article>`:`<article class="achievement"><span>?</span><h3>${escape(a.label)}</h3><p>${escape(a.desc)}</p></article>`).join('')}</div>`);
}

export function openConfirmNew() {
  openDialog('새 일지를 펼칠까요?',`<p>지금 기록을 먼저 파일로 남겨 두면 언제든 다시 가져올 수 있어요.</p><div class="modal-actions">${btn('현재 일지 내보내기','export','','button secondary')}${btn('새로운 첫 방송 시작','new','','button primary')}</div>`);
}

export function openImportConfirm(candidate) {
  openDialog('일지 가져오기',`<p>${escape(candidate.date)} · ${escape(candidate.broadcastIndex)}번째 방송의 기록이에요.</p><p>현재 기록은 직전 저장으로 보관하고 이 일지로 이어갑니다. 필요하면 먼저 현재 일지를 내보내 주세요.</p>${btn('현재 일지 내보내기','export','','button secondary')}${btn('이 일지로 이어하기','commitImport','','button primary')}`);
}

export function openEndingConfirm(choiceId) {
  openDialog('이 장의 마지막 선택',`<p>이 선택으로 현재 기획을 마무리하고 엔딩·크레딧으로 이어져요.</p>${btn('조금 더 생각하기','closeModal','','button secondary')}${btn('이 이야기로 마무리하기','confirmEnding',`data-id="${escape(choiceId)}"`,'button primary')}`);
}
