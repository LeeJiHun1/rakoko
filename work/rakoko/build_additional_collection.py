"""Document the second public-chat batch and bounded cached-caption review."""
from pathlib import Path
from collections import Counter
import json,hashlib

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs'; WORK=ROOT/'work/rakoko'

# Summaries are paraphrases of bounded automatic-caption context, not audio attribution.
CASES=[
 ('기본 의상의 부품 표시','Kv03yHk6Fe8',3730,3748,
  '재킷을 빼면 다른 형태로 입을 수 있다는 설명 문맥.',
  '기본 의상 내부의 표시 변형과 별도 신의상 해금을 구분한다.',
  '기본 의상 부품을 설명하는 구간이지 신의상 최초 공개 근거가 아니다. 새 토글 에셋은 아직 없다.',
  ['rakoko_outfit_verification.md']),
 ('모든 채팅에 응답하지 않기','xnIhJoOfnds',9950,10011,
  '채팅이 과해지면 일부러 반응하지 않고 다른 주제로 이끌 수 있다는 설명 문맥.',
  '수락·거절 외에 답하지 않고 진행으로 복귀하는 선택도 대사 후보로 둔다.',
  '기존 D14의 문맥 보강이다. 이후 실제로 조용해졌는지, 진지한 경고였는지는 미확인.',
  ['rakoko_decision_guide.md:D14']),
 ('준비 미완성과 대체 편성','nIcK2sD5aEs',6805,6855,
  '다음 날 준비 때문에 당일 PPT를 마치지 못했고 다른 코너 후보를 언급하는 문맥.',
  '준비 완료·미완성·다른 코너로 전환을 별도 상태로 취급한다.',
  '기존 OBS-CHAIN-003 보강. 후보가 언급됐다고 대체 코너 실행·다음 날 이행을 확정하지 않는다.',
  ['rakoko_followup_observations.md:OBS-CHAIN-003']),
 ('시험 송출과 피드백 요청','ChKm2pt_clM',12129,12164,
  '게임을 틀어 소리가 들리는지 묻고 안도하는 말이 이어지는 문맥.',
  '점검 실행→시청자 확인 요청→상태 보고를 나눠 쓴다.',
  '기존 D12 보강. 자막의 긍정 보고이지 실제 오디오 품질·완전 복구 검증이 아니다.',
  ['rakoko_decision_guide.md:D12']),
 ('행사 수요가 예상보다 큰 상황','bDwPyfYOjUQ',2224,2276,
  '사전 수요조사 응답과 참여 희망 수를 보고 진행 방식을 고민하는 문맥.',
  '수요조사·처리 가능 인원·확정 예약을 서로 다른 수치로 설계할 근거 후보다.',
  '응답 수·희망 수·실제 방문 수를 같게 보지 않는다. 숫자를 실제 행사 실적이나 게임 수치로 복사하지 않는다.',
  []),
 ('대관 등 대안을 검토 중인 상태','bDwPyfYOjUQ',2793,2906,
  '선착순 제안에 대한 응답, 추가 대관 가능성, 대책을 회의 중이라는 설명 문맥.',
  '제안·검토·지출 확정·진행 완료를 구분하고 대안의 비용을 명시한다.',
  '대관 계약·결제·최종 참가 규칙이 확정됐다는 근거는 아니다. 자산 부족 시 포기라는 기존 규칙은 유지한다.',
  []),
 ('제작과 판매·견적 지원의 분담','Sd9Oc8NZvb8',2904,2976,
  '굿즈 발주·대신 판매할 곳·견적을 함께 돕는 사람이 있다는 설명 문맥.',
  '발주, 납품, 판매, 운영 지원을 나눠 제작 이벤트의 후속을 구성한다.',
  '조력자의 실명·사적 관계·회사 내부 구조·실제 견적은 수집하지 않는다. 완전 납품을 뜻하지 않는다.',
  []),
 ('일부 해결과 남은 문제의 구분','yaSuAocNYDw',690,740,
  '충전·연결의 해결 보고와 아직 남은 끊김 문제를 구분하는 문맥.',
  '한 문제의 해결로 모든 기술 상태를 정상 처리하지 않는다.',
  '기존 OBS-CHAIN-002 재검토. 원인 진단·수리 완료를 검증하지 않았으며 실제 장비 설정법으로 쓰지 않는다.',
  ['rakoko_followup_observations.md:OBS-CHAIN-002']),
 ('의상 준비와 참가 자격은 별개','W71-NPzpO-I',533,580,
  '의상 세팅 지연을 설명하고 보여줄 수 있음을 말하는 흐름에 경찰 선발 결과 언급이 이어짐.',
  '경찰 의상 소유·공개와 RP 서버의 경찰 직업 자격을 독립적으로 저장한다.',
  '의상 착용 화면은 별도 기존 검증이 있다. 이 자막만으로 실제 면접 내용·심사 이유를 추정하지 않는다.',
  ['rakoko_outfit_verification.md']),
 ('기념일의 여러 준비 항목','NVwuL1_SHZY',2455,2542,
  '제작 사정에 대한 설명, 작은 생일 기념 굿즈, 시청자 중 한 명을 추첨할 룰렛 준비를 소개하는 문맥.',
  '생일을 축하 한 줄로 끝내지 않고 준비 항목·소개·참여·일지 회수로 나눌 수 있다.',
  '준비·소개 문맥이다. 실제 배포 수량·추첨 결과·상품·배송 완료는 미확인. 생일 슬롯 수를 자동 늘리지 않는다.',
  []),
 ('유출처럼 들리는 농담의 반례','NVwuL1_SHZY',2365,2400,
  '커버곡 준비 설명 뒤 잘못 올린 공개였냐는 질문과 부정 응답이 교차하는 문맥.',
  '질문형 채팅을 실제 유출로 확정하지 않는다. 의상 유출 사건의 실화 근거로 채택하지 않는다.',
  '커버곡 문맥이며 의상 공개가 아니다. 화자·원음 미대조, 시청자 농담과 실제 업로드 사고를 분리한다.',
  []),
 ('행사 뒤 다음 진행 방식과 감사','t3Y8PL9bSjk',3161,3208,
  '다음 팬미팅은 조용한 곳에서 하자는 제안과 스태프에게 감사·격려를 전했다는 회고 문맥.',
  '행사 종료 뒤 운영 회고·다음 계획·조력자 감사라는 후속을 남긴다.',
  '기존 행사 조사와 같은 방송의 다른 관점이다. 차기 행사 확정·직원 수·실제 지출은 미확인.',
  ['rakoko_decision_guide.md:D13']),
]

def clock(ms):
    t=int(ms)//1000;return f'{t//3600:02d}:{t//60%60:02d}:{t%60:02d}'

def main():
    inv={v['id']:v for v in json.loads((WORK/'inventory.json').read_text(encoding='utf-8'))}
    obs=[]
    for i,(title,vid,start,end,summary,use,limit,related) in enumerate(CASES,1):
        p=WORK/f'{vid}.json'; d=json.loads(p.read_text(encoding='utf-8'))
        selected=[x for x in d if start<=x['start']<=end]
        assert selected and 0<=start<end<=inv[vid]['duration']
        obs.append({'id':f'OBS4-{i:03d}','title':title,'videoId':vid,
          'dateFromTitle':inv[vid]['broadcast_date_from_title'],'startSeconds':start,'endSeconds':end,
          'sourceUrl':f'https://www.youtube.com/watch?v={vid}&t={start}s',
          'captionContextSummary':summary,'designUse':use,'limits':limit,'relatedPriorEvidence':related,
          'evidence':'B_cached_automatic_caption_context_review',
          'speakerVerified':False,'audioVerified':False,'newIndependentIncidentCounted':False,
          'cachedSegmentCountReviewed':len(selected),
          'cacheSha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    payload={'date':'2026-11-05','observations':obs,'count':len(obs),
      'distinctCachedVideos':len({x['videoId'] for x in obs}),
      'newCaptionVideosDownloaded':0,'originalAudioVerified':0,
      'notAdditiveWithPriorEventCards':True}
    (OUT/'rakoko_observation_batch_04.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    md=['# 추가 조사 04 — 진행·경계·준비·후속',
      '\n2026-11-05 · 자막 문맥 12개 / 기존 캐시 10편 / 신규 자막 다운로드 0편 / 원음·화자 검증 0건\n',
      '이번 문서는 기존 자막을 목적에 맞춰 더 좁게 읽은 관찰이다. 12개의 새로운 독립 실화가 아니며 사건 카드29개·기존 관찰에 합산하지 않는다. 같은 방송의 여러 관점, 기존 D14·D12·전후 연결의 보강과 반례가 포함된다. 게임 적용 문장은 설계적 해석이며 실제 인물의 고정 성격을 뜻하지 않는다.\n']
    for x in obs:
        md += [f'## {x["id"]} · {x["title"]}\n',
          f'- [원본 {x["dateFromTitle"]} · {clock(x["startSeconds"]*1000)}~{clock(x["endSeconds"]*1000)}]({x["sourceUrl"]})',
          '- 자막 관찰: '+x['captionContextSummary'], '- 설계에 참고할 점: '+x['designUse'],
          '- 제한: '+x['limits'], '- 원음·화자 미확인. 기존 연관 자료: '+(', '.join(x['relatedPriorEvidence']) or '해당 초점의 개별 연결 미등록')+'\n']
    md+=['캐시 해시·선별 세그먼트 수·원본 구간은 [JSON](rakoko_observation_batch_04.json)에 보관한다. 인용 대사집·실제 게임 구현·모델 가중치 학습 결과가 아니다.']
    (OUT/'rakoko_observation_batch_04.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
    m=json.loads((WORK/'kimongi_chat/batch02/manifest.json').read_text(encoding='utf-8'))
    rows=[json.loads(x) for x in (WORK/'kimongi_chat/batch02/sample_anonymized.jsonl').read_text(encoding='utf-8').splitlines()]
    windows={w['id']:w for v in m['videos'] for w in v['windows']}
    assert len(rows)==m['stats']['retainedMessages'] and len({r['id'] for r in rows})==len(rows)
    for r in rows:
        assert set(r)=={'id','videoNo','windowId','playerTimeMs','text','reviewStatus','tags'}
        w=windows[r['windowId']];assert w['startMs']<=r['playerTimeMs']<w['endMs']
    assert dict(Counter(str(r['videoNo']) for r in rows))==m['stats']['byVideo']
    first=json.loads((WORK/'kimongi_chat/manifest.json').read_text(encoding='utf-8'))
    assert not ({v['videoNo'] for v in first['videos']} & {v['videoNo'] for v in m['videos']})
    report=['# 추가 수집 판단과 결과 — 2차',
      '\n2026-11-05 · 다른 팬게임 비교는 재개하지 않음\n',
      '## 추가 수집이 필요한 이유\n',
      '1차 집단 대사 표본은 짧은 반응 형태를 파악하는 데 쓸 수 있지만, 어떤 상황에서 반응이 바뀌는지와 선택 뒤 후속을 검증하기에는 부족하다. 따라서 방송 초반 관계 형성, 과한 장난의 경계, 기념일 준비 순서, 기술 문제의 부분 복구, 행사 뒤 회고를 우선했다. NPC 성격을 새로 만드는 일과 성장 수치 결정은 자료 수집만으로 해결할 수 없는 별도 설계 작업이다.\n',
      '|우선 영역|이번 수행|남은 확인|','|---|---|---|',
      '|1~8월 키몽이 채팅·초기 관계|현재 치지직 공개 목록 40개를 조회. 그 안의 1~8월 게시 영상 0개. 1~8월 기존 자막에서 진행·경계 문맥을 보강|오래된 채팅을 다른 공개 출처에서 확보하지 못함. 자막을 채팅으로 대체했다고 세지 않음|',
      '|장난의 경계·주제 복귀|1/20 기존 D14의 앞뒤 재검토. 위키의 규칙 절과 연결된 공지 URL 발견|연결 Notion 공지는 웹 도구 접근 실패. 공식 공지 본문 확인으로 표시하지 않음|',
      '|의상·기념일의 상태 구분|기본 재킷, 경찰 의상 준비, 생일 굿즈·추첨 준비, 유출 농담 반례 검토|원음·실제 공개 순서·배포 완료 검증|',
      '|문제 수습·기다림·도움|소리 시험/피드백 요청과 부분 복구 자막. 새 짧은 방송에서 기다림·설정 도움 채팅 확보|실제 장비 복구·게임 성공 화면은 미확인|',
      '|행사·제작의 후속|수요/수용량, 대관 검토, 발주·판매 지원, 다음 행사 구상/감사 문맥 보강|회의→결제→납품→실행을 연결한 완결 출처|',
      '|축하·복귀·새 장비의 군중 반응|새로운 다시보기 5개·19개 지정 구간에서 2차 표본 확보|제목상의 주제가 지정 구간 전체에 실제 등장하는지는 별도 확인|',
      '\n## 새로 확보한 실제 채팅\n',
      f'새 영상 {len(m["videos"])}개, 지정 구간 {len(windows)}개, 지정 범위 합계 38분에서 자동 정제 메시지 {len(rows):,}건을 보관했다. 요청 커서가 끝에 도달한 구간은 18/19개이며 마지막 짧은 방송의 한 구간은 종료 커서가 소진되어 불완전으로 남겼다. 그 구간도 반환된 메시지만 보관하며 누락 없음을 보증하지 않는다.\n',
      '|다시보기(제목 단서)|게시일|지정 구간 시작(각120초)|보관|','|---|---|---|---:|']
    for v in m['videos']:
        report.append(f'|[{v["title"]}]({v["url"]})|{v["publishDate"]}|'+', '.join(clock(w['startMs']) for w in v['windows'])+f'|{m["stats"]["byVideo"][str(v["videoNo"])]:,}|')
    report += ['\n1차 10개·7,256건과 영상이 겹치지 않는다. 두 배치 합계는 **15개·79구간·지정 범위128분·10,165건**이다. 2차에는 거친 표현 필터를 더했으므로 두 배치의 비율 변화로 팬덤의 변화를 추정하지 않는다. 개별 시청자 수는 측정하지 않았다. 프로필·계정 해시·닉네임은 저장하지 않고 자동 치환했으나 메시지 본문 간접 식별과 민감 표현이 남을 수 있어 두 표본 모두 분석용이다.\n',
      '## 새로 읽어서 확인한 반응과 오분류 방지\n',
      '|출처·구간·근거 ID|관찰|게임에 옮길 부분|','|---|---|---|',
      '|[새 모캡 제목 방송](https://chzzk.naver.com/video/15370277) 00:00:11~23 · K2C000640/653/655|인사의 호칭·늘임이 다름|다양한 입장 인사. 모든 키몽이의 고정 말버릇으로 만들지 않음|',
      '|[유튜브6만 감사 제목 방송](https://chzzk.naver.com/video/15411729) 00:01:05~34 · K2C001434~1480 중 축하 13건|축하 문자·짧은 축하가 모여 있음|이정표 축하의 합창 구조. 실제 6만 달성 시각을 채팅만으로 확정하지 않음|',
      '|[라코코로 돌아가기 1일차](https://chzzk.naver.com/video/15464397) 00:00:18~40 · K2C002073/079/103|제목을 받는 농담과 인사 늘임|복귀 반응의 후보. 타 인물로 환생하는 게임 구조로 쓰지 않음|',
      '|[마 내가 이겨따](https://chzzk.naver.com/video/15610493) 00:05:19, 00:09:31~10:19 · K2C002708/2770/2771/2778/2795|설정창 언급, 기다리자는 제안, 레이아웃에 대한 도움|제목만 보고 게임 승리로 분류하지 않음. 시청자도 기다림·도움 역할 가능. 실제 조치 성공은 미확인|',
      '\n채팅의 표현을 게임에 직접 복사하지 않고 구조만 참고한다. 채팅 순서가 실제 답글 관계·화자 수를 입증하는 것은 아니다. 모든 원본 영상의 음성·장면은 이번 조사에서 대조하지 않았다.\n',
      '## 기존 자막의 추가 문맥 검토\n',
      '[추가 관찰04](rakoko_observation_batch_04.md)는 기존 캐시10편에서12개 문맥을 검토했다. 새로운 자막 영상은 내려받지 않았다. 주요 설계적 구분은 다음과 같다.\n',
      '- 기본 재킷 표시 변경과 신의상 해금.',
      '- 채팅 농담·질문과 확인된 사실.',
      '- 의상 소유와 서버 직업 자격.',
      '- 준비 소개와 실행·배포·배송 완료.',
      '- 해결 보고와 독립적인 기술 검증, 일부 복구와 완전 복구.',
      '- 행사 수요조사와 실제 방문 수, 대관 제안과 계약 완료.\n',
      '## 외부 출처 점검\n',
      '- [라코코 위키 미러](https://namu.moe/w/%EB%9D%BC%EC%BD%94%EC%BD%94)의 생일·첫 방송일·팬네임 항목을 재확인했다. 9/10·2026/1/18·키몽이는 기존 설정과 일치한다. 미러는 2차 출처이며 공식 프로필 원문을 새로 검증한 것은 아니다.',
      '- 같은 문서의 방송 규칙 절에는 반복 요구를 멈추는 기준에 관한 설명과 [연결 공지](https://app.notion.com/p/26-08-08-3b54a611d37b8036ab21e03b90c0e9b8)가 있다. 연결 공지는 접근 실패라 공식 세부 제재 규칙을 게임에 이식하지 않았다.',
      '- 일반 의상 검색에는 동명이인·무관 결과가 많았으며 위키의 의상명 검색도 본문 일치를 주지 않았다. 이를 의상 부재 증거로 쓰지 않고 기존 공식 다시보기 착용 근거를 유지했다.',
      '- 공식 YouTube 다시보기 2개를 웹 도구로 다시 열었으나 조회 제한 응답을 받았다. 원음 확인으로 계산하지 않았다. 기존 캐시를 사용했다.\n',
      '## 산출물·남은 범위\n',
      '- 2차 채팅: `work/rakoko/kimongi_chat/batch02/manifest.json`, `sample_anonymized.jsonl`.',
      '- 수집기: `work/rakoko/collect_kimongi_targeted.py`. 1차 파일을 덮어쓰지 않는다.',
      '- 추가 자막 검토: `rakoko_observation_batch_04.md/.json`.',
      '- 재현·검증: `work/rakoko/build_additional_collection.py`. 구간·건수·고유ID·프로필 필드 배제·기존 배치와 영상 비중복 검사.',
      '\n아직 필요한 핵심 자료는 오래된 공개 채팅, 실제 영상·음성의 발화자 대조, 공개/배송/게임 완료의 전후 연결이다. 접근할 수 없는 과거 자료를 수집 완료로 표시하지 않는다. 수치·결말33종·기념일·기존 의상 해금 규칙은 이번 조사에서 변경하지 않았다.\n']
    (OUT/'rakoko_additional_collection_02.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
    print(f'PASS: {len(obs)} caption observations / {payload["distinctCachedVideos"]} cached videos; {len(rows)} new chat rows / {len(windows)} windows')

if __name__=='__main__':main()
