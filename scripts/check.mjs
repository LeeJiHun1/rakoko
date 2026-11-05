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
console.log(`PASS: IDs, 80 events, 32 projects, 8 modules, choices, experience links, image/font paths, JS syntax (${files.length} files).`);
