import {readFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const manifest=await json('assets/asset-requests-v2-manifest.json');
const images=await json('docs/asset-validation-v2.json');
const audio=await json('docs/audio-validation-v2.json');
const catalog=await json('src/data/catalog.json');
assert.equal(manifest.assets.length,99);
assert.equal(new Set(manifest.assets.map(a=>a.path)).size,99);
assert.equal(images.length,91,'Run complete PNG validation first');
assert.equal(audio.length,8);
let bytes=0;
for(const asset of manifest.assets){
  assert(asset.path.startsWith('assets/')&&!asset.path.includes('..'));
  const data=await readFile(asset.path);
  assert(data.length>100,asset.path);
  bytes+=data.length;
  const hash=createHash('sha256').update(data).digest('hex');
  const proof=(asset.group==='audio'?audio:images).find(x=>x.path===asset.path);
  assert(proof,asset.path);
  assert.equal(hash,proof.sha256,'Stale validation: '+asset.path);
  if(asset.group==='audio'){
    assert.equal(data.toString('ascii',0,4),'OggS',asset.path);
    assert(data.includes(Buffer.from('vorbis')),asset.path);
    assert.equal(proof.sampleRate,44100);assert.equal(proof.channels,2);
    assert(Math.abs(proof.seconds-asset.duration)<1/44100);
    assert(proof.peak<.98&&proof.rms>.005);
    if(proof.loop){assert(proof.seconds>=60&&proof.seconds<=120);assert(proof.loopBoundaryDelta<.025);}
  }else{
    assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(data.readUInt32BE(16),asset.width,asset.path);
    assert.equal(data.readUInt32BE(20),asset.height,asset.path);
    assert.equal(proof.width,asset.width);assert.equal(proof.height,asset.height);
    assert(proof.visiblePixels>0);
    assert.equal(proof.visiblePixels+proof.transparentPixels,asset.width*asset.height);
    assert(asset.transparent?proof.transparentPixels>0:proof.transparentPixels===0);
    if(asset.generator==='imagegen'){
      assert(asset.prompt&&asset.promptFile);
      assert.equal((await readFile(asset.promptFile,'utf8')).trim(),asset.prompt);
      for(const ref of asset.refs)assert((await stat(ref)).isFile());
    }
    if(asset.generator==='reuse')assert(data.equals(await readFile(asset.source)),asset.path);
  }
}
const faces=manifest.assets.filter(a=>a.group==='faces');
assert.equal(faces.length,25);
for(const outfit of ['base','ghost','maid','police','nun'])
 for(const expression of ['default','smile','flustered','surprised','proud'])
  assert(faces.some(a=>a.outfit===outfit&&a.expression===expression));
assert.deepEqual(manifest.assets.filter(a=>a.group==='games').map(a=>a.gameId).sort(),catalog.games.map(g=>g.id).sort());
assert.deepEqual(manifest.assets.filter(a=>a.group==='modules').map(a=>a.moduleId).sort(),catalog.modules.map(g=>g.id).sort());
console.log('PASS: 99 files (91 PNG + 8 Ogg), dimensions, alpha, hashes, 25 outfit faces, 15 game IDs, 8 modules, prompts and audio metrics. '+bytes+' bytes.');
