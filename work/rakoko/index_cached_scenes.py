"""Index every cached transcript. Retrieval hits are not verified observations."""
import json,re,argparse
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[2]; W=ROOT/'work/rakoko'; OUT=ROOT/'outputs'
groups={
 '준비와 진행':'준비|시작하기 전에|순서|먼저 해|해 볼게',
 '기술 점검':'설정|고쳤|고쳐|백업|마이크|안 들려|잘 들려|인터넷',
 '후속 약속':'다음 방송|다음에 해|내일 해|하기로 했|약속|공약|저번에 하',
 '도전과 재시도':'다시 해|다시 할|한 번 더|한번 더|연습|재도전',
 '퍼즐과 설명':'힌트|정답|이해했|설명해|문제 풀',
 '합방 조율':'역할|왼쪽|오른쪽|같이 하|들리세요|제 차례',
 '팬 작품':'팬아트|팬게임|만들어 주|만들어주|그려 주|그려주',
 '기념과 행사':'팬미팅|생일|기념|축하|행사|200일|201일',
 '주제 전환':'다른 주제|다른 얘기|무슨 얘기|이야기하고|마저 해',
 '진행 규칙':'규칙|룰 설명|투표|정해 볼|정해볼|후보',
 '제작과 표현':'썸네일|글꼴|폰트|화면 크기|편집|배경을',
 '일정과 기록':'방송 시간|방송시간|일정|메모|기록해|기록을',
}
exclude=re.compile('오컬트|귀신|무당|사주|운세|타로|굿을|부적|귀접|성불|응급실|병원|진단|혈관|계약|전속|분쟁|사생활|본명|실물|전생|환생|재데뷔|팬티|속옷|브라|오팬무|오펜무|오펜모|촉각|촉슈|촉수|벗어|벗고|벗었|섹스|섹시|성인|성적|성희롱|가슴|엉덩|허벅|음란|키스|뽀뽀|자위|노출|보지|자지|미시|쀼쀼')
inventory=json.loads((W/'inventory.json').read_text(encoding='utf-8'))
scanned=[]; hits=[]; context_map={}; filtered=Counter()
for item in sorted(inventory,key=lambda x:x['broadcast_date_from_title'] or ''):
    path=W/(item['id']+'.json')
    if not path.exists():continue
    rows=json.loads(path.read_text(encoding='utf-8')); last=defaultdict(lambda:-9999)
    count0=len(hits)
    for i,r in enumerate(rows):
        text=r['text']; matching=[(cat,re.search(pattern,text)) for cat,pattern in groups.items()]
        matching=[(cat,m.group()) for cat,m in matching if m]
        if not matching:continue
        context=' / '.join(x['text'] for x in rows[max(0,i-4):min(len(rows),i+5)])
        if exclude.search(context):
            filtered['excluded_context_hits']+=1;continue
        for cat,term in matching:
            if r['start']-last[cat]<300:continue
            start=max(0,int(rows[max(0,i-4)]['start'])); end=min(item['duration'],int(rows[min(len(rows)-1,i+4)]['start']+rows[min(len(rows)-1,i+4)].get('duration',5))+1)
            if end<=start:continue
            rec=dict(id=f'IDX-{len(hits)+1:05}',video_id=item['id'],date=item['broadcast_date_from_title'],category=cat,matched_term=term,start_seconds=start,end_seconds=end,source_url=item['url']+f'&t={start}s',status='자동 탐색·미검토',speaker_verified=False,audio_verified=False,screen_verified=False,fact_summary=None,adoption_decision=None)
            hits.append(rec); context_map[rec['id']]=dict(title=item['title'],context=context)
            last[cat]=r['start']
    scanned.append(dict(video_id=item['id'],date=item['broadcast_date_from_title'],subtitle_segments=len(rows),retrieval_hits=len(hits)-count0,scope='전체 자막 문자열 검색. 전수 정독·청취 아님'))
assert len(scanned)==81
assert len({x['video_id'] for x in scanned})==81
index=dict(as_of='2026-11-03',scan_method='12개 주제 정규식 검색, 민감·제외 문맥 사전 제외, 영상·주제당 5분 이내 중복 검색 억제. 자동 검색은 사실 검증이 아님.',scanned_cached_videos=len(scanned),candidate_count=len(hits),verified_event_count=0,category_counts=dict(Counter(x['category'] for x in hits)),videos=scanned,candidates=hits)
(OUT/'rakoko_retrieval_index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')
(W/'retrieval_contexts.json').write_text(json.dumps(context_map,ensure_ascii=False),encoding='utf-8')
md=['# 확보 자막 전체 탐색 색인','','2026-11-03. **81편의 자막 파일 전체**를 12개 주제로 문자열 검색했다. 전수 정독·청취가 아니며, 검색 위치를 검증된 사건이나 실제 발언으로 취급하면 안 된다. 시청자 TTS·게임 대사·합방 상대의 말이 섞여 있다.','',f'탐색 지점 {len(hits):,}개. 영상·주제별 5분 이내 검색 중복을 억제했지만 같은 대화가 여러 주제에 걸칠 수 있다. 따라서 독립 사건 수는 아니다. 제외 문맥은 자동 사전 필터를 적용했으나 누락·오검출이 가능하다.','', '기획 채택 여부는 전부 미정이다. 출력에는 원문 장문·사생활·가사 대신 영상 링크·시간·탐색어·검토 상태만 남긴다. 자막 문맥을 검토하기 전에는 사실 요약도 비워 두었다.','','[전체 탐색 색인 JSON](rakoko_retrieval_index.json)','','|탐색 주제|위치 수|','|---|---:|']
for cat,n in Counter(x['category'] for x in hits).items():md.append(f'|{cat}|{n}|')
md+=['','## 영상별 검색 범위','','|방송일|영상|자막 세그먼트|탐색 위치|','|---|---|---:|---:|']
for v in scanned:md.append(f"|{v['date']}|[{v['video_id']}](https://www.youtube.com/watch?v={v['video_id']})|{v['subtitle_segments']}|{v['retrieval_hits']}|")
(OUT/'rakoko_retrieval_index.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
print(json.dumps(dict(scanned=len(scanned),segments=sum(v['subtitle_segments'] for v in scanned),retrieval_hits=len(hits),categories=index['category_counts']),ensure_ascii=False))
parser=argparse.ArgumentParser();parser.add_argument('--samples',action='store_true');args=parser.parse_args()
if args.samples:
    seen=set()
    for h in hits:
        if h['category'] not in ['후속 약속','팬 작품','진행 규칙','제작과 표현']:continue
        key=(h['date'][:7],h['category'])
        if key in seen:continue
        seen.add(key);print(json.dumps(dict(**h,**context_map[h['id']]),ensure_ascii=False))
