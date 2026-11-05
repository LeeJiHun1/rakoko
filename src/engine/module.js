// 장기 콘텐츠 참가·선택 반영. 사건 생성은 events/module-events.js.
import {MODULE_DURATION_DAYS, PLAYER_SKILL_THRESHOLD} from './constants.js';
import {addDays} from './dates.js';
import {awardTournamentPrize} from './economy.js';
import {isTournament} from './events/module-events.js';
import {gain} from './growth.js';
import {random} from './rng.js';
import {skill} from './state.js';
import {clamp, clone, getPath, setPath} from './util.js';

/** 대회 상대 준비도: 35~70 (참가 시 2회 추첨해 저장) */
const rollOpponent = s => 35 + Math.floor(random(s) * 36);

function createModule(s, def) {
  return {id: def.id, name: def.name, gameId: def.gameId, phase: 'invited', instanceId: `${def.id}:${s.broadcastIndex}:${s.moduleArchive.length}`,
    deadline: addDays(s.date, MODULE_DURATION_DAYS), local: clone(def.localState),
    qualification: {playerConfirmed: skill(s, def.gameId) >= PLAYER_SKILL_THRESHOLD, supportConfirmed: true},
    usedThisBroadcast: 0, participation: 0, participatedLast: -1, lastAdvance: -1, repeatLast: {}, matches: [],
    opponents: [rollOpponent(s), rollOpponent(s)], practiceOnly: false};
}

function playMatch(s, m, c) {
  if (c.id === 'withdraw') {
    m.local.roleTrack = 'support';
    m.matches.push({won: false, withdrawn: true}, {won: false, withdrawn: true});
    return;
  }
  const performance = .5 * skill(s, m.gameId) + .25 * (m.local.practice || 0) + .25 * (m.local.teamwork || 0);
  const won = performance >= s.event.opponent;
  m.matches.push({opponent: s.event.opponent, performance, won});
  s.result.outcome = `팀 준비 ${performance.toFixed(1)} 대 상대 ${s.event.opponent}. ${won ? '이번 라운드를 이겼다!' : '이번 라운드는 아쉽게 졌다.'}`;
}

const EFFECTS = {
  'local.add'(s, m, effect) { setPath(m.local, effect.key, clamp((getPath(m.local, effect.key) || 0) + effect.amount)); },
  'local.set'(s, m, effect) { setPath(m.local, effect.key, effect.value); },
  'module.phase'(s, m, effect) { m.phase = effect.value; },
  'module.validateRehearsal'(s, m, effect) {
    m.local.verifiedFinalScope = effect.verifiedFinalScope === 'projectTrack' ? m.local.projectTrack : effect.verifiedFinalScope;
    if (m.id === 'LC-RD' && m.local.verifiedFinalScope === 'specialist' && (skill(s, m.gameId) < 55 || (m.local.practice || 0) < 40 || (m.local.teamwork || 0) < 30)) m.local.verifiedFinalScope = 'guided';
  },
  'module.recordOutcome'(s, m, effect, catalog) {
    m.outcome = {scope: m.local.verifiedFinalScope || 'guided', role: m.local.roleTrack || 'learner', matches: clone(m.matches), wins: m.matches.filter(x => x.won).length};
    if (isTournament(m) && m.local.roleTrack === 'player' && m.matches.length === 2 && m.matches.every(x => x.won) && !m.prizeAwarded) awardTournamentPrize(s, m, catalog);
  },
};

export function commitModuleChoice(s, c, catalog) {
  const m = s.module;
  if (m.participatedLast !== s.broadcastIndex) { m.participation++; m.participatedLast = s.broadcastIndex; }
  m.usedThisBroadcast++;
  if (s.event.kind === 'match') { playMatch(s, m, c); return; }
  for (const effect of c.effects || []) if (Object.hasOwn(EFFECTS, effect.op)) EFFECTS[effect.op](s, m, effect, catalog);
  if (s.event.moduleProgression) m.lastAdvance = s.broadcastIndex;
  else m.repeatLast[s.event.definitionId] = m.participation;
  gain(s, 'gameSkill', 1, m.gameId);
  gain(s, 'operation', 1);
}

export const commands = {
  joinModule: {prepOnly: true, run(s, c, catalog) {
    if (s.module && !s.module.expired) throw Error('장기 콘텐츠는 하나씩 참여할 수 있어요.');
    const def = catalog.modules.find(x => x.id === c.id);
    if (!def) throw Error('콘텐츠를 찾을 수 없어요.');
    if (s.module) s.moduleArchive.push(s.module);
    s.module = createModule(s, def);
    if (!s.plan.includes('G')) s.plan[0] = 'G';
  }},
  practiceModule: {prepOnly: true, run(s) { if (s.module) s.module.practiceOnly = !s.module.practiceOnly; }},
  leaveModule: {prepOnly: true, run(s) {
    if (!s.module) return;
    s.moduleArchive.push({...s.module, abandoned: true});
    s.module = null;
  }},
};
