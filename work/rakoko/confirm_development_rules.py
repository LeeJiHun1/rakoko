"""Read current design data; report supply without regenerating source catalogs."""
import json
import random
from collections import Counter
from pathlib import Path
from statistics import mean, median

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def simulate(pool, rules, pattern, seed):
    rng = random.Random(seed)
    used, recent = set(), {}
    cfg = rules['supplyAcceptance']
    selection = rules['selection']
    counts = Counter()
    first = None
    for broadcast in range(cfg['modelBroadcasts']):
        day = broadcast * cfg['modelIntervalDays']
        phase = next(p for p in pool['selection']['phases']
                     if p['throughElapsedDay'] is None or day <= p['throughElapsedDay'])
        for slot in range(rules['broadcast']['segmentSlots']):
            corner = pattern[(broadcast * rules['broadcast']['segmentSlots'] + slot) % len(pattern)]
            eligible = [e for e in pool['entries']
                        if e['trigger'] == 'random' and corner in e['route']
                        and e['family'] not in used
                        and broadcast - recent.get(e['group'], -100) > selection['excludedFollowingBroadcastsPerGroup']
                        and day >= e.get('minElapsedDay', 0)]
            if not eligible:
                counts['fallback'] += 1
                first = first or broadcast + 1
                continue
            source = '라코코 각색' if rng.random() < phase['rakokoSourceShare'] else '창작'
            candidates = [e for e in eligible if e['source'] == source] or eligible
            weights = [e.get('weight', selection['defaultWeight']) *
                       (phase['gameplayMultiplier'] if e['topic'] == 'gameplay'
                        else pool['selection']['otherTopicMultiplier']) for e in candidates]
            picked = rng.choices(candidates, weights=weights)[0]
            used.add(picked['family'])
            recent[picked['group']] = broadcast
            if broadcast < cfg['earlyBroadcasts']:
                counts['earlyGeneral'] += 1
                counts['earlyRakoko'] += picked['source'] == '라코코 각색'
            if day >= cfg['lateFromElapsedDay']:
                counts['lateGameplay'] += picked['topic'] == 'gameplay'
    return counts, first or cfg['modelBroadcasts'] + 1


def main():
    rules = read(OUT / 'rakoko_game_rules.design.json')
    for name, ref in rules['references'].items():
        assert (OUT / ref).is_file(), (name, ref)
    pool = read(OUT / rules['references']['drawPool'])
    assert len({e['id'] for e in pool['entries']}) == len(pool['entries'])
    assert all(e['source'] in ('라코코 각색', '창작') for e in pool['entries'])
    assert all(e.get('weight', 1) > 0 for e in pool['entries'])
    general = [e for e in pool['entries'] if e['trigger'] == 'random']
    families = len({e['family'] for e in general})
    cfg = rules['supplyAcceptance']
    slots = cfg['modelBroadcasts'] * rules['broadcast']['segmentSlots']
    lines = [
        '# 개발 가이드 연결 및 과거 일회성 공급 비교', '',
        '2026-11-04 · 앞선 모델의 검토 의견과 현재 파일을 대조한 결과다. 실행 게임 플레이테스트는 아니다.', '',
        '## 확인과 조치', '',
        '- 초반 출처 90/10·중반 55/45·후반 40/60, 게임 배수 0.35/1/4를 유지했다.',
        '- 준비 2회·3칸, 방송 후 무작위 사건 20%·최대 1건을 설정 데이터에 반영했다. 서로 다른 방송 3회 같은 누적 목표는 업적으로 옮겼다.',
        '- 유출 8%/점검 3%, 수습 실패 25%/점검 10%, 준비 +25는 기존 의상 설정을 참조한다.',
        '- 설정은 rakoko_game_rules.design.json을 진입점으로 삼고 달력·의상·추첨 원본을 참조한다. 중복 수치를 새로 저장하지 않았다.',
        '- 주년 자동 결산은 폐기했다. 엔딩은 첫 1주년부터 5%, 해마다 +3%p, 상한 35%의 별도 사건이다. 미당첨은 30일 뒤 검사하며 보류 90일·엔딩 뒤 계속 365일 대기를 적용한다.',
        '- 16사건·32결말의 조건부 선택과 장 전환 시 이월 규칙은 rakoko_ending_design.md를 따른다. 연도가 바뀌는 것만으로 새 장을 만들지 않는다.', '',
        '## 현재 목록에 과거 일회성 제약을 적용한 비교 기준', '',
        f'전체 {len(pool["entries"])}개 참조 / 일반 후보 {len(general)}개 / 일반 소재 {families}종.',
        f'모든 소재를 한 번만 쓰던 과거 제약에서는 {slots}칸의 대체 하한이 {(slots-families)/slots:.1%}였다. 최신 반복 정책의 하한이 아니다.', '',
        '주간 52회·3칸·각 100개 시드. 준비·선택 조건은 충족했다고 가정하며 고정·후속·방송 후 사건은 제외한다. 초반 각색 비율은 첫 10회의 일반 사건만 분모로 쓰고 일상은 제외한다. 후반 게임 건수는 경과 241일 이후 시드당 평균이다.', '',
        '|편성|첫 일상 중앙값|일상 대체율|초반 각색|후반 게임 평균|통과 여부(각색/대체/후반)|',
        '|---|---:|---:|---:|---:|---|']
    for name, pattern in cfg['patterns'].items():
        results = [simulate(pool, rules, pattern, seed) for seed in range(cfg['seeds'])]
        total = sum((r[0] for r in results), Counter())
        early = total['earlyRakoko'] / total['earlyGeneral'] if total['earlyGeneral'] else 0
        fallback = total['fallback'] / (slots * cfg['seeds'])
        late = mean(r[0]['lateGameplay'] for r in results)
        checks = ['충족' if early >= cfg['minimumEarlyRakokoShareAmongGeneral'] else '미달',
                  '충족' if fallback <= cfg['maximumFallbackShareAmongRequestedSlots'] else '미달',
                  ('대상 아님' if name == 'talk' else
                   '충족' if late >= cfg['minimumMeanLateGameplayForGameAndMixed'] else '미달')]
        lines.append(f'|{name} ({pattern})|{median(r[1] for r in results):g}회|{fallback:.1%}|{early:.1%}|{late:g}건|{" / ".join(checks)}|')
    lines += ['', '## 판정과 후속 작업', '',
              '최신 기준은 상태·경험·승인 마무리 기획의 종결 선택, 무엔딩10년 강제결혼, 반복 창작55참조다. 이 표는 해당 반복 정책과 수치를 반영한 플레이 결과가 아니다.',
              '180 일반 소재·60 후속은 제작 목표다. 초반 잡담 각색 → 후반 게임 소재와 결과·후속 → 나머지 코너 순서로 보강하고 같은 모형을 재실행한다. 엔딩 16사건·32결말 설계는 별도 카탈로그이며 이 일반 추첨 공급량에는 포함하지 않는다.',
              '한 회차 구현 후에는 실제 조건·선택·고정 편성·후속이 연결된 시나리오로 공급을 별도 측정한다. 현재 모형은 날짜를 늘리거나 연속 시즌의 반복성을 평가하지 않는다.', '']
    report = OUT / 'rakoko_development_confirmation.md'
    report.write_text('\n'.join(lines), encoding='utf-8')
    print('\n'.join(lines[lines.index('|편성|첫 일상 중앙값|일상 대체율|초반 각색|후반 게임 평균|통과 여부(각색/대체/후반)|'):]))


if __name__ == '__main__':
    main()
