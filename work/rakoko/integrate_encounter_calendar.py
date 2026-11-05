from pathlib import Path
import json, collections
out=Path('outputs')
p=out/'rakoko_game_feature_spec.md'
s=p.read_text(encoding='utf-8').replace('설계 v1.', '설계 v1.2.')
start=s.index('초안은 시즌 12회 방송')
end=s.index('진행은 클릭 기반', start)
s=s[:start]+'방송당 준비 행동 2회·코너 3칸을 기본안으로 둔다. 시작일은 사용자 최종 정정대로 2026-01-18로 고정하고 실제 달력과 방송 회차를 함께 사용한다. 생일은 9월 10일이다. 달력·기념일·진행 구간은 rakoko_calendar_design.md를 따른다. 이전 12회 고정 시즌안은 폐기했다. '+s[end:]
start=s.index('12회 종료 시')
end=s.index('끝내기를 선택하면',start)
s=s[:start]+'달력 기준 첫 1주년 전후에 시즌 회고를 제안하고 계속 진행을 허용하는 방식이 기본안이다. 상세는 rakoko_calendar_design.md를 따른다. 이전 12회 종료·3회 연장 제한은 폐기했다. '+s[end:]
s=s.replace('`외부 구조에서 만든 창작`, `이전 선택의 후속`','`외부 구조에서 만든 창작`, `독자 창작`, `이전 선택의 후속`')
s=s.replace('라코코/외부 각각','출처 기반 각색/창작 각각')
s+='''
## 인카운터 확장 v1.2

사용자가 앞선 돌발 사건의 반영과 방송 상황 창작을 허용했다. rakoko_encounter_catalog.md/.json에 12분류·72개 창작 설계를 추가했다. 조건·선택·결과·후속·재등장 제한을 기록했다. 유출 엔진 훅·결과 반응·예약 변주·조건 후속·방송 후 사건은 일반 랜덤과 구분한다. 기존29사건과 주제가 겹치므로 101개 독립 사건으로 합산하지 않는다.

추가 조사03은 자막 관찰12개/출처10편이며 창작72개와 별개다. 원음·화자 검증 완료를 뜻하지 않는다. 일반 사건180종/후속60종은 초기 분량 목표이며 아직 미달이다. 코너별 적격 풀과 기능군 중복을 검토해야 한다. 제목만 다른 사건 수로 분량 충분을 판정하지 않는다.
'''
p.write_text(s,encoding='utf-8')
p=out/'rakoko_collection_overview.md'
s=p.read_text(encoding='utf-8')
s=s.replace('## 2026-11-04 추가 정리','''## 2026-11-04 인카운터·달력 추가

- [창작 인카운터72종](rakoko_encounter_catalog.md) / [JSON](rakoko_encounter_catalog.json): 실제 사건72건이 아니다. 기존 카드와 중복 주제 포함, 합산 금지.
- [추가조사03](rakoko_observation_batch_03.md): 자막 문맥12관찰/10출처영상, 원음·화자 미대조.
- [달력·기념일](rakoko_calendar_design.md): 시작일2026-01-18, 생일9/10. 사용자 정정으로 1/2안 폐기, 12회 고정 시즌안 대체.
- [확장 검토](rakoko_encounter_review.md): 정적 데이터 검사이며 전체 콘텐츠 확보 완료 아님.

## 2026-11-04 추가 정리''',1)
p.write_text(s,encoding='utf-8')
calendar={'startDate':'2026-01-18','startDateConfirmedByUser':True,'birthdayMonthDay':'09-10','countStartAsDayOne':True,'defaultBroadcastIntervalDaysProposal':7,'previousJan02SettingDiscarded':True,'fixedTwelveBroadcastSeasonDiscarded':True,'milestones':[{'id':'day100','date':'2026-04-27'},{'id':'day200','date':'2026-08-05'},{'id':'day201','date':'2026-08-06'},{'id':'birthday2026','date':'2026-09-10'},{'id':'day300','date':'2026-11-13'},{'id':'anniversary1','date':'2027-01-18'}],'wikiRead':'https://www.namu.moe/w/%EB%9D%BC%EC%BD%94%EC%BD%94','originalWikiAccess':'unavailable','skipDatePolicy':'retain_date_and_offer_late_celebration','status':'design_only'}
(out/'rakoko_calendar.design.json').write_text(json.dumps(calendar,ensure_ascii=False,indent=2),encoding='utf-8')
cat=json.loads((out/'rakoko_encounter_catalog.json').read_text(encoding='utf-8'))
obs=json.loads((out/'rakoko_observation_batch_03.json').read_text(encoding='utf-8'))
assert len(cat['events'])==72 and len({e['id'] for e in cat['events']})==72
assert len({e['title'] for e in cat['events']})==72
assert all(len(e['choices'])>=3 and e['eligibility_description'] and e['followup_description'] for e in cat['events'])
assert sum(e['trigger_kind']=='outfit_leak_hook' for e in cat['events'])==1
assert len(obs['observations'])==12 and obs['distinct_videos']==10
stats=dict(collections.Counter(e['trigger_kind'] for e in cat['events']))
(out/'rakoko_encounter_review.md').write_text('''# 인카운터 확장 검토

2026-11-04 · 정적 데이터 검사. 실행/플레이 테스트 아님.

- 72개 ID·제목 중복 없음, 모두 조건·3개 이상 선택·후속 설명 포함.
- 12분류 각6개. 기존 실화 카드와 주제가 중복될 수 있으며 합산하지 않음.
- 의상 유출 훅1개. 기존 유출 엔진과 이중 추첨 금지.
- 일반 랜덤과 조건 후속·결과 반응·예약 변주·방송 후 랜덤 분리.
- 후속은 난수로 소멸시키지 않고 도래 대기열로 진행.
- 1/18 시작·9/10 생일·기념일 건너뛰기 대응 반영.
- 일반180/후속60 목표 미달. 코너별 적격 풀 소진·반복 체감·밸런스는 구현 후 검증 필요.
- 결과는 서술형 설계이며 실행 효과·완성 대사·추가 이미지 제작은 남음.

유형별 수: '''+json.dumps(stats,ensure_ascii=False)+'\n',encoding='utf-8')
p=Path('work/rakoko/STATE.md')
s=p.read_text(encoding='utf-8')
p.write_text('''# 2026-11-04 최신 — 인카운터·달력 정정

- 사용자: 앞선 돌발 사건 모두 반영, 추가 조사와 독자 창작 허용. 시작일은 최종 정정으로 2026-01-18. 1/2안 폐기. 생일9/10, 나무위키 원문 접속불가로 미러 확인.
- 창작 인카운터72종/12분류. 실화72건 아님. 기존29와 주제 중복 가능, 합산금지. build_encounter_expansion.py 재생성.
- 추가조사03: 63검색문맥→13전후60초구간→12관찰/10영상. B만/A0.
- 달력명세·calendar.design.json·기능명세v1.2·encounter_review 작성. 12회 고정안 폐기. 목표 일반180/후속60은 아직 미달. 주간방송·1주년회고는 미확정 제안.
- 다음: 창작72개 실행 효과/후속ID 구체화, 기존자료와 family중복통합, 코너별 적격풀 검토.

---
'''+s,encoding='utf-8')
print('Validated 72 designs; 12 observations / 10 videos; 2026-01-18 start.',stats)
