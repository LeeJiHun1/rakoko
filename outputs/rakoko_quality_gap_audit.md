# 게임 완성도 정적 점검

2026-11-05 · 실행 게임 테스트와 구분

## 확인된 우선 빈칸

- 일반 결말 32개: EX32종 중 생산 사건 연결 대기26종, 설계 연결/엔진 대기6종. 모든 결말의 실제 도달 증명은 미확인.
- 일반 사건105참조/선택312개의 추가 성장 효과가 미배정이다. 기존 기본 성장이나 원문 선택의 다른 효과까지 없다는 뜻은 아니다.
- 변주 목표가 있는 참조 55개는 각1개를 보유하고 각3개를 목표로 한다. 추가 110개 분량의 변주가 필요하다. 이 참조 수를 독립 실화 수로 세지 않는다.
- 장기8모듈/64사건, 유료16사건이 있어도 납품·경험·일지·엔딩을 잇는 실제 동작은 별도 검증해야 한다.
- 루트 package.json/src 없음. 현재 조사는 실행 엔진·성능·접근성 통과를 뜻하지 않는다.

## 새로 확인한 정본 중복

강제 엔딩은 독립 JSON과 엔딩 경로 JSON 안의 복사본에 함께 존재한다. 핵심 10년 날짜·확률은 현재 일치하지만 아래 필드는 다르다. 어느 쪽을 읽느냐에 따라 부가 정보가 누락될 수 있어 구현 전에 정본을 정해야 한다.

`partner.poolRepresentsEntireAudience, partner.populationContext, version`

권장: 독립 강제 엔딩을 정본 후보로 삼고 경로 목록은 ID로 참조하거나 생성 단계에서 일치를 검사한다. 이 감사에서는 기존 게임 규칙 파일을 수정하지 않았다.

## 32결말의 경험 연결 현황

아래 연결이 있어도 수치·현재 기획·실제 결과 가드를 함께 만족해야 한다. 엔진에서 끝까지 실행한 경로 증명은 모두 대기다.

|결말|요구 경험|생산자 상태|연결된 원 선택|
|---|---|---|---|
|END-001 · 그 시간이면 켜지는 방송|EX-001|needs_content_binding|미연결|
|END-002 · 편성표 밖의 라코코|EX-002|needs_content_binding|미연결|
|END-003 · 마지막 보스 뒤의 첫 페이지|EX-003|design_binding_engine_pending|LC-RD-07-C1|
|END-004 · 공략을 들려주는 사람|EX-004|design_binding_engine_pending|LC-RD-05-C1|
|END-005 · 기록보다 남은 것|EX-005|needs_content_binding|미연결|
|END-006 · 클리어하지 못한 공략집|EX-006|needs_content_binding|미연결|
|END-007 · 키몽이 편성국|EX-007|needs_content_binding|미연결|
|END-008 · 오늘 하루의 키몽제|EX-008|needs_content_binding|미연결|
|END-009 · 송출 화면 밖으로|EX-009|needs_content_binding|미연결|
|END-010 · 첫 화 끝, 다음 화 예고|EX-010|needs_content_binding|미연결|
|END-011 · 이름을 건 첫 무대|EX-011|needs_content_binding|미연결|
|END-012 · 혼자 켰던 방송, 함께 오른 무대|EX-012|needs_content_binding|미연결|
|END-013 · 모두의 마이크를 켜는 사람|EX-013|needs_content_binding|미연결|
|END-014 · 우리 팀 마지막 라운드|EX-014|needs_content_binding|미연결|
|END-015 · 옷장에서 시작된 이야기|EX-015|needs_content_binding|미연결|
|END-016 · 한 벌에서 열린 전시회|EX-016|design_binding_engine_pending|LC-VR-07-C1, LC-VR-07-C2, LC-VR-07-C3|
|END-017 · 화면이 꺼져도 들리는 방송|EX-017|needs_content_binding|미연결|
|END-018 · 생방송 대신 첫 상영회|EX-018|needs_content_binding|미연결|
|END-019 · 그때 적어 둔 다음에|EX-019|needs_content_binding|미연결|
|END-020 · 작은 방송 박물관|EX-020|needs_content_binding|미연결|
|END-021 · 매년 다시 부를 한 곡|EX-021|needs_content_binding|미연결|
|END-022 · 우리가 쓴 생일 한 권|EX-022|needs_content_binding|미연결|
|END-023 · 채팅창에서 같은 자리로|EX-023|needs_content_binding|미연결|
|END-024 · 키몽이 운동회 첫 회|EX-024|design_binding_engine_pending|LC-MC-07-C1, LC-MC-07-C2, LC-MC-07-C3|
|END-025 · 실수로 태어난 대표 코너|EX-025|needs_content_binding|미연결|
|END-026 · 농담 하나의 플레이 버튼|EX-026|needs_content_binding|미연결|
|END-027 · 더 큰 편성표의 한 칸|EX-027|design_binding_engine_pending|LC-PT-08-C1, LC-PT-08-C2, LC-ST-08-C1, LC-ST-08-C2|
|END-028 · 오늘은 우리 방송 하는 날|EX-028|design_binding_engine_pending|LC-CO-08-C1, LC-CO-08-C2, LC-CO-08-C3|
|END-029 · 작아도 완성된 오늘|EX-029|needs_content_binding|미연결|
|END-030 · 끝이 아니라 정규 편성|EX-030|needs_content_binding|미연결|
|END-031 · 우리가 방송을 만든 시간|EX-031|needs_content_binding|미연결|
|END-032 · 방송일지의 움직이는 마지막 장|EX-032|needs_content_binding|미연결|

## 화면용 이미지 실측

현재 선택한 게임 표시 PNG 8개의 합계는 10.13MiB다. 전부 RGBA로 디코딩한다고 가정하면 약 48.0MiB이며 실제 메모리 측정은 아니다. 초기 화면에서 전부 미리 읽을 필요는 없다.

|파일|크기|파일 용량(MiB)|
|---|---|---:|
|assets/characters/kimongi-base-v1.png|1293×1217|0.64|
|assets/characters/rakoko-base-v1.png|1024×1536|1.14|
|assets/events/outfit-journal/stage-closed-v1.png|1672×941|1.54|
|assets/events/outfit-journal/stage-open-v1.png|1672×941|1.70|
|assets/events/outfit-reveals/rakoko-ghost-v1.png|1024×1536|1.27|
|assets/events/outfit-reveals/rakoko-maid-v1.png|1024×1536|1.25|
|assets/events/outfit-reveals/rakoko-nun-v1.png|1024×1536|1.45|
|assets/events/outfit-reveals/rakoko-police-v1.png|1024×1536|1.14|

캐릭터는 저해상도 격자가 정규화된 스프라이트 시트가 아니다. 원본을 보존한 제작용 파일을 따로 만들고 실제 표시 크기에서 눈·머리·의상 구분과 알파 가장자리를 확인해야 한다. `image-rendering` 설정만으로 원본 그림을 저해상도 도트로 교정했다고 표시하지 않는다.

## 재현

`python work/rakoko/review_game_quality.py`

검사: 결말/경험 ID 대응, 6생산자의 장기 선택 ID, 일반 선택/변주 수, 이미지 크기·해시, 강제 엔딩 중복 차이. [상세 JSON](rakoko_quality_gap_audit.json)에 결말별 조건과 출처 파일 경로를 보관한다. 실행 게임의 도달성·밸런스는 통과 처리하지 않는다.
