"""Record source observations, with no game adoption decisions or new fiction."""
import json
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2];W=ROOT/'work/rakoko';O=ROOT/'outputs'
inv={v['id']:v for v in json.loads((W/'inventory.json').read_text(encoding='utf-8'))}
rows=[
('첫 방송에서 정규 시각 안내','Kv03yHk6Fe8',1434,1470,'방송 시간을 오후 2시 반으로 안내하는 자막 문맥.','이 날짜의 안내다. 이후 전 기간의 실제 시작 시각이나 현재 일정을 뜻하지 않는다.','IDX-00003'),
('구독 기능 신청 후 공지 계획','R_Yp_Hrs1Jc',8671,8708,'구독 기능을 신청하고 열린 시각을 공지해야 한다는 자막 문맥.','플랫폼의 실제 자격 요건·승인 절차를 확인한 자료가 아니며 해당 발언의 맥락만 기록한다.','IDX-00051'),
('다시보기 날짜 정정 요청','-KemMFgrOII',3136,3161,'다시보기 썸네일 날짜가 잘못됐으니 고쳐 달라는 질문·요청이 자막에 등장한다.','요청자가 누구인지, 날짜가 실제 틀렸는지, 이후 수정됐는지는 미확인. 질문을 곧바로 발생 사실로 승격하지 않는다.','IDX-00132,IDX-00133'),
('방송 시각 착각으로 이른 시작 설명','Ei7wO4NO65Q',16540,16615,'방송 시간을 착각해 의도치 않게 일찍 켰다는 설명과 다음 날 시작 시각을 고민하는 자막 문맥.','실제 예정·시작 시각의 분 단위 차이는 미확인. 다른 지각 사례와 구분한다.','IDX-00486'),
('첫 업로드 이후 썸네일 변경 시도','IVYVjRo8wek',8475,8590,'본채널에 첫 영상이 올라왔다는 이야기 뒤, 썸네일을 바꿔 본 적이 없다며 변경을 시도하고 이후 바꿔 놨다는 자막이 이어진다.','최초 업로드 날짜·파일·정확한 작업 주체와 실제 저장 화면은 미확인. 변경을 시도했다는 말과 저장 완료 화면은 다르다.','IDX-00729'),
('방송 테마 배경 제작 요청','_wog0wu6d8A',1299,1345,'시청자가 좋아할 것 같아 배경을 제작진에게 그려 달라고 요청해 준비했다는 자막 문맥.','작가의 이름·보수·작업 기간은 수집하지 않는다. 요청과 결과물 원본의 연결은 화면 대조 전이다.','IDX-00892,IDX-00893'),
('알람과 휴대전화 전원 설명','IFrj8Y0V1ag',1088,1125,'자기 전에 알람을 맞추지만 휴대전화가 꺼져 있을 줄은 몰랐다고 설명하는 자막 문맥.','기기 전원·알람 설정을 실제 확인하지 않았다. 의료적 설명과 벌칙 내용은 이 관찰에서 제외한다.','IDX-01516'),
('썸네일 색상 피드백','28oEgK4mT-o',936,980,'진행 중 썸네일 피드백을 하겠다며 색상이 애매하다고 말하고 배경·PSD 파일을 언급하는 자막 문맥.','수정 요청의 정확한 내용과 이후 최종 이미지 변경은 미확인.','IDX-02002'),
('컴퓨터 문제와 자료 업로드 지연 설명','1HIh-ekHAaw',23845,23900,'자료를 업로드해야 하는데 컴퓨터 때문에 정신이 없었다며 설명하는 자막 문맥.','어떤 자료가 언제 실제 올라갔는지, 지연 원인의 전부가 컴퓨터였는지는 미확인.','IDX-03506'),
('생일 축전 소개와 게시 예정 언급','NVwuL1_SHZY',3570,3640,'썸네일 제작자가 축전도 그려 줬다는 소개와 카페에 올릴 예정이라는 자막 문맥.','원본 축전·게시물·작가 귀속을 직접 대조하지 않았다. 공개 예정 발언을 실제 게시 완료로 기록하지 않는다.','IDX-04165,IDX-04166'),
('행사 기간 아침 방송 예고','PYaZJJC2z8c',2900,2970,'10월 16~18일 행사 참여로 평소 시각의 방송이 어려워 아침에 방송하겠다는 안내. 오전 7시 반과 9시 또는 9시 반을 언급하는 자막 문맥.','예정 안내다. 실제 시작·종료 시각을 확인한 기록이 아니다. 행사 참가 사실은 기존 공식 프로그램 근거와 연결한다.','IDX-04600'),
('다음 팬미팅 요청과 개최 미정 응답','kbxwJpapjCo',13750,13820,'다음 팬미팅을 요청하는 말 뒤, 언제 할 수 있을지 아직 모른다는 취지의 자막 문맥.','합의·개최 확정·예약 시작의 증거가 아니다. 재개최 약속으로 분류하지 않는다.','IDX-04701,IDX-04702'),
]
records=[]
for n,(title,vid,start,end,summary,uncertainty,hit_ids) in enumerate(rows,1):
    transcript=json.loads((W/(vid+'.json')).read_text(encoding='utf-8'))
    assert any(start<=r['start']<=end for r in transcript)
    assert 0<=start<end<=inv[vid]['duration']
    records.append(dict(id=f'OBS2-{n:03}',title=title,video_id=vid,broadcast_date=inv[vid]['broadcast_date_from_title'],start_seconds=start,end_seconds=end,source_url=inv[vid]['url']+f'&t={start}s',evidence='B',source_summary=summary,uncertainty=uncertainty,audio_checked=False,screen_checked=False,speaker_checked=False,retrieval_ids=hit_ids.split(','),adoption_decision=None,game_design_fiction=None))
data=dict(as_of='2026-11-03',record_count=len(records),distinct_videos=len({r['video_id'] for r in records}),scope='추가 자막 문맥 관찰. 독립 사건·새 영상 전수 검토 수가 아님.',records=records)
(O/'rakoko_observation_batch_02.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
md=['# 라코코 추가 관찰대장 02','','2026-11-03 · 12개 관찰 / 12편 출처의 지정 구간 · B 12개 / A 0개','','전체 영상 정독·청취 수가 아니다. 이미 조사한 방송의 다른 장면도 포함한다. 기존 사건 카드 29개와 별개로 보관하며 새 독립 실화 12개를 추가했다고 합산하지 않는다. 확인된 범위와 미확인 결과를 분리했고, 채택 판단·창작 선택지는 전부 미정이다.','']
for r in records:
    md += [f"## {r['id']} · {r['title']}",'',f"- [원본 {r['broadcast_date']} · {r['start_seconds']}–{r['end_seconds']}초]({r['source_url']})",'- 자막 문맥: '+r['source_summary'],'- 미확인: '+r['uncertainty'],'- 원음·화자·화면: 미대조','- 채택 판단: 미정','']
md+=['## 읽은 탐색 지점과 제외·보류','','이번에는 84개의 짧은 탐색 문맥을 읽고, 그중 위 12개 관찰에 연결되는 지점과 추가 구간을 정리했다. 나머지는 게임 대사·시청자 발언·제외 소재·연결 불명확 등을 포함하므로 독립 사건으로 승격하지 않았다. 일부는 같은 문맥의 중복이다. 84는 전체 4,798지점의 전수 검토 수가 아니다.','','## 앞뒤 연결','','- 오후 2시 반 안내와 2월의 이른 시작 설명은 날짜가 다르다. 이를 하나의 고정 출근 성향으로 일반화하지 않는다.','- 썸네일을 바꿨다는 자막은 있지만 저장 화면은 확인하지 못했다.','- 행사 기간 방송 시각 예고는 기존 팬미팅 준비 회고와 연결하되 실제 시간표 이행은 미확인이다.','- 재개최 요청에 대한 미정 응답은 향후 약속 목록에 넣지 않는다.']
(O/'rakoko_observation_batch_02.md').write_text('\n'.join(md)+'\n',encoding='utf-8')

# Mark only the short contexts actually read, never infer facts from search counts.
index_path=O/'rakoko_retrieval_index.json'; idx=json.loads(index_path.read_text(encoding='utf-8'))
focus=json.loads((W/'focused_candidates.json').read_text(encoding='utf-8')); focus_ids={x['id'] for x in focus}
mapped={hit:r for r in records for hit in r['retrieval_ids']}
for r in idx['candidates']:
    if r['id'] in focus_ids:
        r['status']='짧은 문맥 1차 검토·사건 귀속/결과 미확정'
        r['review_batch']='02'
    if r['id'] in mapped:
        r['status']='자막 문맥 관찰 B·원음 미대조'
        r['fact_summary']=mapped[r['id']]['source_summary']
        r['observation_id']=mapped[r['id']]['id']
idx['reviewed_retrieval_positions']=sum(r['status']!='자동 탐색·미검토' for r in idx['candidates'])
idx['review_note']='문맥 검토는 짧은 탐색 문맥과 지정 구간에 한정. 전체 영상·전체 검색 지점 검토나 원음 검증을 뜻하지 않는다.'
index_path.write_text(json.dumps(idx,ensure_ascii=False,indent=2),encoding='utf-8')
src=O/'rakoko_source_index.json'; source=json.loads(src.read_text(encoding='utf-8'))
for s in source['records']:s['additional_observation_ids']=[r['id'] for r in records if r['video_id']==s['video_id']]
src.write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(new_observations=len(records),source_videos=data['distinct_videos'],short_contexts_read=len(focus_ids),cumulative_retrieval_positions_read=idx['reviewed_retrieval_positions'],audio_verified=0),ensure_ascii=False))
