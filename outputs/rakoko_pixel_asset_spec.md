# 도트 캐릭터 제작 기준

2026-11-04 · 내장 image_gen 사용. 사용자 제공 공식 설정화와 키몽이 사진을 기준으로 제작한 v1 정지 이미지 초안이다. 원 저작물의 권리 상태를 새로 확인했다는 의미는 아니다.

- 라코코: assets/characters/rakoko-base-v1.png
- 키몽이: assets/characters/kimongi-base-v1.png
- 참조 이미지는 assets/references에 보존.
- 두 파일은 도트풍 고해상도 PNG 초안이다. 정규 64×96/48×48 픽셀 격자, 동일 셀 크기의 애니메이션 스프라이트 시트로 검증된 결과는 아니다. 게임 내 크기·팔레트·표정·애니메이션 제작은 후속 작업이다.
- 신의상은 라코코의 외형 정체성을 유지하는 별도 의상 버전으로 관리한다. 실제 신의상 공개 사건과 게임용 창작 의상을 구분하며, 다른 작품의 고유 의상을 그대로 복제하지 않는다. 신의상 이벤트를 확정한 뒤 해당 의상 에셋을 연결한다.
- 사용자가 두 참조를 제작 기준으로 지정했으므로 이 범위의 제작을 진행한다. 사용자가 별도 권리 증빙을 제공한 것으로 기록하지 않는다.

## 생성 프롬프트

### 라코코

Use case: style-transfer. Create a transparent-background pixel-art game character asset based on the supplied official RAKOKO turnaround reference. One single full-body front-facing idle sprite only, centered, no sheet, no text, no border, no props or background. Faithfully preserve navy-black hair, straight bangs, the white hair streak on viewer right, long high side ponytail on viewer right, gold hair accessory, viewer-left blue eye and viewer-right red eye. Preserve official outfit: white sleeveless high-neck blouse, dark navy tie, black high-waisted shorts and belt details, black open jacket draped on shoulders, black gloves, asymmetric thigh straps and stockings, black platform shoes. Cute compact 3-head-tall game proportions, recognizable adult character, restrained 32-color palette, crisp deliberately placed square pixel clusters and hard stepped outlines, no smooth vector edges, no blur, no painterly shading. Aim for the visual detail of a 64x96 sprite enlarged by integer nearest-neighbor scale; sprite takes most of canvas with clear transparent margin. Keep anatomy and clothing readable. No occult symbols, magic effects, text, watermark, or copied frame ornaments.

### 키몽이

Use case: style-transfer. Create one single transparent-background pixel-art game mascot sprite faithfully based on the attached second reference image (Kimongi), not the dangling object cropped at upper right. Full body centered, front three-quarter standing pose, cute compact proportions. Preserve round stitched patchwork head and body with muted moss-green on viewer left and coral pink on viewer right, stitched seams, triangular ears, dark mischievous eyes, tiny smiling fang mouth, thick charcoal scarf knotted in front, short limbs, and thin curved tail ending in the dark spade/heart-shaped tip on viewer right. No costume additions. Match clean retro game pixel art: crisp square pixel clusters, stepped dark outlines, limited palette, flat 2-3-tone shading, visual detail of a roughly 48x48 sprite enlarged with nearest-neighbor. No blur, no glow, no paper texture, no illustration background, no lettering, no grid, no sprite sheet. Keep reference silhouette and colors recognizable. Actual transparent alpha background and clear margin.
