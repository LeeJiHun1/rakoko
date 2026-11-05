// 결과 화면의 키몽이 채팅 3줄. 최근 24줄과 겹치지 않게 고른다.
import {CHAT_POOLS, chatContext} from '../data/chat.js';
import {random} from './rng.js';

const HISTORY = 24, SPEAKERS = 8;
/** 대성공이면 채팅이 몰아친다 */
const linesFor = result => result?.grade === 'great' ? 5 : 3;

export function reactions(s, selected) {
  const context = chatContext(s.event, selected, s.result, s.module);
  const pool = CHAT_POOLS[context] || CHAT_POOLS.general, LINES = linesFor(s.result);
  s.reactionHistory ??= [];
  let recent = new Set(s.reactionHistory.slice(-HISTORY).map(x => x.text));
  let candidates = pool.filter(x => !recent.has(x.text));
  if (candidates.length < LINES) { recent = new Set(s.reactionHistory.slice(-LINES).map(x => x.text)); candidates = pool.filter(x => !recent.has(x.text)); }
  if (candidates.length < LINES) candidates = pool.slice();
  const offset = Math.floor(random(s) * SPEAKERS), rows = [];
  for (let i = 0; i < LINES; i++) {
    const index = Math.floor(random(s) * candidates.length), line = candidates.splice(index, 1)[0];
    rows.push({id: line.id, speaker: `키몽이 ${String((offset + i) % SPEAKERS + 1).padStart(2, '0')}`, text: line.text});
    s.reactionHistory.push({id: line.id, text: line.text});
  }
  s.reactionHistory = s.reactionHistory.slice(-HISTORY);
  s.result.chatContext = context;
  return rows;
}
