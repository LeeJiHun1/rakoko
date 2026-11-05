"""Build a proposed acceptance contract and an explicitly unexecuted test plan."""
from pathlib import Path
from collections import Counter
import json,re

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs';DATA=ROOT/'work/rakoko/quality_sources'

def main():
    sources=json.loads((DATA/'sources.json').read_text(encoding='utf-8'))
    cases=json.loads((DATA/'validation_cases.json').read_text(encoding='utf-8'))
    audit=json.loads((OUT/'rakoko_quality_gap_audit.json').read_text(encoding='utf-8'))
    source_ids={x['id'] for x in sources['sources']}
    assert len(source_ids)==len(sources['sources'])==18
    assert len({x['id'] for x in cases['cases']})==len(cases['cases'])==36
    for c in cases['cases']:
        assert set(c['sourceIds'])<=source_ids
        assert c['executionStatus']=='not_run_no_game_engine'
        assert not re.search(r'[\u3040-\u30ff]',c['title']+c['setup']+c['expected'])
    contract={'version':'1.0','asOf':'2026-11-05',
      'status':'proposed_acceptance_not_runtime_verified',
      'research':'rakoko_game_quality_research.md','audit':'rakoko_quality_gap_audit.json',
      'sources':[{'id':x['id'],'title':x['title'],'url':x['url'],'readStatus':x['readStatus']} for x in sources['sources']],
      'gameRuleOverrides':{},'gameEngineImplementedByThisResearch':False,
      'proposedTargets':{
        'playtime':{'basis':'project_proposal_not_external_average_not_user_confirmed',
          'firstNormalEndingMinutes':[15,25],'familiarReplayMinutes':[10,15],
          'firstBroadcastReviewTargetMinutes':3,'allEndingsRequiredToFitSameDuration':False,'wallClockAutoEnd':False},
        'humanPilot':{'basis':'small_project_pilot_not_population_estimate','fanParticipants':4,'lessFamiliarParticipants':4,
          'externalRecruitmentAuthorizedByThisFile':False,'automatedTelemetryRequired':False},
        'randomizedProgressionBudget':{'basis':'proposed_engine_test_budget','seedCount':200,'broadcastsPerRun':52,
          'styles':['talk','game','fan_planning','mixed'],'totalBroadcasts':41600,'executed':False},
        'accessibility':{'normalTextContrast':4.5,'largeTextContrast':3,'targetSizeScMinimumCssPx':24,
          'mainControlHeightProjectTargetCssPx':44,'textPanelReflowWidthCssPx':320,'bodyTextScalePercent':200,
          'targetMinimumHasScExceptions':True,'fullWcagComplianceClaim':False},
        'webVitals':{'LCPSecondsAtMost':2.5,'INPMillisecondsAtMost':200,'CLSAtMost':0.1,
          'assessment':'field_75th_percentile_segment_mobile_desktop','measured':False},
        'endingWitnesses':{'normalOutcomeCount':audit['summary']['normalEndingOutcomes'],
          'forcedOutcomeCount':1,'requiresNewRunToFinalChoiceWitness':True,'debugStatInjectionAloneIsNotWitness':True}},
      'cases':cases['cases']}
    (OUT/'rakoko_quality_acceptance.design.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    headings={'progression':'진행','choices':'선택','economy':'경제','endings':'엔딩','repetition':'반복',
      'balance':'밸런스','long_content':'장기 콘텐츠','save':'저장','accessibility':'접근성',
      'presentation':'연출','performance':'성능','playtest':'사용자 플레이','assets':'에셋','content_integrity':'내용 일관성'}
    counts=Counter(c['priority'] for c in cases['cases'])
    md=['# 게임 완성도 검증 계획\n',
      f'2026-11-05 · {len(cases["cases"])}시나리오 · P0 {counts["P0"]} / P1 {counts["P1"]} · 게임 실행 검증0건\n',
      '모든 항목은 **실행 전**이다. JSON·참조·파일 크기를 검사한 정적 감사와 아래의 실제 게임 검증을 구분한다. 제안 수치를 게임 설정에 자동 적용하지 않았다.\n',
      '## 우선순위와 통과 증거\n',
      '- P0: 진행 막힘, 잘못된 엔딩/보상/결제/저장으로 이어질 수 있는 항목. 첫 시연에서 대표 경로를 검사한 뒤 전체 경로로 확장한다.',
      '- P1: 선택 이해·속도·반복·읽기·조작·마감 품질. 출시 전에 실제 화면과 플레이로 확인한다.',
      '- 미정 정책은 먼저 결정해야 하며, 구현 전 테스트 계획이 있다는 이유로 통과 처리하지 않는다.',
      '- 결말별 재현 로그는 `새 게임 상태 → 명령/선택 → 비용/성장 → 실제 EX 생산 → 현재 기획 → 종결`을 포함한다. 고정 시드와 콘텐츠/저장 버전을 함께 남긴다.',
      '- 무작위 진행은 분포·막힘 탐색에 사용하고, 희귀 결말은 별도 목표 경로로 증명한다. 200시드×52회×4방침은 제안 예산이며 이번 수행 수가 아니다.\n',
      '## 시나리오\n']
    for c in cases['cases']:
        md += [f'### {c["id"]} · {c["title"]} ({c["priority"]} / {headings[c["area"]]})\n',
          '- 재현: '+c['setup'],'- 기대: '+c['expected'],'- 상태: 미실행.']
        if c['basis']=='unresolved_design_decision':md.append('- 선행 작업: 미정 설계 정책 확정.')
        if c['sourceIds']:
            md.append('- 조사 연결: '+', '.join(f'[{sid}]({next(x["url"] for x in sources["sources"] if x["id"]==sid)})' for sid in c['sourceIds']))
        md.append('')
    md += ['## 첫 플레이 관찰 기록 양식\n',
      '|항목|기록 내용|','|---|---|',
      '|환경|게임/콘텐츠/저장 버전, 기기·브라우저·화면 크기|',
      '|플레이 배경|팬/사전 지식 적음, 첫 플레이/재플레이. 실제 닉네임 수집 불필요|',
      '|진행|첫 방송/첫 일반 결말 시간, 완료 방송·사건·실제 선택 수|',
      '|시간 분해|읽기, 준비/편성 설정, 반복 연출, 다음 목표 탐색, 중단 시간|',
      '|이해|선택 전 의도·잠금 이유·다음 준비·날짜 이동의 영향을 설명할 수 있는지|',
      '|상태|규모 승급·현금 부족 포기·반복 family·선행 경험 확보 시점|',
      '|문제|장면·재현 명령·기대/실제 결과·중요도·재시험 여부|',
      '\n8명 파일럿은 초안 문제를 찾는 제작 제안이며 모집단의 평균 시간·만족도 통계를 주장할 수 없다. 이 문서는 외부 사람에게 연락하거나 사용자 데이터를 전송할 권한을 부여하지 않는다.\n',
      '## 원본 자료\n',
      '[조사·적용안](rakoko_game_quality_research.md) · [정적 감사](rakoko_quality_gap_audit.md) · [검증 설정](rakoko_quality_acceptance.design.json). 원자료는 `work/rakoko/quality_sources/sources.json`, `validation_cases.json`이다.\n']
    (OUT/'rakoko_quality_validation_plan.md').write_text('\n'.join(md),encoding='utf-8')
    cat=['# 게임 완성도 조사 출처대장\n','2026-11-05 · 18개 제작자/개발사/표준·플랫폼 1차 자료\n',
      '문헌의 설명과 이 게임에 적용할 제안을 분리한다. 링크를 모은 것만으로 구현/도달성/접근성 통과를 주장하지 않는다.\n']
    for s in sources['sources']:
        cat += [f'## {s["id"]} · {s["title"]}\n',f'- 발행 주체: {s["publisher"]}',
          f'- [원문]({s["url"]}) · 확인 상태: `{s["readStatus"]}`',
          '- 원문에서 확인: '+s['finding'],'- 프로젝트 적용 해석: '+s['application'],'']
    cat += ['## 접근 제한 기록\n']
    for a in sources['accessNotes']:cat.append(f'- [{a["url"]}]({a["url"]}): `{a["result"]}`. {a["handling"]}')
    cat += ['\n라이선스 파일과 폰트 후보의 실제 다운로드·해시는 `work/rakoko/quality_sources/vendor_candidates/manifest.json`을 따른다. 다운로드 실패 항목은 확보 파일에 포함하지 않는다.']
    (OUT/'rakoko_quality_sources.md').write_text('\n'.join(cat)+'\n',encoding='utf-8')
    print(f'PASS: {len(source_ids)} sources; {len(cases["cases"])} unexecuted cases; priorities {dict(counts)}; source references valid')

if __name__=='__main__':main()
