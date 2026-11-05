# 구조 안내 (ARCHITECTURE)

> 「라코코의 방송일지」 코드 구조와 확장 방법. 진행 상황·결정 기록은 `docs/WORKLOG.md`, 기획 검토는 `docs/DESIGN-REVIEW.md`.

## 한눈에 보기

```
index.html ─ src/app.js ─ src/ui/boot.js
                              │
   클릭/입력 ─▶ ui/actions.js ─▶ ui/commands.js ──▶ src/engine.js (공개 façade)
                                   │  runCommand        │
                                   │                    ▼
                                   │           engine/dispatch.js ─ commands.js(등록표)
                                   │                    │  복제본에 명령 적용
                                   │                    ▼
                                   │           engine/<도메인>.js · engine/events/*
                                   ▼
                          src/storage.js (IndexedDB 저장 성공 후에만)
                                   ▼
                          ui/render.js ─ ui/views/*  (화면 전체 다시 그리기)
```

- **엔진(`src/engine/*`)**: 순수 상태 전이. DOM·저장소·`Math.random` 을 쓰지 않는다. 게임 난수는 저장되는 시드 `random(s)` 만.
- **UI(`src/ui/*`)**: 엔진 결과를 HTML 문자열로 그린다. 상태는 `runCommand` → `dispatch` 로만 바꾼다.
- **외부 패키지 없음**: 번들러 없이 브라우저 ES 모듈로 바로 읽는다. import 경로는 상대경로 + `.js` 확장자.
- **외부(UI·테스트·스크립트)는 `src/engine.js` 에서만 import** 한다. 내부 파일을 직접 import 하지 않는다.

## 엔진 모듈

| 파일 | 책임 |
|---|---|
| `engine/constants.js` | 날짜·수치 상수 (밸런스 조정 시작점) |
| `engine/state.js` | `newGame`·`skill`·`SCHEMA_VERSION` — **키 순서 유지**(골든 해시) |
| `engine/dispatch.js` | 명령 단일 입구: 중복 commandId 무시, 복제본에 적용, 실패 시 원본 그대로 |
| `engine/commands.js` | 도메인별 명령 표 합치기 (`{prepOnly?, run(s, command, catalog)}`) |
| `engine/broadcast.js` | 편성·게임·방송 시작(예약·수입 스냅샷)·선택·코너 진행·정산·날짜 명령 |
| `engine/choices.js` | 선택 반영 — 사건 종류별 효과 표 `KIND_EFFECTS` + 공통 성장 |
| `engine/events/next.js` | 다음 사건 우선순위 (예약 → 기획 → 장기 콘텐츠 → 약속 → 유출 → 일반) |
| `engine/events/general.js` | 일반 사건 추첨 (출처 비중·게임 가중치), 반복 시 회상 문구 |
| `engine/events/eligibility.js` | 일반 사건 등장 조건 + 상태 의존 조건 표 `EVENT_GATES` |
| `engine/events/scripted.js` | 기획 단계·기념일·의상 공개·유출·마지막 특집·약속 사건 |
| `engine/events/module-events.js` | 장기 콘텐츠 사건·대회 경기 |
| `engine/events/factory.js` | `event()`·`choice()` 객체 생성 |
| `engine/preparation.js` | 준비 행동 (자료·연습·점검·의상) |
| `engine/outfit.js` | 신의상: 제안 이벤트(막간)→시작(첫 준비비)→준비→공개 예약→공개(해금만, 자동 환복 없음)·조기 공개 후속, 유출은 의상당 1회 |
| `project.js` · `module.js` · `economy.js` · `ending.js` · `calendar.js` | 도메인 규칙 + 해당 명령 |
| `engine/growth.js` | 능력 성장(방송당 상한)·경험 기록 |
| `engine/requirements.js` | 카탈로그 조건식 `{path, op, value}` 평가와 잠금 사유 문구 |
| `engine/reactions.js` | 결과 화면 키몽이 채팅 3줄 |
| `engine/save.js` | 저장본 변환(`migrateSave`/`MIGRATIONS`)·검증(`validateSave`)·`loadSave` |

## UI 모듈

| 파일 | 책임 |
|---|---|
| `ui/boot.js` | 카탈로그·저장본 로드, 직전 저장 복구, 부팅 실패 화면 |
| `ui/store.js` | UI 공유 상태(`catalog·state·view·busy·stale·saveError`) + 조회 도우미 |
| `ui/commands.js` | `runCommand`(dispatch → 저장 → 화면 교체), `replaceState`(새 일지·가져오기) |
| `ui/actions.js` | 버튼·입력 처리표 `UI_ACTIONS` · 그 밖의 `data-action` 은 같은 이름의 엔진 명령 |
| `ui/render.js` | 전체 다시 그리기 + 열린 접힘 패널·포커스 유지, 탭/단계별 화면 표 |
| `ui/views/*` | 화면별 HTML (layout·prep·event·result·wrap·ending·wardrobe·projects·journal·project-mini) |
| `ui/dialogs.js` · `ui/modal.js` | 대화상자 내용 · 공용 `<dialog>` |
| `ui/dom.js` | `escape`·`btn`·`tag`·`money`·`compact` |
| `ui/preferences.js` · `feedback.js` · `sync.js` · `save-files.js` | 편의 설정 · 토스트/효과음 · 탭 동기화 · 일지 파일 입출력 |

## 스타일

`src/style.css` 는 `@import` 순서표만 둔다(**순서 = 우선순위**). 영역별 규칙은 `src/styles/01-base … 11-simple-flow.css`.

## 이런 걸 추가하려면

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 새 명령(플레이어 행동) | 해당 도메인 파일의 `commands` 에 `{prepOnly, run}` 추가 → 버튼은 `btn('문구','명령이름', …)`. UI 전용 동작이면 `ui/actions.js` 의 `UI_ACTIONS` |
| 새 사건 종류(kind) | `events/scripted.js` 에 생성 함수 → `events/next.js` 우선순위에 연결 → 선택 효과는 `choices.js` `KIND_EFFECTS` → 화면 태그는 `ui/views/event.js` |
| 일반 사건의 상태 조건 | `events/eligibility.js` `EVENT_GATES` 에 한 줄 (ID 는 `npm run check` 가 카탈로그와 대조) |
| 수치 조정 | `engine/constants.js` 또는 `catalog.json` `economy` (골든 갱신 필요) |
| 새 화면/탭 | `ui/views/<이름>.js` → `ui/render.js` `TAB_SCREENS` → `ui/views/layout.js` `TABS` |
| 상태에 새 필드 | `state.js` `newGame` **끝에** 추가 → `SCHEMA_VERSION` 올리고 `save.js` `MIGRATIONS` 에 변환 + 테스트 → 화면에 그리면 `validateSave` 형식 검사 추가 |
| 화면에 저장본 값 표시 | 반드시 `escape()` (공유받은 일지 파일은 신뢰할 수 없는 입력) |

## 테스트·검사

| 명령 | 내용 |
|---|---|
| `npm test` | `tests/engine.test.mjs`(규칙·32결말 실제 도달 경로) + `tests/golden.test.mjs`(8시드×160방송 상태 해시) |
| `npm run check` | 카탈로그 무결성, 이미지·폰트 경로, 전체 JS 문법, 코드 속 콘텐츠 ID 대조 |
| `npm run build` | `dist/` 정적 산출물 |
| `tests/ui/scenario.js` | (선택) Playwright 로 변경 전후 화면 HTML 해시 비교 — 방법은 파일 머리 주석 |

**골든 정책**: 리팩터링은 골든이 그대로 통과해야 한다. 규칙을 의도적으로 바꿨으면 `UPDATE_GOLDEN=1 npm test` 로 갱신하고 커밋 메시지에 이유를 적는다.
골든 해시는 상태 JSON 문자열을 비교하므로 **객체 키 순서·`random(s)` 호출 순서·오류 문구**도 동작의 일부로 취급된다.
