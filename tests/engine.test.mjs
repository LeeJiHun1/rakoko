import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newGame,dispatch,unmet,skill,addDays,nextMilestone,yearsPlayed,firstEndingDate,endingUnlocked,finaleLocks,projectProgressLocks,validateSave,migrateSave,loadSave,DEADLINE,STYLES,prepBonus} from '../src/engine.js';
import {assignStyles,rollGrade,scaleGains,oddsFor} from '../src/engine/outcome.js';
import {broadcastGrade,GRADE_INCOME} from '../src/engine/audience.js';
import {offerWeight,priceTier,unlockedTier} from '../src/engine/purchases.js';
const catalog=JSON.parse(await readFile(new URL('../src/data/catalog.json',import.meta.url),'utf8'));
let serial=0,passed=0,failed=0;
const copy=x=>JSON.parse(JSON.stringify(x));
const act=(s,type,params={})=>dispatch(s,{...params,type,commandId:`test:${++serial}`},catalog);
function test(name,fn){try{fn();passed++;console.log(`PASS ${name}`);}catch(e){failed++;console.error(`FAIL ${name}\n${e.stack}`);}}
function available(s){return s.event.choices.filter(c=>!unmet(s,c.requirements||c.eligibility?.all||[],catalog,s.event.kind==='module'?s.module?.gameId:undefined).length&&(s.event.kind!=='project'||c.postpone||!projectProgressLocks(s,catalog).length));}
function finish(s,prefer){
  if(s.phase==='prep')s=act(s,'start');let guard=0;
  while(['event','result'].includes(s.phase)){
    assert(++guard<20,'broadcast did not terminate');
    if(s.phase==='result'){s=act(s,'advance');continue;}
    const choices=available(s);assert(choices.length,`No valid choice in ${s.event.kind} ${s.event.title}`);
    const selected=prefer?.(s,choices)||(s.event.kind==='shop'?choices.find(c=>c.id==='skip'):s.event.kind==='outfitOffer'?choices.find(c=>c.id==='later'):null)||choices.find(c=>!c.postpone&&c.id!=='later')||choices[0];
    s=act(s,'choose',{id:selected.id});
  }return s;
}
function next(s,days=7){if(s.phase==='ending')s=act(s,'deferEnding');assert.equal(s.phase,'wrap');return act(s,'date',{date:addDays(s.date,days)});}
test('initial date, resources and no mutation',()=>{let s=newGame(10),before=copy(s);const n=act(s,'start');assert.deepEqual(s,before);assert.equal(n.date,'2026-01-18');assert.equal(n.cash,3000000);assert.equal(n.phase,'event');});
test('broadcast income snapshots pre-growth stats and settles once',()=>{let s=finish(newGame(20));const j=s.journal[0];assert.equal(s.cash,3000000+j.income.net+j.donations);assert.equal(s.journal.length,1);assert.equal(s.ledger.filter(x=>x.id.startsWith('income:')).length,1);assert.equal(j.income.gross,Math.round(300000*GRADE_INCOME[j.grade]));assert.equal(j.events.length,3);assert.throws(()=>act(s,'advance'));});
test('same command is idempotent',()=>{let s=newGame(30),c={type:'prepare',action:'data',commandId:'same'};s=dispatch(s,c,catalog);const n=dispatch(s,c,catalog);assert.equal(n,s);assert.equal(n.preparations,1);assert.equal(n.stats.planning,17);});
test('saved RNG reproduces same choices and reactions',()=>{let s=act(newGame(40),'start'),c={type:'choose',id:available(s)[0].id,commandId:'persisted'};assert.deepEqual(dispatch(s,c,catalog),dispatch(copy(s),c,catalog));});
test('positive gains capped per stat per broadcast',()=>{let s=newGame(50);s=act(s,'prepare',{action:'data'});s=act(s,'prepare',{action:'data'});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'S'});s=finish(s);assert(s.stats.planning<=21);assert(Object.values(s.gainTotals).every(x=>x<=6));});
test('cash insufficiency changes neither cash nor action nor progress',()=>{let s=newGame(60);s.cash=0;const before=copy(s);assert.throws(()=>act(s,'prepare',{action:'outfit'}));assert.deepEqual(s,before);assert.throws(()=>act(s,'purchase',{eventId:'ME-001',choiceId:'ME-001-C1'}));assert.equal(s.purchases.length,0);});
test('check does not stack and free views/equip do not charge',()=>{let s=newGame(70);s=act(s,'prepare',{action:'check'});assert.throws(()=>act(s,'prepare',{action:'check'}));let before={cash:s.cash,actions:s.preparations,stats:copy(s.stats),seed:s.seed};s=act(s,'equip',{outfitId:'base'});assert.deepEqual({cash:s.cash,actions:s.preparations,stats:s.stats,seed:s.seed},before);});
// 실제 흐름으로 새 옷 한 벌 공개: 방송 중 제안 이벤트에서 시작 → 준비 행동으로 100% → 공개 예약 → 공개
function unlockedOutfit(seed=80){let s=newGame(seed);let guard=0;
  while(Object.keys(s.wardrobe).length<2){assert(++guard<80,'새 의상 제안·공개까지 가지 못함');
    if(s.outfitStarted[s.crafting]&&!s.wardrobe[s.crafting]){while(s.preparations&&s.outfitProgress[s.crafting]<100)s=act(s,'prepare',{action:'outfit'});if(s.outfitProgress[s.crafting]>=100&&!s.outfitReserved)s=act(s,'reserveOutfit');}
    s=finish(s,(s,c)=>s.event.kind==='outfitOffer'?c.find(x=>x.id==='start'):s.event.kind==='leak'?c.find(x=>x.id==='hide'):undefined);
    if(Object.keys(s.wardrobe).length<2)s=next(s);
  }
  assert.equal(s.outfitProgress[s.crafting],100);return next(s);}
test('outfit offer starts preparation, reveal unlocks without auto-equip, equip is free',()=>{let s=unlockedOutfit();const id=Object.keys(s.wardrobe).find(x=>x!=='base');assert.equal(s.equipped,'base');assert(s.outfitStarted[id]);const before=s.cash,actions=s.preparations;s=act(s,'equip',{outfitId:id});assert.equal(s.equipped,id);assert.equal(s.cash,before);assert.equal(s.preparations,actions);assert.deepEqual(s.plan,['T','G','F']);});
test('outfit preparation needs an accepted offer; starting costs the first preparation fee',()=>{let s=newGame(81);assert.throws(()=>act(s,'prepare',{action:'outfit'}),/제안/);assert.throws(()=>act(s,'craftAndPrepare',{outfitId:'maid'}),/제안/);let found=false;for(let b=0;b<40&&!found;b++){s=act(s,'start');while(['event','result'].includes(s.phase)){if(s.phase==='result'){s=act(s,'advance');continue;}if(s.event.kind==='outfitOffer'){const cash=s.cash,id=s.event.outfitId,slot=s.slot;s=act(s,'choose',{id:'start'});assert.equal(s.cash,cash-500000);assert.equal(s.outfitProgress[id],25);assert.equal(s.crafting,id);assert.equal(s.slot,slot);assert.equal(s.currentLog.length,slot);found=true;continue;}s=act(s,'choose',{id:available(s)[0].id});}s=next(s);}assert(found,'새 의상 제안을 만나지 못함');s=act(s,'prepare',{action:'outfit'});assert.equal(s.outfitProgress[s.crafting],50);});
test('leak happens at most once per outfit; hide keeps it locked; reveal-now and failed recovery reveal early',()=>{let partial=false,early=false,now=false;for(let seed=1;seed<500&&!(early&&now);seed++){
  let s=newGame(seed);s.outfitStarted={maid:true};s=act(s,'prepare',{action:'outfit'});s=act(s,'prepare',{action:'outfit'});s=act(s,'start');
  if(s.event.kind==='leak'&&s.event.outfitId!=='maid')continue;if(s.event.kind!=='leak')continue;partial=true;assert(s.event.choices.some(c=>c.id==='now'));
  const hidden=act(s,'choose',{id:'hide'});assert(!hidden.wardrobe.maid);assert.equal(hidden.leaked.maid,'hide');
  const n=act(s,'choose',{id:'now'});assert(n.wardrobe.maid);assert.equal(n.equipped,'base');assert.equal(n.result.unlockedOutfit,'maid');now=true;
  const c={type:'choose',id:'risky',commandId:'risk'};const r=dispatch(s,c,catalog);assert.deepEqual(r,dispatch(copy(s),c,catalog));if(r.wardrobe.maid){early=true;assert.equal(r.outfitProgress.maid,50);}
  let h=hidden;for(let b=0;b<12;b++){while(['event','result'].includes(h.phase)){if(h.phase==='result'){h=act(h,'advance');continue;}assert.notEqual(h.event.kind,'leak','같은 의상 재유출');h=act(h,'choose',{id:available(h)[0].id});}h=next(h);h=act(h,'start');}
}assert(partial&&early&&now);});
test('early reveal turns the scheduled reveal corner into a follow-up corner',()=>{let s=newGame(3);s.outfitStarted={maid:true};s.outfitProgress.maid=100;s.outfitReserved=true;s=act(s,'start');assert.equal(s.reservations[2],'outfit');while(s.slot<1||s.phase!=='event'){if(s.phase==='result')s=act(s,'advance');else s=act(s,'choose',{id:available(s)[0].id});}s.event={id:'x',kind:'leak',title:'t',body:'b',outfitId:'maid',choices:[{id:'now',text:'지금',outcome:'o',requirements:[]}]};s=act(s,'choose',{id:'now'});assert(s.wardrobe.maid);assert.equal(s.reservations[2],'outfitFollowup');while(s.slot<2||s.phase!=='event')s=s.phase==='result'?act(s,'advance'):act(s,'choose',{id:available(s)[0].id});assert.equal(s.event.kind,'outfitFollowup');s=act(s,'choose',{id:'vote'});assert.equal(s.outfitFollowup,null);});
test('date skips preserve economy and stats and stop at celebrations',()=>{let s=newGame(90),cash=s.cash,stats=copy(s.stats);s=act(s,'date',{date:'2027-01-18'});assert.equal(s.date,'2026-09-10');assert.equal(s.cash,cash);assert.deepEqual(s.stats,stats);s=act(s,'date',{date:'2027-01-18'});assert.equal(s.date,'2027-01-18');assert.equal(yearsPlayed(s),1);s=act(s,'start');assert.equal(s.event.kind,'calendar');});
test('ten-year deadline: no stat or cash gate; spouse persisted; no continuing',()=>{let s=newGame(100);s.cash=0;s=act(s,'date',{date:'2040-01-01'});assert.equal(s.date,DEADLINE);assert.equal(s.phase,'credits');assert(s.lastEnding.spouse>=1&&s.lastEnding.spouse<=8);assert.equal(s.cash,0);assert.throws(()=>act(s,'continue'));assert.equal(validateSave(copy(s),catalog).lastEnding.spouse,s.lastEnding.spouse);});
test('wrong game does not satisfy bound experience',()=>{let s=newGame(110);s.experienceCountsByGame={puzzle:{'EX-003':1}};s.stats.operation=100;s.gameSkillById.action=100;const req=[{path:'experienceCountsByGame.$game.EX-003',op:'gte',value:1}];assert.equal(unmet(s,req,catalog,'action').length,1);assert.equal(unmet(s,req,catalog,'puzzle').length,0);});
test('project needs distinct broadcasts, actual pilot and review',()=>{let s=newGame(120);s=act(s,'project',{id:'END-001'});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'S'});s=finish(s);assert.equal(s.project.step,1);assert(!s.experienceCounts['EX-001']);s=next(s);s=finish(s);assert.equal(s.project.step,2);s=next(s);s=finish(s);assert.equal(s.experienceCounts['EX-001'],1);assert.equal(s.project.log.length,3);});
test('project pause and resume preserve only its own progress',()=>{let s=newGame(130);s=act(s,'project',{id:'END-001'});const id=s.project.instanceId;s=act(s,'pauseProject');assert.equal(s.project,null);s=act(s,'resumeProject',{id});assert.equal(s.project.id,'END-001');assert.equal(s.project.step,0);assert.equal(s.story.endingProject.eventId,'EF-001');});
test('paid orders do not grant experience and delivery needs completed broadcasts',()=>{let s=newGame(140);const e=catalog.moneyEvents.find(e=>e.choices[0].effects.some(x=>x.op==='purchase.record'&&x.deliveryAfterBroadcasts>0));const c=e.choices[0];s.cash=100000000;s=act(s,'purchase',{eventId:e.id,choiceId:c.id});assert.equal(s.purchases[0].status,'pending');assert.equal(s.experienceRecords.length,0);const delivered=s.purchases[0].dueBroadcast;s=act(s,'date',{date:'2026-02-01'});assert.equal(s.purchases[0].status,'pending');for(let i=0;i<delivered;i++){s=finish(s);if(i<delivered-1)s=next(s);}assert.equal(s.purchases[0].status,'delivered');assert.throws(()=>act(next(s),'purchase',{eventId:e.id,choiceId:c.id}));});
for(const m of catalog.modules)test(`novice path completes ${m.id} without fake victory`,()=>{let s=newGame(150);s=act(s,'joinModule',{id:m.id});s=act(s,'game',{gameId:m.gameId});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'G'});for(let i=0;i<5;i++){s=finish(s,(s,c)=>s.event.kind==='module'?c.find(x=>x.id.endsWith('-C3')):undefined);if(i<4)s=next(s);}assert.equal(s.module,null);assert.equal(s.moduleArchive.length,1);assert.equal(s.moduleArchive[0].participation,5);assert.equal(s.moduleArchive[0].prizeAwarded,undefined);assert.equal(s.phase,'wrap');});
test('invalid imports are rejected without evaluation',()=>{for(const change of [s=>s.cash=-1,s=>s.stats.planning=101,s=>s.plan=['T'],s=>s.seed=-1,s=>delete s.commands]){const s=newGame(160);change(s);assert.throws(()=>validateSave(s,catalog));}let s=finish(newGame(170));s.journal[0].events[0].title='<script>not executed</script>';assert.equal(validateSave(copy(s),catalog).journal[0].events[0].title,'<script>not executed</script>');});
test('shared save cannot smuggle markup into numeric/record fields',()=>{const base=finish(newGame(171));const attacks=[s=>{s.projectArchive=[{id:'END-001',paused:true,instanceId:'x',step:'<img src=x onerror=alert(1)>',log:[]}];},s=>{s.journal[0].id='<img src=x onerror=alert(2)>';},s=>{s.journal[0].date='<b>';},s=>{s.module={id:'LC-PT',name:'m',phase:'working',deadline:'<i>',participation:1};},s=>{s.lastEnding={id:'E',title:'t',projectLog:[{date:'<svg>',text:'x'}]};},s=>{s.purchases=[{id:'o',choice:'c',cost:1,dueBroadcast:'<x>',status:'pending'}];}];for(const attack of attacks){const s=copy(base);attack(s);assert.throws(()=>validateSave(s,catalog));}});

test('save migration upgrades old schema and rejects newer schema with a clear message',()=>{const s=newGame(180);assert.equal(migrateSave(s),s);assert.equal(loadSave(copy(s),catalog).runId,s.runId);const future={...copy(s),schemaVersion:99};assert.throws(()=>loadSave(future,catalog),/더 새로운 버전/);const old={...copy(s),schemaVersion:0};const up=migrateSave(old,{0:x=>({...x,schemaVersion:1,migrated:true})});assert.equal(up.schemaVersion,1);assert(up.migrated);assert.equal(old.migrated,undefined);});

test('repeated event keeps its original situation text and adds a recall line',()=>{let s=newGame(5),seen=0;for(let b=0;b<40&&!seen;b++){s=act(s,'start');while(['event','result'].includes(s.phase)){if(s.phase==='result'){s=act(s,'advance');continue;}if(s.event.kind==='general'&&s.familyMemory[s.event.family]){const def=catalog.events.find(e=>e.id===s.event.definitionId);assert(s.event.body.startsWith(def.body));assert(s.event.body.includes(`‘${s.familyMemory[s.event.family].choice}’`));seen++;}s=act(s,'choose',{id:available(s)[0].id});}s=next(s);}assert(seen>0,'반복 사건을 만나지 못함');});

test('every event mixes choice styles deterministically',()=>{for(const e of catalog.events){const a=assignStyles(e.id,copy(e.choices)),b=assignStyles(e.id,copy(e.choices));assert.deepEqual(a.map(c=>c.style),b.map(c=>c.style));assert(a.every(c=>Object.hasOwn(STYLES,c.style)));if(a.length>1)assert(new Set(a.map(c=>c.style)).size>1,e.id);}});
test('safe never misses and consumes no randomness; bold can boom or miss',()=>{const s={seed:1};assert.equal(rollGrade(s,'safe',0),'success');assert.equal(s.seed,1);const seen={great:0,success:0,miss:0};for(let i=0;i<2000;i++)seen[rollGrade(s,'bold',0)]++;assert(seen.great>500&&seen.miss>600&&seen.success>300,JSON.stringify(seen));assert.deepEqual(scaleGains({planning:2},'miss','bold'),{});assert.deepEqual(scaleGains({planning:1,awareness:1},'great','bold'),{planning:3,awareness:3});assert(oddsFor('bold',prepBonus({checked:true,dataPrepared:2})).miss<STYLES.bold.miss);});
test('styled choice result records grade and miss grants no choice growth',()=>{let found=false;for(let seed=1;seed<400&&!found;seed++){let s=act(newGame(seed),'start');if(s.event.kind!=='general')continue;const c=s.event.choices.find(c=>c.style==='bold'&&!unmet(s,c.requirements,catalog).length);if(!c)continue;const n=act(s,'choose',{id:c.id});assert(['great','success','miss'].includes(n.result.grade));if(n.result.grade==='miss'){found=true;const corner={T:'community',G:'gameSkill',F:'community',S:'planning'}[s.plan[0]];for(const k of Object.keys(c.gain))if(k!==corner)assert.equal(n.stats[k]??0,s.stats[k]??0);}}assert(found,'모험 선택의 아쉬움 결과를 찾지 못함');});

test('broadcast grade, viewers, records and journal fields',()=>{assert.equal(broadcastGrade([{grade:'great'},{grade:'great'},{}]),'S');assert.equal(broadcastGrade([{grade:'great'},{},{}]),'A');assert.equal(broadcastGrade([{},{},{}]),'B');assert.equal(broadcastGrade([{grade:'miss'},{grade:'miss'},{}]),'C');let s=finish(newGame(190));const j=s.journal[0];assert(['S','A','B','C'].includes(j.grade));assert(j.viewers>0);assert.equal(s.records.bestViewers,j.viewers);assert.equal(s.records.bestGross,j.income.gross);assert(s.result.newRecords.includes('viewers'));});
test('virtual donations only come from played corners and are recorded',()=>{let hit=null;for(let seed=1;seed<300&&!hit;seed++){let s=newGame(seed);for(let b=0;b<3&&!hit;b++){const before=s.cash;s=finish(s);const d=s.journal.at(-1).donations;if(d>0){hit={s,d};assert.equal(s.records.donationTotal>=d,true);assert(s.ledger.some(x=>x.id.startsWith('donation:')));}s=next(s);}}assert(hit,'응원 이벤트를 찾지 못함');let s=newGame(7);const cash=s.cash;s=act(s,'date',{date:'2026-08-01'});assert.equal(s.cash,cash);assert.equal(s.records.donations,0);});
test('schema 1 saves migrate to 3 with records restored from journal',()=>{let s=finish(newGame(195));const v1=copy(s);v1.schemaVersion=1;delete v1.records;delete v1.outfitStarted;delete v1.outfitFollowup;const up=loadSave(v1,catalog);assert.equal(up.schemaVersion,3);assert.deepEqual(up.outfitStarted,{});assert.equal(up.records.bestGross,s.journal[0].income.gross);assert.equal(up.records.donations,0);});

test('purchases appear as broadcast interludes, never consume a corner, and pricier items come later',()=>{const early={completedBroadcasts:0},late={completedBroadcasts:30};const tiers=catalog.moneyEvents.map(e=>[e,priceTier(e)]);assert.equal(unlockedTier(early),0);assert.equal(unlockedTier(late),3);for(const [e,t] of tiers){if(t>=2)assert.equal(offerWeight(early,e),0,e.id);if(t===3)assert(offerWeight(late,e)>offerWeight(late,tiers.find(([,x])=>x===0)[0]));}let found=null;for(let seed=1;seed<200&&!found;seed++){let s=act(newGame(seed),'start');let guard=0;while(['event','result'].includes(s.phase)&&guard++<20){if(s.phase==='result'){s=act(s,'advance');continue;}if(s.event.kind==='shop'){const buy=s.event.choices.find(c=>c.purchase&&!unmet(s,c.requirements,catalog).length);const slot=s.slot,cash=s.cash;s=act(s,'choose',{id:buy.id});assert.equal(s.slot,slot);assert(s.cash<cash);assert.equal(s.currentLog.length,slot);assert(s.purchases.at(-1).effects.length);s=act(s,'advance');assert.equal(s.slot,slot);assert.notEqual(s.event.kind,'shop');found=s;continue;}s=act(s,'choose',{id:available(s)[0].id});}if(found){while(['event','result'].includes(found.phase)){if(found.phase==='result'){found=act(found,'advance');continue;}found=act(found,'choose',{id:available(found)[0].id});}assert.equal(found.journal[0].events.length,3);}}assert(found,'구매 막간을 찾지 못함');});

test('first ending opens at day 150 instead of the first anniversary',()=>{assert.equal(firstEndingDate(),'2026-06-17');let s=newGame(200);s=act(s,'project',{id:'END-001'});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'S'});for(let b=0;b<3;b++){s=finish(s);s=next(s);}assert.equal(s.project.step,3);assert(finaleLocks(s,catalog).some(x=>x.includes('150일째')));s=act(s,'date',{date:'2026-06-17'});const locks=finaleLocks(s,catalog);assert(!locks.some(x=>x.includes('150일째')),locks.join());});

test('each preparation helps different corners',()=>{const s={checked:false,dataPrepared:2,practicedToday:0,plan:['T','G','F'],slot:0};assert.equal(prepBonus(s,0,'T').toFixed(2),'0.10');assert.equal(prepBonus(s,0,'G'),0);const g={...s,dataPrepared:0,practicedToday:1};assert.equal(prepBonus(g,0,'G').toFixed(2),'0.10');assert.equal(prepBonus(g,0,'F'),0);assert.equal(prepBonus({...g,checked:true},0,'F').toFixed(2),'0.06');let n=act(newGame(5),'prepare',{action:'practice'});assert.equal(n.practicedToday,1);n=finish(n);n=next(n);assert.equal(n.practicedToday,0);});

test('shared save cannot smuggle markup through slot, result, outfit progress, extra stats or prototype keys',()=>{let s=finish(newGame(210));s=next(s);s=act(s,'start');while(s.phase!=='result')s=act(s,'choose',{id:available(s)[0].id});const attacks=[x=>{x.slot='<img src=x onerror=1>';},x=>{x.result.changes={planning:'<img>'};},x=>{x.result.changes={'<b>':1};},x=>{x.outfitProgress.maid='<img>';},x=>{x.outfitProgress.evil=1;},x=>{x.stats.x='0;background:url(https://e)';},x=>{x.gameId='__proto__';},x=>{x.project={...(x.project||{id:'END-001',instanceId:'a',step:0,log:[]}),gameId:'__proto__'};},x=>{x.scaleIndex=999;},x=>{x.equipped='ghost';},x=>{x.result.reactions=[{speaker:1,text:2}];},x=>{x.reservations={0:'<x>'};},x=>{x.date='9999-12-31';}];for(const attack of attacks){const v=copy(s);attack(v);assert.throws(()=>validateSave(v,catalog),undefined,attack.toString());}assert.equal(validateSave(copy(s),catalog).phase,'result');const w=copy(finish(newGame(211)));w.journal=[];assert.throws(()=>validateSave(w,catalog));});
test('prototype keys never reach Object.prototype through experience counts',()=>{const s=newGame(212);s.experienceCountsByGame={};s.project={id:'END-003',gameId:'__proto__',instanceId:'x'};const before=Object.prototype['EX-003'];try{unmet(s,[{path:'experienceCountsByGame.$game.EX-003',op:'gte',value:1}],catalog,'__proto__');}finally{assert.equal(Object.prototype['EX-003'],before);}});

// Real reachability witnesses: never inject stats, story flags or experiences.
function witness(def,seed){
  let s=def.requiresOutfit?unlockedOutfit(seed):newGame(seed);
  if(def.eventId==='EF-011'){
    s=act(s,'date',{date:'2026-09-10'});s=finish(s);s=next(s,1);
  }
  s=act(s,'project',{id:def.id});
  const wanted={};for(const r of def.requirements)if(r.path.startsWith('stats.'))wanted[r.path.includes('gameSkill')?'gameSkill':r.path.split('.')[1]]=r.value;
  for(let round=0;round<280;round++){
    if(s.phase==='credits')return s;
    if(s.phase==='ending'){
      const c=s.event.choices.find(x=>x.endingId===def.id);
      if(c&&!unmet(s,c.eligibility.all,catalog).length)return act(s,'ending',{id:c.id});
      s=act(s,'deferEnding');
    }
    if(s.phase==='wrap'){
      let target=addDays(s.date,1);
      if(s.project.step===3&&!unmet(s,def.requirements,catalog).length&&!endingUnlocked(s))target=firstEndingDate();
      if(s.deferUntil&&s.date<s.deferUntil)target=s.deferUntil;
      s=act(s,'date',{date:target});
    }
    assert.equal(s.phase,'prep');
    const game=()=>skill(s,s.project.gameId);
    s=act(s,'game',{gameId:s.project.gameId});
    if(s.preparations>0&&!s.checked)s=act(s,'prepare',{action:'check'});
    while(s.preparations){
      const needGame=(wanted.gameSkill||0)>game()||(def.boundGame&&!s.project.practiced);
      s=act(s,'prepare',{action:needGame?'practice':'data'});
    }
    const plan=['T','G','F'];
    if((wanted.community||0)>s.stats.community)plan[0]='F';
    if((wanted.gameSkill||0)>game())plan[1]='G';
    if(s.project.step<3)plan[1]='S';
    for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:plan[i]});
    if(!finaleLocks(s,catalog).length)s=act(s,'finale');
    s=finish(s,(s,choices)=>{
      if(s.event.kind==='project')return choices.find(c=>!c.postpone);
      if(s.event.kind==='leak')return choices.find(c=>c.id==='hide');
      if(s.event.kind==='shop')return choices.find(c=>c.id==='skip');
      if(s.event.kind==='outfitOffer')return choices.find(c=>c.id==='later');
      return choices.slice().sort((a,b)=>{
        const score=c=>Object.entries(c.gain||{}).reduce((v,[k,n])=>v+n*Math.max(0,(wanted[k]||0)-(k==='gameSkill'?game():s.stats[k])),0)*(c.style?(oddsFor(c.style,prepBonus(s)).great*STYLES[c.style].greatScale+(1-oddsFor(c.style,prepBonus(s)).great-oddsFor(c.style,prepBonus(s)).miss)):1);
        return score(b)-score(a);
      })[0];
    });
  }
  throw Error(`Witness stalled ${def.id}: date ${s.date}, step ${s.project?.step}, stats ${JSON.stringify(s.stats)}, skill ${skill(s)}, locks ${finaleLocks(s,catalog)}`);
}
const witnesses=[];
for(const [i,def]of catalog.projects.entries())test(`new-run reachability ${def.id}`,()=>{const s=witness(def,1000+i);assert.equal(s.lastEnding.id,def.id);assert(s.journal.length>=3);assert(s.experienceCounts[def.experienceId]>=1);const n=act(s,'continue');assert.equal(n.phase,'wrap');assert.equal(n.cash,s.cash);assert.equal(n.equipped,s.equipped);assert(n.endingSeenEver);validateSave(copy(s),catalog);validateSave(copy(n),catalog);const later=act(n,'date',{date:'2037-01-18'});assert.notEqual(later.phase,'credits');witnesses.push({endingId:def.id,broadcasts:s.completedBroadcasts,date:s.date,stats:s.stats,cash:s.cash});});
console.log(`\n${passed} passed, ${failed} failed. Reachability witnesses: ${witnesses.length}/32.`);
if(process.env.WRITE_TEST_REPORT==='1'){
  const {writeFile}=await import('node:fs/promises');await writeFile('docs/reachability-report.json',JSON.stringify({engineVersion:catalog.version,generatedAt:new Date().toISOString(),passed,failed,witnesses},null,2)+'\n');
}
process.exitCode=failed?1:0;
