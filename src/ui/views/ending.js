// 결말 선택 화면과 크레딧 이후 빈 화면.
import {btn, escape} from '../dom.js';
import {store} from '../store.js';
import {choices} from './event.js';
import {endingImage} from '../assets.js';

export function endingChoices() {
  const {state} = store;
  return `<div class="ending-intro">✦ 한 장의 마지막 선택</div><article class="event-card">${endingImage(state.event.id)?`<img class="ending-art" src="${endingImage(state.event.id)}" alt="" width="960" height="540"/>`:''}<span class="eyebrow">준비한 기획, 쌓아 온 경험</span><h2>${escape(state.event.title)}</h2><p class="event-body">${escape(state.event.setup)}</p><p class="ending-warning">아래 종결 선택을 하면 이 장의 엔딩과 크레딧으로 이어져요.</p>${choices(state.event)}${btn('아직 더 방송하고 싶어 · 계속하기','deferEnding','','button secondary full')}</article>`;
}

export function creditsScreen() {
  return '<div class="empty-state"><span>✦</span><h2>한 장의 이야기를 마쳤어요.</h2><p>일지를 둘러보거나 마지막 장면을 다시 볼 수 있어요.</p>' + btn('마지막 장면 보기', 'credits', '', 'button primary') + '</div>';
}
