// 화면 공통 틀: 상단바 · 왼쪽 스튜디오(캐릭터·능력) · 일지 탭 · 날짜 머리말.
import {LABELS, skill} from '../../engine.js';
import {btn, escape} from '../dom.js';
import {gameName, outfit, store} from '../store.js';

export const isLive = state => ['event', 'result', 'ending'].includes(state.phase);

export function topbar() {
  const {busy, saveError} = store;
  return `<header class="topbar"><a class="brand" href="#" data-view="broadcast"><span class="brand-mark">✦</span><span>라코코의 방송일지<small>THE BROADCAST JOURNAL</small></span></a>
  <div class="topbar-actions"><span class="save-state ${saveError?'error':''}"><i></i>${busy?'저장 중':saveError?'저장 확인 필요':'기록 중'}</span>${btn('↻','reload','title="최신 일지 불러오기"','icon-button')}${btn('☷','settings','title="설정"','icon-button')}${btn('?','about','aria-label="게임 안내"','icon-button')}</div></header>`;
}

function statusPanel(state, catalog) {
  return `<section class="status-panel"><div class="section-heading"><span>우리 방송의 지금</span><small>${escape(catalog.economy.income.scaleTiers[state.scaleIndex].label)}</small></div><div class="stat-grid">${Object.entries(state.stats).map(([key,value])=>`<div class="stat"><div><span>${LABELS[key]}</span><b>${value}<small>/100</small></b></div><div class="meter"><i style="width:${value}%" class="${key}"></i></div></div>`).join('')}</div>
  <div class="game-stat"><span>▣ ${escape(gameName(state.gameId))}</span><b>숙련 ${skill(state)}</b></div></section>`;
}

export function studio() {
  const {state, catalog} = store, live = isLive(state), o = outfit();
  return `<aside class="studio-column"><section class="studio"><div class="studio-top"><span class="live-pill ${live?'live':''}"><i></i>${live?'ON AIR':'STANDBY'}</span><span>RAKOKO / STUDIO 01</span></div>
  <div class="studio-window"><span></span></div><div class="studio-grid"></div><span class="studio-spark s1">✦</span><span class="studio-spark s2">✧</span>
  <img class="character" src="${o.image}" alt="${escape(o.name)}을 입은 라코코" width="1024" height="1536" />
  <div class="studio-caption"><span class="tiny">TODAY'S RAKOKO</span><h2>오늘도,<br/>코코랑.</h2><p>${live?'지금 이 순간도 다음 페이지가 될 거야.':'아직 쓰지 않은 이야기가 기다리고 있어.'}</p><div class="outfit-label"><i></i>${escape(o.name)}${btn('갈아입기 ↗','wardrobe','','text-button')}</div></div></section>
  ${statusPanel(state, catalog)}</aside>`;
}

const TABS = [['broadcast', '방송하기', '◉'], ['projects', '목표 고르기', '▤'], ['wardrobe', '옷장', '♧'], ['journal', '지난 기록', '▥']];
export function navigation() {
  const {view} = store;
  return `<nav class="notebook-tabs" aria-label="일지 메뉴">${TABS.map(([id,label,icon])=>`<button data-view="${id}" class="${view===id?'active':''}" ${view===id?'aria-current="page"':''}><span>${icon}</span>${label}</button>`).join('')}</nav>`;
}

const PHASE_TITLES = {prep: '방송 준비', event: '지금은 방송 중', result: '선택의 결과', wrap: '오늘의 일지', ending: '기획의 마무리', credits: '마지막 페이지'};
const VIEW_TITLES = {projects: '다음 이야기의 씨앗', wardrobe: '기분 따라, 오늘의 코코', journal: '차곡차곡 쌓인 우리'};
export function dayHeader() {
  const {state, view} = store, d = new Date(state.date + 'T12:00:00Z');
  const title = view === 'broadcast' ? PHASE_TITLES[state.phase] : VIEW_TITLES[view];
  return `<div class="page-heading"><div><p class="eyebrow">ONE STREAM, ONE STORY</p><h1>${title}</h1></div><div class="date-stamp"><span>${d.toLocaleString('en-US',{month:'short',timeZone:'UTC'}).toUpperCase()} ${state.date.slice(0,4)}</span><strong>${state.date.slice(-2)}</strong><small>${d.toLocaleString('en-US',{weekday:'short',timeZone:'UTC'}).toUpperCase()}</small></div></div>`;
}
