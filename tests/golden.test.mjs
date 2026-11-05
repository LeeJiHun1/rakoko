// 동작 고정(골든) 테스트: 리팩터링이 게임 규칙을 바꾸지 않았는지 확인한다.
// 시드별로 거의 모든 명령을 섞어 장기 플레이를 돌리고, 방송마다 상태 해시를 비교한다.
// 규칙을 의도적으로 바꿨다면 `UPDATE_GOLDEN=1 npm test` 로 기준을 다시 만들고 커밋 메시지에 이유를 적는다.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {newGame,dispatch,unmet,projectProgressLocks,finaleLocks,addDays} from '../src/engine.js';

const FIXTURE=new URL('./fixtures/golden-runs.json',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('../src/data/catalog.json',import.meta.url),'utf8'));
const SEEDS=[1,7,42,99,2026,31337,555,8080];
const BROADCASTS=160;

function playerRng(seed){let x=seed*2654435761>>>0||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
const hash=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0,16);

function run(seed){
  const realNow=Date.now;Date.now=()=>1767225600000; // runId 고정
  let s;try{s=newGame(seed);}finally{Date.now=realNow;}
  const r=playerRng(seed),pick=a=>a[Math.floor(r()*a.length)];
  let serial=0;const trail=[];
  const act=(type,params={})=>{
    try{s=dispatch(s,{...params,type,commandId:`g:${seed}:${++serial}`},catalog);return true;}
    catch(e){trail.push(`${type}!${e.message}`);return false;}
  };
  const checkpoints=[];
  for(let b=0;b<BROADCASTS;b++){
    if(s.phase==='credits'){if(s.lastEnding?.forced)break;act('continue');}
    if(s.phase==='prep'){
      if(r()<.15)act('game',{gameId:pick(catalog.games).id});
      if(!s.module&&r()<.08)act('joinModule',{id:pick(catalog.modules).id});
      if(s.module&&r()<.05)act('practiceModule');
      if(s.module&&r()<.02)act('leaveModule');
      if((!s.project||s.project.step>=3)&&r()<.2)act('project',{id:pick(catalog.projects).id});
      if(s.project&&r()<.03)act('pauseProject');
      if(!s.project&&r()<.3){const p=s.projectArchive.find(x=>x.paused);if(p)act('resumeProject',{id:p.instanceId});}
      if(r()<.1)act('craft',{outfitId:pick(catalog.outfits).id});
      if(r()<.08){const e=pick(catalog.moneyEvents),c=pick(e.choices);act('purchase',{eventId:e.id,choiceId:c.id});}
      for(let i=0;i<3;i++)if(r()<.2)act('plan',{index:i,corner:pick(['T','G','F','S'])});
      while(s.preparations>0&&r()<.9)if(!act('prepare',{action:pick(['data','practice','check','outfit'])}))break;
      if(r()<.3)act('reserveOutfit');
      if(r()<.6&&!finaleLocks(s,catalog).length)act('finale');
      if(r()<.05)act('equip',{outfitId:pick(Object.keys(s.wardrobe))});
      act('start');
    }
    let guard=0;
    while(['event','result'].includes(s.phase)&&guard++<20){
      if(s.phase==='result'){act('advance');continue;}
      const e=s.event,ok=e.choices.filter(c=>!unmet(s,c.requirements||c.eligibility?.all||[],catalog,e.kind==='module'?s.module?.gameId:undefined).length&&(e.kind!=='project'||c.postpone||!projectProgressLocks(s,catalog).length));
      if(!ok.length){trail.push('stuck');break;}
      act('choose',{id:pick(ok).id});
    }
    if(s.phase==='ending'){
      const ok=s.event.choices.filter(c=>!unmet(s,c.eligibility.all,catalog).length);
      if(ok.length&&r()<.5)act('ending',{id:pick(ok).id});else act('deferEnding');
    }
    if(s.phase==='wrap'){
      if(r()<.3)act('representative',{index:Math.floor(r()*3)});
      act('date',{date:addDays(s.date,r()<.1?120+Math.floor(r()*200):1+Math.floor(r()*30))});
    }
    checkpoints.push(hash(s));
  }
  return {seed,checkpoints,trail:hash(trail),final:hash(s),broadcasts:s.completedBroadcasts,endings:s.reachedEndings.map(x=>x.id)};
}

const results=SEEDS.map(run);
if(process.env.UPDATE_GOLDEN==='1'){
  await writeFile(FIXTURE,JSON.stringify(results,null,1)+'\n');
  console.log(`golden 기준 갱신: ${results.length}개 시드`);
}else{
  const expected=JSON.parse(await readFile(FIXTURE,'utf8'));
  let failed=0;
  for(const [i,got]of results.entries()){
    const want=expected[i];
    try{
      assert.equal(got.seed,want.seed);
      const at=got.checkpoints.findIndex((h,j)=>h!==want.checkpoints[j]);
      assert.equal(at,-1,`seed ${got.seed}: ${at+1}번째 방송부터 상태가 달라졌어요`);
      assert.equal(got.checkpoints.length,want.checkpoints.length);
      assert.equal(got.trail,want.trail,`seed ${got.seed}: 거부된 명령·오류 문구가 달라졌어요`);
      console.log(`PASS golden seed ${got.seed} (${got.broadcasts}회 방송, 결말 ${got.endings.length})`);
    }catch(e){failed++;console.error(`FAIL ${e.message}`);}
  }
  if(failed)process.exitCode=1;
}
