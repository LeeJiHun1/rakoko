// 명령 등록표. 새 명령은 도메인 파일에 {prepOnly?, run(s, command, catalog)} 로 추가하고 여기서 합친다.
// prepOnly: 방송 준비(phase 'prep') 중에만 허용.
import {commands as broadcast} from './broadcast.js';
import {commands as economy} from './economy.js';
import {commands as ending} from './ending.js';
import {commands as module} from './module.js';
import {commands as outfit} from './outfit.js';
import {commands as preparation} from './preparation.js';
import {commands as project} from './project.js';

export const COMMANDS = Object.freeze({...broadcast, ...preparation, ...outfit, ...project, ...module, ...economy, ...ending});
