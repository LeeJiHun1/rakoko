# 작업 일지 (이어받기용)

> 작업할 때마다 이 파일을 갱신한다. 새로 이어받는 사람은 **「지금 상태」→「다음 할 일」** 순서로 읽고 시작한다.
> 커밋 단위와 이 문서의 체크 항목을 1:1로 맞춘다.

## 지금 상태 (마지막 갱신: 2026-11-05)

- 브랜치: `refactor/modular-structure` (기준선 `main` = `1668cdb`)
- 진행 중: **4단계 — CSS 분리**. 엔진(2)·UI(3) 분리 완료 — 골든 8시드·UI 76단계 HTML 해시 모두 일치
- 기획 검토: `docs/DESIGN-REVIEW.md` 작성 완료 → **사용자 결정 6건 대기** (아래 「결정 대기」)
- 검증 명령: `npm test` (엔진 56건 + 골든 8시드) · `npm run check` · `npm run build`

## 전체 계획

| 단계 | 내용 | 상태 | 커밋 |
|---|---|---|---|
| 0 | 기준선 커밋, 방송 캡처(`assets/references/`, `outputs/*.jpg`) git 제외 | 완료 | `1668cdb` |
| 1 | 골든(동작 고정) 테스트 — 리팩터링 전후 상태 해시 비교 | 완료 | `39254d9` |
| 2 | 엔진 분리: `src/engine.js`(공개 façade) + `src/engine/*` 도메인 모듈 | 완료 | `5a2ff5f` |
| 3 | UI 분리: `src/ui/*` (상태 저장소·액션·화면별 view) | 완료 | (이 커밋) |
| 3b | 기획 검토 문서 `docs/DESIGN-REVIEW.md` (도파민 개선안 + 결정 질문) | 완료 | 다음 커밋 |
| 4 | CSS 분리: `src/styles/*` 영역별 파일 | 진행 중 | |
| 5 | 검토 수정 ① 가져온 일지 HTML 주입 차단 (escape + 저장 검증 강화) | 대기 | |
| 6 | 검토 수정 ② 부팅 실패 탈출구 + 저장 마이그레이션 자리 | 대기 | |
| 7 | 검토 수정 ③ 다시 그릴 때 접힘 패널(`<details>`) 열림 유지 | 대기 | |
| 8 | 검토 수정 ④ 반복 사건에서 원래 상황 본문 유지 | 대기 | |
| 9 | 검토 수정 ⑤ 사건 조건 ID를 정적 검사에 포함 | 대기 | |
| 10 | 문서: `docs/ARCHITECTURE.md`, AGENTS.md 경로 정정(없는 `docs/IMPLEMENTATION.md`) | 대기 | |
| 11 | 브라우저 실행 확인(Playwright) | 대기 | |

## 결정 사항

- **push 하지 않는다.** 원격 `origin = github.com/LeeJiHun1/rakoko` 은 있지만 공개 범위 확인 전이라 로컬 커밋만 한다.
- **리팩터링 단계(2~4)는 동작을 바꾸지 않는다.** 골든 테스트가 상태 JSON 해시를 비교하므로
  - 객체 생성 시 **키 순서**를 기존과 같게 유지한다 (예: `newGame`, `s.result` 의 `changes → chatContext → reactions`).
  - `random(s)` **호출 순서**를 바꾸지 않는다.
  - 오류 문구를 바꾸지 않는다 (거부 명령 문구도 해시에 포함).
- 의도적인 규칙 변경(5단계 이후)은 `UPDATE_GOLDEN=1 npm test` 로 기준을 갱신하고, 커밋 메시지에 이유를 적는다.
- 외부 패키지 없이 브라우저 ES 모듈로 바로 읽는다(번들러 없음) → 모듈 경로는 상대경로 + `.js` 확장자 필수.
- 밸런스(첫 결말까지 약 52회 방송)는 기획 판단 영역이라 손대지 않고 아래 「남은 과제」에만 적는다.

## 다음 할 일

1. 4단계 CSS 분리 (`src/style.css` 20줄 압축 → `src/styles/*`, 폰트 상대경로 주의)
2. 5~9단계 검토 수정 (각각 커밋, 동작 변경 시 golden 갱신 사유 기록)
3. 사용자 결정 6건 받은 뒤 `docs/DESIGN-REVIEW.md` §5 「결정 후」 묶음 착수

## UI 회귀 비교 방법 (3단계에서 사용)

- 변경 전 버전을 `git archive <커밋> index.html src assets/characters assets/events assets/fonts | tar -x -C <임시폴더>` 로 꺼내 `PORT=5391 node scripts/serve.mjs <임시폴더>`, 현재 버전은 `PORT=5392 npm run dev`.
- `tests/ui/scenario.js` 함수를 Playwright 로 두 페이지에서 실행 → 반환된 단계별 해시를 diff. 리팩터링이면 완전 일치해야 한다.
- 3단계 결과: 76단계 일치, pageerror 0.

## UI 모듈 지도 (3단계 결과)

| 파일 | 책임 |
|---|---|
| `src/app.js` | 진입점 (`boot()` 호출만) |
| `ui/boot.js` | 카탈로그·저장본 로드, 복구, 이벤트 설치 |
| `ui/store.js` | UI 공유 상태(`catalog·state·view·busy·stale·saveError`) + 조회 도우미 |
| `ui/commands.js` | `runCommand` (dispatch → 저장 → 화면 교체), `replaceState` |
| `ui/actions.js` | 버튼·입력 처리표 (`UI_ACTIONS`, 엔진 명령 기본 처리, 토스트 표) |
| `ui/render.js` | 전체 다시 그리기, 탭/단계별 화면 선택표 |
| `ui/views/*` | 화면별 HTML: layout·prep·event·result·wrap·ending·wardrobe·projects·journal·project-mini |
| `ui/dialogs.js` · `modal.js` | 대화상자 내용 · 공용 dialog |
| `ui/dom.js` | `escape`·`btn`·`money` 등 HTML 도우미 |
| `ui/preferences.js` · `feedback.js` · `sync.js` · `save-files.js` | 편의 설정 · 토스트/효과음 · 탭 동기화 · 일지 파일 입출력 |

## 엔진 모듈 지도 (2단계 결과)

| 파일 | 책임 |
|---|---|
| `src/engine.js` | 공개 façade — 외부는 여기서만 import |
| `engine/constants.js` | 날짜·수치 상수 (밸런스 조정 시작점) |
| `engine/state.js` | `newGame`·`skill`·`SCHEMA_VERSION` |
| `engine/dispatch.js` · `commands.js` | 명령 단일 입구 · 도메인별 명령 등록표 합치기 |
| `engine/broadcast.js` | 편성·시작·코너 진행·정산·날짜 명령 |
| `engine/choices.js` | 선택 반영 (사건 종류별 효과 표 `KIND_EFFECTS`) |
| `engine/events/*` | 사건 생성: `next.js`(우선순위) · `general.js`(추첨) · `eligibility.js`(등장 조건 표 `EVENT_GATES`) · `scripted.js` · `module-events.js` · `factory.js` |
| `engine/preparation.js` · `outfit.js` · `project.js` · `module.js` · `economy.js` · `ending.js` · `calendar.js` | 도메인별 규칙 + 해당 명령 |
| `engine/growth.js` · `requirements.js` · `reactions.js` | 성장 상한·경험 / 조건식 평가 / 채팅 반응 |
| `engine/save.js` | 저장본 검증 |

## 결정 대기 (사용자)

`docs/DESIGN-REVIEW.md` §4 참고. Q1 실패 수위 · Q2 확률 표시 · Q3 첫 결말까지 길이 · Q4 시청자·후원 수치 · Q5 돈의 쓸모 · Q6 연출 범위.
답을 받으면 이 절에 결과를 적고 §5 「결정 후」 묶음으로 진행한다.

## 남은 과제 (이번 작업 범위 밖)

- 밸런스: 기본 버튼 "7일 뒤"만 쓰면 1주년(첫 결말 가능)까지 약 52회 방송. 의도 확인 필요.
- 공개 전: 라코코 측 2차 창작 가이드라인(AI 생성 이미지·팬게임 배포·강제 결혼 결말) 확인 후에만 공개.
- 결말 32종 중 추천 3종만 노출 → 수집 힌트 UI 검토.

## 이력

- 2026-11-05: 3단계 완료 — UI 76단계 HTML 해시 일치. 사용자 요청으로 기획 검토(`docs/DESIGN-REVIEW.md`) 병행 작성.
- 2026-11-05: 2단계 완료 — 골든 8시드 해시 일치, 변이 시험(수입 보너스 조건 변경)으로 골든이 규칙 변화를 잡는 것 확인.
- 2026-11-05: 0·1단계 완료, 2단계 착수. 작업 일지 신설(사용자 요청: 이어받을 수 있게 문서에 명시하며 진행).
