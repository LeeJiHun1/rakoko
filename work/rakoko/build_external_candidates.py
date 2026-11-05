from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs'
rows=[
('통깡이','생일 팬게임 선물','생일 축하용 통깡런과 점프 회피 방식이 위키에 기록되어 있다.','https://m.namu.moe/w/통깡이/팬게임','2025-06-28','팬게임','선물 도착→규칙 익히기→기념 기록','제작자 배포 글과 실제 플레이 구간'),
('침착맨','팬이 만든 삼국지 게임','공개 영상 목록에서 팬 제작 삼국지 게임 두 작품을 다룬 제목을 확인했다.','https://www.koreachannels.com/ko/channel/chimchakman-gamefull','2026-10-24','팬게임','팬 작품 소개→취향에 맞는 코너로 편성','업로드일과 방송일 구분, 본편 규칙·반응'),
('케인','밈으로 만든 여러 장르의 팬게임','팬게임 목록에 방송 시뮬레이션·퍼즐·액션 등 서로 다른 방식의 작품들이 기록되어 있다.','https://m.namu.moe/w/케인(인터넷 방송인)/팬 게임',None,'팬게임','같은 방송 소재를 짧은 미니게임으로 바꾸는 방식','현재 배포 여부·제작자 원문·실제 플레이'),
('징버거','생일선물 팬게임 방송','공개 방송 기록에 생일선물 팬게임 제목이 남아 있다.','https://poonggo.com/station/jingburger1/history','2026-10-08','팬게임','생일 코너에 팬 작품을 배치','게임명·내용·방송 중 반응. 제목만으로 감동·성공 추정 금지'),
('아이네','화이트데이 팬게임','팬게임 플레이 목록과 영상 소개 미러에 화이트데이 관련 작품이 연결된다.','https://socialcounts.org/youtube-video-live-view-count/tvz3TJ7Ca1E',None,'팬게임','기념일에 맞춘 작은 팬 참여 콘텐츠','본편 내용과 화자, 배포 원문'),
('우왁굳','연말 공모전에서 팬게임 소개','외부 소개 글에서 공모전 팬게임과 제작자 배포 글을 연결한다.','https://imoneed.tistory.com/155','2023-01-29','팬게임','공모→작품 소개→팬 아이디어를 다음 코너로','게시일은 소개 글 기준. 원래 공모전·플레이 날짜 미확정'),
('따효니','팬게임을 방송 일정에 편성','캘린더에 킁리단의 분노 팬게임을 포함한 일정과 원 공지 링크가 있다.','https://dal.wiki/t/v1c2BaT1zEvn/e/ioehrhm7uz7n','2025-02-03','팬게임','팬 작품 도착→정규 일정에 편성','예정과 실제 실행 구분·본편 결과'),
('라디유','받은 팬게임을 방송 소재로','공개 방송 제목 기록에 팬게임을 받았다는 내용이 있다.','https://weflview.com/channel/chzzk/68f895c59a1043bc5019b5e08c83a5c5','2026-10-20','팬게임','준비한 방송에 팬 작품 코너를 추가','게임 종류·제작자·실제 플레이 구간'),
('연두','방송 밈을 담은 생일 팬게임','위키는 생일 팬게임 연과같이에 기존 방송 밈이 활용됐다고 서술한다.','https://seore.org/w/연두(인터넷 방송인)',None,'팬게임','검증한 고유 소재를 미니 콘텐츠로 연결','원 제작·배포 글·생일 방송. 인격 구분 설정은 각색에 사용하지 않음'),
('머독','팝콘집 경영 팬게임','개발자 소개에서 클릭·고용·경매를 결합한 팬게임임을 확인했다.','https://goldmetal.itch.io/mdps','2017','팬게임 구조 참고','고유 방송 소재를 반복 운영 규칙으로 확장','개발자 설명 확인. 실제 방송 해프닝의 원영상은 별도 검증'),
('머독','퀴즈와 여러 엔딩을 결합한 팬게임','개발자 페이지에 퀴즈 유형과 복수 엔딩이 소개되어 있다.','https://goldmetal.itch.io/pdmd','2018','팬게임 구조 참고','퀴즈 성적과 선택에서 서로 다른 회고','개발자 설명 확인. 전 문항·모든 엔딩을 플레이한 것은 아님'),
('레바','방송인 캐릭터를 쓴 액션 팬게임','아카이브에 개발자와 액션 장르가 기재된 게임이 있다.','https://flasharch.com/ko/archive/play/1d12ef808a9f977b46c4b11a3a6e28af',None,'팬게임 구조 참고','같은 캐릭터를 유지하며 장르를 바꾸는 사례','방송인 대상 팬게임과 다른 IP 기반 팬게임의 중첩 구분'),
('소니쇼','초보자를 위한 대회 기획','기사에서 포챔스 유치원 운동회가 초보 스트리머의 학습·대결 콘텐츠였다고 설명한다.','https://www.gameple.co.kr/news/articleView.html?idxno=216113',None,'학습·대회','배우기→작은 연습→친선 대결','원 공지·참가자·규칙·본편 날짜. 기사 원문 재접속은 403'),
('남봉','함께 참여하는 게임 서버 주최','같은 기사에서 코블몬 기반 봉켓몬 합동 콘텐츠 주최를 언급한다.','https://www.gameple.co.kr/news/articleView.html?idxno=216113',None,'서버·협업','참가 준비→서버 활동→활동 회고','일정·원 공지·개별 행동과 결과'),
('비챤·우왁굳·아이네·징버거·릴파·주르르·고세구','시청자 투표가 반영되는 영상 선택 콘텐츠','플랫폼 소개에서 준비 영상의 선택과 실시간 투표가 결합된 콘텐츠를 확인했다.','https://pick.sooplive.com/daily/view/161565','2025-02-15','시청자 참여','제안→투표→화면 반영→다른 결과','날짜는 소개 기사. 실제 방송 구간·각 참여자의 발화는 미확인. 연애 설정을 복사하지 않음'),
('고세구·우왁굳·아이네·징버거·릴파·주르르·비챤','방송 클립을 활용한 기념 합방','콘텐츠 목록에 데뷔 기념일의 클립 캐치 합방이 기록되어 있다.','https://www.namu.moe/w/고세구/콘텐츠','2024-12-17','회고·합방','이전 장면을 알아보기→새 농담→회고','원본 영상·실제 규칙. 참가자마다 별개 사건으로 부풀리지 않음'),
('고세구','눈사람 만들기 컨테스트','콘텐츠 목록에 해당 제목이 있다.','https://www.namu.moe/w/고세구/콘텐츠',None,'창작 참여','작은 주제 제안→작품 감상→다음 아이디어','제목 단계. 결과·참가 규모·방식 미확인'),
('릴파','단독 공연과 방송 회고','공개 공연 기록에서 공연과 이후 녹화본 송출 구성이 확인된다.','https://www.namu.moe/w/LILPACON : Going Out - SOOPER CONCERT','2024-07-12~13','준비·공연','선곡→연습→작은 무대→함께 돌아보기','제작 준비 과정·방송 반응. 행사 규모를 그대로 옮기지 않음'),
('아이네','방송 장비 문제로 재시작','위키에 컴퓨터·장비 문제 때문에 방송을 껐다 켠 사례가 서술되어 있다.','https://www.alphawiki.org/raw/아이네?uuid=9747839f-045a-4ce4-a5cb-05c07a9087a9',None,'장비 해프닝','문제 발견→재접속→다른 코너로 수습','정확한 날짜·원인·복구 행동. 관련 오컬트 명칭은 게임에 사용하지 않음'),
('라디유','장비 구매 경로가 돌아간 해프닝','콘텐츠 정리 문서에 국내 장비를 해외 경로로 구입한 이야기가 있다.','https://m.namu.moe/w/라디유/콘텐츠 및 게임',None,'준비 해프닝','구매 전 사양 확인→준비 방식 선택','금액·관세·경위 원영상 확인. 가격이나 손해를 사실로 확정하지 않음'),
('김도','예상보다 길어진 게임과 엔딩 도전','2019년 기록에는 Reventure의 추가 엔딩을 찾아 도전을 이어간 내용이 있다.','https://dark.namu.moe/w/김도/플레이한 게임/2019년','2019','게임 도전','끝인 줄 알았는데 새 목표→재계획→후기','방송 날짜·목표 발견·계속하기 판단·실제 완료 구간'),
('녹두로','팬게임 플레이가 다른 사람의 플레이로 이어짐','개인 리뷰가 녹두로의 포케로그 영상을 보고 게임을 시작했다고 기록한다.','https://camelpage.tistory.com/entry/게임-리뷰-PokéRogue','2024-06-19','게임 확산','방송 소재→시청자도 도전→후기 도착','리뷰 작성자의 경험. 스트리머 고유 팬게임으로 잘못 분류하지 않음'),
('침착맨·서새봄·후추·승우아빠·매직박','여러 사람이 함께하는 게임 캠프','공개 영상 목록에 참가자와 캠프 구성 제목이 기록되어 있다.','https://creatorafterwork.com/channel/UC027x98NgUBw9K4aPT8k0mg/videos/','2026-10-21','협업·기획','함께 목표 정하기→역할 배분→작은 마무리','업로드일과 개최일 대조. 장시간/수면 제한은 우리 게임에 옮기지 않음'),
('풍월량','팬게임 개발 과정 공개','치지직 목록에 풍월량 팬게임 개발 시리즈가 남아 있다.','https://m.chzzk.naver.com/videos?tags=유니티','2026-10','팬게임 제작 단서','작품 제작 중간 소식→완성 후 소개','풍월량 본인이 실제 플레이한 사건은 아직 확인하지 않음'),
]
cards=[]
for i,(people,title,fact,url,date,category,adapt,need) in enumerate(rows,1):
    cards.append(dict(id=f'EXT-{i:03}',people=people.split('·'),title=title,date=date,category=category,evidence_grade='C',evidence_kind=('개발자 공개 소개' if 'goldmetal.itch.io' in url else '외부 기록'),source_fact=fact,source_url=url,adaptation_structure=adapt,verification_needed=need,vod_audio_screen_verified=False,rakoko_real_event=False,release_ready=False))
teams=[
('민기 THE 프린세스',['매드라이프','박옥자누나','델로략국','금휘','이글콥']),
('내적팀밀감',['크캣','쁘허','형독','루시아','고차비']),
('%%이글스',['푸린','멋사','너불','루다','백곰파']),
('제홍 THE 퀸',['행수','류제홍','연리','렘쨩','둥그레'])]
roster=[]
for team,people in teams:
    roster.extend(dict(person=p,event='2024 자낳대: 사이퍼즈',team=team,scope='참가·팀 편성 기록 확인. 개인 해프닝 수집 완료 아님.',source_url='https://www.namu.moe/w/2024 자낳대: 사이퍼즈') for p in people)
people=sorted(set(p for c in cards for p in c['people'])|set(r['person'] for r in roster))
payload=dict(as_of='2026-11-03',candidates=cards,tournament_participation_registry=roster,unique_named_subjects=len(people),named_subjects=people,individual_vod_verifications=0)
(OUT/'rakoko_external_candidates.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# 타 스트리머 소재 — 외부 탐색 1차','',f'2026-11-03 | 후보 묶음 {len(cards)}개 | 이름이 연결된 대상 {len(people)}명 | 원음·화면 검증 완료 0건','',
'**명단 확인과 개인 사건 조사는 다르다.** 아래 후보와 별도로 대회 참가 20명의 팀 편성을 확인했다. 그 20명을 서로 다른 20개 해프닝으로 계산하지 않았다. 같은 합방의 여러 참가자도 하나의 사건 묶음이다. 이전의 ‘20명 이상 팬게임 조사’를 완료했다는 보고가 아니며, 팬게임 소유자·팬게임 플레이어·개발자·합방 참가자를 구분해 후속 조사한다.','',
'모든 항목은 C(외부 단서)다. 개발자 소개는 게임 설명에 대한 1차 근거일 뿐, 스트리머가 실제로 어떻게 반응했는지 검증한 자료가 아니다. 외부 출처의 과장·오류 가능성과 게시일/방송일 차이는 남겨 둔다.','',
'라코코에게 실제 있었던 일로 옮겨 적지 않는다. 건강·계약 분쟁·사생활·오컬트·정체성 교체는 카드 소재에서 제외한다. 원문의 긴 대사와 고유 밈 대신 준비·수습·협업·회수의 구조를 추출한다.','',
'## 우선 검증할 묶음','',
'생일 팬 작품, 시청자 투표, 작은 친선 대회, 콘텐츠 제작, 장비 수습, 목표 재도전부터 검증한다. 공포 팬게임이나 정체성 변형을 포함하는 작품은 내용 복사의 대상이 아니다.','',
'## 후보 목록','']
for c in cards:
    lines += [f'### {c["id"]} · {c["title"]}','',f'- 대상: {" · ".join(c["people"])}',f'- 분류: {c["category"]} | 날짜 단서: {c["date"] or "미확정"}',f'- 외부에서 확인: {c["source_fact"]}',f'- 출처: [{c["evidence_kind"]}]({c["source_url"]})',f'- 각색 방향〔창작〕: {c["adaptation_structure"]}',f'- 추가 확인: {c["verification_needed"]}','- 상태: C · 원본 대조 전 · 게임 채택 미확정','']
lines += ['## 대회 참가자 추가 조사대장','', '[공식 대회 안내](https://www.enchantenter.team/jnd/2024cyphers)에서 경매·대회 일정을 확인하고, [대회 기록](https://www.namu.moe/w/2024%20자낳대:%20사이퍼즈)과 [비공식 참가팀 목록](https://czzboard.com/streamers/tournaments/jnd-2024-cyphers)을 대조했다. 공식 라인업 페이지는 접근 오류가 있어 직접 대조를 마치지 못했다.','', '| 팀 | 참가자 | 다음 조사 |','|---|---|---|']
for team,ps in teams:
    lines += [f'| {team} | {", ".join(ps)} | 역할 정하기·팀 연습·전술 변경·대회 후기의 원본 구간 |']
lines += ['', '20명은 참가 기록 수준의 조사대장이다. 각자의 말투나 성격을 추정하지 않고, 실제로 확인한 연습·역할·후기만 사건으로 승격한다. 팀 편성·연습·역할 변경·경기·후기는 같은 연속 사건으로 연결한다.','', '## 다음 수집 규칙','', '1. 원 공지/제작자 배포 글 → 영상 날짜·구간 → 전후 맥락 순으로 검증한다.','2. 예정표·제목만으로 실행이나 성공을 확정하지 않는다.','3. 같은 사례를 소개하는 위키 미러들은 독립 증거로 세지 않는다.','4. 새 사람 수를 늘리는 일과 새 사건 구조를 찾는 일을 별도 집계한다.','5. 라코코의 말·약속 회수에 맞는지를 채택 기준으로 삼고, 타인의 유명 밈을 그대로 넣지 않는다.']
(OUT/'rakoko_external_candidates.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
assert len(roster)==20 and len(set(r['person'] for r in roster))==20
assert all(c['evidence_grade']=='C' and not c['rakoko_real_event'] for c in cards)
print(f'{len(cards)} candidate groups; {len(people)} named subjects; 20 tournament registry entries; 0 VOD-verifications.')

