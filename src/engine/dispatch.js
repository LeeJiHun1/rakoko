// 모든 상태 변경의 단일 입구. 원본 상태는 바꾸지 않고 복제본에 명령을 적용해 돌려준다.
// 같은 commandId 는 한 번만 적용된다(중복 클릭·재전송 대비). 실패하면 예외를 던지고 원본은 그대로다.
import {COMMAND_HISTORY_LIMIT} from './constants.js';
import {COMMANDS} from './commands.js';
import {clone} from './util.js';

function execute(s, command, catalog) {
  if (!Object.hasOwn(COMMANDS, command.type)) throw Error('알 수 없는 행동이에요.');
  const handler = COMMANDS[command.type];
  if (handler.prepOnly && s.phase !== 'prep') throw Error('방송 준비 중에 할 수 있어요.');
  handler.run(s, command, catalog);
}

export function dispatch(state, command, catalog) {
  if (!command.commandId || typeof command.commandId !== 'string') throw Error('명령 식별자가 필요해요.');
  if (state.commands.includes(command.commandId)) return state;
  const next = clone(state);
  execute(next, command, catalog);
  next.commands.push(command.commandId);
  next.commands = next.commands.slice(-COMMAND_HISTORY_LIMIT);
  next.revision++;
  return next;
}
