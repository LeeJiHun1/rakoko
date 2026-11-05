import json, runpy
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs'
runpy.run_path(str(ROOT/'work/rakoko/build_cards.py'))
inv={x['id']:x for x in json.loads((ROOT/'work/rakoko/inventory.json').read_text(encoding='utf-8'))}
doc=json.loads((OUT/'rakoko_event_cards.json').read_text(encoding='utf-8'))
cards=doc['cards']
def evidence(c,vid,start,end,fact):
    c.update(evidence='B',date=inv[vid]['broadcast_date_from_title'],source_url=inv[vid]['url']+f'&t={start}s',start_seconds=start,end_seconds=end,source_fact=fact,verification_needed='원음·화자·연속 화면 대조 필요')
    c['source_group']=vid
evidence(cards[21],'q1ZG65-Ujy4',13169,13340,'모자 길이 퍼즐에서 힌트와 시각적 비교를 거쳐 답을 고르는 자막 문맥이 있다. 퍼즐 화면도 별도로 확인했다. 발화자와 정확한 반응은 미확정이다.')
evidence(cards[22],'Ro0DbUCnsM0',2060,2640,'노래방 진행과 곡 선택을 이야기하는 자막 문맥이 있다. 마이크를 든 아바타와 곡 요청 패널 화면을 확인했다. 실제 가창·짐볼 동작은 음성·연속 화면 대조 전이다.')
evidence(cards[23],'hLRRdR9IMkM',5913,6045,'색과 슬라이더 위치를 전달하며 협동하는 자막 문맥을 읽었다. 게임 화면과 세 아바타 아이콘도 별도로 확인했다. 각 발언의 화자는 미확정이다.')
new=[
('고친 것과 남은 것','장비','yaSuAocNYDw',697,770,'모션 장비의 충전·연결 문제는 해결했다고 설명하고 간헐적 끊김은 남았다고 구분하는 자막 문맥이 있다. 실제 기술 원인과 복구 상태는 확정하지 않는다.','점검표에 해결한 문제와 남은 문제가 섞여 있다.','해결한 항목을 지운다|남은 증상을 기록한다|안정적인 코너를 고른다'),
('교체 전에 백업부터','방송 준비','1HIh-ekHAaw',3273,3360,'새 저장장치가 도착했지만 교체 전 백업이 필요하다고 말하는 자막 문맥이 있다. 실제 교체·백업 완료 여부는 미확인이다.','장비를 바꾸기 전에 남겨야 할 자료가 있다.','먼저 백업한다|자료 목록을 정리한다|교체 일정을 따로 잡는다'),
('게임 소리 들리나요','장비','ChKm2pt_clM',12147,12190,'수박게임을 틀어 소리가 잘 들리는지 묻고 응답에 반응하는 자막 문맥이 있다. 실제 출력 음량은 미확인이다.','화면은 준비됐고 이제 소리를 확인할 차례다.','시험 소리를 낸다|시청자 응답을 기다린다|설정을 다시 본다'),
('팬미팅 준비를 돌아보며','팬 소통','t3Y8PL9bSjk',271,310,'행사 준비 수량을 더 늘릴 걸 그랬다는 자막 문맥이 있다. 주최 측 공식 프로그램에도 라코코 팬미팅이 등재돼 있다. 실제 수량·판매량·참석 인원은 미확인이다.','기념 행사의 다음 준비를 정리한다.','필요한 수량을 다시 적는다|진행 순서를 점검한다|다음 행사의 메모로 남긴다'),
('흐름을 다른 주제로','팬 소통','xnIhJoOfnds',9982,10035,'과한 채팅은 일부러 반응하지 않고 다른 주제로 이끄는 방법을 설명하는 자막 문맥이 있다. 이후 실제 분위기가 안정됐다는 결과는 미확인이다.','채팅의 장난 때문에 준비한 이야기가 밀린다.','준비한 주제로 돌아간다|진행 기준을 짧게 알린다|다음 코너로 넘어간다')]
for title,cat,vid,start,end,fact,prompt,choices in new:
    c=dict(id=f'RK-{len(cards)+1:03}',title=title,category=cat,game_prompt=prompt,choices=[dict(text=t,outcome='미정: 실제 결과를 뜻하지 않는 창작 설계') for t in choices.split('|')],eligibility='초안: 플레이테스트 전',chain=None)
    evidence(c,vid,start,end,fact); cards.append(c)
for c in cards:
    vid=c['source_url'].split('v=')[1].split('&')[0]
    c.setdefault('source_group',vid)
    c['audio_verified']=False
    c['visual_verified']=False
cards[15]['visual_verified']=True
cards[15]['visual_note']='201일 방송 약 15분 구간에 3개 게이지와 여러 활동 버튼이 있는 화면. 각 버튼의 기능은 자막 설명과 구분한다.'
cards[20]['visual_verified']=True
cards[20]['visual_note']='8:11:43~8:12:08 부근에 황금 할버드 획득 표시를 관찰. 처치 동작 전체·시도 횟수·성공 발언 화자는 미확인.'
cards[20]['source_fact']='성공으로 해석되는 자막 반응과, 뒤이어 황금 할버드 보상 표시가 있는 원본 화면을 확인했다. 처치 동작 전체와 정확한 환호 발화자는 미확인이다.'
for idx in [21,22,23]:cards[idx]['visual_verified']=True
cards[27]['external_sources']=['https://www.dcfair.co.kr/']
doc.update(version='0.2',cards=cards,source_groups=len({c['source_group'] for c in cards}),audio_verified_cards=0,visual_supported_cards=sum(c['visual_verified'] for c in cards))
assert len(cards)==29 and doc['source_groups']==25
assert all(0<=c['start_seconds']<c['end_seconds']<=inv[c['source_group']]['duration'] for c in cards)
(OUT/'rakoko_event_cards.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf-8')
md=['# 라코코의 방송일지 — 가벼운 사건 카드 v0.2','','2026-11-03 · 29개 카드 / 25개 영상 출처 · B 29개 · A 0개 · 화면 보조근거 5개','','B는 자동자막 전후 문맥 검토다. 화면 보조근거가 있어도 음성·화자 검증 완료(A)는 아니다. 동일 영상에서 서로 다른 장면을 나눈 카드가 있으므로 29개의 독립 실화라는 뜻은 아니다. 원본 대사 인용 대신 요약을 사용했다.','','제외: 오컬트, 심각한 사건, 사생활, 성적 벌칙, 신체 평가, 정체성 교체. 상황과 선택지·결과는 창작이며 실제 선택을 뜻하지 않는다. 확률·수치는 미정이다.','','기존 제목 기반 후보 3개는 구간을 찾아 B로 보강했다. RK-020~021은 한 도전의 연속 카드이며 RK-010/027、RK-004/029、RK-014/015도 각각 같은 영상이다.','','화면 대조 세부 사항은 [장면 근거대장](rakoko_scene_evidence.md)을 참고한다.','']
for c in cards:
    md += [f"## {c['id']} · {c['title']}",'',f"- 분류: {c['category']} / {c['date']} / B",f"- 출처: [다시보기 {c['start_seconds']}–{c['end_seconds']}초]({c['source_url']})",f"- 자막 문맥 요약: {c['source_fact']}",f"- 원본 화면 보조: {'있음 — 해당 화면 요소만 확인' if c['visual_verified'] else '없음'}",'- 원음·화자: 미확인',f"- 창작 상황: {c['game_prompt']}",'- 창작 선택: '+' / '.join(x['text'] for x in c['choices']),'- 결과·확률·수치: 미정','']
    if c.get('visual_note'):md += ['화면 메모: '+c['visual_note'],'']
    if c.get('external_sources'):md += ['외부 대조: [대전콘텐츠페어 공식 프로그램](https://www.dcfair.co.kr/)에 팬미팅·버추얼 스튜디오 등재. 실제 참석 인원·판매 실적은 확인하지 않았다.','']
(OUT/'rakoko_event_cards.md').write_text('\n'.join(md),encoding='utf-8')
print('Validated:',len(cards),'cards;',doc['source_groups'],'source groups;',doc['visual_supported_cards'],'visual supported cards; audio A=0')
