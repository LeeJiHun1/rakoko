"""Author fictional broadcast finances; no real income or market-price assumptions."""
import json
from pathlib import Path

OUT=Path(__file__).resolve().parents[2]/'outputs'
# Explicit paid options; the last choice is always abandonment, never an equivalent free reward.
OFFERS=[
 ('새 게임을 구매할까','new_game_requested','새 게임을 구매한다',80000,'requested_game_purchase','저렴한 대체 게임을 구매한다',20000,'budget_game_purchase'),
 ('추가 콘텐츠를 열어볼까','dlc_requested','요청한 확장 콘텐츠를 구매한다',30000,'requested_dlc_purchase','작은 추가 팩만 구매한다',15000,'small_addon_purchase'),
 ('마이크 수리를 맡길까','mic_service_requested','전문 수리를 맡긴다',150000,'mic_repair_service','이번 방송용 장비를 빌린다',50000,'mic_rental_service'),
 ('추가 녹화 공간이 필요하다','recording_archive_expansion_requested','녹화·백업 저장 장치를 구매한다',500000,'recording_storage_purchase','한 기획용 보관 공간만 빌린다',100000,'recording_storage_rental'),
 ('특집 썸네일을 의뢰할까','thumbnail_commission_requested','독자 썸네일을 의뢰한다',50000,'thumbnail_commission','소규모 수정 작업을 의뢰한다',20000,'thumbnail_revision'),
 ('새 방송 화면을 주문할까','overlay_commission_requested','맞춤 화면 구성을 의뢰한다',250000,'overlay_commission','필요한 패널만 의뢰한다',80000,'overlay_panel_commission'),
 ('특집 소품을 마련할까','broadcast_props_requested','계획한 소품 세트를 구매한다',300000,'props_full_purchase','핵심 소품만 구매한다',100000,'props_small_purchase'),
 ('소규모 행사의 공간을 빌릴까','event_venue_requested','공간·기본 음향·운영 묶음을 대여한다',5000000,'venue_full_rental','작은 공간 중심으로 축소 대여한다',1000000,'venue_small_rental'),
 ('팬 참여 기획의 기념품','commemorative_goods_requested','계획한 수량의 기념품을 제작한다',1500000,'goods_full_production','작은 수량으로 제작한다',300000,'goods_small_production'),
 ('가상 전시용 독자 에셋','exhibit_asset_commission_requested','맞춤 전시 에셋 묶음을 의뢰한다',2000000,'exhibit_full_commission','한 작품의 보조 에셋만 의뢰한다',500000,'exhibit_small_commission'),
 ('독자 영상의 편집 지원','video_edit_service_requested','방송 요약·하이라이트 묶음을 의뢰한다',500000,'video_edit_full','일부 구간의 정리만 의뢰한다',150000,'video_edit_partial'),
 ('합동 방송 장비를 빌릴까','collab_equipment_requested','다인 송출장비·운영 묶음을 예약한다',2000000,'collab_equipment_full_rental','필수 장비만 예약한다',500000,'collab_equipment_small_rental'),
 ('방송 작업실을 확장할까','studio_expansion_requested','방음·장비·작업환경을 함께 구축한다',15000000,'studio_full_expansion','핵심 작업환경만 개선한다',5000000,'studio_small_expansion'),
 ('온라인 특집 공연 제작','online_show_requested','무대·영상·송출 제작 묶음을 맡긴다',30000000,'online_show_full','작은 무대 구성으로 제작한다',8000000,'online_show_small'),
 ('직접 여는 스트리머 대회','hosted_tournament_requested','운영·중계·게임용 상금 예산을 집행한다',50000000,'hosted_cup_full','소규모 친선전 예산으로 줄인다',10000000,'hosted_cup_small'),
 ('큰 팬 행사 개최 준비','large_fan_event_requested','장소·제작·운영을 묶어 준비한다',80000000,'fan_event_full','인원과 구성을 줄여 준비한다',20000000,'fan_event_small')
]


def main():
    config={
      'version':'2.0','status':'implementation_defaults_not_playtested',
      'label':'보유 자산 · 방송 자금','currency':'fictional_KRW','initialCash':3000000,
      'cashPath':'economy.cash','cashMinimum':0,'cashMaximum':9000000000000,'integerOnly':True,
      'competencyRangeAndGrowthCapApply':False,
      'income':{'source':'completed_broadcast','statSnapshot':'broadcast_start_after_preparation',
                'base':50000,'perAwarenessPoint':2000,'perCommunityPoint':2000,
                'perCompletedSegment':30000,'threeSegmentCompletionBonus':100000,
                'operatingCostPerSettledBroadcast':30000,
                'scaleMetric':'min_awareness_community',
                'scaleTiers':[{'id':'starter','label':'시작 단계','minimumScore':0,'multiplier':1},
                              {'id':'growing','label':'성장 방송','minimumScore':25,'multiplier':2},
                              {'id':'established','label':'중견 방송','minimumScore':45,'multiplier':5},
                              {'id':'major','label':'대형 방송','minimumScore':65,'multiplier':12},
                              {'id':'leading','label':'최상위 방송','minimumScore':85,'multiplier':25}],
                'unlockTierAt':'broadcast_start_after_preparation','retainHighestUnlockedTier':True,
                'tierSnapshotOnStart':True,'multiplyGrossAndOperatingCost':True,
                'zeroCompletedSegmentsPays':0,'requiresBroadcastClosed':True,
                'settlementKey':['runId','broadcastId','incomeSettlement'],
                'settlementBeforeEndingCheck':True,'maximumSupportedSegments':3},
      'outfitPreparation':{'costPerAction':500000,'progressPerPaidAction':25,
                           'whenInsufficientCash':'do_not_consume_action_or_advance_progress',
                           'allowSkipCurrentPreparation':True,'equipUnlockedOutfitCost':0,
                           'revealFee':0,'preservePreviouslyPaidProgress':True},
      'tournamentAwards':[
        {'moduleId':'LC-PT','winnerPrize':5000000},
        {'moduleId':'LC-ST','winnerPrize':2000000}],
      'tournamentPrizeBasis':'fictional_individual_share_not_entire_team_pool',
      'awardRequirements':{'playerConfirmed':True,'roleTrack':'player','matchesWonAtLeast':2,
                           'competitionActuallyCompleted':True,'awardOncePerCompetitionInstance':True},
      'paidChoices':{'requireCashAtCommit':True,'disableWhenInsufficient':True,
                    'showPriceAndCurrentCash':True,'allowAbandon':True,
                    'abandonGrantsPaidOutcome':False,'abandonChargesCash':False,
                    'automaticDebt':False,'silentPartialPayment':False,
                    'futureIncomeUsableBeforeSettlement':False},
      'separateWallets':['module_server_currency','module_resources'],
      'moduleCurrencyConvertsToBroadcastCash':False,
      'defaultUnpricedChoiceCost':0,'dateSkipChargesCash':False,'dateSkipEarnsCash':False,
      'randomUnacceptedCashLoss':False,'freeEquipChangesCash':False,'replayChangesCash':False,
      'forcedTenYearWeddingCost':0,
      'retainOnChapterContinuation':True,'resetOnlyOnSeparateNewRun':True,
      'commitOrder':['verify_revision_and_conditions','verify_funds','apply_cash_and_story_atomically','save_ledger_and_command_id','present_result'],
      'ledgerFields':['transactionId','runId','broadcastId','eventInstanceId','choiceId','category','amount','balanceAfter','gameDate','ruleVersion'],
      'purchaseFields':['purchaseId','projectId','itemOrServiceId','scope','deliveryStatus','paidTransactionId'],
      'migration':{'missingCash':'grant_initial_cash_once_with_opening_ledger_entry','retroactiveBroadcastIncome':False,'preserveOriginalSave':True,
                   'existingCashAndLedger':'preserve_nominal_values_no_automatic_scale_up',
                   'pendingChoicePrices':'honor_saved_price_snapshot','oldPurchasesRepriced':False},
      'choicePoliciesReference':'rakoko_money_events.design.json'
    }
    events=[]
    for i,(title,need,full,fullprice,fullitem,small,smallprice,smallitem) in enumerate(OFFERS,1):
        key=f'ME-{i:03}';choices=[]
        for j,(text,price,item,scope) in enumerate([(full,fullprice,fullitem,'full'),(small,smallprice,smallitem,'reduced')],1):
            choices.append({'id':f'{key}-C{j}','text':text,'cost':{'wallet':'economy.cash','amount':price},
                            'eligibility':{'all':[{'path':'economy.cash','op':'gte','value':price}]},
                            'showWhenEventVisible':True,'disableWhenAnyConditionFails':True,
                            'effects':[{'op':'cash.debit','amount':price,'reason':item},
                                       {'op':'purchase.record','itemOrServiceId':item,'scope':scope,'bindProjectAndTarget':True,
                                        'targetBinding':'event.requestedTargetId' if j==1 else 'event.reducedTargetId',
                                        'deliveryStatus':'available' if i in (1,2,8,12) or (i in (3,4) and j==2) else 'paid_pending_delivery',
                                        'deliveryAfterBroadcasts':3 if i in (13,14) else 4 if i in (15,16) else 0 if i in (1,2,8,12) or (i in (3,4) and j==2) else 1,
                                        'rentalUntil':'project_close' if i==4 and j==2 else 'target_broadcast_end' if item.endswith('rental') else None}],
                            'automaticallyGrantsEndingOrExperience':False})
        choices.append({'id':key+'-ABANDON','text':'이번 이벤트는 포기한다','cost':{'wallet':'economy.cash','amount':0},
                        'eligibility':{'all':[]},'effects':[{'op':'paidEvent.abandon','grantsPurchase':False,'grantsProgress':False,'chargesCash':False,'createsMandatoryPromise':False,'returnTo':'preparation_or_parent_broadcast_content'}],
                        'alwaysAvailable':True})
        events.append({'id':key,'title':title,'provenance':'fictional_game_design',
                       'eligibility':{'all':[{'path':'needs.'+need,'op':'eq','value':True}]},
                       'costBasis':'game_balance_not_real_market_price',
                       'snapshotTargetsAndPricesBeforePresenting':True,
                       'route':'relevant_preparation_request_or_contextual_general_slot',
                       'countsAsIncomeEligibleSegmentByItself':False,
                       'repeat':{'maxSuccessfulPurchasesPerProjectAndTarget':1,'abandonConsumesPurchaseLimit':False,'afterAbandon':'manual_reopen_or_new_project_only'},
                       'choices':choices})
    (OUT/'rakoko_economy.design.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'rakoko_money_events.design.json').write_text(json.dumps({'version':'2.0','status':'design_only','events':events},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=[f'# 자금 지출 사건 {len(events)}종','','2026-11-05 · v2.0. 공개 가격 사례는 경제 조사 문서에 기록했고 아래 값은 게임용 패키지 예산이다. 실제 라코코의 자산/수입을 뜻하지 않는다. 잔액이 부족한 유료 선택은 비활성화하고 포기 선택을 제공한다.','',
           '|사건|유료 선택1|유료 선택2|잔액 부족/원하지 않을 때|','|---|---|---|---|']
    for e in events:
        a,b,_=e['choices']
        lines.append(f'|{e["id"]} · {e["title"]}|{a["text"]} · {a["cost"]["amount"]:,}원|{b["text"]} · {b["cost"]["amount"]:,}원|이번 이벤트 포기. 지출·구매·성공·진행도 없음|')
    lines += ['', '수치·기획·참가 자격 조건은 돈으로 대체하지 않는다. 지급 결과는 구매/의뢰 접수 기록이며, 납품·실제 사용·검수·리허설을 마쳐야 관련 준비나 경험을 얻는다. 축소 구매는 축소된 작업 범위에만 유효하다. 포기한 작업을 무료 완료로 처리하지 않는다.', '',
              '예: 인게임 블록·도시 역할극의 물자는 지역 자원으로 처리한다. 이 목록의 구매는 방송 제작 자금의 지출이며 서버 안 가게의 매출을 방송 자산으로 환전하지 않는다. 마이크 수리·녹화 공간 지출을 포기해도 게임 저장·기본 방송을 유료로 잠그지 않는다.', '']
    (OUT/'rakoko_money_events.md').write_text('\n'.join(lines),encoding='utf-8')
    print(f'Financial defaults and {len(events)} events / {sum(len(e["choices"]) for e in events)} choices authored.')


if __name__=='__main__':
    main()
