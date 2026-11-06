import {readFile, writeFile} from 'node:fs/promises';

// 요청서의 고정 파일명·규격. 엔진이나 UI를 변경하지 않는 제작 인계 도구다.
const assets = [];
const add = (path, width, height, transparent, label, promptId, extra = {}) =>
  assets.push({path, width, height, transparent, label, promptFile: `work/asset-production/${promptId}.prompt.txt`, ...extra});
for (const [id, label] of Object.entries({default:'기본', smile:'웃음', surprised:'놀람', flustered:'당황', proud:'뿌듯'}))
  add(`assets/characters/rakoko-face-${id}.png`,512,512,true,`라코코 · ${label}`,`face-${id}`);
for (const [id, label] of [['night','밤'],['day','낮']])
  add(`assets/backgrounds/studio-${id}.png`,1600,1000,false,`방송 스튜디오 · ${label}`,`studio-${id}`);
for (const [id, label] of [['maid','프릴 조각'],['police','단추 조각'],['ghost','흰 천 끝'],['nun','흑백 천 끝']])
  add(`assets/events/outfit-leak/${id}.png`,640,360,true,`유출 단서 · ${label}`,`leak-${id}`,{spoilerPolicy:'일부 천 조각만 표시. 의상 전체 공개용 아님.'});
for (const [i,label] of ['모자','안경','하트','졸린 얼굴','헤드폰','파티 모자'].entries())
  add(`assets/characters/kimongi-${i+1}.png`,128,128,true,`키몽이 ${i+1} · ${label}`,`kimongi-${i+1}`);
add('assets/brand/logo.png',1200,360,true,'라코코의 방송일지 · 로고','logo');
const catalog = JSON.parse(await readFile('src/data/catalog.json','utf8'));
for (const event of catalog.endingEvents)
  add(`assets/endings/${event.id}.png`,960,540,false,`${event.id} · ${event.title}`,event.id,
    {eventId:event.id, endingIds:event.choices.map(x=>x.endingId), endingTitles:event.choices.map(x=>x.endingTitle)});
for (const [id,label] of [['T','잡담'],['G','게임 도전'],['F','팬 참여'],['S','특별 기획']])
  add(`assets/icons/corner-${id}.png`,96,96,true,`코너 · ${label}`,`corner-${id}`);
for (const asset of assets) asset.prompt = (await readFile(asset.promptFile,'utf8')).replace(/^\uFEFF/,'').trim();
if (assets.length !== 38) throw new Error(`Expected 38 assets, got ${assets.length}`);
const manifest = {
  version:1, producedAt:'2026-11-05', request:'docs/ASSET-REQUESTS.md',
  tool:'Built-in image_gen.imagegen (CLI/API fallback unused)',
  identityReferences:['assets/characters/rakoko-base-v1.png','assets/characters/kimongi-base-v1.png'],
  processing:'Windows System.Drawing: nearest-neighbor sizing only; contain for alpha assets, cover for opaque scenes. No semantic repainting.',
  distribution:'로컬 제작물. 공개 배포는 docs/ASSET-REQUESTS.md의 공개 전 조건에 따른다.',
  integration:'이미지 제작·배치 완료. UI 연결·빌드 대상 추가는 별도 작업.',
  assets
};
await writeFile('assets/asset-requests-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=assets.map(a=>`<figure><div class="image ${a.transparent?'alpha':''}"><img src="../${esc(a.path)}" alt="${esc(a.label)}"></div><figcaption><strong>${esc(a.label)}</strong><br>${a.width}×${a.height}${a.transparent?' · 투명':''}<br><a href="../${esc(a.path)}">${esc(a.path)}</a></figcaption></figure>`).join('\n');
await writeFile('docs/asset-gallery.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>방송일지 에셋 38종</title><style>body{margin:24px;background:#f5eedf;color:#302436;font:15px system-ui,sans-serif}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;background:white;border:1px solid #cdbfa9;border-radius:10px;overflow:hidden}.image{height:220px;display:grid;place-items:center;background:#302436}.alpha{background-color:#ece5dc;background-image:conic-gradient(#d5cabb 25%,transparent 0 50%,#d5cabb 0 75%,transparent 0);background-size:24px 24px}img{max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated}figcaption{padding:12px;line-height:1.6;overflow-wrap:anywhere}a{color:#675080}header{max-width:900px;margin-bottom:24px}</style><header><h1>라코코의 방송일지 · 제작 에셋 38종</h1><p>2026-11-05 · ASSET-REQUESTS.md 요청 규격. 체크 무늬는 투명 배경 확인용이며 이미지에 포함되지 않습니다.</p><p>이미지 제작·배치 완료. 게임 화면 연결은 별도 작업입니다. 원래 캐릭터 PNG는 덮어쓰지 않았습니다.</p></header><main>${cards}</main></html>`);
console.log(`Wrote manifest and gallery: ${assets.length} assets.`);
