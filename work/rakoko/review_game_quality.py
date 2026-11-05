"""Static readiness audit only; never claims to have played an absent engine."""
from pathlib import Path
from collections import Counter
from PIL import Image
import json,hashlib

ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs'
def read(name):return json.loads((OUT/name).read_text(encoding='utf-8'))
def save(name,obj):(OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def differing_paths(a,b,prefix=''):
    if isinstance(a,dict) and isinstance(b,dict):
        out=[]
        for k in sorted(set(a)|set(b)):
            p=f'{prefix}.{k}' if prefix else k
            if k not in a or k not in b:out.append(p)
            else:out.extend(differing_paths(a[k],b[k],p))
        return out
    return [] if a==b else [prefix]

def main():
    req=read('rakoko_ending_requirements.design.json');routes=read('rakoko_ending_routes.design.json')
    play=read('rakoko_event_play_rules.design.json');bridges=read('rakoko_long_content_bridges.design.json')
    lc=read('rakoko_long_content.design.json');money=read('rakoko_money_events.design.json')
    forced=read('rakoko_forced_ending.design.json');rules=read('rakoko_game_rules.design.json')
    defs=req['experienceDefinitions']; producers={x['experienceId']:x for x in bridges['producers']}
    lc_choices={c['id'] for e in lc['events'] for c in e['choices']}
    for p in producers.values():assert set(p['sourceChoiceIds'])<=lc_choices
    matrix=[];seen=set()
    for event in routes['events']:
        for choice in event['choices']:
            eid=choice.get('endingId')
            if not eid:continue
            assert eid not in seen;seen.add(eid);r=req['requirementsByEndingId'][eid]
            assert set(choice['experienceIds'])==set(r['experienceIds'])
            xs=r['experienceIds']
            assert all(x in defs for x in xs)
            matrix.append({'endingId':eid,'endingTitle':choice['endingTitle'],'eventId':event['id'],
              'choiceId':choice['id'],'statRequirements':[x for x in r['all'] if x['path'].startswith(('stats.','gameSkill'))],
              'experienceRequirements':[{'id':x,'label':defs[x]['label'],'producerStatus':defs[x]['producerStatus'],
                'sourceChoiceIds':producers.get(x,{}).get('sourceChoiceIds',[])} for x in xs],
              'currentProjectConditionsStillRequired':True,'runtimeWitnessStatus':'not_implemented_or_not_verified'})
    assert seen==set(req['requirementsByEndingId'])
    variants=[]
    for e in play['entries']:
        r=e['repeat']
        if r.get('targetVariantCount'):
            variants.append({'eventId':e['id'],'family':e['family'],'authored':r['authoredVariantCount'],
                'target':r['targetVariantCount'],'shortfall':max(0,r['targetVariantCount']-r['authoredVariantCount'])})
    asset_paths=(list((ROOT/'assets/characters').glob('*.png'))+
      list((ROOT/'assets/events/outfit-reveals').glob('*.png'))+
      list((ROOT/'assets/events/outfit-journal').glob('stage*.png')))
    assets=[]
    for p in sorted(asset_paths):
        with Image.open(p) as im:
            assets.append({'path':p.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,
              'mode':im.mode,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
              'estimatedDecodedRgbaBytes':im.width*im.height*4})
    embedded=next(x for x in routes['forcedEndings'] if x['endingId']==forced['endingId'])
    dupdiff=differing_paths(embedded,forced)
    assert embedded['trigger']==forced['trigger'] and embedded['probability']==forced['probability']
    summary={'normalEndingOutcomes':len(matrix),'forcedEndingOutcomes':1,
      'experienceDefinitionCount':len(defs),'experienceProducerStatuses':dict(Counter(x['producerStatus'] for x in defs.values())),
      'bridgeProducerCount':len(producers),'ordinaryEventReferences':len(play['entries']),
      'ordinaryChoices':sum(len(x['choices']) for x in play['entries']),
      'unassignedOrdinaryGrowthBonuses':sum(c.get('growthBonusNotYetAssigned',False) for e in play['entries'] for c in e['choices']),
      'entriesWithVariantTarget':len(variants),'authoredVariantsInThoseEntries':sum(x['authored'] for x in variants),
      'targetVariantsInThoseEntries':sum(x['target'] for x in variants),'variantShortfall':sum(x['shortfall'] for x in variants),
      'repeatModeCounts':dict(Counter(x['repeat']['mode'] for x in play['entries'])),
      'longContentModules':len(lc['modules']),'longContentEvents':len(lc['events']),
      'paidEvents':len(money['events']),'presentationPngCount':len(assets),
      'presentationPngTotalBytes':sum(x['bytes'] for x in assets),
      'estimatedAllDecodedRgbaBytes':sum(x['estimatedDecodedRgbaBytes'] for x in assets),
      'rootPackageJsonPresent':(ROOT/'package.json').exists(),
      'rootSrcPresent':(ROOT/'src').exists(),'runtimeTestsPerformed':False}
    report={'asOf':'2026-11-05','kind':'static_design_readiness_not_runtime_test',
      'summary':summary,'endingWitnessMatrix':matrix,'variantBacklog':variants,'assets':assets,
      'duplicatedForcedEnding':{'canonicalCandidate':'rakoko_forced_ending.design.json',
        'embeddedIn':'rakoko_ending_routes.design.json:forcedEndings','differentPaths':dupdiff,
        'tenYearTriggerAndProbabilityMatch':True,'runtimeConsumerImpact':'unknown_no_engine',
        'recommendation':'정본을 하나로 정하고 생성 시 복사본 일치 검증 또는 ID 참조로 바꾼다. 이번 감사는 원본을 변경하지 않음.'},
      'limits':['Producer status is design data, not proof of engine reachability.',
        'Growth bonus placeholders do not imply all original choices have no other effects.',
        'Variant shortfall counts references, not independent story families.',
        'Decoded RGBA estimate excludes GPU copies, mipmaps and browser overhead.',
        'No app playthrough, performance benchmark or accessibility certification was performed.']}
    save('rakoko_quality_gap_audit.json',report)
    md=['# 게임 완성도 정적 점검\n','2026-11-05 · 실행 게임 테스트와 구분\n',
      '## 확인된 우선 빈칸\n',
      f'- 일반 결말 {len(matrix)}개: EX32종 중 생산 사건 연결 대기26종, 설계 연결/엔진 대기6종. 모든 결말의 실제 도달 증명은 미확인.',
      '- 일반 사건105참조/선택312개의 추가 성장 효과가 미배정이다. 기존 기본 성장이나 원문 선택의 다른 효과까지 없다는 뜻은 아니다.',
      f'- 변주 목표가 있는 참조 {len(variants)}개는 각1개를 보유하고 각3개를 목표로 한다. 추가 {summary["variantShortfall"]}개 분량의 변주가 필요하다. 이 참조 수를 독립 실화 수로 세지 않는다.',
      '- 장기8모듈/64사건, 유료16사건이 있어도 납품·경험·일지·엔딩을 잇는 실제 동작은 별도 검증해야 한다.',
      '- 루트 package.json/src 없음. 현재 조사는 실행 엔진·성능·접근성 통과를 뜻하지 않는다.\n',
      '## 새로 확인한 정본 중복\n',
      '강제 엔딩은 독립 JSON과 엔딩 경로 JSON 안의 복사본에 함께 존재한다. 핵심 10년 날짜·확률은 현재 일치하지만 아래 필드는 다르다. 어느 쪽을 읽느냐에 따라 부가 정보가 누락될 수 있어 구현 전에 정본을 정해야 한다.\n',
      '`'+', '.join(dupdiff)+'`\n',
      '권장: 독립 강제 엔딩을 정본 후보로 삼고 경로 목록은 ID로 참조하거나 생성 단계에서 일치를 검사한다. 이 감사에서는 기존 게임 규칙 파일을 수정하지 않았다.\n',
      '## 32결말의 경험 연결 현황\n',
      '아래 연결이 있어도 수치·현재 기획·실제 결과 가드를 함께 만족해야 한다. 엔진에서 끝까지 실행한 경로 증명은 모두 대기다.\n',
      '|결말|요구 경험|생산자 상태|연결된 원 선택|','|---|---|---|---|']
    for x in matrix:
        ex=x['experienceRequirements']
        md.append(f'|{x["endingId"]} · {x["endingTitle"]}|'+', '.join(e['id'] for e in ex)+'|'+', '.join(e['producerStatus'] for e in ex)+'|'+(', '.join(c for e in ex for c in e['sourceChoiceIds']) or '미연결')+'|')
    md += ['\n## 화면용 이미지 실측\n',
      f'현재 선택한 게임 표시 PNG {len(assets)}개의 합계는 {summary["presentationPngTotalBytes"]/1048576:.2f}MiB다. 전부 RGBA로 디코딩한다고 가정하면 약 {summary["estimatedAllDecodedRgbaBytes"]/1048576:.1f}MiB이며 실제 메모리 측정은 아니다. 초기 화면에서 전부 미리 읽을 필요는 없다.\n',
      '|파일|크기|파일 용량(MiB)|','|---|---|---:|']
    for a in assets:md.append(f'|{a["path"]}|{a["width"]}×{a["height"]}|{a["bytes"]/1048576:.2f}|')
    md += ['\n캐릭터는 저해상도 격자가 정규화된 스프라이트 시트가 아니다. 원본을 보존한 제작용 파일을 따로 만들고 실제 표시 크기에서 눈·머리·의상 구분과 알파 가장자리를 확인해야 한다. `image-rendering` 설정만으로 원본 그림을 저해상도 도트로 교정했다고 표시하지 않는다.\n',
      '## 재현\n','`python work/rakoko/review_game_quality.py`\n',
      '검사: 결말/경험 ID 대응, 6생산자의 장기 선택 ID, 일반 선택/변주 수, 이미지 크기·해시, 강제 엔딩 중복 차이. [상세 JSON](rakoko_quality_gap_audit.json)에 결말별 조건과 출처 파일 경로를 보관한다. 실행 게임의 도달성·밸런스는 통과 처리하지 않는다.']
    (OUT/'rakoko_quality_gap_audit.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=False,indent=2));print('Forced ending duplicate differences:',', '.join(dupdiff))

if __name__=='__main__':main()
