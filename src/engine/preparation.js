// 방송 전 준비 행동(방송마다 2회): 자료 준비 · 게임 연습 · 화면 점검 · 의상 준비.
import {gain} from './growth.js';
import {isCraftable, isStarted, prepareOutfit} from './outfit.js';

const PREPARE_ACTIONS = {
  data(s) { gain(s, 'planning', 2); s.dataPrepared++; },
  practice(s) { gain(s, 'gameSkill', 2); s.practicedToday = (s.practicedToday || 0) + 1; if (s.project?.gameId === s.gameId) s.project.practiced = true; },
  check(s) { if (s.checked) throw Error('이번 방송은 이미 점검했어요.'); s.checked = true; gain(s, 'operation', 1); },
  outfit: prepareOutfit,
};

export function prepare(s, action) {
  if (s.preparations < 1) throw Error('오늘의 준비 행동을 모두 사용했어요.');
  if (!Object.hasOwn(PREPARE_ACTIONS, action)) throw Error('준비 행동을 찾을 수 없어요.');
  PREPARE_ACTIONS[action](s);
  s.preparations--;
}

export const commands = {
  prepare: {prepOnly: true, run(s, c) { prepare(s, c.action); }},
  /** 옷장 화면의 "제작하기": 준비할 의상을 바꾸고 바로 의상 준비 1회 */
  craftAndPrepare: {prepOnly: true, run(s, c, catalog) {
    if (!isCraftable(catalog, c.outfitId)) throw Error('의상을 골라주세요.');
    if (!isStarted(s, c.outfitId)) throw Error('방송 중 새 의상 제안을 받아 준비를 시작해주세요.');
    if (s.crafting !== c.outfitId) s.outfitReserved = false;
    s.crafting = c.outfitId;
    prepare(s, 'outfit');
  }},
};
