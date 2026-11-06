// 화면에서 쓰는 그림 에셋 경로를 한곳에서 관리한다. 새 에셋이 오면 여기만 고친다.
// 인계 메모: docs/ASSET-DELIVERY.md (v1 38종). v2(의상별 표정 등)는 docs/ASSET-REQUESTS-v2.md.

/** 표정 초상: v1 은 기본 의상 전용. 지금 입은 옷의 초상이 없으면 null(다른 옷 초상으로 대체하지 않음) */
const FACE_SETS = {
  base: expr => `assets/characters/rakoko-face-${expr}.png`,
  // v2 의상별 초상이 오면: ghost: expr => `assets/characters/faces/rakoko-face-ghost-${expr}.png`, …
};
export const FACE_EXPRESSIONS = ['default', 'smile', 'surprised', 'flustered', 'proud'];
export function facePath(state, expr = 'default') {
  const set = FACE_SETS[state.equipped];
  return set && FACE_EXPRESSIONS.includes(expr) ? set(expr) : null;
}

/** 키몽이 채팅 아이콘: 'n번 키몽이' 번호로 기본 + 변형 6종(모자·안경·하트·졸린 얼굴·헤드폰·파티 모자)을 돌려 쓴다 */
export function kimongiAvatar(speaker) {
  const n = Number(String(speaker).match(/\d+/)?.[0]) || 0, v = n % 7;
  return v ? `assets/characters/kimongi-${v}.png` : 'assets/characters/kimongi-base-v1.png';
}

export const STUDIO_BACKGROUND = {day: 'assets/backgrounds/studio-day.png', night: 'assets/backgrounds/studio-night.png'};
export const LOGO = 'assets/brand/logo.png';
export const cornerIcon = corner => ['T', 'G', 'F', 'S'].includes(corner) ? `assets/icons/corner-${corner}.png` : null;
/** 유출 단서(옷의 일부만): 미공개 의상 전신을 대신 노출하지 않는다. 대체 텍스트에 의상 이름을 쓰지 않는다 */
export const leakClue = outfitId => ['maid', 'police', 'ghost', 'nun'].includes(outfitId) ? `assets/events/outfit-leak/${outfitId}.png` : null;
/** 결말 장면: EF 사건 ID 기준(결말 2개가 한 장 공유). 10년 결말은 그림 없음 */
export const endingImage = eventId => /^EF-0(0[1-9]|1[0-6])$/.test(eventId || '') ? `assets/endings/${eventId}.png` : null;
