"""Author the original fictional finale catalog; does not alter research sources."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / 'outputs'

# Event title, setup, setup state; each branch: choice, prerequisite, ending, resolution, epilogue.
ROUTES = [
('다음 해 편성표의 마지막 빈칸', '다음 해 방송 방향을 정하는 마지막 편성 회의가 열린다.', None,
 ('매주 같은 시간, 같은 코너로 만나자', None, '그 시간이면 켜지는 방송', '고정 코너와 정기 편성표를 확정하고 첫 장을 닫는다.', '다음 해에는 약속한 시간에 다시 모이는 키몽이들의 모습으로 끝난다.'),
 ('매주 다른 특집을 만드는 방송으로 가자', None, '편성표 밖의 라코코', '일상 편성표를 특집 제작 일정으로 바꾸고 첫 기획을 발표한다.', '계절마다 달라지는 특집 포스터들이 채널의 다음 모습을 보여준다.')),
('긴 도전의 마지막 판', '장기 도전이 최종 구간에 도달했고 마지막 공략을 정해야 한다.', 'challenge.finale_ready',
 ('연습한 정공법으로 마지막 판을 마치자', 'challenge.final_route_rehearsed', '마지막 보스 뒤의 첫 페이지', '미리 검증한 공략으로 도전을 완주하고 긴 시리즈를 종결한다.', '게임 완주 경험을 바탕으로 다음 장르의 도전을 시작하는 예고가 나온다.'),
 ('키몽이들에게 설명하면서 끝내자', 'challenge.teaching_outline_ready', '공략을 들려주는 사람', '최종 구간을 해설 방송으로 바꾸고 완성한 공략 노트를 공개한다.', '채널의 간판은 함께 배우는 게임 해설 프로그램으로 자리 잡는다.')),
('끝내 달성하지 못한 목표', '최종 도전 방송이 실패로 끝나고 이번 시리즈의 처리 방향을 정한다.', 'challenge.final_attempt_failed',
 ('미리 검증한 대체 목표로 완주하자', 'challenge.alternative_goal_verified', '기록보다 남은 것', '원래 기록을 포기하고 대체 코스를 마쳐 시리즈를 완결한다.', '기록 경쟁 대신 다양한 시도를 보여주는 도전 방송으로 방향을 정한다.'),
 ('실패 기록까지 모두 공개하고 여기서 마치자', 'challenge.failure_log_edited', '클리어하지 못한 공략집', '실패 과정과 배운 점을 정리한 마지막 편을 공개한다.', '실패와 시행착오 자체를 함께 분석하는 새 프로그램이 시작된다.')),
('키몽이 기획안의 최종 투표', '시청자 참여로 만든 두 기획안이 최종 후보에 오른다.', 'fan.finalists_selected',
 ('검증한 투표안을 정규 프로그램으로 만들자', 'fan.regular_pilot_completed', '키몽이 편성국', '파일럿의 문제를 고치고 시청자 편성 프로그램을 정식 출범시킨다.', '다음 편성표에 키몽이들의 제안이 정기적으로 실린다.'),
 ('이번에만 열리는 깜짝 축제로 완성하자', 'fan.festival_rehearsed', '오늘 하루의 키몽제', '최종 후보들을 하루짜리 축제로 묶어 방송을 마친다.', '이 축제는 해마다 기다리는 채널 고유 행사로 남는다.')),
('방송에서 만들던 작품의 완성', '방송 중 제작하던 독자 창작물이 공개 가능한 버전이 된다.', 'creation.release_candidate_ready',
 ('한 편의 완성작으로 공개하자', 'creation.standalone_review_passed', '송출 화면 밖으로', '완성작과 제작 후기를 공개하고 제작 연작을 끝낸다.', '방송에서 시작한 작품이 별도 감상 공간에서 관객을 만난다.'),
 ('첫 화로 내고 정식 연재를 시작하자', 'creation.series_outline_approved', '첫 화 끝, 다음 화 예고', '파일럿을 정식 첫 화로 공개하고 연재 방향을 확정한다.', '채널은 작품 제작 과정을 함께 보는 연재 방송으로 이어진다.')),
('막이 오르기 직전', '준비해 온 온라인 무대의 최종 공연 방식을 결정한다.', 'stage.final_rehearsal_completed',
 ('혼자 준비한 무대로 막을 올리자', 'stage.solo_program_ready', '이름을 건 첫 무대', '개인 무대를 끝까지 진행하고 마지막 인사를 남긴다.', '이후에는 라코코의 무대형 콘텐츠가 채널의 중심이 된다.'),
 ('합을 맞춘 합동 무대로 바꾸자', 'stage.ensemble_rehearsed', '혼자 켰던 방송, 함께 오른 무대', '함께 준비한 출연 순서로 공연을 완성한다.', '이번 팀이 다시 모일 다음 합동 무대를 예고하며 끝난다.')),
('합동 기획의 마지막 역할 배정', '가상의 합동 기획에서 마지막으로 맡을 역할을 정한다.', 'collab.production_ready',
 ('진행을 맡아 전체 방송을 완성하자', 'collab.host_runbook_verified', '모두의 마이크를 켜는 사람', '진행자로 순서를 연결하고 합동 기획을 마무리한다.', '새로운 합동 프로그램의 진행자로 다시 초대되는 후일담이 나온다.'),
 ('준비한 팀의 선수로 끝까지 뛰자', 'collab.team_strategy_verified', '우리 팀 마지막 라운드', '진행을 다른 가상 참가자에게 넘기고 팀의 마지막 시범 경기를 마친다.', '같은 팀으로 도전할 다음 대회의 목표를 남긴다.')),
('의상 공개 다음의 마지막 기획', '공개한 의상으로 준비한 특집의 최종 연출을 정한다.', 'outfit_special.production_ready',
 ('준비한 이야기의 장면으로 등장하자', 'outfit_special.story_script_rehearsed', '옷장에서 시작된 이야기', '공개 의상을 극중 역할로 사용해 짧은 독자 상황극을 완성한다.', '다음 작품의 첫 장면으로 이어지며 상황극 연작의 시작을 알린다.'),
 ('키몽이와 만든 테마 전시를 열자', 'outfit_special.gallery_reviewed', '한 벌에서 열린 전시회', '의상 준비 과정과 직접 제작한 테마 그림을 온라인 전시로 완성한다.', '전시가 채널의 계절별 창작 행사로 자리 잡는 모습을 보여준다.')),
('특집 직전 송출 화면이 멈췄다', '최종 특집의 화면 전환이 멈췄다. 준비된 대체 편성 중 하나를 선택한다.', 'technical.finale_scene_frozen',
 ('준비해 둔 음성 전용 편성으로 끝내자', 'technical.audio_fallback_rehearsed', '화면이 꺼져도 들리는 방송', '화면 복구를 기다리는 대신 준비한 오디오 특집으로 마지막 편을 완성한다.', '이날의 형식이 정식 라디오 코너로 남는 후일담이 이어진다.'),
 ('검수한 녹화본으로 상영회를 열자', 'technical.backup_cut_reviewed', '생방송 대신 첫 상영회', '미리 검수한 독자 영상과 실시간 해설을 결합해 특집을 마친다.', '편집 영상과 생방송 해설을 묶는 새로운 상영 프로그램이 탄생한다.')),
('오래전에 봉인한 시간캡슐', '예전에 저장한 미래 편지가 지정한 개봉일을 넘겼다.', 'capsule.opening_due',
 ('편지에 적었던 미완성 기획을 이번에 완성하자', 'capsule.promised_project_ready', '그때 적어 둔 다음에', '과거에 약속한 결과물을 이번 마지막 방송에서 공개한다.', '오래된 한 문장에서 시작한 기획의 전 과정을 보여주며 장을 닫는다.'),
 ('허락받은 기록으로 작은 방송 박물관을 열자', 'capsule.archive_curated', '작은 방송 박물관', '이번까지의 직접 제작 기록과 메모를 온라인 전시로 묶는다.', '전시 마지막 방에 다음 방송을 위한 빈 자리를 남기고 끝난다.')),
('생일 특집의 마지막 선물', '현재 또는 늦은 생일 특집에서 준비한 마지막 공개물을 고른다.', 'birthday.final_segment_ready',
 ('함께 만든 독자 노래를 공개하자', 'birthday.original_song_approved', '매년 다시 부를 한 곡', '방송 안에서 창작하고 검수한 생일 노래를 처음 공개한다.', '다음 생일에는 같은 노래를 함께 부르는 장면이 후일담으로 나온다.'),
 ('함께 쓴 글로 한 권의 기념책을 완성하자', 'birthday.fan_book_approved', '우리가 쓴 생일 한 권', '동의받은 게임 속 글과 직접 만든 삽화로 기념책을 완성한다.', '책의 마지막 페이지에서 다음 해의 새 권을 예고한다.')),
('작은 공개 행사의 마지막 자리', '가상의 소규모 방송 행사를 준비했고 마지막 코너를 정한다.', 'meetup.program_rehearsed',
 ('질문과 답변으로 오래 준비한 이야기를 나누자', 'meetup.questions_curated', '채팅창에서 같은 자리로', '선별한 질문으로 첫 소규모 토크 행사를 끝낸다.', '작게 자주 만나는 토크 모임이 앞으로의 정기 행사로 남는다.'),
 ('함께 만든 게임 코너로 마무리하자', 'meetup.game_pilot_tested', '키몽이 운동회 첫 회', '테스트를 마친 참여형 미니게임으로 첫 행사를 완성한다.', '다음 기수를 모집하는 가상 채널 공지로 후일담을 맺는다.')),
('장난으로 만든 말이 간판이 됐다', '가벼운 실수에서 나온 독자 유행어를 특집으로 만들 기회가 생긴다.', 'meme.original_phrase_feature_ready',
 ('재현한 상황극을 정식 코너로 만들자', 'meme.sketch_pilot_approved', '실수로 태어난 대표 코너', '당사자 비하 없이 직접 쓴 상황극으로 유행어 특집을 마친다.', '농담 하나가 채널의 대표 코미디 프로그램이 되는 후일담이 나온다.'),
 ('독자 퍼즐 게임으로 바꾸어 공개하자', 'meme.puzzle_release_reviewed', '농담 하나의 플레이 버튼', '유행어에서 출발한 작은 독자 퍼즐을 직접 플레이하며 공개한다.', '키몽이들의 새로운 풀이와 창작물이 뒤따르는 모습을 보여준다.')),
('큰 특집과 작은 약속이 같은 날', '외부 가상 프로그램의 초대와 먼저 준비한 자체 기획이 겹친다.', 'invitation.schedule_conflict_pending',
 ('미리 합의한 대체 진행으로 약속을 지키고 초대에 가자', 'invitation.coverage_agreed', '더 큰 편성표의 한 칸', '자체 기획의 대체 진행을 확정하고 외부 특집의 맡은 순서를 마친다.', '자기 코너를 지키며 더 넓은 무대에도 참여하는 방송으로 이어진다.'),
 ('초대에 답하고 약속했던 자체 기획을 열자', 'invitation.own_program_ready', '오늘은 우리 방송 하는 날', '초대에는 다른 기회를 제안하고 준비했던 자체 특집을 완성한다.', '채널이 스스로 기획한 프로그램을 중심으로 자리 잡는 후일담이 나온다.')),
('기획 전체를 못 끝낼 것 같다', '한 번의 방송에 담으려던 최종 기획이 범위 조정을 필요로 한다.', 'project.scope_decision_due',
 ('검증한 핵심 부분만 남겨 한 편으로 완성하자', 'project.minimum_version_verified', '작아도 완성된 오늘', '불필요한 부분을 덜어 완결 가능한 특집으로 마무리한다.', '대형 기획 한 번보다 작은 완성작을 꾸준히 내는 방송으로 방향을 잡는다.'),
 ('나눠 놓은 구성으로 정식 연속 프로그램을 열자', 'project.multipart_plan_verified', '끝이 아니라 정규 편성', '범위를 나눈 기획의 첫 편을 완성하고 다음 편성 일정을 발표한다.', '원래의 무리한 한 편이 오래 이어지는 정규 시리즈로 바뀐다.')),
('완성된 방송일지 영상의 마지막 컷', '직접 제작한 기록으로 만든 마지막 영상이 두 편집본까지 완성된다.', 'journal.finale_edit_ready',
 ('과정이 드러나는 긴 기록으로 공개하자', 'journal.long_cut_reviewed', '우리가 방송을 만든 시간', '시작과 시행착오, 마지막 선택까지 연결한 독자 다큐를 공개한다.', '다음 기획을 함께 만들 사람들에게 작업실을 여는 장면으로 끝난다.'),
 ('재구성한 짧은 애니메이션으로 공개하자', 'journal.animation_cut_reviewed', '방송일지의 움직이는 마지막 장', '실제 타인 영상 대신 직접 만든 그림과 글로 마지막 단편을 공개한다.', '방송에서 얻은 이야기로 새 독자 애니메이션을 만드는 후일담을 남긴다.')),
]


def cond(flag):
    return {'all': [] if flag is None else [{'path': 'story.' + flag, 'op': 'eq', 'value': True}]}


def main():
    requirements = json.loads((OUT/'rakoko_ending_requirements.design.json').read_text(encoding='utf-8'))
    forced = json.loads((OUT/'rakoko_forced_ending.design.json').read_text(encoding='utf-8'))
    events = []
    for i, (title, setup, flag, *branches) in enumerate(ROUTES, 1):
        eid = f'EF-{i:03}'
        choices = []
        for n, (text, requirement, ending, resolution, epilogue) in enumerate(branches, 1):
            result_id = f'END-{(i-1)*2+n:03}'
            linked = requirements['requirementsByEndingId'][result_id]
            full = {'all': cond(requirement)['all'] + linked['all']}
            prerequisites = {'all': [x for x in full['all'] if not x['path'].startswith('stats.')]}
            choices.append(dict(id=f'{eid}-C{n}', text=text, eligibility=full,
                                prerequisites=prerequisites, display='always_when_event_is_present',
                                disabledWhenEligibilityFails=True, experienceIds=linked['experienceIds'],
                                endingId=result_id, endingTitle=ending,
                                resolution=resolution, epilogue=epilogue,
                                nextChapterFocus=result_id.lower()))
        offer = cond(flag)
        offer['all'] += [{'path':'story.endingProject.accepted','op':'eq','value':True},
                         {'path':'story.endingProject.eventId','op':'eq','value':eid}]
        events.append(dict(id=eid, title=title, setup=setup, eligibility=offer,
                           weight=.5 if flag is None else 1, choices=choices,
                           continueChoice=dict(id=f'{eid}-CONTINUE', text='이번에는 결론을 내리지 않고 방송을 계속한다', endingId=None)))
    catalog = dict(version='3.0', status='design_only_not_playable_content',
                   provenance='fictional_game_scenarios', events=events,
                   conditionContract='Offer when event story and at least one choice non-stat prerequisite match; show choices, enable only if all story, experience and bound-game stat conditions match. Missing fields fail.',
                   randomEndingCount=sum(len(e['choices']) for e in events),
                   forcedEndings=[forced], endingCount=sum(len(e['choices']) for e in events)+1)
    (OUT/'rakoko_ending_routes.design.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    lines = ['# 엔딩 사건 16종·결말 32종', '',
             '2026-11-04 · 설계 v3.0. 일반 엔딩 사건 16종·32결말이며 별도의 10년 강제 엔딩을 더하면 총 33결말이다. 모든 시나리오는 독자 창작이며 실제 방송 이력에 합산하지 않는다.', '',
             '각 사건은 두 종결 선택과 한 계속 선택을 가진다. 사건 준비와 적어도 한 선택의 비수치 선행 경험이 맞으면 등장 후보가 된다. 두 종결 선택을 모두 보여주되 수치·경험·준비 조건이 부족한 선택은 비활성화한다. EF-001도 수치와 기획 경험 조건을 확인한다. 횟수 업적은 선택 자격과 무관하다.', '',
             '같은 이름의 성공 표지만 붙이지 않도록 각 결말에는 현재 기획을 어떻게 끝냈는지와 이후 방송이 어떤 모습이 되었는지를 함께 썼다. 아래 마지막 장면·후일담이 출시용 대사와 연출로 구현되어야 플레이 가능한 엔딩이다.', '']
    for e in events:
        lines += [f'## {e["id"]} · {e["title"]}', '', e['setup'], '',
                  '사건 등장 조건: ' + (flag_description(e['eligibility'])) + '.', '',
                  '|선택 ID·선택|추가 조건|도달 엔딩|종결 장면 → 후일담|', '|---|---|---|---|']
        for c in e['choices']:
            lines.append(f'|{c["id"]} · {c["text"]}|{flag_description(c["eligibility"], requirements)}|{c["endingId"]} · **{c["endingTitle"]}**|{c["resolution"]} → {c["epilogue"]}|')
        lines += ['', f'계속 선택: {e["continueChoice"]["text"]}。'.replace('。','.'), '']
    lines += ['## 조건을 만드는 선행 콘텐츠', '',
              'story 아래의 플래그는 기존 조사·일반 사건 데이터에 이미 연결되어 있다는 뜻이 아니다. 각 플래그를 만드는 준비·파일럿·검수·리허설 사건을 추가 제작해야 한다. 날짜 이동, 업적 획득, 엔딩 추첨만으로 플래그를 켜지 않는다.',
              '예를 들어 EF-009는 최종 특집 편성을 확정한 상태에서 화면 오류 사건을 겪었을 때만 준비된다. 오디오 리허설을 완료했다면 END-017, 녹화 대체본을 검수했다면 END-018로 이어지는 선택을 할 수 있다. 둘 다 하지 않았다면 이 엔딩 사건은 후보에서 빠지고 일반 수습으로 돌아간다.',
              '사건 상태는 현재 기획·방송 ID에 묶는다. 다른 기획에서 예전에 리허설했다는 이유로 새 특집의 조건을 충족하지 않는다. 새 장에서는 완료한 기획의 story 상태를 보관하고 현재 기획용 조건은 새 ID로 시작한다. 상세 JSON은 현재 기획 story 스냅샷에 대한 경로로 해석한다.', '']
    lines += ['## 추가 강제 엔딩', '',
              'END-FORCED-10Y · **10년의 방송, 둘의 엔딩**. 엔딩을 한 번도 보지 않은 run이 2036-01-18에 도달하면 즉시 발생한다. 가상의 키몽이 NPC 한 명과 마음을 확인하고 결혼하는 후일담으로 방송일지를 닫는다. 수치·경험·준비 조건과 RNG 없이 적용하며 계속 선택은 없다. 상세는 [엔딩 설계](rakoko_ending_design.md)를 따른다.', '']
    (OUT/'rakoko_ending_routes.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'Authored {len(events)} random events, {catalog["randomEndingCount"]} random-route outcomes, and one forced outcome.')


def flag_description(condition, requirements=None):
    if not condition['all']:
        return '사건 자체의 추가 준비 조건 없음'
    items = []
    for clause in condition['all']:
        path = clause['path']
        if path.startswith('stats.') and requirements:
            key = 'gameSkill' if 'gameSkillById' in path else path.split('.')[1]
            items.append(f"{requirements['statLabels'][key]} ≥ {clause['value']}")
        elif path.startswith('experienceCounts') and requirements:
            key = path.split('.')[-1]
            items.append(f"{key}: {requirements['experienceDefinitions'][key]['label']}")
        else:
            items.append(path + ' = true')
    return '<br>'.join(items)


if __name__ == '__main__':
    main()
