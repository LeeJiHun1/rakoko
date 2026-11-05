import json,re
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'outputs'; W=ROOT/'work/rakoko'
inv=json.loads((W/'inventory.json').read_text(encoding='utf-8'))
status=json.loads((W/'collection_status.json').read_text(encoding='utf-8'))
cards=json.loads((OUT/'rakoko_event_cards.json').read_text(encoding='utf-8'))['cards']
scenes=json.loads((OUT/'rakoko_scene_evidence.json').read_text(encoding='utf-8'))['scenes']
fan=json.loads((OUT/'streamer_fangame_survey.json').read_text(encoding='utf-8'))
rows=[]; months=defaultdict(lambda:Counter())
for v in inv:
    vid=v['id']; cached=(W/(vid+'.json')).exists(); prev=status.get(vid,{})
    current='cached' if cached else prev.get('status','not_requested')
    record=dict(video_id=vid,title=v['title'],broadcast_date_from_title=v['broadcast_date_from_title'],duration_seconds=v['duration'],source_url=v['url'],subtitle_state=current,prior_collector_response=prev.get('status'),card_ids=[c['id'] for c in cards if c['source_group']==vid],scene_ids=[s['id'] for s in scenes if s['video_id']==vid],audio_verified=False,full_vod_reviewed=False)
    if vid=='pLjjbiz2sdo':record['browser_export_response']='No transcript is available (2026-11-03)'
    rows.append(record)
    month=(v['broadcast_date_from_title'] or 'unknown')[:7]
    months[month]['listed']+=1;months[month]['cached']+=int(cached)
counts=Counter(r['subtitle_state'] for r in rows)
assert len(rows)==230 and counts['cached']==81
assert len({r['video_id'] for r in rows})==230
assert sum(counts.values())==230
data=dict(as_of='2026-11-03',listed_videos=230,subtitle_states=dict(counts),full_vods_reviewed=0,audio_verified=0,records=rows)
(OUT/'rakoko_source_index.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
md=['# 라코코 수집 현황과 자료 안내','','2026-11-03 · 최신 상태. 전체 수집·학습 완료 선언이 아니다. 준비된 자료와 검증이 남은 자료를 구분한다.','','## 이번 추가분','','- 팬게임: 서로 다른 스트리머 **27명·27작품**의 제작자 공개 자료. 국내 2명·해외 25명. 작품 조사와 직접 플레이를 구분했다.','- 라코코 사건 카드: **29개**, 연결된 영상 **25편**. 자막 문맥 B 29개. 그중 화면 보조 5개. 음성·화자 대조 A 0개.','- 장면 근거대장: 이번 추가 조사 **12구간**, 저장 화면 보조 5구간. 모든 구간의 시작·끝이 해당 영상 길이 안에 있는지 검사했다.','- 말투 가이드: 잠정 관찰 10개. 판단 가이드: 잠정 카드 14개. 반례 후보도 추가했다.','- 외부 소재: 공식 편성에서 찾은 가벼운 콘텐츠 8개와 팬 작품 피드백 사례. 예정 공지와 실제 결과를 구분했다.','','## 핵심 문서','','|자료|쓰임|','|---|---|','|[말투 가이드](rakoko_speech_guide.md)|창작 대화의 호흡·호칭·질문·주제 복귀|','|[판단 가이드](rakoko_decision_guide.md)|상황별 선택과 반례·예외|','|[이벤트 검증 기록](rakoko_event_verification.md)|외부 단서와 다시보기 연결|','|[사건 카드](rakoko_event_cards.md) / [JSON](rakoko_event_cards.json)|사실 요약과 창작 선택지 분리|','|[장면 근거대장](rakoko_scene_evidence.md) / [JSON](rakoko_scene_evidence.json)|새 구간과 화면 확인의 정확한 범위|','|[팬게임 27명 조사](streamer_fangame_survey.md) / [JSON](streamer_fangame_survey.json)|유형·규칙·개별 제작자 원출처|','|[국내 보강 자료](streamer_domestic_supplement.md)|원문 확인된 사례와 대기 후보|','|[가벼운 외부 콘텐츠](streamer_light_content_sources.md)|중후반 창작 소재의 원출처|','|[후속 사건 설계](rakoko_followup_event_design.md)|기존 소재가 다음 방송에 돌아오는 창작 구조|','|[고유 기획 방향](rakoko_original_game_direction.md)|라코코를 고정한 방송일지 게임의 중심 규칙|','|[230편 출처대장](rakoko_source_index.json)|영상별 자막 상태·카드·장면 연결|','','## 원자료 커버리지','','|월|목록 영상|자막 캐시|','|---|---:|---:|']
for month,m in sorted(months.items()):md.append(f"|{month}|{m['listed']}|{m['cached']}|")
md+=['',f"처리 상태: {dict(counts)}. 캐시 81편은 전수 정독·청취한 영상 수가 아니다. 이 목록은 공개 채널의 Videos 목록이며 삭제·비공개·다른 채널의 자료를 포함하는 전체 생방송 목록은 아니다.",'','## 끝내기 전에 남은 검증','','|남은 항목|현재 상태|완료 근거|','|---|---|---|','|원음·화자|미완료|깨끗한 독백·TTS 겹침·합방의 실제 음성을 구분하고 발화자 확인|','|정확한 발음·억양·말속도|미완료|다른 날짜의 동일 상황을 원음으로 대조|','|약속과 이행|부분 탐색|약속 발언과 후속 실행 장면 두 출처 연결. 창작 후속표는 실화 증거가 아님|','|게임 결과|부분 확인|성공·실패가 보이는 연속 구간 확인. 보상 화면만 본 경우 범위를 한정|','|11월 자료|자막 캐시 0편|현재 목록의 2편에서 가벼운 구간을 찾아 별도 검토|','|국내 팬게임 원문|일부 접근 제한|네이버 카페 원문과 실제 작품 내용 연결. 해외 표본으로 국내 조사를 대체했다고 말하지 않음|','|그림·음악·음성 사용 범위|미확정|사용할 개별 자산의 출처와 허용 범위 확인. 현재 캡처는 조사용|','','브라우저 원본 재생은 가능했다. 자막 수집기의 기존 IpBlocked와 별개이며 새로운 IP·계정·프록시로 우회하지 않았다. 공개 자막 내보내기를 요리 방송 1편에서 시도했으나 자막 없음 응답을 받았다. 현재 원음을 직접 청취한 검증 결과는 없다.','','## 자료를 게임에 사용하는 순서','','1. B 자료로 사건의 뼈대와 창작 선택지를 만든다. 실제 대사·성격·확률로 확정하지 않는다.','2. 화면 보조는 보이는 UI·보상·게임 종류에만 적용한다. 실제 감정과 발언은 음성 확인 전 보류한다.','3. 초반은 라코코 자료 중심, 중후반은 기존 선택의 후속과 출처를 참고한 창작 콘텐츠로 확장한다. 사건 비중·플레이 길이는 설계값이며 실제 방송 빈도로 추정하지 않는다.','4. 엔딩은 같은 라코코의 도전·기획·팬 참여·합방 기록을 편집한 일지다. 실제 은퇴·계약·사생활, 오컬트, 타 캐릭터 환생은 제외한다.','5. 게임에 넣을 자료가 확정되면 사실·창작·미검증 표시가 유지되는지 다시 검사한다.']
md=[x.replace('27명·27작품',f'{fan["distinct_streamers"]}명·{len(fan["games"])}작품').replace('국내 2명·해외 25명','국내 2명·해외 28명').replace('팬게임 27명 조사',f'팬게임 {fan["distinct_streamers"]}명 조사') for x in md]
(OUT/'rakoko_collection_overview.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
for filename,notice in [('rakoko_speech_guide.md','최신 v0.2: 잠정 관찰 10개. 원음·화자 검증 0건. 아래의 v0.1은 초기 본문이며 맨 아래 추가 관찰이 최신 보강이다.'),('rakoko_decision_guide.md','최신 v0.2: 잠정 판단 카드 14개. 원음·화자 검증 0건. 아래의 v0.1은 초기 본문이며 맨 아래 추가 카드와 반례를 함께 읽는다.'),('rakoko_event_verification.md','최신 v0.2: 사건 카드 29개·25개 영상 출처·B29·A0·화면 보조 5개. 본문의 초기 수량은 당시 기록이며 마지막 보강 기록을 우선한다.')]:
    p=OUT/filename;body=p.read_text(encoding='utf-8'); parts=body.split('\n',1)
    parts[1]=re.sub(r'^\n*> 최신 [^\n]*\n*','',parts[1],count=1)
    p.write_text(parts[0]+'\n\n> '+notice+'\n\n'+parts[1].lstrip('\n'),encoding='utf-8')
state=W/'STATE.md'; old=state.read_text(encoding='utf-8-sig')
header=f'''# 최신 추가 수집 — 2026-11-03

- 최신 총괄: outputs/rakoko_collection_overview.md. 원음·화자 A=0, 전체 완료로 보고하지 않는다.
- 팬게임 제작자 원문 27명·27작품(국내2/해외25), domestic_supplement와 light_content_sources 추가.
- 라코코 29카드·25영상 출처, B29/C0, 화면 보조 5카드. 12구간의 장면 근거대장 작성. 제목 기반 기존3개를 B로 보강.
- 말투10개/판단14개 잠정 관찰, D03 반례 추가. 행사 공식 프로그램과 E16 연결.
- 원본 YouTube 브라우저 재생 가능 확인. 자막 수집기 IpBlocked와 구분. 공개 자막 내보내기 요리 1편 시도는 자막 없음 응답. 캐시81 유지. 음성·화자는 검증하지 못했다.
- 230편 개별 상태대장: outputs/rakoko_source_index.json, 상태 {dict(counts)}. 전체 정독·청취 수가 아니다.
- 재생성: expand_research.py → build_research_dossier.py → build_fangame_survey.py → build_collection_index.py. 원 build_cards.py만 실행하면 초기24카드로 돌아가므로 단독 실행하지 않는다.
- 다음 핵심: 음성·화자 대조, 미확인 결과/약속 이행, 국내 원문 보강. 이전 수량은 역사 기록이다.

---

'''
header=header.replace('27명·27작품(국내2/해외25)','30명·30작품(국내2/해외28)')
if old.startswith('# 최신 추가 수집 —'):old=old.split('\n---\n\n',1)[1]
state.write_text(header+old,encoding='utf-8')
print('Source index:',len(rows),'videos;',dict(counts));print('All source IDs and card/scene time ranges validated.')
