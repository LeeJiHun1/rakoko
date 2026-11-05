"""Reference calculations and content checks, not a production settlement engine."""
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs'


def calculate(policy, awareness, community, segments=3, previous_tier=None):
    income=policy['income']
    tiers=income['scaleTiers']
    assert 0<=awareness<=100 and 0<=community<=100
    assert isinstance(segments,int) and 0<=segments<=income['maximumSupportedSegments']
    current=max(i for i,t in enumerate(tiers) if min(awareness,community)>=t['minimumScore'])
    if previous_tier is not None:
        current=max(current,next(i for i,t in enumerate(tiers) if t['id']==previous_tier))
    tier=tiers[current]
    if not segments:
        return tier,0,0,0
    base=(income['base']+awareness*income['perAwarenessPoint']+
          community*income['perCommunityPoint']+segments*income['perCompletedSegment']+
          (income['threeSegmentCompletionBonus'] if segments==3 else 0))
    gross=base*tier['multiplier']
    overhead=income['operatingCostPerSettledBroadcast']*tier['multiplier']
    return tier,gross,overhead,gross-overhead


def main():
    policy=json.loads((OUT/'rakoko_economy.design.json').read_text(encoding='utf-8'))
    offers=json.loads((OUT/'rakoko_money_events.design.json').read_text(encoding='utf-8'))['events']
    cases=[(10,20,270000),(30,35,680000),(50,55,2100000),(70,75,6000000),(90,95,14500000)]
    lines=['# 경제 규모 재조정 검토','','2026-11-05 · v2.0. 현재 설정을 읽은 참조 계산·데이터 검토다. 게임 엔진의 거래 통합/실제 플레이 검증은 아니다.','',
           '## 규모별 회당 금액','','|인지도/단골층|단계|배율|총수입|운영비|순수입|','|---|---|---:|---:|---:|---:|']
    for a,c,expected in cases:
        tier,gross,overhead,net=calculate(policy,a,c)
        assert net==expected
        lines.append(f'|{a}/{c}|{tier["label"]}|{tier["multiplier"]}|{gross:,}|{overhead:,}|{net:,}|')
    assert calculate(policy,100,100)[1:]==(16000000,750000,15250000)
    assert calculate(policy,0,0,0)[1:]==(0,0,0)
    assert calculate(policy,0,0,1)[3]>0
    # Every unlock boundary, plus persistent highest tier after a small decline.
    for i,t in enumerate(policy['income']['scaleTiers'][1:],1):
        threshold=t['minimumScore']
        assert calculate(policy,threshold-1,threshold-1)[0]['id']==policy['income']['scaleTiers'][i-1]['id']
        assert calculate(policy,threshold,threshold)[0]['id']==t['id']
        assert calculate(policy,threshold-1,threshold-1,previous_tier=t['id'])[0]['id']==t['id']
    assert len(offers)==16 and len({c['id'] for e in offers for c in e['choices']})==48
    for event in offers:
        for choice in event['choices'][:2]:
            price=choice['cost']['amount']
            assert type(price) is int and 0<price<=policy['cashMaximum']
            assert choice['eligibility']['all']==[{'path':'economy.cash','op':'gte','value':price}]
            debits=[x for x in choice['effects'] if x['op']=='cash.debit']
            assert len(debits)==1 and debits[0]['amount']==price
        abandon=event['choices'][2]
        assert not abandon['eligibility']['all'] and abandon['cost']['amount']==0
        assert all(x['op'] not in ('cash.credit','purchase.record','outfit.progress','experience.grant') for x in abandon['effects'])
        assert not event['countsAsIncomeEligibleSegmentByItself']
    assert policy['initialCash']==3000000
    assert policy['outfitPreparation']['costPerAction']*4==2000000
    assert policy['outfitPreparation']['equipUnlockedOutfitCost']==policy['forcedTenYearWeddingCost']==0
    assert policy['initialCash']+calculate(policy,10,20)[3]-offers[0]['choices'][0]['cost']['amount']==3190000
    lines += ['', '## 큰 목표까지 필요한 방송 수','','표는 잔액0원·동일 스테이터스/규모 유지·추가 지출 없음·정상3코너 진행의 단순 저축 비교다. 실제 진행은 성장·다른 지출·상금·초기 자산에 따라 달라진다.','',
              '|목표|가격|시작27만원/회|중견210만원/회|대형600만원/회|최상위1,450만원/회|',
              '|---|---:|---:|---:|---:|---:|']
    targets=[('의상 준비1종',2000000),('공간·기본운영 묶음',5000000),('작업실 구축',15000000),('온라인 특집 공연',30000000),('직접 주최 대회',50000000),('큰 팬 행사',80000000)]
    for name,price in targets:
        counts=[math.ceil(price/net) for net in (270000,2100000,6000000,14500000)]
        lines.append(f'|{name}|{price:,}|{counts[0]}회|{counts[1]}회|{counts[2]}회|{counts[3]}회|')
    # Conservative annual budget without assuming unknown event effects or stat growth.
    first_year=policy['initialCash']+52*calculate(policy,10,20)[3]
    after_outfits=first_year-4*policy['outfitPreparation']['costPerAction']*4
    assert (first_year,after_outfits)==(17040000,9040000)
    lines += ['',f'시작 수치를1년52회 내내 유지하면 초기자산 포함{first_year:,}원, 의상4종 준비비8,000,000원을 제외하면{after_outfits:,}원이다. 큰 공연을 초반 고정 수입만으로 곧바로 열기보다는 성장·축소안·다른 기획을 선택하게 하는 값이다.', '',
              '## 확인 결과와 한계','',
              '- 5개 예시 수입, 최대/0코너/초기저수치 수입, 4개 승급 경계와 최고단계 보존 확인.',
              '- 유료32선택의 가격/잠금/차감액 일치, 포기16선택의 무료완료/보상 없음 확인.',
              '- 의상총200만원·초기300만원·첫방송후80,000원구매잔액3,190,000원·무료환복/강제결혼0원 일치.',
              '- 큰 기획의 저축 필요 회수는 비교 기준이며 실제52회 조건/경험/진행 경로를 시뮬레이션한 결과가 아니다.',
              '- 구버전 잔액·장부·가격 스냅샷을 소급 변경하지 않는다. 일회 거래/잔액부족 포기의 실제 동작은 엔진 통합 뒤 검증한다.', '']
    (OUT/'rakoko_economy_review.md').write_text('\n'.join(lines),encoding='utf-8')
    print('\n'.join(lines[:11]))
    print('PASS: tier boundaries, persistent scale, 32 paid/16 abandon choices, target budgets and config examples.')


if __name__=='__main__':
    main()
