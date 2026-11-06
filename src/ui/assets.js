// 화면에서 쓰는 그림·소리 에셋 경로를 한곳에서 관리한다. 새 에셋이 오면 여기만 고친다.
// 인계 메모: docs/ASSET-DELIVERY.md (v1 38종) · docs/ASSET-DELIVERY-v2.md (v2 99개).
// 이 파일은 DOM 을 쓰지 않는다 — scripts/check.mjs 가 import 해서 경로가 실제로 있는지 검사한다.

/** 표정 초상: 의상 5종 × 표정 5종. 지금 입은 옷의 초상이 없으면 null(다른 옷 초상으로 대체하지 않음) */
const FACE_OUTFITS = ['base', 'ghost', 'maid', 'police', 'nun'];
export const FACE_EXPRESSIONS = ['default', 'smile', 'surprised', 'flustered', 'proud'];
const facePathOf = (outfit, expr) => `assets/characters/faces/rakoko-face-${outfit}-${expr}.png`;
export function facePath(state, expr = 'default') {
  return FACE_OUTFITS.includes(state.equipped) && FACE_EXPRESSIONS.includes(expr) ? facePathOf(state.equipped, expr) : null;
}

/** 키몽이 채팅 아이콘: 'n번 키몽이' 번호로 기본 + 변형 6종(모자·안경·하트·졸린 얼굴·헤드폰·파티 모자)을 돌려 쓴다 */
export function kimongiAvatar(speaker) {
  const n = Number(String(speaker).match(/\d+/)?.[0]) || 0, v = n % 7;
  return v ? `assets/characters/kimongi-${v}.png` : 'assets/characters/kimongi-base-v1.png';
}

export const STUDIO_BACKGROUND = {day: 'assets/backgrounds/studio-day.png', night: 'assets/backgrounds/studio-night.png'};
export const LOGO = 'assets/brand/logo.png';
export const KEY_VISUAL = 'assets/brand/key-visual.png';
export const cornerIcon = corner => ['T', 'G', 'F', 'S'].includes(corner) ? `assets/icons/corner-${corner}.png` : null;
/** 유출 단서(옷의 일부만): 미공개 의상 전신을 대신 노출하지 않는다. 대체 텍스트에 의상 이름을 쓰지 않는다 */
export const leakClue = outfitId => ['maid', 'police', 'ghost', 'nun'].includes(outfitId) ? `assets/events/outfit-leak/${outfitId}.png` : null;
/** 결말 장면: EF 사건 ID 기준(결말 2개가 한 장 공유) */
export const endingImage = eventId => /^EF-0(0[1-9]|1[0-6])$/.test(eventId || '') ? `assets/endings/${eventId}.png` : null;
export const FORCED_ENDING_IMAGE = 'assets/endings/forced-10y.png';
/** 미공개 의상: 천으로 덮인 공통 마네킹(어떤 옷인지 드러나지 않음) */
export const OUTFIT_LOCKED = 'assets/events/outfit-locked.png';
export const REVEAL_FAIL = 'assets/events/reveal-fail.png';

/** 방송 등급 도장 · 응원 연출 */
export const gradeStamp = grade => ['S', 'A', 'B', 'C'].includes(grade) ? `assets/ui/grade-${grade}.png` : null;
export const donationArt = tier => ['small', 'medium', 'jackpot'].includes(tier) ? `assets/ui/donation-${tier}.png` : null;

/** 게임 아이콘(카탈로그 games 의 id 와 1:1) · 장기 콘텐츠 배너(카탈로그 modules 순서 = 번호) */
const GAME_IDS = ['puzzle', 'strategy', 'action', 'coop', 'rhythm', 'boxing', 'sandbox', 'sandbox_blocks', 'city_roleplay', 'survival_coop', 'raid_mmo', 'platform_cup_game', 'streamer_cup_game', 'coop_restaurant', 'virtual_exhibition'];
export const gameIcon = id => GAME_IDS.includes(id) ? `assets/games/game-${id}.png` : null;
const MODULE_IDS = ['LC-MC', 'LC-RP', 'LC-SV', 'LC-RD', 'LC-PT', 'LC-ST', 'LC-CO', 'LC-VR'];
export const moduleBanner = id => MODULE_IDS.includes(id) ? `assets/modules/module-${MODULE_IDS.indexOf(id) + 1}.png` : null;

/** 구매 이벤트(ME-001~016) → 아이템 그림 8분류 */
const ITEM_OF = {
  'ME-001': 'game', 'ME-002': 'game', 'ME-003': 'gear', 'ME-004': 'venue', 'ME-005': 'design', 'ME-006': 'design', 'ME-007': 'props', 'ME-008': 'venue',
  'ME-009': 'props', 'ME-010': 'storage', 'ME-011': 'editing', 'ME-012': 'gear', 'ME-013': 'venue', 'ME-014': 'event', 'ME-015': 'event', 'ME-016': 'event',
};
export const itemIcon = moneyEventId => ITEM_OF[moneyEventId] ? `assets/items/item-${ITEM_OF[moneyEventId]}.png` : null;

/** 업적 → 배지 8분류. 미션 도장은 별도 */
const BADGE_OF = {
  first_broadcast: 'broadcast', broadcasts_10: 'broadcast', broadcasts_50: 'broadcast', broadcasts_100: 'broadcast', scale_major: 'broadcast', celebration: 'broadcast', events_40: 'broadcast',
  first_great: 'great', greats_25: 'great', grade_s: 'great',
  viewers_1000: 'viewers', viewers_10000: 'viewers',
  first_donation: 'donation', jackpot: 'donation', donation_10m: 'donation',
  first_outfit: 'outfit', all_outfits: 'outfit', leak: 'outfit', reveal_fail: 'outfit',
  first_project: 'project', projects_5: 'project', module_done: 'project',
  first_ending: 'ending', endings_5: 'ending',
  mission_perfect: 'mission',
};
export const badgeIcon = achievementId => BADGE_OF[achievementId] ? `assets/ui/badge-${BADGE_OF[achievementId]}.png` : null;
export const BADGE_ACHIEVEMENT_IDS = Object.keys(BADGE_OF);
export const MISSION_STAMP = 'assets/ui/mission-stamp.png';

/** 사건 카드 머리 그림. 일반 사건은 분류(group)로, 정해진 사건은 종류(kind)로 고른다. 없으면 null(글자만) */
const SCENE_OF_GROUP = {
  '장비·화면': 'tech', '장비': 'tech', '게임 도전': 'game',
  '시청자 참여': 'fan', '참여 콘텐츠': 'fan', '팬 소통': 'fan', '의상 주변 사건': 'fan',
  '진행·편성': 'flow', '방송 준비': 'flow', '자료·준비': 'flow', '현장 회고': 'flow',
  '합방·협동': 'collab', '합방': 'collab', '기획 실험': 'project', '긍정적 기회': 'project', '팬 공간·기념 준비': 'celebration',
};
const SCENE_OF_CORNER = {T: 'flow', G: 'game', F: 'fan', S: 'project'};
const scenePath = name => `assets/scenes/scene-${name}.png`;
const scene = name => ({src: scenePath(name), width: 960, height: 360, kind: 'scene'});
export const sceneOfGroup = group => SCENE_OF_GROUP[group] || null;
export function eventArt(state, e) {
  if (!e) return null;
  if (e.kind === 'general') return SCENE_OF_GROUP[e.group] ? scene(SCENE_OF_GROUP[e.group]) : null;
  if (e.kind === 'routine') { const name = SCENE_OF_CORNER[state.plan?.[state.slot]]; return name ? scene(name) : null; }
  if (e.kind === 'project' || e.kind === 'finale') return scene('project');
  if (e.kind === 'promise') return scene('promise');
  if (e.kind === 'calendar') return ['birthday', 'anniversary'].includes(e.celebrationType) ? {src: `assets/events/celebration-${e.celebrationType}.png`, width: 960, height: 540, kind: 'photo'} : scene('celebration');
  if (e.kind === 'outfitOffer') return {src: 'assets/events/outfit-offer.png', width: 960, height: 540, kind: 'photo'};
  if (e.kind === 'shop' && itemIcon(e.moneyEventId)) return {src: itemIcon(e.moneyEventId), width: 256, height: 256, kind: 'item'};
  if ((e.kind === 'module' || e.kind === 'match') && moduleBanner(state.module?.id)) return {src: moduleBanner(state.module.id), width: 640, height: 360, kind: 'scene'};
  return null; // 유출(단서 그림)·공개(커튼)는 각자 연출이 있다
}

/** 소리: 효과음 6종 + 배경음악 2곡(준비·방송). 설정에서 켠 경우에만 재생 */
export const SFX = {click: 'assets/audio/sfx-click.ogg', great: 'assets/audio/sfx-great.ogg', miss: 'assets/audio/sfx-miss.ogg', donation: 'assets/audio/sfx-donation.ogg', curtain: 'assets/audio/sfx-curtain.ogg', badge: 'assets/audio/sfx-badge.ogg'};
export const BGM = {prep: 'assets/audio/bgm-prep.ogg', live: 'assets/audio/bgm-live.ogg'};

/** 화면이 참조하는 모든 에셋 경로 — check.mjs 가 존재 여부를 검사한다. 짝이 없는 항목은 null 로 남아 검사에서 걸린다 */
export function allAssetPaths(catalog) {
  return [
    ...FACE_OUTFITS.flatMap(o => FACE_EXPRESSIONS.map(e => facePathOf(o, e))),
    ...[0, 1, 2, 3, 4, 5, 6].map(n => kimongiAvatar(`키몽이 ${n}`)),
    ...Object.values(STUDIO_BACKGROUND), LOGO, KEY_VISUAL, FORCED_ENDING_IMAGE, OUTFIT_LOCKED, REVEAL_FAIL, MISSION_STAMP,
    ...['T', 'G', 'F', 'S'].map(cornerIcon), ...['maid', 'police', 'ghost', 'nun'].map(leakClue),
    ...catalog.endingEvents.map(x => endingImage(x.id)),
    ...['S', 'A', 'B', 'C'].map(gradeStamp), ...['small', 'medium', 'jackpot'].map(donationArt),
    ...catalog.games.map(g => gameIcon(g.id)), ...catalog.modules.map(m => moduleBanner(m.id)),
    ...catalog.moneyEvents.map(m => itemIcon(m.id)), ...BADGE_ACHIEVEMENT_IDS.map(badgeIcon),
    ...catalog.events.map(ev => SCENE_OF_GROUP[ev.group] ? scenePath(SCENE_OF_GROUP[ev.group]) : null),
    ...Object.values(SCENE_OF_CORNER).map(scenePath), scenePath('promise'), scenePath('celebration'),
    'assets/events/celebration-birthday.png', 'assets/events/celebration-anniversary.png', 'assets/events/outfit-offer.png',
    ...Object.values(SFX), ...Object.values(BGM),
  ];
}
