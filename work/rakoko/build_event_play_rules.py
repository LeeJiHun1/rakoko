"""Attach reviewed stat requirements and repeat policies to existing design references."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / 'outputs'

# Choice index -> semantically relevant stat thresholds. Basic/safe choices remain free.
CE = {
 1:{2:'operation:30'}, 6:{1:'operation:30'},7:{2:'planning:30'},
 9:{1:'planning:35',3:'planning:30'},10:{1:'community:25'},12:{2:'planning:30'},
 13:{2:'community:25'},14:{2:'planning:25'},15:{2:'planning:35 operation:25'},
 16:{2:'planning:25'},17:{1:'planning:30',3:'planning:35 community:30'},
 18:{3:'gameSkill:35'},22:{2:'gameSkill:40',3:'gameSkill:25'},
 23:{1:'gameSkill:45'},24:{2:'gameSkill:35'},25:{1:'operation:30',2:'planning:30'},
 26:{3:'planning:30'},27:{2:'operation:30'},28:{2:'operation:25'},
 29:{1:'gameSkill:25'},30:{1:'planning:30'},31:{2:'planning:30 community:30'},
 32:{1:'planning:30'},33:{1:'planning:30'},34:{1:'operation:30 planning:35'},
 35:{2:'planning:30'},37:{1:'planning:45 community:35'},38:{3:'gameSkill:30'},
 39:{2:'planning:35 community:30'},40:{1:'planning:35'},41:{3:'planning:35'},
 42:{1:'gameSkill:35'},48:{1:'planning:40'},
 50:{1:'operation:20'},51:{2:'community:25'},53:{3:'community:25'},
 58:{1:'planning:35 operation:30'},
 61:{1:'planning:30 community:25'},62:{2:'planning:30'},63:{1:'planning:30'},
 64:{3:'planning:30 operation:30'},65:{2:'operation:25'},66:{1:'planning:25'},
 69:{1:'gameSkill:35'},71:{1:'planning:35'},72:{2:'planning:35 community:25'}
}
RK = {
 1:{3:'operation:25'},3:{3:'operation:30'},4:{2:'operation:25'},
 6:{2:'planning:30'},12:{1:'gameSkill:25'},
 13:{1:'planning:30',2:'planning:35'},14:{2:'community:25'},
 15:{1:'planning:25',2:'planning:30'},16:{3:'operation:25'},17:{3:'operation:30'},
 24:{1:'operation:30'},28:{2:'operation:25'}
}


def thresholds(raw):
    return [{'path':'stats.gameSkillById.$game' if k=='gameSkill' else 'stats.'+k,
             'op':'gte', 'value':int(v)} for k,v in (token.split(':') for token in raw.split())]


def main():
    def read(name):
        return json.loads((OUT/name).read_text(encoding='utf-8'))
    pool=read('rakoko_draw_pool.design.json')
    originals={x['id']:x for x in read('rakoko_encounter_catalog.json')['events']}
    originals.update({x['id']:x for x in read('rakoko_event_cards.json')['cards']})
    entries=[]
    for e in pool['entries']:
        key=e['id']; n=int(key.split('-')[1]); trigger=e['trigger']
        source=originals.get(key)
        source_choices=source['choices'] if source else e['choices']
        mapping=CE.get(n,{}) if key.startswith('CE-') else RK.get(n,{}) if key.startswith('RK-') else {1:'planning:25'}
        choices=[]
        for i,c in enumerate(source_choices,1):
            text=c if isinstance(c,str) else c.get('label',c.get('text'))
            if isinstance(c,str):
                text=text.split(' → ')[0]
            choices.append({'id':f'{key}-C{i}','sourceChoiceIndex':i-1,'text':text,
                            'eligibility':{'all':thresholds(mapping.get(i,''))},
                            'requiresOriginalStoryAndCostConditions':True,
                            'showWhenEventVisible':True,'disableWhenAnyRequirementFails':True,
                            'growthBonusNotYetAssigned':True})
        if key.startswith('RK-'):
            repeat={'mode':'once_per_run','maxOccurrencesPerRun':1,'reason':'구체적인 원자료 각색은 한 번만 사용'}
        elif key.startswith('RA-'):
            repeat={'mode':'once_per_run','maxOccurrencesPerRun':1,'reason':'지정 원자료 관찰 각색'}
        elif trigger=='random':
            context = 'currentProjectId' if n in (37,40,41,42,50,51,52,58,60,65,66) else None
            repeat={'mode':'per_context' if context else 'recurring','minimumBroadcastGap':8 if context else 5,
                    'contextKey':context,'maxPerContext':1 if context else None,
                    'authoredVariantCount':1,'targetVariantCount':3,
                    'sourceFactRepeats':False}
        elif 'followup' in trigger:
            repeat={'mode':'per_parent_instance','maxPerParent':1}
        elif trigger=='post_broadcast_random':
            repeat={'mode':'per_context','contextKey':'broadcastOutputId','maxPerContext':1,'minimumBroadcastGap':4}
        elif trigger=='result_reaction':
            repeat={'mode':'per_context','contextKey':'challengeResultId','maxPerContext':1}
        elif trigger=='outfit_leak_hook':
            repeat={'mode':'per_context','contextKey':'outfitId','maxPerContext':1}
        else:
            repeat={'mode':'per_context','contextKey':'scheduledOccurrenceKey','maxPerContext':1}
        weights=[]
        if e['group']=='장비·화면':
            weights.append({'when':{'all':thresholds('operation:60')},'multiplier':.6})
        if key in ('CE-019','RK-007','RK-010','RA-004'):
            weights.append({'when':{'all':thresholds('gameSkill:60')},'multiplier':.4})
        if key in ('CE-022','CE-023','RK-012','RK-020'):
            weights.append({'when':{'all':thresholds('gameSkill:40')},'multiplier':1.3})
        if key in ('CE-015','CE-037','CE-061','CE-062','CE-063'):
            weights.append({'when':{'all':thresholds('community:50')},'multiplier':1.3})
        entries.append(dict(id=key,family=e['family'],trigger=trigger,repeat=repeat,choices=choices,statWeightRules=weights))
    assert len(entries)==105
    assert all(any(not c['eligibility']['all'] for c in e['choices']) for e in entries), 'Every ordinary event needs a stat-free choice.'
    result={'version':'1.0','status':'design_only_not_executable_effects',
            'rules':{'originalStoryConditionsStillRequired':True,'statLocksDoNotReplaceSetupConditions':True,
                     'adaptationAfterFamilyPreviouslySeen':False,'creativeRecurrenceAfterAdaptationAllowedAfterCooldown':True,
                     'familySharedCooldown':True,'groupExcludedFollowingBroadcasts':2,'sameFamilyMaximumPerBroadcast':1,
                     'repeatedFixedAchievementOrUnlockRewards':False,'uniqueAwarenessGainPerFamilyPerRun':True,
                     'repeatInstancesHaveNewIdsAndReuseSavedOutcomesOnResume':True},
            'entries':entries}
    (OUT/'rakoko_event_play_rules.design.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    rows=['# 일반 사건의 선택 제한·반복 정책','','2026-11-04 · 기획용 연결표. 원본 문구·조건·효과를 대체하지 않는다. 105참조는 105개 독립 사건이 아니다.','',
          '수치가 필요한 전문 선택만 제한한다. 기본 점검·인사·힌트·보류·의상 무료 환복에는 관련 없는 수치 제한을 붙이지 않았다. 각 사건에 최소 한 개 수치 제한 없는 선택을 남겼고 원래의 안전한 보류·전환 경로도 보존한다. 원래 준비·약속·의상 해금 조건은 별도로 지켜야 한다.','',
          '|참조|반복 방식|선택별 수치 제한|','|---|---|---|']
    labels=read('rakoko_ending_requirements.design.json')['statLabels']
    for e in entries:
        limited=[]
        for c in e['choices']:
            if c['eligibility']['all']:
                conditions=[]
                for clause in c['eligibility']['all']:
                    path=clause['path']; k='gameSkill' if 'gameSkillById' in path else path.split('.')[1]
                    conditions.append(f"{labels[k]} {clause['value']}")
                limited.append(c['text']+' → '+'·'.join(conditions))
        rows.append(f"|{e['id']}|{e['repeat']['mode']}|{'<br>'.join(limited) or '수치 제한 없음'}|")
    (OUT/'rakoko_event_play_rules.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
    print('Linked',len(entries),'references and',sum(len(e['choices']) for e in entries),'choices; recurring general references:',sum(e['trigger']=='random' and e['repeat']['mode'] in ('recurring','per_context') for e in entries))


if __name__=='__main__':
    main()
