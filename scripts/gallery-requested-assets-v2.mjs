import {readFile,writeFile,stat} from 'node:fs/promises';
const m=JSON.parse(await readFile('assets/asset-requests-v2-manifest.json','utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={faces:'의상별 표정 25종',scenes:'사건 분류 8종',grades:'방송 등급 4종',donations:'응원 3종',outfit:'의상 이벤트 3종',items:'구매 아이템 8종',modules:'장기 콘텐츠 8종',games:'게임 아이콘 15종',badges:'업적·미션 9종',celebration:'생일·주년 2종',ending:'10년 결말 단체사진',brand:'키 비주얼·앱 아이콘·공유 이미지',audio:'직접 작곡·합성한 음원 8종'};
let count=0;
const sections=[];
for(const [group,name] of Object.entries(names)){
 const cards=[];
 for(const a of m.assets.filter(a=>a.group===group)){
  let ready=false;try{ready=(await stat(a.path)).isFile();}catch{}
  if(ready)count++;
  const media=!ready?'<span>제작 중</span>':group==='audio'?'<audio controls preload="none" src="../'+esc(a.path)+'"></audio>':'<img loading="lazy" src="../'+esc(a.path)+'" alt="'+esc(a.label)+'">';
  const extra=group==='audio'?a.duration+'초 · OGG · 스테레오':a.width+'×'+a.height+(a.transparent?' · 투명 PNG':' · 배경 포함 PNG');
  cards.push('<figure><div class="media '+(a.transparent?'alpha':'')+'">'+media+'</div><figcaption><strong>'+esc(a.label)+'</strong><br>'+extra+'<br><a href="../'+esc(a.path)+'">'+esc(a.path)+'</a></figcaption></figure>');
 }
 sections.push('<section id="'+group+'"><h2>'+name+'</h2><div class="grid">'+cards.join('')+'</div></section>');
}
await writeFile('docs/asset-gallery-v2.html','<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>방송일지 에셋 v2</title><style>body{margin:24px;background:#f5eedf;color:#302436;font:15px system-ui,sans-serif}header{max-width:1000px}h1{font-size:26px}h2{font-size:20px;margin-top:40px}nav{display:flex;flex-wrap:wrap;gap:10px}a{color:#674b7b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}figure{margin:0;background:white;border:1px solid #cbbda8;border-radius:10px;overflow:hidden}.media{height:220px;display:grid;place-items:center;background:#302436;color:white}.alpha{background-color:#eee6da;background-image:conic-gradient(#d5cabb 25%,transparent 0 50%,#d5cabb 0 75%,transparent 0);background-size:24px 24px}img{max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated}figcaption{padding:12px;line-height:1.6;overflow-wrap:anywhere}audio{max-width:95%}</style><header><h1>라코코의 방송일지 · 추가 에셋 v2</h1><p>2026-11-06 · '+count+'/99개 파일 배치. 그림 91개(기존 기본 초상 재사용 5개·아이콘 크기 변환 2개 포함), 직접 작곡·합성한 음원 8개.</p><p>체크 무늬는 투명 배경 검토용이며 PNG에 포함되지 않습니다. 음원은 재생 버튼을 눌러야 재생됩니다. 게임 UI 연결·공개 배포는 별도입니다.</p><nav>'+Object.entries(names).map(([id,n])=>'<a href="#'+id+'">'+n+'</a>').join('')+'</nav></header>'+sections.join('')+'</html>');
console.log('Updated gallery: '+count+'/99 files currently exist.');
