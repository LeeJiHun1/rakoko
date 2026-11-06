# 추가 에셋 제작 인계 v2 · 2026-11-06

요청 원문은 [ASSET-REQUESTS-v2.md](ASSET-REQUESTS-v2.md)다. 사용자가 부른 “ASSET-REQUESTS2.md”에 해당하는 저장소 파일이다. 요청 **99개 = PNG 91개 + OGG 8개 제작·검수 완료**. 실제 규격·해시는 검사 JSON에 기록했다.

- [전체 그림·음원 미리보기](asset-gallery-v2.html)
- [파일 규격·의상/표정·게임/콘텐츠 ID·프롬프트](../assets/asset-requests-v2-manifest.json)
- [PNG 검사](asset-validation-v2.json) · [음원 디코딩·길이·음량·반복 경계 검사](audio-validation-v2.json)
- 한 장 미리보기: [초상](asset-v2-faces.png) · [장면](asset-v2-scenes.png) · [UI·아이템·게임](asset-v2-ui.png) · [브랜드](asset-v2-brand.png)

| 종류 | 수량 | 경로 |
|---|---:|---|
| 의상 5종 × 표정 5종 | 25 | assets/characters/faces/rakoko-face-{base,ghost,maid,police,nun}-{default,smile,flustered,surprised,proud}.png |
| 사건 분류 | 8 | assets/scenes/scene-{tech,game,fan,flow,collab,project,promise,celebration}.png |
| 등급 | 4 | assets/ui/grade-{S,A,B,C}.png |
| 응원 | 3 | assets/ui/donation-{small,medium,jackpot}.png |
| 미공개 의상·의상 제안 | 2 | assets/events/outfit-locked.png · outfit-offer.png |
| 구매 아이템 | 8 | assets/items/item-{game,gear,storage,design,props,venue,editing,event}.png |
| 장기 콘텐츠 | 8 | assets/modules/module-{1..8}.png |
| 게임 아이콘 | 15 | assets/games/game-{게임 id}.png |
| 업적·미션 | 9 | assets/ui/badge-{broadcast,great,viewers,donation,outfit,project,ending,mission}.png · mission-stamp.png |
| 생일·주년 | 2 | assets/events/celebration-{birthday,anniversary}.png |
| 공개 실패 해프닝 | 1 | assets/events/reveal-fail.png |
| 10년 결말 단체사진 | 1 | assets/endings/forced-10y.png |
| 키 비주얼 | 1 | assets/brand/key-visual.png |
| 앱 아이콘·공유 이미지 | 4 | assets/brand/icon-{32,180,512}.png · og-image.png |
| 준비·방송 BGM | 2 | assets/audio/bgm-{prep,live}.ogg |
| 효과음 | 6 | assets/audio/sfx-{click,great,miss,donation,curtain,badge}.ogg |

새 그림 84종은 내장 image_gen.imagegen으로 제작했다. 기본 의상 초상 5종은 v1 PNG를 새 경로로 복사했다. 앱 아이콘 32·180은 공통 512 원본의 크기 변환이다. v1 원본과 사용자 참조 원본은 덮어쓰지 않았다. 개별 프롬프트는 work/asset-production-v2/*.prompt.txt에도 있다.

## 연결 메모

- 이번 작업은 에셋 제작·배치다. UI·엔진·밸런스·저장 형식과 빌드 복사 목록은 바꾸지 않았다. 음원 미리보기를 위해 개발 서버 MIME에 OGG/MP3/WAV 형식만 추가했다.
- 초상은 현재 옷 ID + 표정 ID로 선택한다. 현재 옷의 초상을 읽지 못하면 초상 자리를 비우고 다른 의상 초상으로 대체하지 않는다.
- 미공개 의상은 천으로 완전히 덮인 공통 마네킹을 쓴다. 잠긴 옷장 이름은 계속 ???이며 미공개 초상을 표시하지 않는다.
- 의상 제안은 스케치북과 천 조각, 공개 실패는 풀린 리본과 굴러가는 단추를 그렸다. 신체 노출·옷 파손 연출이 아니다.
- 사건·모듈 그림은 카드에 얹는 투명 비네트다. 체크무늬는 미리보기 배경이며 PNG에 포함되지 않는다.
- 등급 도장은 S/A/B/C 문자와 함께 쓰되 실제 등급 텍스트와 대체 텍스트를 유지한다.
- 모듈 번호는 1=LC-MC, 2=LC-RP, 3=LC-SV, 4=LC-RD, 5=LC-PT, 6=LC-ST, 7=LC-CO, 8=LC-VR 순서다. 게임 아이콘은 카탈로그의 15개 게임 ID와 1:1 대응한다.
- 블록 마을·도시 역할극·협동 식당 등은 장르를 표현한 창작 소품이다. 상용 게임의 로고·텍스처·캐릭터나 실제 플랫폼 로고를 넣지 않았다.
- 키 비주얼은 왼쪽에 별도 제목을 얹을 여백을 둔다. OG 이미지에는 게임 제목을 포함한다. 앱 아이콘 3크기는 같은 디자인이다.
- 10년 결말은 기본 의상의 라코코와 가상의 키몽이 한 명, 많은 키몽이가 모인 게임 창작 단체사진이다. 실제 시청자 얼굴·닉네임·실제 관계를 표현하지 않는다.
- 신규 폴더를 정적 빌드 복사 목록에 추가해야 배포 파일에서 누락되지 않는다.

## 음원

외부 음악·샘플·녹음·목소리를 사용하지 않았다. 직접 구성한 코드·멜로디와 수학적 발진기·시드 잡음으로 합성했다. 소스는 [synthesize-requested-audio.py](../scripts/synthesize-requested-audio.py)다. 별도 유료 API는 쓰지 않는다.

- 준비: 80 BPM · 32마디 · 96초 · 건반·패드·베이스.
- 방송: 100 BPM · 40마디 · 96초 · 플럭·베이스·가벼운 리듬.
- 선택/대성공/아쉬움/응원/커튼/업적 효과음: 0.09/0.95/0.55/0.8/1.2/1.1초.
- Ogg Vorbis · 44,100Hz · 스테레오. 디코딩 후 길이·클리핑·빈 음원을 검사했다. BGM 꼬리는 시작 부분으로 순환 합성해 96초 전체를 반복하도록 만들었다.
- 사용자가 소리 설정을 켠 경우에만 재생한다. 설정을 끄면 멈추도록 연결한다. BGM 전환에는 짧은 페이드를 권장한다. 갤러리는 자동 재생하지 않는다.

개발용 재생성(게임 실행에는 Python 의존성 불필요):

~~~powershell
python -m pip install -r work/asset-production-v2/audio-requirements.txt
python scripts/synthesize-requested-audio.py
~~~

## 규격 검사·미리보기 갱신

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-requested-assets-v2.ps1 -InspectOnly
node scripts/gallery-requested-assets-v2.mjs
node scripts/check-requested-assets-v2.mjs
~~~

InspectOnly를 빼면 규격이 다른 제작 PNG만 최근접 보간으로 크기를 맞춘다. 투명 전경은 비율을 유지해 넣고 배경 3종은 캔버스를 채운다. 의미 있는 재채색·합성·그림 변경은 하지 않는다. 보고서에는 실제 크기·투명 픽셀·가시 영역·SHA-256을 남긴다.

catalog-requested-assets-v2.mjs는 목록과 프롬프트를 다시 만들며 기본 초상을 복사하므로 의도적으로 교체한 기본 초상이 있다면 먼저 변경 내용을 확인한다.

## 사용자 확인

2026-11-06 사용자가 **“2차 창작 허용이다 그것도 문서에 추가해놔라”**라고 직접 확인했다. 요청서에도 기록했고 B6 단체사진을 포함해 제작한다. 이는 사용자에게 확인받은 사실의 기록이며 공식 가이드라인 원문을 별도로 검증했다는 뜻은 아니다. 자동 공개·push·배포는 수행하지 않는다.
