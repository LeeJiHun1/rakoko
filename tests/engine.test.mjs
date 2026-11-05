import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newGame,dispatch,unmet,skill,addDays,nextMilestone,yearsPlayed,finaleLocks,projectProgressLocks,validateSave,DEADLINE} from '../src/engine.js';
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
    const selected=prefer?.(s,choices)||choices.find(c=>!c.postpone&&c.id!=='later')||choices[0];
    s=act(s,'choose',{id:selected.id});
  }return s;
}
function next(s,days=7){if(s.phase==='ending')s=act(s,'deferEnding');assert.equal(s.phase,'wrap');return act(s,'date',{date:addDays(s.date,days)});}
test('initial date, resources and no mutation',()=>{let s=newGame(10),before=copy(s);const n=act(s,'start');assert.deepEqual(s,before);assert.equal(n.date,'2026-01-18');assert.equal(n.cash,3000000);assert.equal(n.phase,'event');});
test('broadcast income snapshots pre-growth stats and settles once',()=>{let s=finish(newGame(20));assert.equal(s.cash,3270000);assert.equal(s.journal.length,1);assert.equal(s.ledger.length,1);assert.equal(s.journal[0].income.gross,300000);assert.throws(()=>act(s,'advance'));});
test('same command is idempotent',()=>{let s=newGame(30),c={type:'prepare',action:'data',commandId:'same'};s=dispatch(s,c,catalog);const n=dispatch(s,c,catalog);assert.equal(n,s);assert.equal(n.preparations,1);assert.equal(n.stats.planning,17);});
test('saved RNG reproduces same choices and reactions',()=>{let s=act(newGame(40),'start'),c={type:'choose',id:available(s)[0].id,commandId:'persisted'};assert.deepEqual(dispatch(s,c,catalog),dispatch(copy(s),c,catalog));});
test('positive gains capped per stat per broadcast',()=>{let s=newGame(50);s=act(s,'prepare',{action:'data'});s=act(s,'prepare',{action:'data'});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'S'});s=finish(s);assert(s.stats.planning<=21);assert(Object.values(s.gainTotals).every(x=>x<=6));});
test('cash insufficiency changes neither cash nor action nor progress',()=>{let s=newGame(60);s.cash=0;const before=copy(s);assert.throws(()=>act(s,'prepare',{action:'outfit'}));assert.deepEqual(s,before);assert.throws(()=>act(s,'purchase',{eventId:'ME-001',choiceId:'ME-001-C1'}));assert.equal(s.purchases.length,0);});
test('check does not stack and free views/equip do not charge',()=>{let s=newGame(70);s=act(s,'prepare',{action:'check'});assert.throws(()=>act(s,'prepare',{action:'check'}));let before={cash:s.cash,actions:s.preparations,stats:copy(s.stats),seed:s.seed};s=act(s,'equip',{outfitId:'base'});assert.deepEqual({cash:s.cash,actions:s.preparations,stats:s.stats,seed:s.seed},before);});
function unlockedOutfit(seed=80){let s=newGame(seed);for(let b=0;b<2;b++){
  s=act(s,'prepare',{action:'outfit'});s=act(s,'prepare',{action:'outfit'});
  s=finish(s,(s,c)=>s.event.kind==='leak'?c.find(x=>x.id==='hide'):undefined);s=next(s);
}assert.equal(s.outfitProgress.maid,100);assert(!s.wardrobe.maid);s=act(s,'reserveOutfit');s=finish(s);assert(s.wardrobe.maid);assert.equal(s.equipped,'maid');return next(s);}
test('outfit preparation, reserved reveal and free equip',()=>{let s=unlockedOutfit();const before=s.cash,actions=s.preparations;s=act(s,'equip',{outfitId:'base'});assert.equal(s.cash,before);assert.equal(s.preparations,actions);assert.deepEqual(s.plan,['T','G','F']);});
test('partial leak is not reveal, risky response can reveal early and is stable',()=>{let partial=false,early=false;for(let seed=1;seed<500&&!early;seed++){
  let s=newGame(seed);s=act(s,'prepare',{action:'outfit'});s=act(s,'prepare',{action:'outfit'});s=act(s,'start');
  if(s.event.kind!=='leak')continue;partial=true;const hidden=act(s,'choose',{id:'hide'});assert(!hidden.wardrobe.maid);
  const c={type:'choose',id:'risky',commandId:'risk'};const n=dispatch(s,c,catalog);assert.deepEqual(n,dispatch(copy(s),c,catalog));if(n.wardrobe.maid){early=true;assert.equal(n.outfitProgress.maid,50);}
}assert(partial&&early);});
test('date skips preserve economy and stats and stop at celebrations',()=>{let s=newGame(90),cash=s.cash,stats=copy(s.stats);s=act(s,'date',{date:'2027-01-18'});assert.equal(s.date,'2026-09-10');assert.equal(s.cash,cash);assert.deepEqual(s.stats,stats);s=act(s,'date',{date:'2027-01-18'});assert.equal(s.date,'2027-01-18');assert.equal(yearsPlayed(s),1);s=act(s,'start');assert.equal(s.event.kind,'calendar');});
test('ten-year deadline: no stat or cash gate; spouse persisted; no continuing',()=>{let s=newGame(100);s.cash=0;s=act(s,'date',{date:'2040-01-01'});assert.equal(s.date,DEADLINE);assert.equal(s.phase,'credits');assert(s.lastEnding.spouse>=1&&s.lastEnding.spouse<=8);assert.equal(s.cash,0);assert.throws(()=>act(s,'continue'));assert.equal(validateSave(copy(s),catalog).lastEnding.spouse,s.lastEnding.spouse);});
test('wrong game does not satisfy bound experience',()=>{let s=newGame(110);s.experienceCountsByGame={puzzle:{'EX-003':1}};s.stats.operation=100;s.gameSkillById.action=100;const req=[{path:'experienceCountsByGame.$game.EX-003',op:'gte',value:1}];assert.equal(unmet(s,req,catalog,'action').length,1);assert.equal(unmet(s,req,catalog,'puzzle').length,0);});
test('project needs distinct broadcasts, actual pilot and review',()=>{let s=newGame(120);s=act(s,'project',{id:'END-001'});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'S'});s=finish(s);assert.equal(s.project.step,1);assert(!s.experienceCounts['EX-001']);s=next(s);s=finish(s);assert.equal(s.project.step,2);s=next(s);s=finish(s);assert.equal(s.experienceCounts['EX-001'],1);assert.equal(s.project.log.length,3);});
test('project pause and resume preserve only its own progress',()=>{let s=newGame(130);s=act(s,'project',{id:'END-001'});const id=s.project.instanceId;s=act(s,'pauseProject');assert.equal(s.project,null);s=act(s,'resumeProject',{id});assert.equal(s.project.id,'END-001');assert.equal(s.project.step,0);assert.equal(s.story.endingProject.eventId,'EF-001');});
test('paid orders do not grant experience and delivery needs completed broadcasts',()=>{let s=newGame(140);const e=catalog.moneyEvents.find(e=>e.choices[0].effects.some(x=>x.op==='purchase.record'&&x.deliveryAfterBroadcasts>0));const c=e.choices[0];s.cash=100000000;s=act(s,'purchase',{eventId:e.id,choiceId:c.id});assert.equal(s.purchases[0].status,'pending');assert.equal(s.experienceRecords.length,0);const delivered=s.purchases[0].dueBroadcast;s=act(s,'date',{date:'2026-02-01'});assert.equal(s.purchases[0].status,'pending');for(let i=0;i<delivered;i++){s=finish(s);if(i<delivered-1)s=next(s);}assert.equal(s.purchases[0].status,'delivered');assert.throws(()=>act(next(s),'purchase',{eventId:e.id,choiceId:c.id}));});
for(const m of catalog.modules)test(`novice path completes ${m.id} without fake victory`,()=>{let s=newGame(150);s=act(s,'joinModule',{id:m.id});s=act(s,'game',{gameId:m.gameId});for(let i=0;i<3;i++)s=act(s,'plan',{index:i,corner:'G'});for(let i=0;i<5;i++){s=finish(s,(s,c)=>s.event.kind==='module'?c.find(x=>x.id.endsWith('-C3')):undefined);if(i<4)s=next(s);}assert.equal(s.module,null);assert.equal(s.moduleArchive.length,1);assert.equal(s.moduleArchive[0].participation,5);assert.equal(s.moduleArchive[0].prizeAwarded,undefined);assert.equal(s.phase,'wrap');});
test('invalid imports are rejected without evaluation',()=>{for(const change of [s=>s.cash=-1,s=>s.stats.planning=101,s=>s.plan=['T'],s=>s.seed=-1,s=>delete s.commands]){const s=newGame(160);change(s);assert.throws(()=>validateSave(s,catalog));}let s=finish(newGame(170));s.journal[0].events[0].title='<script>not executed</script>';assert.equal(validateSave(copy(s),catalog).journal[0].events[0].title,'<script>not executed</script>');});
test('shared save cannot smuggle markup into numeric/record fields',()=>{const base=finish(newGame(171));const attacks=[s=>{s.projectArchive=[{id:'END-001',paused:true,instanceId:'x',step:'<img src=x onerror=alert(1)>',log:[]}];},s=>{s.journal[0].id='<img src=x onerror=alert(2)>';},s=>{s.journal[0].date='<b>';},s=>{s.module={id:'LC-PT',name:'m',phase:'working',deadline:'<i>',participation:1};},s=>{s.lastEnding={id:'E',title:'t',projectLog:[{date:'<svg>',text:'x'}]};},s=>{s.purchases=[{id:'o',choice:'c',cost:1,dueBroadcast:'<x>',status:'pending'}];}];for(const attack of attacks){const s=copy(base);attack(s);assert.throws(()=>validateSave(s,catalog));}});

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
      if(s.project.step===3&&!unmet(s,def.requirements,catalog).length&&yearsPlayed(s)<1)target='2027-01-18';
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
      return choices.slice().sort((a,b)=>{
        const score=c=>Object.entries(c.gain||{}).reduce((v,[k,n])=>v+n*Math.max(0,(wanted[k]||0)-(k==='gameSkill'?game():s.stats[k])),0);
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
