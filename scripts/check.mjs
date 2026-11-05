// 정적 콘텐츠·코드 검사: 카탈로그 ID 무결성, 필수 연결, 파일 경로, 모든 JS 문법.
import {readFile, stat, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const c = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
for (const list of [c.events, c.projects, c.modules, c.moduleEvents, c.moneyEvents, c.outfits]) assert.equal(new Set(list.map(x => x.id)).size, list.length, 'Duplicate IDs');
assert.equal(c.events.length, 80); assert.equal(c.projects.length, 32); assert.equal(c.modules.length, 8);
for (const e of [...c.events, ...c.moduleEvents]) assert(e.choices.length >= 2 && e.choices.every(x => x.id && x.text));
for (const p of c.projects) { assert(c.experienceDefinitions[p.experienceId]); assert.equal(p.steps.length, 3); assert(c.endingEvents.some(e => e.id === p.eventId)); }
for (const o of c.outfits) assert((await stat(o.image)).isFile());

async function jsFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await jsFiles(path));
    else if (entry.name.endsWith('.js')) out.push(path);
  }
  return out;
}
const files = await jsFiles('src');
for (const file of files) execFileSync(process.execPath, ['--check', file]);
assert((await stat('assets/fonts/neodgm-LICENSE.txt')).isFile());

// 코드에 직접 적힌 콘텐츠 ID 가 카탈로그에 실제로 있는지 (카탈로그 재생성으로 ID 가 바뀌면 조건이 조용히 사라지는 것을 막는다)
const known = {
  event: new Set(c.events.map(e => e.id)),
  experience: new Set(Object.keys(c.experienceDefinitions)),
  endingEvent: new Set(c.endingEvents.map(e => e.id)),
  module: new Set(c.modules.map(m => m.id)),
  project: new Set(c.projects.map(p => p.id)),
};
const ID_PATTERNS = [[/\b(?:CE|RK|RA)-\d{3}\b/g, 'event'], [/\bEX-\d{3}\b/g, 'experience'], [/\bEF-\d{3}\b/g, 'endingEvent'], [/\bLC-[A-Z]{2}\b/g, 'module'], [/\bEND-\d{3}\b/g, 'project']];
const missing = [];
let refs = 0;
for (const file of files.filter(f => f.startsWith('src/engine') || f.startsWith('src/ui') || f === 'src/data/chat.js')) {
  const text = await readFile(file, 'utf8');
  for (const [pattern, kind] of ID_PATTERNS) for (const id of text.match(pattern) || []) { refs++; if (!known[kind].has(id)) missing.push(`${file}: ${id}`); }
}
assert.deepEqual(missing, [], `카탈로그에 없는 콘텐츠 ID:\n${missing.join('\n')}`);
console.log(`PASS: IDs, 80 events, 32 projects, 8 modules, choices, experience links, image/font paths, JS syntax (${files.length} files), code content refs (${refs}).`);
