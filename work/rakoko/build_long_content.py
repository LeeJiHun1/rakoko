"""Build researched content frameworks and original playable-design event chains."""
import json
from pathlib import Path

OUT=Path(__file__).resolve().parents[2]/'outputs'
SOURCES=[
 ('LCS-01','SOOP 어쎔블·악어의 놀이터2 제작 지원','https://www.hankyung.com/article/202407129335P','기업 배포 보도자료의 매체 게재본','본문에 SOOP 제공 보도자료라고 명시. 악어의 놀이터2 통합 서버 지원과 어쎔블-폴가이즈 개최를 확인. 플랫폼 간 협업과 플랫폼 주도 대회를 참고한다.'),
 ('LCS-02','VCR GTA3 안내','https://prtimes.jp/main/html/rd/p/000000038.000091658.html','Rockstar 안내를 담은 기업 배포 보도자료','초대형 스트리머 서버, 한정 기간, 역할별 활동과 서버별 규칙을 확인. 도시 직업·가벼운 시민 역할극으로 각색한다.'),
 ('LCS-03','HermitCraft 공식 사이트','https://hermitcraft.com/','참여자 공동체 공식 사이트','참여자 방송과 시즌별 월드 다운로드 목록을 확인. 경제·직업의 세부 규칙을 이 페이지가 입증한다고 보지는 않는다.'),
 ('LCS-04','VAULTROOM ARK 서버 기록','https://vaultroom.shop/en/blogs/streamer-server-ark','주최자 공식 아카이브','운영자의 ARK 스트리머 서버 기록 존재를 확인. 상세 생존 활동은 게임사 소개와 별도로 대조한다.'),
 ('LCS-05','ARK 게임 소개','https://store.steampowered.com/app/346110/ARK_Survival_Evolved/','개발·배급사 공식 상품 설명','생존·제작·건설·생물 길들이기·협동 구조를 확인. 스트리머 개인의 특정 성과를 증명하는 자료는 아니다.'),
 ('LCS-06','Guild Wars 2 레이드 설계','https://www.guildwars2.com/en/news/designing-challenging-content/','게임 개발사 공식 설계 설명','역할 분담·협동·공략 단계·실행 역량, 반복 연습과 고유 보상 주기를 확인. 특정 스트리머 공대의 이력으로 분류하지 않는다.'),
 ('LCS-07','Twitch Rivals x Clash Streamer Showdown','https://www.leagueoflegends.com/en-us/news/community/twitch-rivals-x-clash-streamer-showdown/','공동 개최 게임사 공식 안내','플랫폼·게임사 협업, 팀 단위 스트리머 대회, 조별 경기와 플레이오프, 공식 방송과 개인 시점을 확인.'),
 ('LCS-08','CR CUP 공식 소개·대회 기록','https://crcup.jp/','대회 주최 조직 공식 사이트','다종목·초청전, 스크림과 본대회 일정 분리를 확인. 개인 스트리머 단독 주최라고 분류하지 않는다.'),
 ('LCS-09','獅白杯 운영 사례','https://gloe.jp/works/202604_shishirohai/','공동 주최·운영사 공식 실적','獅白ぼたん 발의의 초청·공모형 대회, 공모 토너먼트·본대회·동서 대항전과 제작·운영을 확인. 개인 기획자와 법적 주최 조직을 구분한다.'),
 ('LCS-10','PlateUp! 게임 소개','https://store.steampowered.com/app/1599600/PlateUp/','개발·배급사 공식 상품 설명','협동 요리·서빙·식당 설계·확장·반복 경영 구조를 확인. 특정 방송인의 플레이 사실을 뜻하지 않는다.'),
 ('LCS-11','Virtual Market 공식 사이트','https://vket.com/en/','주최자 공식 사이트','가상 전시, 출전 신청·창작물 제출, 월드·부스와 이용자 기획 구조를 확인. 현재 일정은 게임 날짜에 복사하지 않는다.'),
 ('LCS-12','VAULTROOM RUST3 기록','https://vaultroom.shop/en/blogs/vcr-rust3/memory-of-vcr-rust3','주최자 공식 아카이브','다회차 공유 서버 기록을 확인. 실제 약탈·갈등을 게임 사건으로 옮기지 않는다.')
]

# Each row: scene; option 1 ~ stat gate ~ outcome; option 2 ...; safe option ... .
MODULES=[
 ('MC','블록 마을 공동생활','Minecraft 대형 공유 서버 계통','sandbox_blocks',['LCS-01','LCS-03'],['build','reputation','supplies'],[
 '서버 입장 설명회|상점 구역을 둘러본다~planning:20~장터 동선 메모를 얻는다|공동 건축 안내를 듣는다~operation:20~공용 작업 규칙을 익힌다|초보 안내부터 받는다~~초보 거처와 기본 재료를 받는다',
 '첫 거처와 역할 선택|자원 담당을 맡는다~gameSkill:20~자원 정리 역할을 정한다|작은 가게를 준비한다~planning:25~판매 준비 역할을 정한다|공동 창고 보조를 한다~~누구나 가능한 보조 역할로 정착한다',
 '장터 주문이 겹쳤다|묶음 주문표를 짠다~planning:30~주문 처리가 안정되어 마을 평판이 오른다|팀과 배송을 나눈다~operation:30~서로 나눌 배송 약속을 만든다|적은 주문만 받는다~~규모를 줄여 손실 없이 주문을 마친다',
 '공동 창고의 표지판|분류 체계를 만든다~planning:25~다음 재료 탐색이 쉬워진다|안내 방송으로 사용법을 알린다~community:30~마을 참여자와 시청자가 규칙을 이해한다|정해진 칸부터 정리한다~~기본 재료를 정리하고 사용 기록을 남긴다',
 '마을 건축 의뢰|동선을 포함해 설계한다~planning:40~공용 건물의 설계 기여가 남는다|작업 구간을 나눈다~operation:35~공동 작업의 역할 합의가 생긴다|작은 장식 구역을 맡는다~~가능한 규모로 건축에 참여한다',
 '축제 부스 기획|미니게임 부스를 설계한다~planning:45~시험할 독자 부스 기획을 만든다|참여자 안내대를 기획한다~community:35~팬 참여 안내 기획을 만든다|작은 전시대부터 준비한다~~검수 가능한 작은 부스를 만든다',
 '부스 시범 운영|공식 시험 순서를 진행한다~operation:40~부스의 안내와 운영 시험을 마친다|규칙의 빈틈을 수정한다~planning:40~수정된 부스 규칙을 검증한다|참가자 한 팀과 연습한다~~도움을 받아 작은 부스를 시험한다',
 '서버 축제와 폐장|검증한 부스를 운영한다~operation:45~기획 규모의 축제 부스를 완료한다|건축물 안내 투어를 한다~planning:40~완성 건축물과 과정을 소개한다|완성한 작은 구역을 소개한다~~참여한 범위의 기록을 남기고 시즌을 마친다']),
 ('RP','도시 생활 역할극','GTA 인생 서버 계통','city_roleplay',['LCS-02'],['roleExperience','trust','credits'],[
 '시민 역할 안내|운송 직업을 견학한다~operation:20~운송 규칙과 도시 지도를 익힌다|정비 작업장을 견학한다~planning:20~정비 작업 순서를 익힌다|신입 시민 안내를 받는다~~기본 이동과 시민 규칙을 배운다',
 '첫 직업 체험|택시 시범 근무를 한다~gameSkill:20~운송 역할을 정하고 안내 운전을 마친다|정비 접수 보조를 한다~operation:25~접수와 작업 배분을 경험한다|안내소 보조로 시작한다~~신입에게 가능한 역할로 정착한다',
 '예약 손님이 몰린 날|운송 순서를 재배치한다~operation:35~약속 시간을 조정하고 신뢰를 얻는다|동료에게 배차를 제안한다~community:30~공동 운송 합의를 남긴다|새 예약을 줄인다~~받아 둔 예약만 처리한다',
 '가게 간판을 정한다|서비스 안내판을 만든다~planning:30~상점의 서비스 범위를 분명히 한다|시민 의견을 모은다~community:30~가상의 시민 의견으로 간판을 정한다|기본 안내판을 쓴다~~준비된 기본 간판으로 영업한다',
 '동료의 공동 근무 제안|역할별 업무표를 짠다~operation:35~공동 근무 순서를 검증한다|가벼운 도시 투어를 제안한다~planning:35~진행할 투어 경로를 준비한다|짧은 보조 근무만 한다~~무리하지 않는 근무 약속을 만든다',
 '도시 행사 운송 준비|행사 배차 계획을 세운다~operation:45~시민 행사의 운송 기획을 준비한다|초보 시민 투어를 기획한다~planning:40~새 시민을 위한 투어를 설계한다|안내소의 작은 구역을 맡는다~~소규모 행사 역할을 준비한다',
 '행사 전 모의 근무|예약표대로 운행한다~gameSkill:40~운행 시험과 안내를 마친다|접수 동선을 시험한다~operation:40~접수와 배차 오류를 수정한다|짧은 구간을 함께 시험한다~~도움을 받아 맡은 구역을 검수한다',
 '도시의 마지막 행사|준비한 시민 서비스를 운영한다~operation:45~직업 역할을 지키며 행사를 마친다|역할극 비하인드를 소개한다~planning:40~함께 만든 이야기를 방송에서 회고한다|동료에게 인사하고 역할을 정리한다~~시민 역할의 마무리를 기록한다']),
 ('SV','협동 생존 정착기','ARK·RUST 공유 서버 계통','survival_coop',['LCS-04','LCS-05','LCS-12'],['base','supplies','teamwork'],[
 '공동 거점 초대|안전 동선을 확인한다~operation:20~거점 주변의 이동 계획을 익힌다|자원 지도를 만든다~planning:20~모을 자원과 장소를 표시한다|초보 동행으로 들어간다~~기본 도구와 거점 설명을 받는다',
 '거점 역할 나누기|탐사 담당을 맡는다~gameSkill:25~탐사 역할과 복귀 규칙을 정한다|건축 담당을 맡는다~planning:25~작은 거점 설계를 맡는다|물자 정리부터 돕는다~~안전한 보조 역할로 정착한다',
 '공용 물자 운반|운반 경로를 줄인다~gameSkill:30~물자를 효율적으로 옮긴다|보급 목록을 맞춘다~planning:30~필요 물자와 재고 차이를 정리한다|가까운 재료만 모은다~~기본 재고를 안전하게 보충한다',
 '거점 작업 순서가 겹쳤다|공동 시간표를 만든다~operation:30~서로의 작업 충돌을 줄인다|장비를 함께 쓰도록 나눈다~planning:30~공용 장비 사용 규칙을 정한다|빈 구역의 작업을 돕는다~~작업 충돌을 피하며 참여한다',
 '새 탐사 구역 발견|탐사 역할을 배치한다~operation:40~동행 역할과 복귀 계획을 검증한다|지형을 시험 이동한다~gameSkill:40~현재 게임의 이동 경험을 남긴다|거점에서 지원한다~~탐사 지원과 귀환 확인을 맡는다',
 '공동 목표 기획|거점 완성 목표를 세운다~planning:40~시즌 말에 완성할 건축 범위를 정한다|협동 탐사 시범을 기획한다~gameSkill:40~팀의 시험 탐사 목표를 정한다|작은 공동 창고를 목표로 삼는다~~초보도 완성할 범위를 준비한다',
 '목표 전 리허설|합의한 루트를 검증한다~gameSkill:45~협동 이동 루트를 검증한다|거점 동선을 검수한다~operation:40~공동 거점 사용 동선을 검증한다|익숙한 구간을 동행한다~~도움을 받아 공동 목표를 시험한다',
 '공동 거점 완성일|완성한 거점을 공개한다~planning:45~공동 건축 결과를 소개한다|검증한 탐사를 함께 마친다~gameSkill:50~검증된 범위의 협동 탐사를 완주한다|지원 역할의 기록을 남긴다~~맡은 지원 기여로 시즌을 마친다']),
 ('RD','초보 공대 성장기','MMORPG 협동 공대 계통','raid_mmo',['LCS-06'],['mechanicKnowledge','teamwork','practice'],[
 '초보 공대 모집|전투 역할 설명을 듣는다~gameSkill:20~현재 게임의 역할 구성을 익힌다|공대 진행표를 읽는다~operation:20~참여 일정과 연습 순서를 확인한다|초보 교육반에 들어간다~~필수 안내를 받으며 참여한다',
 '역할과 공략 선택|기믹 담당을 연습한다~gameSkill:30~기믹 역할을 선택한다|공대 기록 보조를 맡는다~planning:25~시도와 복기 메모를 맡는다|기본 역할로 연습한다~~쉬운 역할을 정하고 연습한다',
 '첫 패턴에서 막혔다|패턴별 메모를 만든다~planning:30~실패 원인을 정리해 다음 시도에 쓴다|역할 수행을 따로 시험한다~gameSkill:35~자신의 역할을 분리 연습한다|교육 구간부터 다시 한다~~처음 패턴을 복습한다',
 '연습 시간이 맞지 않는다|참여 가능한 구간을 조율한다~operation:35~공대 연습 약속을 조정한다|소규모 복습회를 연다~community:30~서로 도울 복습 기회를 만든다|자기 역할 메모를 남긴다~~부재 구간의 자료를 보관한다',
 '중간 기믹을 넘겼다|성공 과정을 해설한다~gameSkill:40~성공한 기믹의 설명 경험을 남긴다|팀의 동선을 비교한다~planning:35~공략 개선 메모를 얻는다|오늘 배운 구간을 기록한다~~실제 통과한 구간만 기록한다',
 '최종 연습 계획|검증할 최종 역할을 정한다~gameSkill:45~최종 시도의 연습 계획을 만든다|설명형 공략 방송을 준비한다~planning:40~시청자와 볼 공략 구성을 만든다|초보 목표로 범위를 줄인다~~목표를 교육 구간 완주로 정한다',
 '최종 시범 연습|자기 기믹을 검증한다~gameSkill:50~연습한 최종 기믹을 검증한다|해설 순서를 시험한다~planning:45~기록과 화면 설명을 시험한다|낮은 단계부터 검증한다~~선택한 교육 목표를 시험한다',
 '공대 결과 발표|최종 도전 결과를 확인한다~gameSkill:55~실제 결과에 따라 클리어 또는 재도전 기록을 남긴다|검증한 구간을 해설한다~planning:45~실제로 익힌 공략을 설명한다|배운 구간을 정리하고 마친다~~보조와 교육 이력으로 기획을 마무리한다']),
 ('PT','플랫폼 공식 게임컵','플랫폼 주최 대회','platform_cup_game',['LCS-01','LCS-07'],['practice','teamwork','broadcastReadiness'],[
 '플랫폼 대회 참가 공고|본선 참가 조건을 읽는다~awareness:25~공식 신청과 심사 조건을 확인한다|공식 연습 중계에 지원한다~operation:25~연습 방송 역할을 신청한다|초보 공개 연습부터 한다~~본선 확정 없이 연습 콘텐츠를 시작한다',
 '대진과 역할 안내|팀의 출전 역할을 맡는다~gameSkill:30~참가 자격 확인 후 선수 역할을 정한다|시점 방송 담당을 맡는다~operation:30~개인 시점의 공개 범위를 확인한다|교육 매치 역할을 맡는다~~초보 연습전 역할로 진행한다',
 '대회 규정이 낯설다|규정표를 요약한다~planning:30~이용 가능한 기능과 규칙을 정리한다|운영진 질의 내용을 정리한다~operation:30~불명확한 규칙을 확인한다|기본 교육을 다시 본다~~규정 이해를 보완한다',
 '공식 연습 경기|역할 수행을 집중 연습한다~gameSkill:35~선수 연습 기록을 남긴다|팀 소통 순서를 시험한다~operation:35~중복 지시를 줄이는 규칙을 시험한다|쉬운 교육 매치를 한다~~현재 수준에 맞는 연습을 마친다',
 '개인 시점과 공식 중계|시점 전환을 리허설한다~operation:40~허용된 중계 화면 구성을 시험한다|입문자 설명을 준비한다~planning:35~관전자를 위한 기본 설명을 만든다|기본 화면 구성을 사용한다~~확인된 기본 구성을 유지한다',
 '본선 방송 준비|출전 계획을 확정한다~gameSkill:45~본선 자격이 있는 경우 경기 계획을 준비한다|연습전 소개 방송을 기획한다~planning:40~본선 자격이 없으면 교육·소개 편성을 준비한다|자기 경기만 복기한다~~확인된 참여 범위에서 기획을 준비한다',
 '마지막 사전 점검|팀 계획과 송출을 검증한다~operation:45~출전 역할과 시점 송출을 검증한다|전술 시범을 검증한다~gameSkill:50~현재 팀 전술을 시험한다|교육 범위만 점검한다~~지원 역할의 시범을 마친다',
 '대회 결과와 뒤풀이|확정된 경기 결과를 소개한다~operation:45~우승 여부를 실제 경기 결과로만 표시한다|팀과 경기 과정을 복기한다~planning:40~공식 참가·연습 참가를 구분해 회고한다|참여한 역할에 감사 인사를 한다~~참가 경로에 맞는 뒤풀이를 마친다']),
 ('ST','스트리머 초청 친선전','개인 스트리머·제작팀 주최 대회','streamer_cup_game',['LCS-08','LCS-09'],['practice','teamwork','ruleUnderstanding'],[
 '스트리머의 친선전 초대|선수 초대 조건을 확인한다~awareness:20~가상의 주최자가 제안한 선수 경로를 확인한다|진행 보조를 제안한다~operation:25~규칙 안내와 진행 역할을 제안한다|공개 연습전에 참여한다~~비초청 초보도 가능한 연습을 시작한다',
 '팀 구성과 자체 규칙|역할 균형을 맞춘다~planning:30~팀의 역할을 균형 있게 정한다|초보와 숙련자의 짝을 짓는다~community:30~교육 동행 역할을 정한다|정해진 쉬운 역할을 맡는다~~확인된 범위의 팀 역할로 시작한다',
 '자체 규칙의 빈틈|검증할 예외를 정리한다~planning:35~주최자가 확인할 규칙 메모를 만든다|시범 매치로 확인한다~gameSkill:30~규칙 적용 사례를 시험한다|주최자의 기본 해석을 따른다~~임의 변경 없이 규칙을 적용한다',
 '스크림 일정이 겹쳤다|짧은 연습 구간을 합의한다~operation:35~팀이 지킬 수 있는 연습 순서를 만든다|개인 연습 자료를 공유한다~gameSkill:35~현재 게임의 연습 자료를 남긴다|가능한 연습만 참여한다~~지킬 수 있는 시간만 약속한다',
 '주최자의 깜짝 미션|팀 전략으로 미션을 푼다~gameSkill:40~허용된 추가 미션을 수행한다|재미있는 시범을 제안한다~planning:35~동의한 팀과 가벼운 시범을 만든다|기본 미션만 진행한다~~확인된 규칙대로 참여한다',
 '친선전 마지막 기획|선수 경로의 전술을 준비한다~gameSkill:45~초청 또는 참가 자격 확인 후 경기 계획을 만든다|진행 보조의 순서를 준비한다~operation:40~자격이 없는 경우에도 보조 편성을 준비한다|초보 교류전으로 범위를 정한다~~교육 목적의 마무리를 준비한다',
 '본 경기 전 시범|팀 전술을 검증한다~gameSkill:50~소통과 전술을 실제 시험한다|진행 순서를 검수한다~operation:45~진행 보조의 순서와 규칙을 검수한다|자기 역할만 연습한다~~팀의 쉬운 역할을 검증한다',
 '친선전과 재회 약속|확정된 팀 결과를 돌아본다~gameSkill:45~실제 경기 기록으로만 승패를 표시한다|다음 교류의 역할을 제안한다~community:40~친선 상대와 다음 협동 약속을 만든다|참여 소감을 남기고 마친다~~진행·교육 참여도 별도 기록으로 보존한다']),
 ('CO','키몽이 협동 식당','협동 경영 게임 계통','coop_restaurant',['LCS-10'],['workflow','supplies','teamwork'],[
 '첫 식당 영업 준비|주방 동선을 그린다~planning:20~조리와 전달 동선을 정리한다|서빙 순서를 점검한다~operation:20~손님 응대 순서를 익힌다|기본 메뉴로 시작한다~~작은 식당의 규칙을 익힌다',
 '조리와 서빙 역할|조리를 담당한다~gameSkill:20~현재 게임의 조리 역할을 정한다|서빙 조율을 맡는다~operation:25~주방과 홀의 전달을 맡는다|보조 테이블을 맡는다~~쉬운 역할로 팀에 합류한다',
 '주문이 한꺼번에 왔다|조리 순서를 묶는다~planning:30~대기 주문의 작업 흐름을 개선한다|서빙 역할을 나눈다~operation:30~완성 음식 전달을 나눈다|새 주문 수를 줄인다~~현재 주문부터 마무리한다',
 '테이블 배치가 불편하다|이동 동선을 바꾼다~planning:30~조리와 서빙 경로를 짧게 만든다|역할별 대기 칸을 만든다~operation:30~팀원 사이의 경로 충돌을 줄인다|작은 구역부터 정리한다~~사용 중인 구역을 안전하게 정돈한다',
 '새 메뉴 제안|시험 조리로 메뉴를 검증한다~gameSkill:35~가능한 메뉴의 조리 과정을 검증한다|메뉴 수를 조정한다~planning:35~팀이 감당할 수 있는 메뉴를 고른다|익숙한 메뉴를 유지한다~~확인된 기본 메뉴로 운영한다',
 '마지막 특별 영업 기획|협동 특집 영업을 준비한다~planning:40~정해진 작업량의 특별 영업을 준비한다|초보 교육 영업을 준비한다~community:35~신입이 참여할 교육 구성을 만든다|짧은 기본 영업을 준비한다~~완주 가능한 작은 목표를 정한다',
 '영업 전 모의 주문|주방 시범을 검증한다~gameSkill:40~현재 메뉴의 조리를 시험한다|홀과 주방의 합을 맞춘다~operation:40~팀의 전달 순서를 검증한다|적은 주문으로 시험한다~~도움을 받아 작은 영업을 시험한다',
 '마지막 손님이 돌아간 뒤|정한 목표의 영업을 마친다~operation:45~실제 처리한 주문과 분담을 기록한다|조리 과정을 설명한다~planning:40~검증한 메뉴와 개선 과정을 소개한다|맡은 작은 영업을 정리한다~~교육·보조 목표의 완주를 기록한다']),
 ('VR','가상 전시회 제작단','가상 공간 전시·행사 계통','virtual_exhibition',['LCS-11'],['booth','permissions','visitorFlow'],[
 '가상 전시 참가 안내|부스 규격을 확인한다~planning:20~제출 범위와 부스 규칙을 확인한다|관람 동선을 살펴본다~operation:20~방문객 이동 흐름을 익힌다|관람 안내부터 받는다~~작은 참가·안내 경로를 확인한다',
 '전시 역할 선택|독자 작품 부스를 만든다~planning:25~직접 만든 작품의 전시 역할을 정한다|관람 안내 역할을 맡는다~community:25~방문객 안내 역할을 정한다|작은 글 패널을 맡는다~~간단한 설명 패널로 참여한다',
 '부스 문구가 길어졌다|핵심 설명으로 줄인다~planning:30~관람객이 읽기 쉬운 글을 만든다|안내 순서를 나눈다~operation:30~설명과 관람의 순서를 정리한다|짧은 기본 설명을 쓴다~~확인된 설명만 남긴다',
 '관람객이 같은 길로 몰린다|대체 동선을 안내한다~operation:35~혼잡한 구역을 분산한다|작은 관람 묶음을 만든다~planning:30~순서 있는 관람 경로를 만든다|한 팀씩 안내한다~~작은 인원으로 관람을 진행한다',
 '함께 전시할 작품 제안|제출 동의를 확인한다~operation:30~허용된 작품과 사용 범위를 확인한다|독자 작품끼리 주제를 묶는다~planning:35~전시 주제와 설명을 연결한다|자신의 작품만 전시한다~~추가 사용 동의가 없어도 참여한다',
 '전시 공개 프로그램|독자 테마 전시를 준비한다~planning:45~검수할 전시 프로그램을 준비한다|관람 안내 방송을 준비한다~community:35~작품을 이해할 안내 구성을 만든다|작은 패널 발표로 정한다~~제출 가능한 작은 공개물을 정한다',
 '공개 전 전시 검수|규격과 동선을 검수한다~operation:40~제출 조건과 관람 흐름을 검증한다|작품 설명을 시험한다~planning:40~사전 관람 피드백으로 설명을 수정한다|패널 한 장부터 검수한다~~작은 전시 범위를 검증한다',
 '전시 마지막 관람 시간|허용된 작품으로 안내를 마친다~operation:45~정해진 전시와 안내를 완료한다|직접 만든 작품의 과정을 공개한다~planning:45~독자 작품의 제작 과정을 소개한다|작은 전시의 기록을 남긴다~~맡은 패널과 안내 기여를 기록한다'])
]


def limits(raw):
    return {'all':[{'path':'stats.gameSkillById.$game' if k=='gameSkill' else 'stats.'+k,'op':'gte','value':int(v)} for k,v in (x.split(':') for x in raw.split())]}


def main():
    modules=[]; events=[]
    # Transition events 1,2,6,7,8; recurring scenes 3,4,5 take place in the working phase.
    stages={1:('invited','orientation'),2:('orientation','working'),3:('working','working'),4:('working','working'),5:('working','working'),6:('working','project_ready'),7:('project_ready','rehearsed'),8:('rehearsed','closed')}
    for code,name,kind,game,refs,meters,rows in MODULES:
        mid='LC-'+code
        mods=dict(id=mid,name=name,researchCategory=kind,gameId=game,sourceRefs=refs,
                  provenance='original_adaptation_of_researched_content_structure',
                  realRakokoParticipationClaim=False,status='design_only',
                  entry={'noviceRouteAvailable':True,'mainCompetitionRequiresConfirmedQualification':code in ('PT','ST')},
                  localState={meters[0]:0,meters[1]:20,meters[2]:20,'projectProgress':0},
                  phases=['invited','orientation','working','project_ready','rehearsed','closed'],
                  eventIds=[f'{mid}-{i:02}' for i in range(1,9)],minimumParticipatingBroadcasts=5,
                  gameBinding='moduleInstance.gameId_immutable_after_acceptance',
                  instanceWindowDays=120)
        if code in ('PT','ST'):
            mods['qualificationModel']={'resolveBefore':'orientation_role_choice',
                'playerRequirements':limits(f'awareness:{25 if code=="PT" else 20} gameSkill:30'),
                'supportRequirements':limits('operation:25'),
                'novicePracticeNeedsQualification':False,
                'confirmedRoleSavedBeforeShowingChoices':True}
            mods['resultModel']={'type':'fictional_four_team_bracket','matchesToWin':2,
                'opponentStrengthRange':[35,70],'commitOpponentsBeforeMatch':True,
                'performanceWeights':{'gameSkill':.5,'operation':.25,'teamwork':.25},
                'winOn':'performance_gte_opponent_strength','noChampionshipWithoutConfirmedPlayer':True}
        if code=='RD':
            mods['resultModel']={'type':'raid_objective','clearRequirements':{'gameSkill':55,'practice':40,'teamwork':30},'requiredRoleTrack':'specialist','guidedCompletionIsRaidClear':False}
        modules.append(mods)
        for i,row in enumerate(rows,1):
            title,*specs=row.split('|'); phase,nextphase=stages[i]; key=f'{mid}-{i:02}'
            choices=[]
            for j,spec in enumerate(specs,1):
                text,gate,outcome=spec.split('~')
                effects=[{'op':'local.add','key':meters[(j-1)%len(meters)],'amount':4 if j<3 else 2,'clamp':[0,100]},
                         {'op':'journal.append','text':outcome},
                         {'op':'local.set','key':f'lastApproach.{i}','value':['specialist','collaborative','guided'][j-1]}]
                eligibility=limits(gate)
                if i==2:
                    effects.append({'op':'local.set','key':'roleTrack','value':['player' if code in ('PT','ST') else 'specialist','support','learner'][j-1]})
                if code in ('PT','ST') and i==2 and j<3:
                    eligibility['all'].append({'path':'module.qualification.playerConfirmed' if j==1 else 'module.qualification.supportConfirmed','op':'eq','value':True})
                if code in ('PT','ST') and i==6 and j==1:
                    eligibility['all'] += [{'path':'module.qualification.playerConfirmed','op':'eq','value':True},{'path':'module.roleTrack','op':'eq','value':'player'}]
                if code=='RD' and i==8 and j==1:
                    eligibility['all'].append({'path':'module.roleTrack','op':'eq','value':'specialist'})
                if code in ('PT','ST') and i==8 and j==1:
                    eligibility['all'] += [{'path':'module.qualification.playerConfirmed','op':'eq','value':True},{'path':'module.roleTrack','op':'eq','value':'player'}]
                if i==6:
                    effects += [{'op':'local.set','key':'projectProgress','value':20}, {'op':'local.set','key':'projectTrack','value':['specialist','collaborative','guided'][j-1]}]
                    if code=='MC':
                        effects.append({'op':'local.set','key':'projectKind','value':['original_minigame_booth','visitor_information_desk','small_display'][j-1]})
                    if code=='VR':
                        effects.append({'op':'local.set','key':'projectKind','value':['original_theme_gallery','gallery_tour','single_panel'][j-1]})
                if i==7:
                    effects += [{'op':'local.add','key':'projectProgress','amount':20,'clamp':[0,100]}, {'op':'local.set','key':'rehearsalTrack','value':['specialist','collaborative','guided'][j-1]}]
                    effects.append({'op':'module.validateRehearsal','scope':'chosen_project_and_current_approach','inferLargerScopeSuccess':False,
                                    'verifiedFinalScope':'projectTrack' if j<3 else 'guided'})
                if nextphase!=phase:
                    effects.append({'op':'module.phase','value':nextphase})
                if i==8:
                    eligibility['all'].append({'path':'module.projectProgress','op':'gte','value':40})
                    if j<3:
                        eligibility['all'].append({'path':'module.projectTrack','op':'eq','value':'specialist' if j==1 else 'collaborative'})
                        eligibility['all'].append({'path':'module.verifiedFinalScope','op':'eq','value':'specialist' if j==1 else 'collaborative'})
                    effects += [{'op':'module.recordOutcome','from':['projectTrack','rehearsalTrack','lastApproach.8'],'inferVictory':False},
                                {'op':'module.close','preserveArchive':True,'endsRun':False}]
                effects.append({'op':'experience.evaluateLongContentBridges','eventId':key,'choiceId':f'{key}-C{j}','onlyAfterVerifiedResult':True})
                choices.append(dict(id=f'{key}-C{j}',text=text,eligibility=eligibility,
                                    validateQualificationForChosenRole=True,
                                    showWhenEventVisible=True,disableWhenAnyConditionFails=True,
                                    outcome=outcome,effects=effects))
            events.append(dict(id=key,moduleId=mid,title=title,sourceRefs=refs,
                               provenance='fictional_event_design_not_source_incident',gameId=game,
                               eligibility={'modulePhase':phase,'moduleActive':True,'qualifiedRoleRequiredForPlayerActions':code in ('PT','ST')},
                               trigger='module_recurring' if i in (3,4,5) else 'module_progression',
                               consumesSegmentSlot=True,group=mid,
                               maxPerEpisode=1,minimumParticipatingBroadcastGap=2 if i in (3,4,5) else None,
                               choices=choices))
    sources=[dict(id=i,title=t,url=u,kind=k,checkedAt='2026-11-05',verifiedScope=s,videoWatched=False) for i,t,u,k,s in SOURCES]
    catalog=dict(version='1.0',status='design_only_needs_engine_binding',researchSources=sources,modules=modules,events=events)
    (OUT/'rakoko_long_content.design.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    research=['# 장기 콘텐츠 조사와 게임 반영','','조사일 2026-11-05. 공식 운영자·개발사·대회 제작사·기업 배포 자료에서 콘텐츠 구조를 확인했다. 영상 시청·원음 검증을 새로 수행한 조사로 보고하지 않는다. 라코코가 실제로 참여한 콘텐츠 목록이 아니다.','',
              '## 확인한 자료','', '|ID|자료|확인 범위|','|---|---|---|']
    research += [f'|{s["id"]}|[{s["title"]}]({s["url"]}) · {s["kind"]}|{s["verifiedScope"]}|' for s in sources]
    research += ['', '플랫폼 주최는 SOOP 어쎔블과 Twitch Rivals, 스트리머 발의는 獅白杯, 조직 주최 초청전은 CR CUP으로 구분했다. 스크림·팀 구성·공모·공식 중계·대진 같은 확인된 구조만 일반화한다. 특정 참가자의 승패·사생활·분쟁을 새 사건으로 수집하지 않았다.', '',
                 'Global Game Jam 공식 소개는 403, Noxcrew의 Ender Cup 사례 페이지는 시간 초과였다. 해당 페이지를 읽은 근거로 채택하지 않았다. 띵타이쿤 검색 결과는 위키·간접 자료 단계여서 확인된 상세 규칙으로 옮기지 않았다. 확정 반영은 위 표의 자료와 독자 창작 구분을 기준으로 했다.', '',
                 '## 추가 설계 분량','', '장기 콘텐츠 8묶음·사건64설계·선택192개다. 그중 진행40/반복24이며 기존 일반105참조·312선택과 별도다. 연구자료12개는 사건12건이나 라코코 참가12건이라는 뜻이 아니다. 이름·서버 지도·참가자·실제 경기 결과를 복사하지 않고 게임용 독자 기획으로 작성했다.', '']
    (OUT/'rakoko_long_content_research.md').write_text('\n'.join(research),encoding='utf-8')
    lines=['# 장기 콘텐츠 사건 8묶음·64종','','2026-11-05 · 마을·도시 역할극·협동 생존·공대·플랫폼 대회·스트리머 친선전·협동 경영·가상 전시. 각 콘텐츠의 종료는 게임 전체 엔딩이 아니다.','',
           '[조사 근거](rakoko_long_content_research.md) · [구조화 데이터](rakoko_long_content.design.json) · [통합 규칙](rakoko_long_content_design.md)','']
    labels={'awareness':'인지도','community':'단골층','planning':'기획력','operation':'운영력','gameSkill':'해당 게임 숙련도'}
    for m in modules:
        lines += [f'## {m["id"]} · {m["name"]}', '',f'콘텐츠 유형: {m["researchCategory"]}. 게임 ID: {m["gameId"]}. 관련 상태: {", ".join(m["localState"])}.', '', '|사건|진행/반복|선택 → 수치 조건 → 결과|','|---|---|---|']
        for e in [x for x in events if x['moduleId']==m['id']]:
            opts=[]
            for c in e['choices']:
                threshold='·'.join(f"{labels['gameSkill' if 'gameSkillById' in x['path'] else x['path'].split('.')[1]]} {x['value']}" for x in c['eligibility']['all'] if x['path'].startswith('stats.')) or '수치 제한 없음'
                extra=[x for x in c['eligibility']['all'] if not x['path'].startswith('stats.')]
                if extra:
                    threshold += ' + ' + ', '.join(f"{x['path']} {x['op']} {x['value']}" for x in extra)
                opts.append(f'{c["text"]} → {threshold} → {c["outcome"]}')
            lines.append(f'|{e["id"]} · {e["title"]}|{"반복" if e["trigger"]=="module_recurring" else "진행"}|'+ '<br>'.join(opts)+'|')
        lines.append('')
    (OUT/'rakoko_long_content_events.md').write_text('\n'.join(lines),encoding='utf-8')
    print(f'{len(sources)} sources / {len(modules)} modules / {len(events)} events / {sum(len(e["choices"]) for e in events)} choices')


if __name__=='__main__':
    main()
