# 에셋 제작 인계 · 2026-11-05

`ASSET-REQUESTS.md`의 요청 **38종 전부**를 지정 경로에 제작했다. 내장 `image_gen.imagegen`을 사용했으며 외부 API·CLI는 사용하지 않았다. 기존 캐릭터 PNG는 수정하지 않았다. 게임 UI 연결은 이 제작 작업에 포함하지 않는다.

- 전체 미리보기: [asset-gallery.html](asset-gallery.html) — 파일을 직접 열거나 개발 서버의 `/docs/asset-gallery.html`로 확인.
- 한 장 미리보기: [asset-contact-sheet.png](asset-contact-sheet.png)
- 규격·용도·결말 ID·최종 프롬프트: [asset-requests-manifest.json](../assets/asset-requests-manifest.json)
- 실제 픽셀·알파·SHA-256 검사 결과: [asset-validation.json](asset-validation.json)
- 개별 프롬프트 원문: `work/asset-production/*.prompt.txt`

| 종류 | 수량 | 규격 | 경로 |
|---|---:|---|---|
| 라코코 표정 | 5 | 512×512 · 투명 | `assets/characters/rakoko-face-{default,smile,surprised,flustered,proud}.png` |
| 낮·밤 스튜디오 | 2 | 1600×1000 · 불투명 | `assets/backgrounds/studio-{day,night}.png` |
| 유출 단서 | 4 | 640×360 · 투명 | `assets/events/outfit-leak/{maid,police,ghost,nun}.png` |
| 키몽이 변형 | 6 | 128×128 · 투명 | `assets/characters/kimongi-{1..6}.png` |
| 제목 로고 | 1 | 1200×360 · 투명 | `assets/brand/logo.png` |
| 결말 장면 | 16 | 960×540 · 불투명 | `assets/endings/EF-{001..016}.png` |
| 코너 아이콘 | 4 | 96×96 · 투명 | `assets/icons/corner-{T,G,F,S}.png` |

## 연결할 때

- 초상은 `default`를 기본으로, 웃음·놀람·당황·뿌듯을 사건 문맥에 맞춰 선택한다. 성공 여부가 확정되기 전에 성공 표정을 고정하지 않는다. 해금 의상을 바꿔도 이 초상은 기본 의상의 별도 초상이라는 점을 고려한다.
- 스튜디오 배경은 인물이 없는 그림이다. 캐릭터를 별도 레이어로 올린다. 낮·밤은 같은 소품 계열의 서로 다른 구도이며 실제 라코코의 방을 재현한 것이 아니다.
- 단서 4종은 천·프릴·단추의 일부만 그렸다. **미공개 의상 전신 이미지를 대신 노출하지 않는다.** 단서 파일의 내부 ID가 잠긴 옷장 이름으로 표시되지 않도록 한다.
- 키몽이 1~6은 모자·안경·하트·졸린 얼굴·헤드폰·파티 모자 순서다. 다수의 가상 시청자를 표현하는 변형이며 특정 실제 시청자의 외모나 닉네임을 뜻하지 않는다.
- 로고 문구는 `라코코의 방송일지`. 로고 이미지만으로 접근성 제목을 대체하지 말고 텍스트 제목 또는 적절한 대체 텍스트를 유지한다.
- 결말 그림은 **EF 사건 ID** 기준이다. `END-001` → `EF-001`, `END-002` → `EF-001`처럼 두 결말이 한 장을 공유한다. 카탈로그의 `endingEvents[].choices[].endingId`를 이용하고, 전체 대응표는 manifest에 있다. 10년 강제 결혼은 이번 요청의 EF-001~016에 포함되지 않는다.
- 결말 장면은 각 분기에 공통인 기획 소재를 그린 게임 창작 장면이다. 실제 있었던 사건·촬영본·공식 결말 삽화로 설명하지 않는다.
- 표시 시 `image-rendering: pixelated`와 `object-fit: contain`을 사용한다. 작은 아이콘을 불필요하게 크게 확대하지 않는다.
- `scripts/build.mjs`의 에셋 복사 대상에 신규 폴더(`backgrounds`, `brand`, `endings`, `icons`, `events/outfit-leak`)도 포함해야 정적 배포에서 누락되지 않는다. 본 제작 작업에서는 UI·빌드 설정을 변경하지 않았다.

## 제작·검사 재현

```powershell
node scripts/catalog-requested-assets.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-requested-assets.ps1 -InspectOnly
```

첫 명령은 규격표·프롬프트·카탈로그에서 manifest와 HTML 갤러리를 만든다. 두 번째는 38개 PNG를 모두 디코딩해 크기·알파·빈 그림 여부를 확인하고 검사 JSON·한 장 미리보기를 갱신한다. `-InspectOnly`를 빼면 규격이 다른 이미지에 한해 최근접 보간으로 크기를 맞춘다. 투명 전경은 비율을 유지해 캔버스 안에 넣고, 불투명 장면은 캔버스를 채운다. 의미 있는 내용 수정·재채색·합성은 하지 않는다.

공개 배포 조건은 원래 요청서의 「공개 전 조건」을 그대로 따른다. 이번 제작은 그 가이드라인의 확인이나 공개 허가를 의미하지 않는다.
