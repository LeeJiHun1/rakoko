from pathlib import Path
import json
import random
from statistics import median, mean
from collections import Counter

out = Path(__file__).resolve().parents[2] / 'outputs'
def read(name):
    return json.loads((out/name).read_text(encoding='utf-8'))

# T 잡담, G 게임, F 팬 참여, S 특별 기획. 간단한 코너 코드가 추첨기의 입력이다.
rk_routes = 'T/open T TGFS TFS F/milestone TGFS G TF F G FS G/event FS TFS S S/calendar TGS TFS F/calendar G/result G/result G S GS TGFS TS G S/follow TF'.split()
ce_routes = ('TGS G TFS TGFS TS GS T TFS TS G TGFS TS TF F F TF GF GF '
             'G G G G G G S S S S S S T TF TGS T TFS GFS '
             'TFS G TF TGS TGFS G TS TS TS TS TS TS '
             'S S S TFS TS TF FS TF TFS S TFS S F TF FS S S F TF F G TGFS S TF').split()
# 하나의 사건으로 취급할 직접 대응. 나머지는 정의 ID가 별도 소재 키다.
rk_conditions = [
    '첫 방송 도입', '방송 기능 설정 숙제가 남음', '영상 입력을 쓰는 방송',
    '감별용 자료 준비', '목표 팔로워 수 근접', '방송 시작이 지연됨',
    '첫 전략 게임 연습', '스포츠 설명 코너 편성', '팬 공간 소개 편성',
    '몸동작으로 조작하는 게임 편성', '질문 목록 준비', '친선 대결 예약',
    '팀 편성 주제 선택', '다음 기획을 정할 여유가 있음', '친선 행사 초안 보유',
    '201일 기념 코너 수락', '온라인 연결이 필요한 코너', '디자인 감상 자료 준비',
    '생일 축하 코너 수락', '진행 중인 도전에서 재시도 선택', '도전 승리 판정 완료',
    '퍼즐 도전 진행 중', '음악 사용 가능한 노래 코너', '협동 상대와 코너 편성',
    '미해결 장비 점검 항목 보유', '장비 교체 계획 보유', '게임 소리 점검 필요',
    '팬 행사 종료 후 회고 도래', '현재 주제에서 벗어나는 대화가 생김']
overlap = {3:1,4:55,6:11,11:56,15:58,17:6,18:59,22:21,27:2,29:32}
cards = read('rakoko_event_cards.json')['cards']
creative = read('rakoko_encounter_catalog.json')['events']
assert len(rk_routes)==len(cards)==29 and len(ce_routes)==len(creative)==72
pool = []
for c,route in zip(creative,ce_routes):
    pool.append(dict(id=c['id'], title=c['title'], source='창작', route=route,
                     trigger=c['trigger_kind'], family=c['id'], group=c['category'],
                     condition=c['eligibility_description']))
for c,route in zip(cards,rk_routes):
    n=int(c['id'][3:])
    corners,_,kind=route.partition('/')
    paired=creative[overlap[n]-1] if n in overlap else None
    pool.append(dict(id=c['id'], title=c['title'], source='라코코 각색', route=corners,
                     trigger=kind or 'random', family=paired['id'] if paired else c['id'],
                     group=paired['category'] if paired else c['category'],
                     source_url=c['source_url'], evidence=c['evidence'],
                     condition=rk_conditions[n-1]))
phases = [(90,.90,.35),(240,.55,1.0),(None,.40,4.0)]
# 게임 플레이가 중심인 카드. 게임 중 나올 수 있는 장비 오류 등은 일반 주제다.
game_ids = set('RK-007 RK-010 RK-012 RK-020 RK-021 RK-022 RK-024 RA-001 RA-004 CE-017 CE-018 CE-019 CE-020 CE-021 CE-022 CE-023 CE-024 CE-025 CE-029 CE-030 CE-038 CE-042 CE-069'.split())
late_families={'CE-017','CE-018','CE-022','CE-029'}
def run(entries,pattern,seed,weighted=False,reserve=False):
    rng=random.Random(seed)
    used=set()
    recent={}
    first=None
    fallback=early_rk=early_regular=0
    holes=Counter()
    late_games=late_regular=0
    for week in range(52):
        for slot in range(3):
            corner=pattern[(week*3+slot)%len(pattern)]
            eligible=[e for e in entries if e['trigger']=='random' and corner in e['route']
                      and e['family'] not in used and week-recent.get(e['group'],-10)>2
                      and (not reserve or week*7>240 or e['family'] not in late_families)]
            if not eligible:
                fallback+=1
                holes[corner]+=1
                if first is None: first=week+1
                continue
            _,share,game_weight=next(p for p in phases if p[0] is None or week*7<=p[0])
            if not weighted and week*7<=90:
                share=.8
            source='라코코 각색' if rng.random() < share else '창작'
            candidates=[e for e in eligible if e['source']==source] or eligible
            if weighted:
                picked=rng.choices(candidates,weights=[game_weight if e['id'] in game_ids else 1 for e in candidates])[0]
            else:
                picked=rng.choice(candidates)
            if week*7>240:
                late_regular+=1
                late_games+=picked['id'] in game_ids
            used.add(picked['family'])
            recent[picked['group']]=week
            if week<10:
                early_regular+=1
                early_rk+=picked['source']=='라코코 각색'
    return first or 53,fallback,early_rk,early_regular,holes,late_games,late_regular

patterns={'잡담 중심':'TTF','게임 중심':'GGS','혼합':'TGFS'}
def report(entries):
    lines=[]
    for name,pattern in patterns.items():
        rows=[run(entries,pattern,i) for i in range(100)]
        holes=sum((r[4] for r in rows),Counter())
        early=sum(r[2] for r in rows)/sum(r[3] for r in rows)
        lines.append(f"|{name} ({pattern})|{median(r[0] for r in rows):g}회|{mean(r[1] for r in rows)/156:.1%}|{early:.1%}|{holes.most_common(1)[0][0]}|")
    return lines
before=report(pool)
# 신규 자료 각색. 제목·출처·선택 결과는 별도로 유지한다.
extra=[
('OBS3-005','작은 스테이지를 깨고 남은 시간','TG','성공을 이미 기록했고 다음 순서를 정할 여유가 있음','도전 요령 한 줄을 남긴다 → 다음 도전 힌트 개방','남은 시간을 신청 질문에 쓴다 → 질문 코너로 전환'),
('OBS3-004','마이크가 고장났다는 농담의 뒷이야기','T','행사 회고 편성','배치 그림으로 설명한다 → 장비 배치 메모','짧게 바로잡고 넘어간다 → 정정 일지'),
('OBS3-010','매칭 대기 중 한 표','TG','다음 화면을 기다리는 중','다음 목표를 투표한다 → 다음 슬롯 목표 선택','지난 선택 결과를 불러온다 → 대기 시간 회고'),
('OBS3-003','복귀 게임의 첫 연습 메뉴','G','한동안 쉬었던 게임 편성','조작부터 복습한다 → 조작 메모','기억나는 구간부터 시범을 보인다 → 시범 기록')]
obs={x['id']:x for x in read('rakoko_observation_batch_03.json')['observations']}
for i,(ref,title,route,condition,*choices) in enumerate(extra,1):
    key=f'RA-{i:03}'
    fam={3:'CE-036',4:'CE-019'}.get(i,key)
    pool.append(dict(id=key,title=title,route=route,source='라코코 각색',source_ref=ref,
                     source_url=obs[ref]['url'],condition=condition,choices=choices,trigger='random',
                     family=fam,group={'CE-036':'진행·편성','CE-019':'게임 도전'}.get(fam,'현장 회고')))
after=report(pool)
fallback={
 'T':['오늘의 한 문장 고르기 → 일지 제목 선택','지난 방송 질문함 열기 → 새 질문 한 개 접수'],
 'G':['연습 기록 비교 → 다음 목표 설정','조작 한 가지 복습 → 연습 메모'],
 'F':['키몽이 한 줄 소감 → 대표 감상 선택','다음 질문함 주제 정하기 → 질문 주제 예약'],
 'S':['다음 기획의 준비물 정리 → 준비 목록 저장','무대 동선 리허설 → 배치 메모 저장']}
(out/'rakoko_draw_pool.design.json').write_text(json.dumps(dict(cornerCodes={'T':'잡담','G':'게임','F':'팬 참여','S':'특별 기획'},entries=pool,fallback=fallback),ensure_ascii=False,indent=2),encoding='utf-8')
header='|편성|첫 일상 대체 회차 중앙값|일상 대체 슬롯 비율|초반 10회 일반 추첨 중 라코코 비율|대체 최다 코너|\n|---|---:|---:|---:|---|'
(out/'rakoko_draw_review.md').write_text('\n'.join(['# 방송 1년 사건 공급 점검','','주간 52회 × 3칸, 경로별 시드 0~99. T 잡담, G 게임, F 팬 참여, S 특별 기획. 일반 추첨에 156칸 모두 배정한 부하 모형이다. 세부 준비·선택 조건은 충족한 것으로 가정하고 고정·후속·예약은 제외했다. 같은 소재는 시즌 한 번, 같은 분류는 이후 두 방송 동안 제외한다. 가중치는 두 출처에 모두 후보가 있을 때 적용한다. 초반 비율의 분모는 일상 대체를 제외한 첫 10회의 일반 추첨 건수다. 실제 플레이 빈도는 세부 조건과 예약 슬롯 수에 따라 달라진다.','','## 조사 카드 연결 직후','',header,*before,'','## 회고·연습·대기 사건 보강 후','',header,*after,'','8개 반복 일상은 각 코너에서 번갈아 선택한다. 대체율이 높은 구간은 여전히 콘텐츠 보강 대상이다. 초반 80%는 추첨 목표이며 후보 소진 후에도 보장되는 결과가 아니다. 매니페스트의 condition과 choices는 기획 문구다.']),encoding='utf-8')
print('\n'.join(after))

distribution={'phases':[dict(throughElapsedDay=end,rakokoSourceShare=rk,gameplayMultiplier=game) for end,rk,game in phases],
              'otherTopicMultiplier':1,'order':['eligible','source','topicWeightedDraw']}
assert game_ids <= {e['id'] for e in pool}
manifest_path=out/'rakoko_draw_pool.design.json'
manifest=read(manifest_path.name)
manifest['selection']=distribution
for e in manifest['entries']:
    e['topic']='gameplay' if e['id'] in game_ids else 'other'
    e['minElapsedDay']=241 if e['family'] in late_families else 0
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
rows=['','## 동일한 사건 목록에서 가중치 변경 비교','',
      '같은 세 경로·각 100개 시드에서 초반 10회 각색 건수와 경과 241일 이후 게임 주제 건수를 합산했다. 비율 분모는 그 구간에 뽑힌 일반 사건 수다. 후반 17회에는 경로별 총 5,100칸이 있다. 일상 대체는 분모에서 제외했다.','',
      '|편성|규칙|초반 각색 비율|후반 게임 / 후반 일반 추첨|후반 게임 비율|','|---|---|---:|---:|---:|']
for name,pattern in patterns.items():
    for label,updated,reserve in [('기존',False,False),('가중치만',True,False),('가중치+후반 후보',True,True)]:
        samples=[run(pool,pattern,i,updated,reserve) for i in range(100)]
        early=sum(r[2] for r in samples)/sum(r[3] for r in samples)
        games=sum(r[5] for r in samples)
        count=sum(r[6] for r in samples)
        ratio=f'{games/count:.1%}' if count else '해당 없음'
        rows.append(f"|{name}|{label}|{early:.1%}|{games} / {count}|{ratio}|")
with (out/'rakoko_draw_review.md').open('a',encoding='utf-8') as f:
    f.write('\n'.join(rows)+'\n')
print('\n'.join(rows[-9:]))
