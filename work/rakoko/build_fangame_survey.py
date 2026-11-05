import json
from pathlib import Path

root=Path(__file__).resolve().parents[2]
raw='''머독|머도기네 팝콘집|Goldmetal|경영·클리커|팝콘 판매, 직원 고용, 재료와 경매 수집으로 가게 성장|https://goldmetal.itch.io/mdps|국내|밈을 반복 행동과 수집으로 연결
Koseki Bijou|Pebbles|SyncNone|생존 아케이드|근접 공격으로 바위를 쪼개고 점수를 소비해 능력 사용|https://syncnone.itch.io/pebbles|해외|점수 획득과 능력 소비의 선택
Kureiji Ollie|Udin Invaders|SyncNone|슈팅|좌우 이동과 발사로 침입자 대응|https://syncnone.itch.io/udin-invaders|해외|짧은 조작 코너
Murasaki Shion|シオン先輩育成ゲーム|manzyu2003|텍스트 육성|매일 행동 선택, 20일 뒤 자동 전투로 판정|https://manzyu2003.itch.io/shioshachi|해외|날짜별 선택과 상태 관찰만 참고; 전투 설정 이식 제외
Raora Panthera|Raora Panthera Day 2026!!!|Azter Brew|배치·조합|생일상에 물건을 끌어다 놓아 조합|https://blu-asul.itch.io/raora-day-2026-blu-asul|해외|팬 축하 코너의 조합형 상호작용
Mococo Abyssgard|Mococo’s Pup Talk|shamantitan|대화형 비주얼노벨|정기 방송의 격려 코너를 짧은 대화형 작품으로 구성|https://shamantitan.itch.io/mococos-pup-talk|해외|실제 고정 코너를 독립적인 놀이로 바꾸는 발상
Kobo Kanaeru|Wrath of Kanaeru|soulofkazak|플랫포머|등대를 올라 Kobo에게 간식을 전달; 이동과 상호작용·회전 조작|https://soulofkazak.itch.io/wrath-of-kanaeru|해외|가벼운 심부름 목표와 이동 도전
Takanashi Kiara|Tenchou’s Deadline Dash!|LogicalFish 외|업무 미니게임·러너|녹음 음량 유지, 썸네일 선택, 메시지 처리, 서명 입력|https://logicalfish.itch.io/tenchous-deadline-dash|해외|방송 준비 작업을 서로 다른 짧은 조작으로 표현
Haachama|Haachama’s Cooking Chaos|Sailor Ares 외|카드·요리 퍼즐|손님 요구에 맞는 재료 카드를 고르고 시간 비용으로 버림|https://sailor-ares.itch.io/holojam-7|해외|요청과 준비 카드의 조합; 기괴한 음식 표현은 채택하지 않음
Aki Rosenthal|Rosetai to the Sky|Wepeko|무한 상승|자동 점프 중 좌우 조작으로 최고 높이에 도전|https://wepeko.itch.io/rosetai-to-the-sky|해외|최고 기록에 재도전하는 짧은 코너
Airani Iofifteen|Chiyofish|Arcana|수집·회피 액션|클릭·터치 유지로 이동, 먹이를 먹고 다른 물체 회피|https://arcana.itch.io/chiyofish|해외|한 가지 조작에 획득과 회피를 결합
Amane Kanata|BURNING TENSHI|SylverDev|이동 퍼즐|퍼즐을 통과해 연못에 도달; 어려운 레벨 건너뛰기 지원|https://sylverdev.itch.io/burning-tenshi|해외|막힌 코너를 건너뛰는 진행 보조만 참고
Hoshimachi Suisei|Suisei Will Save Us All|planet drop|블록 대응 액션·음악|떨어지는 블록에 대응하며 곡 끝까지 진행; 스테이지별 이야기|https://planetdropper.itch.io/suisei-will-save-us-all|해외|짧은 코너와 이야기의 교대; 음악 사용권은 별도
Ouro Kronii|Chrono Crux|David Wu SoftDev|방어 슈팅|조준과 사격으로 공격 방어, 사격에도 점수 비용|https://david-wu-softdev.itch.io/chrono-crux|해외|행동마다 비용이 있는 기록 경쟁; 시간 세계관 이식 제외
Omaru Polka|Polugram Circus|mevedev|스테이지 액션|서커스 스테이지를 통과, 제작자 설명상 엔딩 2개|https://mevedev.itch.io/polugram-circus|해외|분기 존재만 참고; 무서운 엔딩·기존 게임 리메이크 방식 제외
Houshou Marine|ホロ読み|Itzeusmti|기념일 미니게임|방송 2주년 기념 작품, 방향키와 Z 조작, 약 10분 안내|https://itzeusmti.itch.io/holoyomi|해외|기념일 콘텐츠를 짧은 묶음으로 제공
Sakura Miko|Whack-a-Miko|AoiSora|타이핑·리듬|문자로 망치 위치를 맞춰 댓글을 보내 타격, 정확도 보상|https://aoisora-3d.itch.io/whack-a-miko|해외|방송 채팅 행동 자체를 조작 규칙으로 변환
Nanashi Mumei|Mumei’s Memory Juggling|David Wu SoftDev|기억 카드|짝 맞춘 카드가 배치에 영향을 줌; 이야기·시간 도전·대전 모드|https://david-wu-softdev.itch.io/mumeis-memory-juggling|해외|평소 성향을 규칙으로 연결하고 모드로 확장
Tsukumo Sana|BEEG SANA|MooCow Games|낚시·휴식형|제작자 페이지의 Fishing·Relaxing 태그 확인; 상세 진행은 미검증|https://moocow-games.itch.io/beeg-sana|해외|조작·엔딩 추정 보류, 편안한 코너의 유형 사례
Watson Amelia|Smol Ame|MooCow Games|플랫포머|방향키 이동 중심의 팬 액션, 여러 레벨 업데이트 기록|https://moocow-games.itch.io/smol-ame|해외|팬 캐릭터 표현을 이동형 놀이로 확장
IRyS|Delivering Hope|David Wu SoftDev|발사·거리 기록|각도·세기를 정해 발사하고 충전량을 써서 상승·하강 보조|https://david-wu-softdev.itch.io/delivering-hope-hololive-fangame|해외|짧은 재시도와 보조 자원 선택
Ninomae Ina’nis|Ina’nis: Tako Rescue Mission|Not Shu|구출 액션|5+1 레벨, 근접·원거리 공격과 그래플로 Takodachi 구출|https://not-shu.itch.io/inanis-tako-rescue-mission|해외|마스코트와 팬을 목표에 연결; 세계관 이식 제외
Himemori Luna|Lu-Knight Quest|Thomas L.|플랫포머|팬 기사가 Luna를 구출하는 액션; 이동·점프·무기 공격|https://jetstorm4.itch.io/lu-knight-quest-the-rescue-of-himemori-luna|해외|장르 분류용; 마왕·판타지 구출 설정 채택 제외
Inugami Korone|Korone Potris|David Wu SoftDev|방송 발상 퍼즐|방송에서 보여 준 발상을 게임화; 가로 회전 중 낙하 정지 규칙|https://david-wu-softdev.itch.io/korone-potris|해외|라코코 자신의 즉흥 규칙을 찾는 조사 방식에 가장 유용
Gawr Gura|Gura’s Grand Sekai Adventure|HanaNoUmi 외|리듬·비주얼노벨|3개 레인 타이밍 입력, 실패 누적으로 나쁜 엔딩 조건|https://hananoumi.itch.io/grandsekai|해외|코너 성과와 이야기 분기 연결만 참고; 어두운 설정 제외
Tokino Sora|Ina Vs Sora|SanpoNeko|대결 액션|Ina와 Sora의 대결을 중심으로 한 짧은 액션|https://sanponeko.itch.io/ina-vs-sora|해외|친선 대결의 장르 사례; 승부 상세 규칙은 미검증'''
raw+='\n침착맨|땅국지(쌈국지 웹게임)|강동의이병건개방장사랑해|다인 전략·명령 예약|제작자 베타 공개 글에 세력·탐색·군량·명예의 전당 업데이트 안내; 침착맨 본인이 다인 플레이를 추천|https://chimhaha.net/recommend_comics/933663|국내|팬 피드백과 다음 회차 개선의 연결; 운영·가입 기능 이식은 별도 판단'
raw+='\nVedal987|Where is tutel ?|DayMoniakk|숨은 대상 찾기|무작위 배치된 인물과 소품 사이에서 거북이 Vedal을 찾고 진행에 따라 난도가 변화|https://daymoniakk.itch.io/where-is-tutel|해외|짧은 관찰 코너와 무작위 배치; 원작 탐색 화면 복제 제외'
raw+='\nIronmouse|FPIP (Fruit Pencil Ironmouse Pencil)|Miro Dro|대결 액션|연필 형태와 과일 무리의 대결을 설명한 개발 중 팬게임|https://miro-dro.itch.io/fpip|해외|소품 밈의 규칙 변환 사례; 승리 조건 세부는 미검증'
raw+='\nFilian|Filian is Lost|SalemSalem|탐색·플랫포머 미니게임|방향키 이동·상호작용·대시 조작, VR 로비 진입 때 자동 저장|https://salemsalem.itch.io/filian-is-lost|해외|탐색과 짧은 조작 코너의 결합; 전체 줄거리·엔딩은 미검증'
rows=[]
for i,line in enumerate(raw.splitlines(),1):
    person,game,creator,genre,loop,url,region,note=line.split('|')
    rows.append(dict(id=f'FG-{i:03}',streamer=person,game=game,creator=creator,type=genre,description=loop,source_url=url,region=region,design_note=note,evidence='제작자 배포 페이지 확인',played=False,checked_at='2026-11-03'))
assert len(rows)>20 and len({r['streamer'] for r in rows})==len(rows)
assert len({r['source_url'] for r in rows})==len(rows)
out=root/'outputs'
(out/'streamer_fangame_survey.json').write_text(json.dumps({'as_of':'2026-11-03','distinct_streamers':len(rows),'games':rows,'scope':'국내 2명, 해외 28명(홀로라이브25, 그 밖3). 각기 다른 작품 30개. 제작자 설명 조사이며 직접 플레이 검증은 아님.'},ensure_ascii=False,indent=2),encoding='utf-8')
text='''# 스트리머 팬게임 유형 조사 — 30명·30작품

조사일: 2026-11-03. **국내 2명, 해외 28명(홀로라이브 25명, 그 밖 3명)**. 제작자 배포 페이지를 직접 열어 작품과 대상 스트리머, 공개된 규칙을 확인했다. 국내 사례가 충분하다는 의미는 아니며 해외 홀로라이브에 편중된 표본이다. 국내 후보 중 배포 원문·게임 내용 연결이 부족한 항목은 기존 외부 후보대장에 남겼고 아래 수에 포함하지 않았다. 침착맨 추가 근거: [본인의 추천 글](https://chimhaha.net/best/month/933806?page=1). 땅국지는 제작자 게시글에서 안내하는 작품이며 배포 페이지가 현재 실행된다는 검증과는 구분한다.

한 집단 작품의 등장인물이나 대회 참가자 명단으로 인원수를 늘리지 않았다. 30명마다 서로 다른 작품을 연결했다. 모든 작품을 직접 플레이한 것은 아니며 길이·엔딩·세부 조작은 제작자가 공개한 범위만 적었다. 원작 방송의 사건을 검증한 자료와도 구분한다.

## 개별 조사

|번호|스트리머|작품·제작자 원출처|유형|확인한 내용|
|---|---|---|---|---|
'''
for r in rows:
    text+=f"|{r['id']}|{r['streamer']}|[{r['game']}]({r['source_url']}) · {r['creator']}|{r['type']}|{r['description']}|\n"
text+='''
## 라코코 게임에 적용할 판단

다음은 위 작품들의 성과를 측정한 결과가 아니라, 확인한 설계를 바탕으로 한 기획 해석이다.

1. **방송에서 나온 발상 → 규칙**: Korone Potris, Whack-a-Miko처럼 방송 특유의 행동을 조작으로 바꾸면 이름만 바꾼 게임에서 벗어나기 쉽다. 라코코 자료에서 즉석 규칙, 반복되는 진행 습관, 채팅과의 주고받기를 우선 찾는다.
2. **방송 코너 → 짧은 놀이**: Mococo의 정기 코너 재구성, Kiara의 업무 미니게임 사례를 참고해 잡담·준비·팬 참여를 각각 짧은 선택/조합으로 만든다. 해당 작품의 대사·음성·화면·문제는 가져오지 않는다.
3. **누적 성장 → 반복 시도의 이유**: 경영·수집·기록 경쟁 사례는 사건 수가 적어도 반복 구조를 만드는 방법을 보여 준다. 라코코 게임은 돈·장비 성장표 대신 미완료 도전과 다음 방송 약속을 남긴다.
4. **이야기 + 코너 결과 → 여러 결산**: 날짜별 육성, 이야기 모드, 분기 엔딩의 구조만 비교한다. 결산은 같은 라코코의 기획·도전·합방·팬 참여 기록에 따라 달라지게 제안한다.

추천 중심 구조: 방송 준비 → 코너 3개 편성 → 사건 대응 → 남길 장면과 약속 선택 → 다음 방송의 후속 사건 → 플레이어가 편집한 방송일지. 단순 무작위 사건 추가보다 이전 선택에 조건을 둔 후속 사건을 늘리는 방향이다.

## 추가로 수집해야 할 라코코 데이터

|대상|필요한 기록|게임에서의 용도|
|---|---|---|
|즉석 규칙|처음 제안한 사람, 규칙, 실제 수행 구간|고유 미니게임 발굴|
|반복 코너|시작·끝, 진행 순서, 시청자 참여 방식|코너 편성과 변형|
|약속|발언·조건·기한, 후속 방송에서 수행 여부|여러 방송에 걸친 사건 연결|
|재도전|실패 이후 다음 선택, 재도전·중단 계기|도전 연속 카드|
|준비와 수습|문제 발생 전 준비, 수습 선택과 결과|준비 선택의 효과|
|밈의 변형|최초 등장·재등장·쓰지 않는 맥락|반복에 따른 대사 변화|

원음·화면 확인 전에는 자동 자막을 확정 말투나 실제 결과로 승격하지 않는다. 다른 스트리머의 게임 속 사건은 실화가 아니며, 라코코에게 실제 발생한 것으로 옮기지 않는다.

## 채택에서 제외할 요소

오컬트·공포 연출, 심각한 사건, 실제 은퇴·계약·사생활, 타 캐릭터로 환생하는 구조는 제외한다. 표 안의 판타지·어두운 연출이 있는 작품은 유형 조사 자료일 뿐 채택 권고가 아니다. 타 작품의 UI·대사·코드·음성·음악·이미지·기존 게임 리메이크 자산을 옮기지 않는다. 제작자 페이지에 적힌 이용 지침은 해당 작품의 설명이며 라코코 팬게임의 사용 허락을 대신하지 않는다.
'''
(out/'streamer_fangame_survey.md').write_text(text,encoding='utf-8')
print(f'검증 완료: {len(rows)}명, {len(rows)}개 서로 다른 제작자 배포 페이지')
