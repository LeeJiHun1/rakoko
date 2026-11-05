// Pure state transitions. UI and storage never supply gameplay randomness.
import {CHAT_POOLS,chatContext} from './data/chat.js';
export const START_DATE='2026-01-18', DEADLINE='2036-01-18';
export const CORNERS={T:'잡담',G:'게임 도전',F:'팬 참여',S:'특별 기획'};
export const LABELS={awareness:'인지도',community:'단골 시청층',planning:'기획력',operation:'방송 운영력',gameSkill:'게임 숙련도'};
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
export const addDays=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
export const yearsPlayed=s=>Math.max(0,Number(s.date.slice(0,4))-2026-(s.date.slice(5)<'01-18'?1:0));
export function random(s){s.seed=(s.seed+0x6D2B79F5)>>>0;let t=s.seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
function setPath(obj,path,value){const keys=path.split('.');let cur=obj;for(const k of keys.slice(0,-1)){if(!cur[k]||typeof cur[k]!=='object')cur[k]={};cur=cur[k];}cur[keys.at(-1)]=value;}
export function newGame(seed=Date.now()>>>0){
  return {schemaVersion:1,contentVersion:'0.1.0',runId:`journal-${seed}-${Date.now().toString(36)}`,revision:0,seed:seed>>>0,
    date:START_DATE,phase:'prep',broadcastIndex:1,completedBroadcasts:0,preparations:2,checked:false,dataPrepared:0,
    stats:{awareness:10,community:20,planning:15,operation:20},gameSkillById:{puzzle:10},gameId:'puzzle',
    plan:['T','G','F'],slot:0,event:null,result:null,currentLog:[],gainTotals:{},
    cash:3000000,scaleIndex:0,incomeSnapshot:null,ledger:[],purchases:[],
    wardrobe:{base:true},outfitProgress:{ghost:0,maid:0,police:0,nun:0},equipped:'base',crafting:'maid',outfitReserved:false,
    finaleScheduled:false,reservations:{},leakChecked:false,leaked:{},
    seenOnce:[],familyLast:{},familyMemory:{},groupLast:{},gameHistory:{},
    promises:[],journal:[],celebrations:[],story:{},project:null,projectArchive:[],module:null,moduleArchive:[],
    experienceRecords:[],experienceCounts:{},experienceCountsByGame:{},
    reachedEndings:[],lastEnding:null,lastEndingCheck:null,deferUntil:null,endingSeenEver:false,commands:[]};
}
export const skill=(s,gameId=s.gameId)=>s.gameSkillById[gameId]??10;
function gain(s,key,amount,gameId=s.gameId){
  const ledgerKey=key==='gameSkill'?`game:${gameId}`:key;
  const add=Math.min(amount,Math.max(0,6-(s.gainTotals[ledgerKey]||0)));
  if(key==='gameSkill')s.gameSkillById[gameId]=clamp(skill(s,gameId)+add);
  else s.stats[key]=clamp(s.stats[key]+add);
  s.gainTotals[ledgerKey]=(s.gainTotals[ledgerKey]||0)+add;
  return add;
}
function valueAt(s,path,gameId=s.project?.gameId||s.gameId){
  if(path==='stats.gameSkillById.$game')return skill(s,gameId);
  if(path.startsWith('experienceCountsByGame.$game.'))return s.experienceCountsByGame[gameId]?.[path.split('.').at(-1)]||0;
  if(path.startsWith('experienceCounts.'))return s.experienceCounts[path.split('.').at(-1)]||0;
  if(path==='economy.cash')return s.cash;
  if(path.startsWith('module.')){
    const p=path.slice(7);return p.split('.').reduce((v,k)=>v?.[k],s.module)??p.split('.').reduce((v,k)=>v?.[k],s.module?.local);
  }
  return path.split('.').reduce((v,k)=>v?.[k],s);
}
export function unmet(s,requirements=[],catalog,gameId){
  return requirements.filter(r=>{const v=valueAt(s,r.path,gameId);return r.op==='gte'?typeof v!=='number'||v<r.value:r.op==='eq'?v!==r.value:true;}).map(r=>{
    if(r.path.startsWith('stats.')){const key=r.path.includes('gameSkill')?'gameSkill':r.path.split('.')[1];return `${LABELS[key]||key} ${valueAt(s,r.path,gameId)??0} / 필요 ${r.value}`;}
    if(r.path.startsWith('experience')){const id=r.path.split('.').at(-1);return `${catalog?.experienceDefinitions[id]?.label||'선행 경험'} 필요`;}
    if(r.path.startsWith('story.'))return '현재 기획의 준비·검증이 더 필요해요';
    if(r.path.includes('playerConfirmed'))return '선수 참가 자격이 필요해요';
    if(r.path.includes('roleTrack'))return '현재 참가 역할과 맞지 않아요';
    if(r.path.includes('projectProgress'))return `현지 기획 준비 ${valueAt(s,r.path)||0} / ${r.value}`;
    return '현재 기획의 역할·검증 범위가 맞지 않아요';
  });
}
function awardExperience(s,id,source,gameId,catalog){
  const bound=catalog.experienceDefinitions[id]?.sameGameAsProject;
  if(s.experienceRecords.some(r=>r.experienceId===id&&r.source===source))return;
  s.experienceRecords.push({experienceId:id,source,gameId:bound?gameId:null,date:s.date,broadcastIndex:s.broadcastIndex});
  s.experienceCounts[id]=(s.experienceCounts[id]||0)+1;
  if(bound){s.experienceCountsByGame[gameId]??={};s.experienceCountsByGame[gameId][id]=(s.experienceCountsByGame[gameId][id]||0)+1;}
}
function event(s,kind,title,body,choices,extra={}){return {id:`${s.runId}:${s.broadcastIndex}:${s.slot}:${kind}`,kind,title,body,choices,...extra};}
function choice(id,text,outcome,extra={}){return {id,text,outcome,requirements:[],...extra};}
function normalEligible(s,e){
  if(!e.route.includes(s.plan[s.slot]))return false;
  if(e.minElapsedDay>daysBetween(START_DATE,s.date))return false;
  if(e.repeat.mode==='once_per_run'&&(s.seenOnce.includes(e.id)||s.familyMemory[e.family]))return false;
  if(s.familyLast[e.family]!=null&&s.broadcastIndex-s.familyLast[e.family]<(e.repeat.minimumBroadcastGap||5))return false;
  if(s.groupLast[e.group]!=null&&s.broadcastIndex-s.groupLast[e.group]<=2)return false;
  const id=e.id;
  if(['CE-004','CE-010'].includes(id)&&s.checked)return false;
  if(['CE-007','CE-008','CE-009','CE-012'].includes(id)&&s.dataPrepared<(id==='CE-012'?2:1))return false;
  if(['CE-021','RK-022'].includes(id)&&s.gameId!=='puzzle')return false;
  if(['CE-022','RK-007'].includes(id)&&s.gameId!=='strategy')return false;
  if(id==='RK-010'&&s.gameId!=='boxing')return false;
  if(['CE-060','RK-023'].includes(id)&&s.gameId!=='rhythm'&&s.project?.eventId!=='EF-006')return false;
  if(['CE-019','RA-004'].includes(id)&&(!s.gameHistory[s.gameId]||s.broadcastIndex-s.gameHistory[s.gameId].last<3))return false;
  if(id==='CE-023'&&!s.gameHistory[s.gameId])return false;
  if(['CE-025','CE-026','CE-027','CE-028','CE-029','CE-030','RK-024'].includes(id)&&s.project?.eventId!=='EF-007'&&s.gameId!=='coop')return false;
  if(id==='CE-033'&&s.slot!==2)return false;
  if(id==='CE-037'&&!s.currentLog.some(x=>x.choice.includes('잡담')||x.choice.includes('즉흥'))&&!s.journal.length)return false;
  if(['CE-040','CE-041'].includes(id)&&!s.promises.length)return false;
  if(id==='CE-050'&&(!s.outfitProgress[s.crafting]||s.wardrobe[s.crafting]))return false;
  if(['CE-052','CE-053','CE-054'].includes(id)&&Object.keys(s.wardrobe).length<2)return false;
  if(['CE-058','CE-065','RA-002'].includes(id)&&s.project?.eventId!=='EF-012'&&!s.projectArchive.some(p=>p.eventId==='EF-012'))return false;
  if(id==='RK-026'&&!s.purchases.length)return false;
  if(id==='RA-001'&&!s.projectArchive.length&&!s.moduleArchive.length)return false;
  return true;
}
function pickGeneral(s,catalog){
  const list=catalog.events.filter(e=>normalEligible(s,e));
  if(!list.length)return event(s,'routine',`${CORNERS[s.plan[s.slot]]}의 작은 한 페이지`,'큰 사건이 없는 날도 좋은 방송이 된다. 오늘 남길 작은 기록을 골라 보자.',[
    choice('note','오늘의 팁을 메모한다','다음에 꺼내 볼 수 있는 짧은 메모를 남겼다.',{gain:{planning:1}}),
    choice('question','키몽이의 한 줄을 듣는다','여러 키몽이의 생각을 듣고 오늘의 코너를 마쳤다.',{gain:{community:1}})]);
  const stage=s.completedBroadcasts<10?0:s.completedBroadcasts<25?1:2;
  const share=[.9,.55,.4][stage],rk=list.filter(e=>e.provenance==='adaptation'),fiction=list.filter(e=>e.provenance==='fiction');
  const candidates=random(s)<share?(rk.length?rk:fiction):(fiction.length?fiction:rk);
  const weights=candidates.map(e=>e.topic==='gameplay'?[.35,1,4][stage]:1);
  let draw=random(s)*weights.reduce((a,b)=>a+b,0),selected=candidates[candidates.length-1];
  for(let i=0;i<candidates.length;i++){draw-=weights[i];if(draw<=0){selected=candidates[i];break;}}
  const previous=s.familyMemory[selected.family];
  const body=previous?`지난 방송에서 ‘${previous.choice}’를 선택했던 기록을 펼쳤다. ${s.completedBroadcasts%2?'새 코너에 맞춰 이번의 방법을 다시 골라 보자.':'이번에는 그 메모를 곁에 두고 코너를 이어간다.'}`:selected.body;
  return event(s,'general',selected.title,body,clone(selected.choices),{definitionId:selected.id,family:selected.family,group:selected.group,provenance:selected.provenance});
}
function projectEvent(s,catalog){
  const p=s.project,def=catalog.projects.find(x=>x.id===p.id),step=p.step;
  return event(s,'project',def.name,def.steps[step],[
    choice('work',step===0?'자료와 계획을 준비한다':step===1?'시범 코너를 직접 진행한다':'피드백을 반영하고 검수를 마친다',def.steps[step],{gain:{planning:2}}),
    choice('together',step===0?'키몽이의 의견을 먼저 듣는다':step===1?'차근차근 설명하며 시험한다':'헷갈린 부분을 함께 다시 확인한다',`${def.steps[step]} 키몽이의 의견도 함께 기록했다.`,{gain:{community:2}}),
    choice('postpone','이번에는 다음 방송으로 미룬다','현재 기획을 보존했다. 이번 코너는 준비 메모를 정리하며 마쳤다.',{postpone:true,gain:{operation:1}})
  ],{projectId:p.id,projectStep:step});
}
function calendarEvent(s,type){
  const title=type==='birthday'?'오늘은 코코의 생일!':`${yearsPlayed(s)}주년, 또 한 장의 시작`;
  return event(s,'calendar',title,'조금 다른 오늘도, 함께 있는 키몽이들이 반갑다. 이번 기념일에는 어떤 장면을 남길까?',[
    choice('letters','키몽이들의 짧은 축하를 읽는다','서로 다른 축하와 장난을 모아 기념일의 한 페이지를 만들었다.',{gain:{community:2}}),
    choice('memory','지금까지의 일지를 함께 펼친다','직접 만든 방송 기록을 돌아보고 다음에 하고 싶은 일을 적었다.',{gain:{planning:2}}),
    choice('normal','평소처럼, 조금 더 다정하게 방송한다','크게 꾸미지 않아도 같이 보내는 하루라 좋았다.',{gain:{community:1,operation:1}})
  ],{celebrationKey:`${type}:${s.date.slice(0,4)}`,celebrationType:type});
}
function revealEvent(s,catalog){
  const outfit=catalog.outfits.find(x=>x.id===s.crafting);
  return event(s,'reveal',`${outfit.name}, 드디어 공개`,'조금씩 준비해 온 모습을 오늘의 방송에서 처음 보여준다. 공개 후에는 언제든 편하게 갈아입을 수 있다.',[
    choice('show','새 옷으로 인사한다','커튼을 열고 새 옷을 공개했다. 옷장에 새로운 한 벌이 남았다.'),
    choice('detail','디테일을 하나씩 소개한다','작은 장식부터 차근차근 소개하며 새 옷을 공개했다.')
  ],{outfitId:outfit.id});
}
function leakEvent(s){
  const clues={maid:'프릴처럼 보이는 천 한 조각',police:'반짝이는 작은 단추',ghost:'하늘하늘한 흰 천',nun:'흑백으로 나뉜 천의 끝'};
  return event(s,'leak','어? 방금 화면에…',`작업 화면 구석에 ${clues[s.crafting]}이 잠깐 보였다. 전체 모습은 아직 나오지 않았다.`,[
    choice('hide','작업 화면을 닫고 준비를 이어간다','일부 단서만 남기고 화면을 닫았다. 전체 공개는 원래 준비대로 간다.'),
    choice('teaser','짧은 티저였다고 설명한다','키몽이들은 추측을 나눴다. 아직 전체 의상을 공개한 건 아니다.'),
    choice('risky',`장난스럽게 수습한다 · 조기 공개 위험 ${s.checked?10:25}%`,'가볍게 분위기를 바꿔 보았다.',{risk:s.checked ? 0.10 : 0.25})
  ],{outfitId:s.crafting});
}
function moduleEvent(s,catalog){
  const m=s.module;
  if(!m||m.phase==='closed'||m.expired||m.usedThisBroadcast>=2)return null;
  m.qualification.playerConfirmed=skill(s,m.gameId)>=30;
  const definitions=catalog.moduleEvents.filter(e=>e.moduleId===m.id&&e.eligibility.modulePhase===m.phase);
  if(['LC-PT','LC-ST'].includes(m.id)&&m.phase==='rehearsed'&&m.local.roleTrack==='player'&&m.matches.length<2){
    const opponent=m.opponents[m.matches.length];
    return event(s,'match',`가상 대회 · ${m.matches.length?'결승':'첫 라운드'}`,'미리 정해진 상대와 팀의 준비를 비교한다. 경기를 마쳐야 결과가 기록된다.',[
      choice('play',`경기를 진행한다 · 상대 준비 ${opponent}`,'실제 경기 판정 결과를 기록했다.'),
      choice('withdraw','출전을 포기하고 응원 역할로 마친다','승리를 만들어내지 않고 대회의 응원 역할로 돌아갔다.')
    ],{opponent});
  }
  const advance=definitions.find(e=>e.trigger==='module_progression');
  const repeats=definitions.filter(e=>e.trigger==='module_recurring'&&(m.repeatLast[e.id]==null||m.participation-m.repeatLast[e.id]>=2));
  const def=(m.lastAdvance!==s.broadcastIndex&&!m.practiceOnly?advance:null)||repeats[0];
  if(!def)return null;
  return event(s,'module',def.title,'가상 동료들과 이어 가는 장기 콘텐츠. 실제로 맡은 역할과 시험한 범위만 이번 기록에 남긴다.',def.choices.map(c=>({id:c.id,text:c.text,outcome:c.outcome,requirements:c.eligibility.all,effects:c.effects})),{definitionId:def.id,moduleProgression:def.trigger==='module_progression'});
}
function nextEvent(s,catalog){
  const reservation=s.reservations[s.slot];
  if(reservation==='calendar'){
    const type=s.date.slice(5)==='09-10'?'birthday':'anniversary';s.event=calendarEvent(s,type);
  }else if(reservation==='outfit'&&!s.wardrobe[s.crafting])s.event=revealEvent(s,catalog);
  else if(reservation==='finale')s.event=event(s,'finale','마지막 특집을 준비하며','충분히 준비한 기획을 오늘 마무리한다. 방송 정산 뒤 마지막 선택을 하게 된다.',[choice('ready','마지막 점검을 마친다','마지막 기획의 준비를 확인했다.')]);
  else if(s.plan[s.slot]==='S'&&s.project&&s.project.step<3&&s.project.lastProgress!==s.broadcastIndex)s.event=projectEvent(s,catalog);
  else if(['G','S'].includes(s.plan[s.slot])&&s.module&&(s.event=moduleEvent(s,catalog))){}
  else {
    const promise=s.promises.find(p=>p.status==='pending'&&p.dueBroadcast<=s.broadcastIndex&&p.createdBroadcast<s.broadcastIndex);
    if(promise)s.event=event(s,'promise','지난 방송에서 적어 둔 다음에',`‘${promise.title}’라는 메모가 오늘의 코너를 기다리고 있다.`,[
      choice('fulfill','약속했던 작은 기획을 진행한다','지난 메모를 따라 코너를 진행하고 결과를 기록했다.',{gain:{planning:1}}),
      choice('later','기록을 남기고 한 번 더 미룬다','약속은 지우지 않고 다음 방송으로 옮겼다.')],{promiseId:promise.id});
    else {
      if(!s.leakChecked&&s.outfitProgress[s.crafting]>=40&&!s.wardrobe[s.crafting]){
        s.leakChecked=true;
        if(random(s)<(s.checked ? 0.03 : 0.08)){s.event=leakEvent(s);s.phase='event';return;}
      }
      s.event=pickGeneral(s,catalog);
    }
  }
  s.phase='event';
}
export function projectLocks(s,def){
  const reasons=[];
  if(def.requiresOutfit&&Object.keys(s.wardrobe).length<2)reasons.push('기본 의상 외에 공개한 옷 한 벌이 필요해요');
  if(def.eventId==='EF-011'&&!s.celebrations.some(x=>x.startsWith('birthday:')))reasons.push('같은 일지에서 생일 방송을 먼저 해주세요');
  return reasons;
}
export function projectProgressLocks(s,catalog){
  if(!s.project)return[];
  const def=catalog.projects.find(p=>p.id===s.project.id),reasons=projectLocks(s,def);
  if(s.project.step===1&&['EX-003','EX-004','EX-005','EX-014'].includes(def.experienceId)&&!s.project.practiced)reasons.push('이 기획과 같은 게임을 준비 행동으로 한 번 연습해주세요');
  return reasons;
}
export function finaleLocks(s,catalog){
  const reasons=[];
  if(!s.project||s.project.step<3)reasons.push('현재 기획의 자료·시범·피드백을 먼저 마쳐주세요');
  if(yearsPlayed(s)<1)reasons.push('첫 1주년부터 마지막 특집을 열 수 있어요');
  if(s.deferUntil&&s.date<s.deferUntil)reasons.push(`${s.deferUntil} 이후 다시 마무리 기획을 정할 수 있어요`);
  if(s.project){const def=catalog.projects.find(p=>p.id===s.project.id);reasons.push(...unmet(s,def.requirements,catalog,s.project.gameId));}
  return [...new Set(reasons)];
}
function settle(s,catalog){
  const cfg=catalog.economy.income, snap=s.incomeSnapshot;
  const gross=(cfg.base+snap.awareness*cfg.perAwarenessPoint+snap.community*cfg.perCommunityPoint+s.currentLog.length*cfg.perCompletedSegment+(s.currentLog.length===3?cfg.threeSegmentCompletionBonus:0))*snap.multiplier;
  const cost=cfg.operatingCostPerSettledBroadcast*snap.multiplier,net=gross-cost;
  s.cash=Math.min(catalog.economy.cashMaximum,s.cash+net);
  s.ledger.push({id:`income:${s.broadcastIndex}`,date:s.date,gross,cost,net});
  s.completedBroadcasts++;
  for(const order of s.purchases)if(order.status==='pending'&&order.dueBroadcast<=s.completedBroadcasts)order.status='delivered';
  s.journal.push({id:s.broadcastIndex,date:s.date,events:clone(s.currentLog),income:{gross,cost,net},outfit:s.equipped,representative:0});
  if(s.module?.phase==='closed'){s.moduleArchive.push(clone(s.module));s.module=null;}
  s.phase='wrap';s.result={gross,cost,net};s.event=null;
  if(!s.project||s.project.step<3||yearsPlayed(s)<1)return;
  const e=catalog.endingEvents.find(e=>e.id===s.project.eventId);
  if(unmet(s,e.eligibility.all,catalog).length||!e.choices.some(c=>!unmet(s,c.prerequisites.all,catalog).length))return;
  if(s.deferUntil&&s.date<s.deferUntil)return;
  if(!s.finaleScheduled&&s.lastEndingCheck&&daysBetween(s.lastEndingCheck,s.date)<30)return;
  s.lastEndingCheck=s.date;
  if(s.finaleScheduled||random(s)<Math.min(.35,.05+(yearsPlayed(s)-1)*.03)){
    s.phase='ending';s.event=clone(e);s.event.kind='ending';
  }
  s.finaleScheduled=false;
}
function reveal(s,id){s.wardrobe[id]=true;s.equipped=id;s.outfitReserved=false;for(const key of Object.keys(s.reservations))if(s.reservations[key]==='outfit')delete s.reservations[key];}
function reactions(s,selected){
  const context=chatContext(s.event,selected,s.result,s.module);
  const pool=CHAT_POOLS[context]||CHAT_POOLS.general;
  s.reactionHistory??=[];
  let recent=new Set(s.reactionHistory.slice(-24).map(x=>x.text));
  let candidates=pool.filter(x=>!recent.has(x.text));
  if(candidates.length<3){recent=new Set(s.reactionHistory.slice(-3).map(x=>x.text));candidates=pool.filter(x=>!recent.has(x.text));}
  if(candidates.length<3)candidates=pool.slice();
  const offset=Math.floor(random(s)*8),rows=[];
  for(let i=0;i<3;i++){
    const index=Math.floor(random(s)*candidates.length),line=candidates.splice(index,1)[0];
    rows.push({id:line.id,speaker:`키몽이 ${String((offset+i)%8+1).padStart(2,'0')}`,text:line.text});
    s.reactionHistory.push({id:line.id,text:line.text});
  }
  s.reactionHistory=s.reactionHistory.slice(-24);s.result.chatContext=context;
  return rows;
}
function commitModuleChoice(s,c,catalog){
  const m=s.module;
  if(m.participatedLast!==s.broadcastIndex){m.participation++;m.participatedLast=s.broadcastIndex;}
  m.usedThisBroadcast++;
  if(s.event.kind==='match'){
    if(c.id==='withdraw'){m.local.roleTrack='support';m.matches.push({won:false,withdrawn:true},{won:false,withdrawn:true});return;}
    const performance=.5*skill(s,m.gameId)+.25*(m.local.practice||0)+.25*(m.local.teamwork||0);
    const won=performance>=s.event.opponent;m.matches.push({opponent:s.event.opponent,performance,won});
    s.result.outcome=`팀 준비 ${performance.toFixed(1)} 대 상대 ${s.event.opponent}. ${won?'이번 라운드를 이겼다!':'이번 라운드는 아쉽게 졌다.'}`;return;
  }
  for(const effect of c.effects||[]){
    if(effect.op==='local.add'){const old=effect.key.split('.').reduce((v,k)=>v?.[k],m.local)||0;setPath(m.local,effect.key,clamp(old+effect.amount));}
    if(effect.op==='local.set')setPath(m.local,effect.key,effect.value);
    if(effect.op==='module.phase')m.phase=effect.value;
    if(effect.op==='module.validateRehearsal'){
      m.local.verifiedFinalScope=effect.verifiedFinalScope==='projectTrack'?m.local.projectTrack:effect.verifiedFinalScope;
      if(m.id==='LC-RD'&&m.local.verifiedFinalScope==='specialist'&&(skill(s,m.gameId)<55||(m.local.practice||0)<40||(m.local.teamwork||0)<30))m.local.verifiedFinalScope='guided';
    }
    if(effect.op==='module.recordOutcome'){
      m.outcome={scope:m.local.verifiedFinalScope||'guided',role:m.local.roleTrack||'learner',matches:clone(m.matches),wins:m.matches.filter(x=>x.won).length};
      if(['LC-PT','LC-ST'].includes(m.id)&&m.local.roleTrack==='player'&&m.matches.length===2&&m.matches.every(x=>x.won)&&!m.prizeAwarded){
        const amount=catalog.economy.tournamentAwards.find(x=>x.moduleId===m.id).winnerPrize;s.cash+=amount;m.prizeAwarded=true;s.ledger.push({id:`prize:${m.instanceId}`,date:s.date,net:amount});
      }
    }
  }
  if(s.event.moduleProgression)m.lastAdvance=s.broadcastIndex;
  else m.repeatLast[s.event.definitionId]=m.participation;
  gain(s,'gameSkill',1,m.gameId);gain(s,'operation',1);
}
function applyChoice(s,id,catalog){
  const e=s.event,c=e.choices.find(c=>c.id===id);if(!c)throw Error('선택지를 찾을 수 없어요.');
  const reasons=unmet(s,c.requirements||[],catalog,e.kind==='module'?s.module?.gameId:undefined);
  if(e.kind==='project'&&!c.postpone)reasons.push(...projectProgressLocks(s,catalog));
  if(reasons.length)throw Error(reasons.join(' · '));
  const segmentGame=['module','match'].includes(e.kind)?s.module.gameId:s.project&&e.kind==='project'?s.project.gameId:s.gameId;
  const before={...s.stats,gameSkill:skill(s,segmentGame)};
  s.result={title:e.title,choice:c.text,outcome:c.outcome||'오늘의 기록을 남겼다.',kind:e.kind,provenance:e.provenance};
  if(e.kind==='general'){
    s.familyLast[e.family]=s.broadcastIndex;s.groupLast[e.group]=s.broadcastIndex;
    if(!s.familyMemory[e.family])gain(s,'awareness',1);
    s.familyMemory[e.family]={choice:c.text,outcome:c.outcome};s.seenOnce.push(e.definitionId);
    if(c.promise)s.promises.push({id:`promise:${s.broadcastIndex}:${s.slot}`,title:e.title,status:'pending',dueBroadcast:s.broadcastIndex+1,createdBroadcast:s.broadcastIndex});
  }
  if(e.kind==='project'&&!c.postpone){
    const def=catalog.projects.find(x=>x.id===s.project.id);s.project.step++;s.project.lastProgress=s.broadcastIndex;
    s.project.log.push({date:s.date,text:c.outcome});
    if(s.project.step===1&&def.experienceId==='EX-019')s.project.promise={createdBroadcast:s.broadcastIndex,fulfilled:false};
    if(s.project.step===2&&s.project.promise)s.project.promise.fulfilled=true;
    if(s.project.step===3){
      if(def.experienceId==='EX-019'&&!s.project.promise?.fulfilled)throw Error('먼저 약속했던 기획을 진행해주세요.');
      for(const f of def.storyConditions)setPath(s,f.path,f.value);
      awardExperience(s,def.experienceId,`project:${s.project.instanceId}`,s.project.gameId,catalog);
      gain(s,'awareness',1);s.result.outcome+=' 기획 경험을 기록했다. 마무리에 필요한 능력이 갖춰지면 마지막 특집을 예약할 수 있다.';
    }
  }
  if(e.kind==='calendar')s.celebrations.push(e.celebrationKey);
  if(e.kind==='reveal')reveal(s,e.outfitId);
  if(e.kind==='leak'){
    s.leaked[e.outfitId]=true;
    if(c.risk&&random(s)<c.risk){reveal(s,e.outfitId);s.result.outcome='앗, 전체 화면까지 나와 버렸다! 예상보다 이른 공개였지만 새 옷은 옷장에 남았다.';s.result.kind='reveal';}
  }
  if(e.kind==='promise'){
    const p=s.promises.find(x=>x.id===e.promiseId);if(id==='fulfill')p.status='fulfilled';else {p.dueBroadcast=s.broadcastIndex+1;s.result.kind='routine';}
  }
  if(e.kind==='module'||e.kind==='match')commitModuleChoice(s,c,catalog);
  for(const [key,amount]of Object.entries(c.gain||{}))gain(s,key,amount);
  const base={T:'community',G:'gameSkill',F:'community',S:'planning'}[s.plan[s.slot]];gain(s,base,1,segmentGame);
  if(s.plan[s.slot]==='G')s.gameHistory[s.gameId]={last:s.broadcastIndex};
  s.result.changes=Object.fromEntries(Object.entries({...s.stats,gameSkill:skill(s,segmentGame)}).map(([k,v])=>[k,v-before[k]]).filter(([,v])=>v));
  s.result.reactions=reactions(s,c);s.currentLog.push(clone(s.result));s.phase='result';
}
function forceEnding(s){
  const spouse=1+Math.floor(random(s)*8);
  s.lastEnding={id:'END-FORCED-10Y',title:'10년의 방송, 둘의 엔딩',forced:true,spouse,
    resolution:`다수의 키몽이 중 한 명, 키몽이 ${String(spouse).padStart(2,'0')}와 함께 새로운 일상을 시작한다.`,
    epilogue:'다른 키몽이들의 축하 속에서 단체사진을 남겼다. 길었던 방송일지를 닫으며, 둘의 다음 페이지가 시작된다.'};
  s.reachedEndings.push(clone(s.lastEnding));s.endingSeenEver=true;s.phase='credits';s.event=null;
}
export function nextMilestone(date,type){let y=Number(date.slice(0,4)),md=type==='birthday'?'09-10':'01-18';if(`${y}-${md}`<=date)y++;return `${y}-${md}`;}
export function scheduleDate(s,target){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(target)||Number.isNaN(Date.parse(target+'T00:00:00Z'))||new Date(target+'T00:00:00Z').toISOString().slice(0,10)!==target||target<=s.date||target>'2100-12-31')throw Error('오늘 이후의 올바른 날짜를 골라주세요.');
  if(!s.endingSeenEver&&target>=DEADLINE){s.date=DEADLINE;forceEnding(s);return;}
  const nearest=[nextMilestone(s.date,'birthday'),nextMilestone(s.date,'anniversary')].filter(x=>x<=target).sort()[0];
  s.date=nearest||target;
  if(s.module&&s.date>s.module.deadline)s.module.expired=true;
}
function execute(s,c,catalog){
  const prepOnly=()=>{if(s.phase!=='prep')throw Error('방송 준비 중에 할 수 있어요.');};
  switch(c.type){
    case 'plan':prepOnly();if(!Object.hasOwn(CORNERS,c.corner)||c.index<0||c.index>2)throw Error('올바른 코너를 골라주세요.');s.plan[c.index]=c.corner;break;
    case 'game':prepOnly();if(!catalog.games.some(g=>g.id===c.gameId))throw Error('게임을 찾을 수 없어요.');s.gameId=c.gameId;s.gameSkillById[c.gameId]??=10;break;
    case 'craft':prepOnly();if(!catalog.outfits.some(x=>x.id===c.outfitId&&x.id!=='base'))throw Error('의상을 골라주세요.');s.crafting=c.outfitId;s.outfitReserved=false;break;
    case 'craftAndPrepare':{
      prepOnly();if(!catalog.outfits.some(x=>x.id===c.outfitId&&x.id!=='base'))throw Error('의상을 골라주세요.');
      if(s.crafting!==c.outfitId)s.outfitReserved=false;s.crafting=c.outfitId;
      execute(s,{type:'prepare',action:'outfit'},catalog);break;
    }
    case 'prepare':{
      prepOnly();if(s.preparations<1)throw Error('오늘의 준비 행동을 모두 사용했어요.');
      if(c.action==='data'){gain(s,'planning',2);s.dataPrepared++;}
      else if(c.action==='practice'){gain(s,'gameSkill',2);if(s.project?.gameId===s.gameId)s.project.practiced=true;}
      else if(c.action==='check'){if(s.checked)throw Error('이번 방송은 이미 점검했어요.');s.checked=true;gain(s,'operation',1);}
      else if(c.action==='outfit'){if(s.wardrobe[s.crafting])throw Error('이미 공개한 옷이에요.');if(s.outfitProgress[s.crafting]>=100)throw Error('준비가 끝났어요. 공개 방송을 예약해주세요.');if(s.cash<500000)throw Error('의상 준비비 50만원이 부족해요.');s.cash-=500000;s.outfitProgress[s.crafting]=Math.min(100,s.outfitProgress[s.crafting]+25);s.ledger.push({id:`outfit:${s.broadcastIndex}:${s.preparations}`,date:s.date,net:-500000});}
      else throw Error('준비 행동을 찾을 수 없어요.');s.preparations--;break;
    }
    case 'equip':if(!s.wardrobe[c.outfitId])throw Error('공개한 옷만 입을 수 있어요.');s.equipped=c.outfitId;break;
    case 'reserveOutfit':prepOnly();if((s.outfitProgress[s.crafting]||0)<100||s.wardrobe[s.crafting])throw Error('준비를 마친 새 옷이 필요해요.');s.outfitReserved=!s.outfitReserved;break;
    case 'project':{
      prepOnly();if(s.project&&s.project.step<3)throw Error('현재 기획을 마치거나 보류해주세요.');
      const def=catalog.projects.find(x=>x.id===c.id);if(!def)throw Error('기획을 찾을 수 없어요.');const locks=projectLocks(s,def);if(locks.length)throw Error(locks.join(' · '));
      if(s.project)s.projectArchive.push(clone(s.project));s.story={endingProject:{accepted:true,eventId:def.eventId}};
      s.project={id:def.id,eventId:def.eventId,boundGame:def.boundGame,instanceId:`${s.broadcastIndex}:${s.revision}`,gameId:s.gameId,step:0,lastProgress:-1,practiced:false,log:[]};s.plan[1]='S';break;
    }
    case 'pauseProject':prepOnly();if(s.project){s.projectArchive.push({...s.project,paused:true});s.project=null;s.story={};}break;
    case 'resumeProject':{
      prepOnly();if(s.project)throw Error('현재 기획을 먼저 마무리하거나 보류해주세요.');
      const index=s.projectArchive.findIndex(p=>p.instanceId===c.id&&p.paused);if(index<0)throw Error('보류한 기획을 찾지 못했어요.');
      s.project=s.projectArchive.splice(index,1)[0];delete s.project.paused;s.story={endingProject:{accepted:true,eventId:s.project.eventId}};
      if(s.project.step===3)for(const f of catalog.projects.find(p=>p.id===s.project.id).storyConditions)setPath(s,f.path,f.value);else s.plan[1]='S';break;
    }
    case 'finale':prepOnly();{const locks=finaleLocks(s,catalog);if(locks.length)throw Error(locks.join(' · '));s.finaleScheduled=!s.finaleScheduled;}break;
    case 'joinModule':{
      prepOnly();if(s.module&&!s.module.expired)throw Error('장기 콘텐츠는 하나씩 참여할 수 있어요.');
      const def=catalog.modules.find(x=>x.id===c.id);if(!def)throw Error('콘텐츠를 찾을 수 없어요.');if(s.module)s.moduleArchive.push(s.module);
      s.module={id:def.id,name:def.name,gameId:def.gameId,phase:'invited',instanceId:`${c.id}:${s.broadcastIndex}:${s.moduleArchive.length}`,deadline:addDays(s.date,120),local:clone(def.localState),qualification:{playerConfirmed:skill(s,def.gameId)>=30,supportConfirmed:true},usedThisBroadcast:0,participation:0,participatedLast:-1,lastAdvance:-1,repeatLast:{},matches:[],opponents:[35+Math.floor(random(s)*36),35+Math.floor(random(s)*36)],practiceOnly:false};if(!s.plan.includes('G'))s.plan[0]='G';break;
    }
    case 'practiceModule':prepOnly();if(s.module)s.module.practiceOnly=!s.module.practiceOnly;break;
    case 'leaveModule':prepOnly();if(s.module){s.moduleArchive.push({...s.module,abandoned:true});s.module=null;}break;
    case 'purchase':{
      prepOnly();const e=catalog.moneyEvents.find(e=>e.id===c.eventId),option=e?.choices.find(x=>x.id===c.choiceId);if(!option)throw Error('상품을 찾을 수 없어요.');
      const cost=option.cost?.amount||0;if(!cost)break;
      const target=e.id+':'+(s.project?.instanceId||s.gameId);
      if(s.purchases.some(x=>x.target===target))throw Error('이 기획에 이미 주문한 항목이에요.');if(s.cash<cost)throw Error('잔액이 부족해요. 이번 구매는 포기할 수 있어요.');
      const p=option.effects.find(x=>x.op==='purchase.record');s.cash-=cost;s.purchases.push({id:`order:${s.broadcastIndex}:${s.purchases.length}`,target,title:e.title,choice:option.text,cost,status:p.deliveryAfterBroadcasts?'pending':'delivered',dueBroadcast:s.completedBroadcasts+(p.deliveryAfterBroadcasts||0)});s.ledger.push({id:`purchase:${target}`,date:s.date,net:-cost});break;
    }
    case 'start':{
      prepOnly();s.currentLog=[];s.slot=0;s.reservations={};s.leakChecked=false;s.planBeforeReservations=clone(s.plan);
      const birthday=s.date.slice(5)==='09-10',anniversary=s.date.slice(5)==='01-18'&&yearsPlayed(s)>=1;
      if((birthday||anniversary)&&!s.celebrations.includes(`${birthday?'birthday':'anniversary'}:${s.date.slice(0,4)}`))s.reservations[0]='calendar';
      if(s.outfitReserved&&!s.wardrobe[s.crafting])s.reservations[2]='outfit';
      if(s.finaleScheduled)s.reservations[1]='finale';
      for(const key of Object.keys(s.reservations))s.plan[Number(key)]='S';
      const metric=Math.min(s.stats.awareness,s.stats.community),tiers=catalog.economy.income.scaleTiers;
      s.scaleIndex=Math.max(s.scaleIndex,tiers.reduce((best,t,i)=>metric>=t.minimumScore?i:best,0));
      s.incomeSnapshot={...s.stats,multiplier:tiers[s.scaleIndex].multiplier};
      if(s.module)s.module.usedThisBroadcast=0;nextEvent(s,catalog);break;
    }
    case 'choose':if(s.phase!=='event')throw Error('현재 선택할 사건이 없어요.');applyChoice(s,c.id,catalog);break;
    case 'advance':if(s.phase!=='result')throw Error('결과를 먼저 확인해주세요.');s.slot++;if(s.slot<3)nextEvent(s,catalog);else settle(s,catalog);break;
    case 'representative':if(s.phase!=='wrap')throw Error('방송을 마친 뒤 고를 수 있어요.');if(!Number.isInteger(c.index)||c.index<0||c.index>2)throw Error('기록을 골라주세요.');s.journal.at(-1).representative=c.index;break;
    case 'date':{
      if(!['prep','wrap'].includes(s.phase))throw Error('현재 방송을 마무리한 뒤 날짜를 바꿀 수 있어요.');const wasWrap=s.phase==='wrap';scheduleDate(s,c.date);if(s.phase==='credits')break;
      if(wasWrap){s.broadcastIndex++;s.phase='prep';s.preparations=2;s.checked=false;s.dataPrepared=0;s.gainTotals={};s.event=null;s.result=null;s.currentLog=[];s.reservations={};s.finaleScheduled=false;if(s.planBeforeReservations)s.plan=s.planBeforeReservations;delete s.planBeforeReservations;}
      break;
    }
    case 'ending':{
      if(s.phase!=='ending')throw Error('마무리 기획이 아직 없어요.');const ch=s.event.choices.find(x=>x.id===c.id);if(!ch)throw Error('마지막 선택을 골라주세요.');const locks=unmet(s,ch.eligibility.all,catalog);if(locks.length)throw Error(locks.join(' · '));
      s.lastEnding={id:ch.endingId,title:ch.endingTitle,resolution:ch.resolution,epilogue:ch.epilogue,forced:false,date:s.date,projectLog:clone(s.project.log)};
      if(!s.reachedEndings.some(x=>x.id===ch.endingId))s.reachedEndings.push(clone(s.lastEnding));s.endingSeenEver=true;s.journal.at(-1).ending=ch.endingId;s.phase='credits';s.event=null;break;
    }
    case 'deferEnding':if(s.phase!=='ending')throw Error('현재 마무리 선택이 없어요.');s.phase='wrap';s.event=null;s.deferUntil=addDays(s.date,90);s.finaleScheduled=false;break;
    case 'continue':if(s.phase!=='credits'||s.lastEnding?.forced)throw Error('이 일지는 마무리되었어요. 새 일지로 시작할 수 있어요.');if(s.project)s.projectArchive.push(s.project);s.project=null;s.story={};s.phase='wrap';s.deferUntil=addDays(s.date,365);s.finaleScheduled=false;break;
    default:throw Error('알 수 없는 행동이에요.');
  }
}
export function dispatch(state,command,catalog){
  if(!command.commandId||typeof command.commandId!=='string')throw Error('명령 식별자가 필요해요.');
  if(state.commands.includes(command.commandId))return state;
  const next=clone(state);execute(next,command,catalog);next.commands.push(command.commandId);next.commands=next.commands.slice(-256);next.revision++;
  return next;
}
export function validateSave(s,catalog){
  if(!s||s.schemaVersion!==1||typeof s.runId!=='string'||s.runId.length>160)throw Error('지원하지 않는 일지 파일이에요.');
  if(!['prep','event','result','wrap','ending','credits'].includes(s.phase)||!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||Number.isNaN(Date.parse(s.date+'T00:00:00Z')))throw Error('진행 상태가 올바르지 않아요.');
  for(const key of ['awareness','community','planning','operation'])if(!Number.isFinite(s.stats?.[key])||s.stats[key]<0||s.stats[key]>100)throw Error('능력 값이 올바르지 않아요.');
  if(!Number.isSafeInteger(s.cash)||s.cash<0||s.cash>9000000000000||!Number.isSafeInteger(s.revision)||s.revision<0||!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295)throw Error('저장 값이 올바르지 않아요.');
  for(const key of ['journal','commands','promises','purchases','experienceRecords','reachedEndings','projectArchive','moduleArchive','celebrations','seenOnce'])if(!Array.isArray(s[key])||s[key].length>10000)throw Error('일지 목록이 올바르지 않아요.');
  if(!Number.isInteger(s.broadcastIndex)||s.broadcastIndex<1||s.broadcastIndex>10000||!Number.isInteger(s.completedBroadcasts)||s.completedBroadcasts<0||s.completedBroadcasts>10000||!Number.isInteger(s.preparations)||s.preparations<0||s.preparations>2)throw Error('방송 회차가 올바르지 않아요.');
  if(!Array.isArray(s.plan)||s.plan.length!==3||s.plan.some(x=>!Object.hasOwn(CORNERS,x)))throw Error('편성표가 올바르지 않아요.');
  if(!s.wardrobe||!s.wardrobe.base||!catalog.outfits.some(x=>x.id===s.crafting)||!s.gameSkillById||!s.story||!s.gainTotals||!s.familyLast||!s.groupLast)throw Error('필수 기록이 없어요.');
  if(s.project&&!catalog.projects.some(x=>x.id===s.project.id))throw Error('현재 기획을 확인할 수 없어요.');
  for(const v of Object.values(s.gameSkillById))if(!Number.isFinite(v)||v<0||v>100)throw Error('게임 숙련도가 올바르지 않아요.');
  if(s.phase==='event'&&(!s.event||!Array.isArray(s.event.choices)))throw Error('진행 중 사건이 없어요.');
  return s;
}
