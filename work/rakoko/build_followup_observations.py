import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; O=ROOT/'outputs'; W=ROOT/'work/rakoko'
inv={x['id']:x for x in json.loads((W/'inventory.json').read_text(encoding='utf-8'))}
def step(vid,start,end,summary,kind='자막 문맥 B'):
    data=json.loads((W/(vid+'.json')).read_text(encoding='utf-8'))
    assert any(start<=x['start']<=end for x in data)
    assert 0<=start<end<=inv[vid]['duration']
    return dict(video_id=vid,date=inv[vid]['broadcast_date_from_title'],start_seconds=start,end_seconds=end,source_url=inv[vid]['url']+f'&t={start}s',summary=summary,evidence=kind,audio_verified=False,speaker_verified=False)
chains=[
 dict(id='OBS-CHAIN-001',title='팬 호칭 준비와 다음 날의 투표·호칭 결정',steps=[
 step('Kv03yHk6Fe8',13910,13960,'방송을 마무리하며 다음 날 준비할 숙제 중 팬 호칭을 언급하는 자막 문맥.'),
 step('R_Yp_Hrs1Jc',2730,2785,'팬 호칭 후보를 고민해 준비했으며 투표하자는 자막 문맥.'),
 step('R_Yp_Hrs1Jc',3670,3720,'앞선 투표가 사라져 다시 하겠다는 자막 문맥. 원인·프로그램 오류는 미확인.'),
 step('R_Yp_Hrs1Jc',3781,3830,'후보와 투표가 진행되는 원본 화면을 확인. 중간 득표이므로 최종 결과가 아니다.','B + 원본 화면 보조'),
 step('R_Yp_Hrs1Jc',4260,4380,'이후 팬 호칭을 키몽이로 정한다는 자막 문맥. 최종 득표를 확인한 것은 아니다.')],
 conclusions=['다음 날 준비하겠다는 말과 다음 날의 후보 소개가 연결되는 사례다.','의견을 묻는 장면·중간 투표·최종 호칭을 서로 다른 기록으로 남겼다.'],
 limitations=['정확한 후보 표기는 일부 자동자막에서 흔들린다. 화면과 대조 없이 복원하지 않는다.','최종 호칭과 투표의 최다 득표가 같았다는 결론을 내리지 않는다.','음성·화자 대조 전이므로 A가 아니다.'],screenshot='rakoko_fanname_poll.jpg',adoption_decision=None),
 dict(id='OBS-CHAIN-002',title='장비 점검과 교체 계획 이후의 상태 보고',steps=[
 step('yaSuAocNYDw',697,770,'충전·연결 문제의 해결 언급과 남은 간헐적 끊김을 구분하는 자막 문맥.'),
 step('1HIh-ekHAaw',3273,3360,'장비 변경을 이야기하며 저장장치 교체 전에 백업해야 한다는 자막 문맥.'),
 step('ba0mj_kqP_M',530,575,'포맷은 잘됐고 일시적으로 증상이 덜 나온다는 자막 문맥.')],
 conclusions=['완전 해결과 증상 완화, 계획과 실제 완료는 서로 다른 상태다.','8월 12일에는 상태가 나아졌다는 보고가 있지만 완전 복구를 확정할 근거는 아니다.'],
 limitations=['서로 다른 장비 문제가 섞여 있으므로 세 방송을 동일 원인의 단일 고장으로 단정하지 않는다.','백업과 교체가 실제 끝났다는 화면은 확인하지 않았다.','발언으로 제시된 기술적 원인을 공학적 진단 결과로 취급하지 않는다.'],screenshot=None,adoption_decision=None),
 dict(id='OBS-CHAIN-003',title='준비 시간 때문에 당일 자료가 미완성인 설명',steps=[
 step('nIcK2sD5aEs',6800,6860,'다음 날 할 것을 준비하느라 당일 PPT를 다 만들지 못했다는 취지의 자막 문맥. 이후 월드컵이나 카페를 보는 대안을 언급.')],
 conclusions=['준비에 관한 발언에는 준비 완료뿐 아니라 준비가 밀렸다는 설명도 포함된다.'],
 limitations=['다음 날 어떤 준비물로 연결됐는지 확정하지 않았다.','한 번의 사례로 평소의 계획성이나 성실성을 수치화하지 않는다.','제외 소재로 이어지는 후속 내용은 수집 카드에 넣지 않는다.'],screenshot=None,adoption_decision=None)
]
(O/'rakoko_followup_observations.json').write_text(json.dumps(dict(as_of='2026-11-03',scope='관찰 자료. 기존 창작 후속 사건 설계와 별개.',chains=chains),ensure_ascii=False,indent=2),encoding='utf-8')
md=['# 라코코 방송의 전후 연결 관찰','','2026-11-03. **창작 후속 사건표와 다른 실제 자료 관찰대장**이다. 자막 문맥 B와 화면 보조를 구분한다. 채택·기획 판단은 전부 미정으로 남겼다. 원음·화자 대조 A는 0건이다.','']
for c in chains:
    md += [f"## {c['id']} · {c['title']}",'','|방송일·구간|확인 범위|','|---|---|']
    for s in c['steps']:md.append(f"|[{s['date']} · {s['start_seconds']}–{s['end_seconds']}초]({s['source_url']})|{s['summary']}|")
    md+=['','관찰 정리: '+' '.join(c['conclusions']),'','남은 확인: '+' '.join(c['limitations']),'','채택 판단: 미정.']
    if c['screenshot']:md+=['',f"[투표 중간 저장 화면]({c['screenshot']}) — 최종 득표표가 아니다."]
    md+=['']
(O/'rakoko_followup_observations.md').write_text('\n'.join(md),encoding='utf-8')

# Save tool observations without confusing a no-transcript response with proven absence.
(W/'browser_transcript_observations.json').write_text(json.dumps(dict(as_of='2026-11-03',observations=[
 dict(video_id='G_5KSAPHwCs',result='No transcript is available',purpose='미확보 영상 확인'),
 dict(video_id='tDOxvs7LDm8',result='No transcript is available',purpose='이미 자막 캐시가 있는 대조 영상')],conclusion='캐시가 있는 영상에서도 같은 응답. 이 도구의 응답만으로 실제 자막 부재를 확정할 수 없다. 반복 일괄 요청을 하지 않는다.'),ensure_ascii=False,indent=2),encoding='utf-8')

review={
 'IDX-00015':('문맥 검토 B','첫 방송에서 팬 호칭 아이디어를 다시 묻는 문맥. 최종 결정은 이 구간으로 확정하지 않음.'),
 'IDX-00045':('범위 제외','팬 작품이 아니라 의학적 설명이 검색된 오검출. 게임 소재에서 제외.'),
 'IDX-00322':('문맥 검토 B','중복 영상은 건너뛰기로 했다는 문맥. 새 버전을 다시 틀겠다는 말과 구분.'),
 'IDX-00641':('검색 오검출','노래 가사 속 약속이라는 단어. 실제 후속 약속 근거에서 제외.'),
 'IDX-03150':('문맥 검토 B','작업 날짜를 잘못 잡아 썸네일이 붙지 않았던 경우를 회고하는 문맥. 정확한 발생일·원인·당사자는 미확인.'),
 'IDX-03573':('범위 제외','다른 사람의 사적 일정 언급. 라코코의 방송 공약 근거에서 제외.')}
p=O/'rakoko_retrieval_index.json'; index=json.loads(p.read_text(encoding='utf-8'))
for r in index['candidates']:
    if r['id'] in review:r['status'],r['fact_summary']=review[r['id']]
index['reviewed_retrieval_positions']=len(review)
index['review_note']='일부 검색 지점에 문맥 분류를 추가했지만 A 검증 사건 수는 0이다. 자동 탐색 전체를 확인했다고 읽지 않는다.'
p.write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
print('3 observation groups /',sum(len(x['steps']) for x in chains),'source intervals validated. Six retrieval hits classified.')
