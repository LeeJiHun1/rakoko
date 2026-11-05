import json
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs'
inv={x['id']:x for x in json.loads((ROOT/'work/rakoko/inventory.json').read_text(encoding='utf-8'))}
raw=[
('201일 활동 선택','tDOxvs7LDm8',890,1045,'노래·댄스·공부를 소개하고 무엇부터 할지 묻다가 노래를 먼저 하겠다는 자막 문맥.','선택을 물어보는 과정이 투표 결과에 반드시 따른다는 뜻은 아니다.','rakoko_201day_visual.jpg','약 15:13에 3개 게이지와 여러 활동 버튼이 있는 화면을 관찰.','S08,D09,RK-016'),
('퍼즐 비교와 답 고르기','q1ZG65-Ujy4',13169,13340,'길이를 비교하는 퍼즐에서 힌트, 도구 언급, 시각적 추정을 거쳐 답을 고르는 자막 문맥.','정답 표시는 직접 저장한 정지 화면에서 확인하지 않았다.','rakoko_puzzle_visual.jpg','약 3:41:45에 모자 비교 문제와 화면에 그린 원·표시를 관찰.','D10,RK-022'),
('협동 정보 전달','hLRRdR9IMkM',5913,6045,'슬라이더 색과 좌우 위치를 전달하는 과정에서 반복·재설명하는 자막 문맥.','복수 화자이므로 라코코의 모든 발언으로 귀속하지 않는다.','rakoko_coop_visual.jpg','약 1:38:46에 협동 게임 진행 화면과 아래 세 아바타 아이콘을 관찰. 슬라이더 조작 전체는 저장 화면에 보이지 않는다.','RK-024'),
('노래 코너와 곡 선택','Ro0DbUCnsM0',2060,2640,'곡을 부를 수 있는지와 노래방 진행을 이야기하는 자막 문맥.','가사·가창 실력·정확한 음색과 실제 짐볼 움직임은 확정하지 않는다.','rakoko_karaoke_visual.jpg','마이크를 든 아바타와 곡 요청 패널이 있는 원본 장면을 관찰.','RK-023'),
('도전 뒤 보상 표시','k4H4epY3pxo',29503,29529,'기존 성공 반응 후보 뒤 보상 획득 화면이 이어진다.','마지막 공격부터 쓰러짐까지 연속 관찰한 것은 아니다. 시도 수와 총 소요 시간은 미확인.','rakoko_treeguard_reward.jpg','8:11:43~8:12:08 부근에 황금 할버드 획득 표시를 관찰.','RK-020,RK-021'),
('장비 문제별 상태 구분','yaSuAocNYDw',697,770,'충전·연결 문제는 해결했다고 설명하고 간헐적 끊김은 남았다고 나누는 자막 문맥.','기술적 원인과 실제 복구 완료를 검증한 것은 아니다.',None,None,'D11,RK-025'),
('백업 후 교체 계획','1HIh-ekHAaw',3273,3360,'새 저장장치가 왔으나 교체 전에 백업해야 한다는 자막 문맥.','실제 완료 여부와 장비 사양은 미확인.',None,None,'D11,RK-026'),
('시청자에게 소리 확인','ChKm2pt_clM',12147,12190,'수박게임을 틀고 소리가 들리는지 묻고 응답에 반응하는 자막 문맥.','출력 음량·문제 원인·실제 음질은 확인하지 않았다.',None,None,'S09,D12,RK-027'),
('행사 준비량 회고','t3Y8PL9bSjk',271,310,'준비 수량을 더 늘릴 걸 그랬다는 자막 문맥.','참석·판매·재고 수량을 역산하지 않는다. 행사 존재는 공식 프로그램으로 별도 대조.',None,None,'D13,RK-028'),
('과한 채팅에서 주제 전환','xnIhJoOfnds',9982,10035,'반응하지 않고 다른 주제로 이끄는 방법을 설명하는 자막 문맥.','실제로 이후 채팅이 안정됐다는 결과는 확인하지 않았다.',None,None,'S10,D14,RK-029'),
('QnA 형식 조정','ix7-CJW3Mjc',945,990,'질문에 맞춰 형식을 수정해 왔다는 자막 문맥.','질문의 성인·벌칙 맥락은 게임에 가져오지 않는다. 구체적인 편집 변경은 화면 확인 전.',None,None,'RK-011'),
('계획한 코너가 미뤄지는 사례','Sd9Oc8NZvb8',12556,12590,'콘텐츠 회의를 하기로 했다는 지적에 현재 이야기를 마친 뒤 하겠다는 자막 문맥.','계획을 고려한다는 가설의 반례 후보. 계획이 언제나 즉시 실행되는 것은 아니다.',None,None,'D03 반례 후보')]
scenes=[]
for i,(title,vid,start,end,summary,limit,shot,visual,refs) in enumerate(raw,1):
    rows=json.loads((ROOT/f'work/rakoko/{vid}.json').read_text(encoding='utf-8'))
    segments=[r for r in rows if start<=r['start']<=end]
    assert segments and 0<=start<end<=inv[vid]['duration']
    if shot: assert (OUT/shot).exists()
    scenes.append(dict(id=f'SC-{i:03}',title=title,video_id=vid,date=inv[vid]['broadcast_date_from_title'],source_url=inv[vid]['url']+f'&t={start}s',start_seconds=start,end_seconds=end,transcript_context_reviewed=True,audio_verified=False,speaker_verified=False,summary=summary,limitation=limit,visual_support=bool(shot),screenshot=shot,visual_observation=visual,related_records=refs))
(OUT/'rakoko_scene_evidence.json').write_text(json.dumps(dict(as_of='2026-11-03',scenes=scenes,visual_support_count=5,audio_verified_count=0),ensure_ascii=False,indent=2),encoding='utf-8')
md=['# ラココ 장면 근거대장 v0.2'.replace('ラココ','라코코'),'','2026-11-03 · 이번 추가 조사 12구간 · 자막 문맥 B · 그중 원본 화면 보조 5구간 · 음성·화자 대조 A 0구간','','화면 보조(V)는 독립적인 확인 항목이다. 화면에 실제 보이는 요소만 확정한다. 음성·화자를 확인해야 하는 A의 대체 등급이 아니다. 장면 제목은 조사자가 붙였으며 실제 방송 대사가 아니다. 저장 화면은 조사 확인용으로 게임 자산으로 재사용하지 않는다.','']
for s in scenes:
    md += [f"## {s['id']} · {s['title']}",'',f"- [원본 {s['start_seconds']}–{s['end_seconds']}초]({s['source_url']}) / {s['date']}",'- 자막 문맥: '+s['summary'],'- 한계: '+s['limitation'],'- 관련 기록: '+s['related_records']]
    if s['visual_support']:md+=['- 화면 관찰: '+s['visual_observation'],f"- [저장 화면]({s['screenshot']})"]
    md+=['']
md+=['## 브라우저 재생과 자막 제한의 구분','','이번에는 YouTube 원본 브라우저 재생이 가능했다. 따라서 ‘YouTube 전체가 막혀 화면도 볼 수 없다’는 종전 설명을 현재 상태로 유지하지 않는다. 기존 수집기의 IpBlocked 기록은 이와 별개로 보존한다. 우회 IP·계정·프록시는 사용하지 않았다. 10월 26일 요리 방송은 브라우저의 공개 자막 내보내기 도구에서 No transcript is available로 응답했다. 이것은 해당 도구의 응답이며 모든 언어·수동 자막의 영구 부재를 보증하지 않는다.']
(OUT/'rakoko_scene_evidence.md').write_text('\n'.join(md),encoding='utf-8')

speech='''

## 2026-11-03 추가 관찰 — v0.2

자막과 화면을 분리한 [장면 근거대장](rakoko_scene_evidence.md)을 추가했다. 원음·화자 검증 완료는 여전히 0건이다. 아래는 기존 가설과 동일한 잠정 수준이며 실제 발언을 인용한 것이 아니다.

### S08. 선택지를 소개하고 질문한 뒤 진행을 정하기

[8월 6일 14:50–17:25](https://www.youtube.com/watch?v=tDOxvs7LDm8&t=890s) 자막에서 활동 후보 소개 → 무엇부터 할지 질문 → 먼저 할 활동 결정의 순서가 보인다. 게임에서도 질문 한마디와 진행 결정을 나눌 수 있다. 다만 투표에 항상 따른다는 성격으로 고정하면 안 된다. 활동 버튼 화면은 확인했지만 질문의 발음·억양은 확인하지 않았다.

### S09. 확인 질문과 응답 뒤 안도 표현

[6월 4일 3:22:27–3:23:10](https://www.youtube.com/watch?v=ChKm2pt_clM&t=12147s) 자막에서 시험 소리 안내 → 들리는지 질문 → 응답 뒤 진행하는 구조가 나타난다. 창작 대사는 확인 요청과 재개를 연결한다. 같은 질문을 몇 번 말했는지는 자동자막만으로 확정하지 않는다.

### S10. 모든 장난에 반응하지 않는 진행

[1월 20일 2:46:22–2:47:15](https://www.youtube.com/watch?v=xnIhJoOfnds&t=9982s) 자막에 과한 채팅을 일부러 읽지 않고 다른 주제로 이끄는 방법을 설명하는 맥락이 있다. 장난 → 반문만 반복하는 대사 패턴에 주제 복귀와 무응답도 포함한다. 실제 분위기 변화는 미확인이다.

실제 발음 표기는 늘리지 않았다. 자동자막의 반복 횟수·감정 태그·TTS가 섞인 표현은 고유 말투 빈도에 합산하지 않는다.
'''
decision='''

## 2026-11-03 추가 판단 카드 — v0.2

아래 관찰은 B이며, 행동 모델의 확정 규칙이 아니다. [장면 근거대장](rakoko_scene_evidence.md)의 제한 사항을 함께 적용한다.

|ID|관찰 가능한 자막 문맥|대안 해석·미확인|게임 설계로 옮길 부분|
|---|---|---|---|
|D09|[8월 6일](https://www.youtube.com/watch?v=tDOxvs7LDm8&t=890s) 활동 후보를 소개하고 의견을 물은 뒤 먼저 할 활동을 정함|모든 시청자 의견을 따르거나 실제 투표한 것은 아님|의견 듣기와 최종 편성을 별도 선택으로 둠|
|D10|[2월 7일](https://www.youtube.com/watch?v=q1ZG65-Ujy4&t=13169s) 퍼즐에서 도구·힌트·시각 비교를 오가며 답을 고름|합리적 판단 능력이나 힌트 사용률을 일반화할 수 없음|힌트와 재검토, 추정에 서로 다른 시간 비용을 부여하는 창작안|
|D11|[8월 8일](https://www.youtube.com/watch?v=yaSuAocNYDw&t=697s) 문제별 해결/미해결을 나누고 [8월 10일](https://www.youtube.com/watch?v=1HIh-ekHAaw&t=3273s) 백업 후 교체를 계획|실제 원인·백업·교체 완료 미확인, 서로 다른 문제를 하나의 원인으로 묶지 않음|점검표와 선행 준비 조건. 복구 여부를 일괄 성공/실패로 처리하지 않음|
|D12|[6월 4일](https://www.youtube.com/watch?v=ChKm2pt_clM&t=12147s) 게임 소리를 시험하고 시청자 확인을 요청|음질과 완전 해결 미확인|코너 전 시험 진행과 피드백 확인|
|D13|[10월 17일](https://www.youtube.com/watch?v=t3Y8PL9bSjk&t=271s) 행사 준비 수량을 회고|참석자·판매량·손익을 추정할 수 없음|다음 행사 준비 메모를 남기는 후속 선택|
|D14|[1월 20일](https://www.youtube.com/watch?v=xnIhJoOfnds&t=9982s) 과한 채팅에 일부러 반응하지 않고 주제 전환을 설명|실제로 그 뒤 안정됐는지 미확인|수락·거절 외에 주제로 복귀하는 선택|

D03의 반례 후보: [7월 11일 3:29:16](https://www.youtube.com/watch?v=Sd9Oc8NZvb8&t=12556s)에는 회의를 하기로 했다는 지적에 현재 이야기 후 하겠다는 자막 문맥도 있다. 콘텐츠를 준비하려는 발언과 즉시 실행은 다르다. 한두 장면으로 계획성·성실성을 수치화하지 않는다.

판단 가이드 총 14개(D01–D14). 장면별 실제 결과는 별도 미확인으로 남기며, 게임의 성공 확률을 실제 성향 통계처럼 제시하지 않는다.
'''
for name,add in [('rakoko_speech_guide.md',speech),('rakoko_decision_guide.md',decision)]:
    p=OUT/name; old=p.read_text(encoding='utf-8'); marker='\n\n## 2026-11-03 추가'
    if marker in old:old=old[:old.index(marker)]
    p.write_text(old+add,encoding='utf-8')

event='''

## 2026-11-03 보강 기록 — v0.2

최신 사건 카드 대장은 29개 카드·25개 영상 출처·B 29개·A 0개다. 그중 5개 카드에 원본 화면 보조근거가 있다. 위 본문의 24개/B21/C3은 초기 작성 시점의 기록이다. 모든 음성을 검증했다는 뜻으로 읽지 않는다.

### E16. 대전콘텐츠페어 팬미팅 — 공식 프로그램과 다시보기 연결

- 외부 원출처: [행사 주최 측 공식 홈페이지](https://www.dcfair.co.kr/)에 2026년 10월 16~18일 DCC 제2전시장 행사와 라코코 팬미팅·버추얼 스튜디오 프로그램이 등재돼 있다.
- 대응 다시보기: [10월 17일 4:31–5:10](https://www.youtube.com/watch?v=t3Y8PL9bSjk&t=271s). 준비 수량을 늘렸어야 했다는 자막 문맥. [21:03 부근](https://www.youtube.com/watch?v=t3Y8PL9bSjk&t=1263s)에는 대응 방법을 회의했다는 문맥도 있다.
- 확인 범위: 행사 프로그램 등재는 공식 원문 확인. 방송 발언은 B. 해당 방송의 원본 페이지·화면은 열었지만 음성·화자와 수량 결과까지 검증하지 않았으므로 A는 아니다.
- 채택: 행사 준비와 다음 기획의 메모. 실제 참석자·판매량·수익, 부스의 오컬트 설정은 사용하지 않는다.

### 기존 카드의 근거 보강

- RK-022: 레이튼 퍼즐 구간을 찾아 C→B, 문제 화면 추가 확인.
- RK-023: 노래방 2부의 곡 선택 자막을 찾아 C→B, 마이크·요청 패널 화면 확인. 가창 품질과 실제 짐볼 동작은 미확인.
- RK-024: 협동 정보 전달 구간을 찾아 C→B, 게임 화면 확인. 화자 귀속은 미확인.
- RK-021: 보스 도전 뒤 보상 표시 화면을 추가 확인. 마지막 공격 전체를 본 것으로 확대하지 않는다.
- 새 카드 RK-025~029: 문제별 점검, 백업 선행, 소리 확인, 행사 준비 회고, 주제 복귀. 같은 영상의 다른 장면은 새 독립 출처로 세지 않았다.
'''
p=OUT/'rakoko_event_verification.md';old=p.read_text(encoding='utf-8');marker='\n\n## 2026-11-03 보강 기록'
if marker in old:old=old[:old.index(marker)]
p.write_text(old+event,encoding='utf-8')
print('12 scene records checked; three requested guides updated; A remains 0.')
