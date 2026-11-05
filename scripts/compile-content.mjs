// 실행하면 바로 src/data/catalog.json 을 다시 쓴다(import 만 해도 실행됨 — 검사용으로 import 하지 말 것).
import {readFile,writeFile,mkdir} from 'node:fs/promises';
// 서술형 문장 끝 '…다' 를 연결형 '…고' 로 (점검한다→점검하고, 띄운다→띄우고, 적는다→적고, 번다→벌고)
// ㄹ 탈락 동사는 어절 전체가 일치할 때만 복원한다('띄운다'가 '띄울고'가 되지 않게).
const L_IRREGULAR = {'번다': '벌', '만든다': '만들', '연다': '열', '논다': '놀', '판다': '팔', '민다': '밀', '건다': '걸', '든다': '들', '끈다': '끌'};
export function toConnective(text) {
  const m = text.match(/(\S+)다$/);
  if (!m) return text + '고';
  const word = m[1] + '다', head = text.slice(0, -word.length);
  if (Object.hasOwn(L_IRREGULAR, word)) return head + L_IRREGULAR[word] + '고';
  if (word.endsWith('는다')) return head + word.slice(0, -2) + '고';
  const last = word.at(-2), code = last.charCodeAt(0) - 0xAC00;
  if (code >= 0 && code < 11172 && code % 28 === 4) return head + word.slice(0, -2) + String.fromCharCode(last.charCodeAt(0) - 4) + '고'; // 받침 ㄴ 제거
  return head + word.slice(0, -1) + '고';
}
const read = async name=>JSON.parse(await readFile(`outputs/${name}`,'utf8'));
const [pool,play,cards,creative,ending,requirements,long,money,economy,status,dialogue] = await Promise.all([
  'rakoko_draw_pool.design.json','rakoko_event_play_rules.design.json','rakoko_event_cards.json',
  'rakoko_encounter_catalog.json','rakoko_ending_routes.design.json','rakoko_ending_requirements.design.json',
  'rakoko_long_content.design.json','rakoko_money_events.design.json','rakoko_economy.design.json',
  'rakoko_status.design.json','rakoko_kimongi_dialogue.design.json'
].map(read));
// 손으로 쓴 문구 보강(사건 본문·결과 문구). 없으면 원래 생성 규칙만 쓴다.
const overrides = await readFile('outputs/rakoko_text_overrides.json', 'utf8').then(JSON.parse, () => ({events: {}}));
const source = new Map([...cards.cards,...creative.events].map(e=>[e.id,e]));
const rule = new Map(play.entries.map(e=>[e.id,e]));
const openings={
  '장비·화면':'방송을 이어가려는데 작은 변수가 생겼다. 키몽이들도 화면을 살펴보며 한마디씩 보탠다.',
  '게임 도전':'이번 코너는 게임 도전. 정답을 서두르기보다, 코코다운 방법을 골라 보자.',
  '팬 참여':'채팅창에 여러 키몽이의 생각이 모인다. 한 가지 의견만 있는 건 아닌 것 같다.',
  '방송 흐름':'준비한 순서와 지금의 분위기가 조금 다르다. 오늘의 방송은 어느 쪽으로 이어갈까?',
  '합방·협동':'게임 속 가상 동료들과 한 코너를 준비했다. 서로 다른 속도를 맞추는 것도 방송의 일부다.'
};
const events=pool.entries.filter(e=>e.trigger==='random').map(e=>{
  const src=source.get(e.id)||{}, r=rule.get(e.id);
  return {...e,provenance:e.id.startsWith('CE')?'fiction':'adaptation',
    body:overrides.events[e.id]?.body||src.game_prompt||openings[e.group]||'오늘의 코너에 새로운 이야깃거리가 찾아왔다. 키몽이들과 함께 다음 장면을 골라 보자.',
    repeat:r.repeat,
    choices:r.choices.map((c,i)=>{
      const original=src.choices?.[i];
      const text=c.text.replace(/\s*→.*$/,'');
      let stat=/점검|연결|설정|복구|음량|확인|백업|조작/.test(text)?'operation':/연습|공략|도전|전략/.test(text)?'gameSkill':/설명|투표|질문|시청자|감사|잡담|소개/.test(text)?'community':['planning','operation','community'][i%3];
      if(stat==='gameSkill'&&!e.route.includes('G'))stat='planning';
      const gain=/공개|소개|홍보|발표|공유/.test(text)?{awareness:1,[stat]:1}:{[stat]:2};
      return {id:c.id,text,requirements:c.eligibility.all,gain,
        outcome:overrides.events[e.id]?.outcomes?.[c.id]||original?.result||(!original?.outcome?.startsWith('미정')?original?.outcome:null)||`${toConnective(text)}, 오늘의 코너를 이어갔다.`,
        promise:/다음|미룬|미룬다|보류|대체 화면/.test(text)};
    })};
});
// These are authored game tasks, never claims about actual streams or real viewers.
const plans=[
 ['정기 코너 만들기','매주 만날 코너의 주제와 순서를 적는다.','정해 둔 순서로 짧은 시험 방송을 진행한다.','키몽이의 의견을 읽고 다음 편성표를 수정한다.'],
 ['매번 다른 특집','서로 다른 주제 두 가지를 고른다.','두 주제를 짧게 바꿔 가며 파일럿을 진행한다.','주제별 피드백을 나눠 다음 특집 목록을 완성한다.'],
 ['마지막 구간 도전','현재 게임의 어려운 구간을 연습 노트에 적는다.','연습했던 공략을 게임 안에서 시험한다.','실제 시도 결과와 조작을 복기해 최종 공략을 검증한다.'],
 ['함께 배우는 공략','현재 게임에서 설명할 구간을 고른다.','조작을 천천히 보여주는 시범 코너를 진행한다.','키몽이의 질문을 반영해 설명 순서를 고친다.'],
 ['실패 뒤 다른 목표','기존 기록 도전의 실패를 인정하고 범위를 다시 정한다.','현재 게임에서 대체 목표를 직접 시험한다.','새 목표의 실제 결과를 검토하고 다음 도전을 정한다.'],
 ['실패도 공략 노트','실패했던 구간을 복기할 자료로 모은다.','잘 안 된 시도를 키몽이와 차분히 다시 본다.','원인과 다음에 바꿀 점을 구분해 공략 노트를 마친다.'],
 ['키몽이 편성 회의','게임 속 팬 제안으로 작은 투표를 연다.','투표로 고른 코너를 시험 진행한다.','파일럿 피드백을 읽고 정기 코너 후보를 고친다.'],
 ['작은 키몽제','게임 속 가상 축제의 규칙과 역할을 정한다.','소수의 키몽이와 참가 동선을 시험한다.','오래 걸린 순서를 줄여 작은 축제의 운영안을 마친다.'],
 ['방송에서 작품 만들기','직접 만들 작품의 작은 시제품을 구상한다.','완성한 시제품을 시험 공개한다.','받은 의견을 반영해 공개 가능한 버전으로 다듬는다.'],
 ['새 연재의 첫 화','독자 연재의 등장인물과 첫 장면을 쓴다.','파일럿 한 편을 방송에서 소개한다.','첫 편의 피드백으로 다음 화의 구성을 검증한다.'],
 ['코코의 작은 무대','직접 만든 공연 순서와 무대 동선을 적는다.','짧은 개인 온라인 시범 무대를 진행한다.','놓친 큐를 수정하고 마지막 무대 순서를 확정한다.'],
 ['함께 여는 무대','가상 동료들과 공연 역할을 나눈다.','각 역할의 타이밍을 맞추는 합동 리허설을 한다.','서로의 큐를 확인하고 합동 무대 준비를 마친다.'],
 ['합동 방송 진행자','가상 합방의 진행표와 질문을 준비한다.','진행을 맡아 짧은 합동 시범 방송을 한다.','말할 순서와 화면 전환을 복기해 진행표를 고친다.'],
 ['우리 팀의 한 판','현재 게임으로 가상 팀의 역할을 정한다.','역할별 움직임을 맞추는 협동 시범 경기를 한다.','같은 게임의 경기 기록을 보고 팀 전략을 검증한다.'],
 ['의상으로 시작하는 이야기','공개한 의상으로 독자 상황극의 대본을 쓴다.','그 옷을 입고 짧은 상황극을 시험한다.','장면 전환과 대사를 고쳐 상황극 준비를 마친다.'],
 ['한 벌의 작은 전시','게임 속 창작물의 사용 동의를 확인하고 테마를 고른다.','작은 가상 전시의 안내 동선을 시험한다.','관람 의견을 반영해 테마 전시를 검수한다.'],
 ['목소리로만 만나는 날','화면이 멈췄을 때 쓸 음성 진행안을 적는다.','그림 없이도 전달되는 음성 전용 시험 방송을 한다.','키몽이의 이해를 확인하고 음성 대체 편성을 고친다.'],
 ['미리 만든 한 편','방송을 대체할 독자 녹화본을 준비한다.','검수한 짧은 녹화본을 시험 상영한다.','잘 전달되지 않은 부분을 편집해 대체본을 검수한다.'],
 ['시간캡슐의 약속','다음 방송에서 꼭 해볼 작은 기획을 약속으로 적는다.','다음 참여 방송에서 그 약속의 기획을 실제로 진행한다.','과거 메모와 진행 결과를 대조해 약속을 회수한다.'],
 ['우리 방송의 작은 박물관','직접 만든 방송 기록에서 전시할 장면을 고른다.','시간순으로 묶은 기록 전시를 시험 공개한다.','키몽이의 의견을 듣고 기록의 설명을 고친다.'],
 ['다시 부를 생일 노래','생일을 위한 독자 노래의 가사와 구성을 쓴다.','생일 노래의 짧은 시험편을 소개한다.','수정 피드백을 반영해 다음 생일에도 쓸 곡을 검수한다.'],
 ['우리가 쓴 기념책','게임 속 가상 글의 사용 동의를 받고 원고를 모은다.','짧은 생일 기념집 시제품을 소개한다.','오탈자와 배치를 고쳐 기념집의 시험 제작을 마친다.'],
 ['작은 질문 답변회','가상 팬 행사의 질문과 참가 순서를 정한다.','소규모 질문 답변 행사를 시험 운영한다.','답하지 못한 질문을 정리하고 행사 진행표를 수정한다.'],
 ['키몽이 미니 운동회','독자 미니게임의 규칙과 점수를 정한다.','키몽이 한 팀과 미니게임을 실제 시험 진행한다.','헷갈린 규칙을 고쳐 작은 운동회의 준비를 마친다.'],
 ['작은 농담이 코너가 된다','게임 안에서 나온 독자 유행어를 장면으로 만든다.','그 말을 활용한 상황극 파일럿을 공개한다.','과한 반복을 덜고 고정 코너의 진행안을 고친다.'],
 ['농담으로 만든 퍼즐','독자 퍼즐의 문제와 힌트를 직접 만든다.','가상 키몽이에게 시제품 플레이테스트를 맡긴다.','막힌 지점의 피드백을 반영해 퍼즐을 수정한다.'],
 ['초대받은 특집','가상의 외부 특집에 맡을 역할과 일정을 합의한다.','합의한 역할로 외부 가상 특집에 참여한다.','진행 기록으로 약속을 지켰는지 확인한다.'],
 ['오늘은 우리 방송','겹친 외부 제안 대신 직접 할 기획의 일정을 적는다.','예정한 방송에서 자체 코너를 실제로 진행한다.','준비했던 순서와 결과를 대조하고 마무리한다.'],
 ['작게라도 완성하기','큰 기획에서 이번에 끝낼 최소 범위를 고른다.','범위를 줄인 시범편을 직접 완성한다.','필수 장면을 확인하고 작은 완성본을 검수한다.'],
 ['여러 편으로 나누기','큰 기획을 서로 이어지는 여러 편으로 나눈다.','첫 파일럿을 끝까지 진행한다.','다음 편으로 넘어갈 구성을 검증하고 편성한다.'],
 ['방송일지 한 편','이번 방송에서 직접 만든 영상 기록을 편집한다.','독자 영상 기록을 시험 상영한다.','빠진 장면과 자막을 수정해 마지막 컷을 검수한다.'],
 ['움직이는 마지막 장','직접 만들 짧은 애니메이션의 장면을 고른다.','독자 애니메이션 시험편을 공개한다.','움직임과 읽는 속도에 대한 피드백을 반영한다.']
];
const projects=ending.events.flatMap(event=>event.choices.map(choice=>{
  const index=Number(choice.endingId.slice(-3))-1, ex=choice.experienceIds[0];
  return {id:choice.endingId,eventId:event.id,experienceId:ex,name:plans[index][0],steps:plans[index].slice(1),
    boundGame:requirements.experienceDefinitions[ex].sameGameAsProject,
    storyConditions:[...event.eligibility.all,...choice.prerequisites.all].filter(x=>x.path.startsWith('story.')&&!x.path.startsWith('story.endingProject.')),
    requirements:choice.eligibility.all,requiresOutfit:[14,15].includes(index),
    endingTitle:choice.endingTitle,resolution:choice.resolution,epilogue:choice.epilogue,
    endingChoice:choice.text};
}));
const catalog={version:'0.1.0',generatedBy:'scripts/compile-content.mjs',
  provenance:'공개 자료에서 착안한 비공식 창작 게임. 실제 발언·방송 결과 재현이 아님.',
  events,projects,endingEvents:ending.events,experienceDefinitions:requirements.experienceDefinitions,
  modules:long.modules,moduleEvents:long.events,moneyEvents:money.events,economy,status,
  reactions:dialogue.examples,
  outfits:[['base','기본 의상','오늘도 코코답게.','assets/characters/rakoko-base-v1.png'],
    ['ghost','유령 의상','하늘하늘한 천의 작은 장난.','assets/events/outfit-reveals/rakoko-ghost-v1.png'],
    ['maid','메이드 의상','프릴 한 겹, 특별한 하루.','assets/events/outfit-reveals/rakoko-maid-v1.png'],
    ['police','경찰복','의상은 준비 완료. 출동할까요?','assets/events/outfit-reveals/rakoko-police-v1.png'],
    ['nun','수녀복','차분한 흑백의 새로운 분위기.','assets/events/outfit-reveals/rakoko-nun-v1.png']].map(([id,name,description,image])=>({id,name,description,image})),
  games:[['puzzle','작은 퍼즐 탐정'],['strategy','처음 만나는 전략'],['action','한 판 더, 액션'],['coop','함께하는 협동전'],['rhythm','두근두근 리듬'],['boxing','방구석 복싱'],['sandbox','우리 동네 만들기'],...long.modules.map(m=>[m.gameId,m.name])].map(([id,name])=>({id,name}))};
await mkdir('src/data',{recursive:true});
await writeFile('src/data/catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log(`Compiled ${events.length} general events, ${projects.length} ending projects, ${long.modules.length} modules.`);
