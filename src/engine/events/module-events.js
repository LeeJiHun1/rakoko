// 장기 콘텐츠(마을·협동·대회) 사건. 진행형(module_progression) 우선, 없으면 반복형(module_recurring).
import {PLAYER_SKILL_THRESHOLD} from '../constants.js';
import {skill} from '../state.js';
import {choice, event} from './factory.js';

const MAX_MODULE_EVENTS_PER_BROADCAST = 2;
const TOURNAMENT_MODULES = ['LC-PT', 'LC-ST'];
export const isTournament = m => TOURNAMENT_MODULES.includes(m.id);

function matchEvent(s, m) {
  const opponent = m.opponents[m.matches.length];
  return event(s, 'match', `가상 대회 · ${m.matches.length ? '결승' : '첫 라운드'}`, '미리 정해진 상대와 팀의 준비를 비교한다. 경기를 마쳐야 결과가 기록된다.', [
    choice('play', `경기를 진행한다 · 상대 준비 ${opponent}`, '실제 경기 판정 결과를 기록했다.'),
    choice('withdraw', '출전을 포기하고 응원 역할로 마친다', '승리를 만들어내지 않고 대회의 응원 역할로 돌아갔다.'),
  ], {opponent});
}

/** 이번 코너에 낼 장기 콘텐츠 사건. 없으면 null (일반 사건으로 넘어간다). */
export function moduleEvent(s, catalog) {
  const m = s.module;
  if (!m || m.phase === 'closed' || m.expired || m.usedThisBroadcast >= MAX_MODULE_EVENTS_PER_BROADCAST) return null;
  m.qualification.playerConfirmed = skill(s, m.gameId) >= PLAYER_SKILL_THRESHOLD;
  const definitions = catalog.moduleEvents.filter(e => e.moduleId === m.id && e.eligibility.modulePhase === m.phase);
  if (isTournament(m) && m.phase === 'rehearsed' && m.local.roleTrack === 'player' && m.matches.length < 2) return matchEvent(s, m);
  const advance = definitions.find(e => e.trigger === 'module_progression');
  const repeats = definitions.filter(e => e.trigger === 'module_recurring' && (m.repeatLast[e.id] == null || m.participation - m.repeatLast[e.id] >= 2));
  const def = (m.lastAdvance !== s.broadcastIndex && !m.practiceOnly ? advance : null) || repeats[0];
  if (!def) return null;
  return event(s, 'module', def.title, def.body || '가상 동료들과 이어 가는 장기 콘텐츠. 실제로 맡은 역할과 시험한 범위만 이번 기록에 남긴다.',
    def.choices.map(c => ({id: c.id, text: c.text, outcome: c.outcome, requirements: c.eligibility.all, effects: c.effects})),
    {definitionId: def.id, moduleProgression: def.trigger === 'module_progression'});
}
