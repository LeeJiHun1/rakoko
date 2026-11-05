// 업적·사건 도감. 모든 명령 뒤 상태만 보고 판정한다(난수 없음). 달성 날짜를 기록하고 한 번 달성하면 유지.
const outfitsRevealed = s => Object.keys(s.wardrobe).filter(id => id !== 'base').length;
const projectsDone = s => s.experienceRecords.filter(r => r.source?.startsWith('project:')).length;
export const eventsSeen = s => new Set(s.seenOnce).size;

export const ACHIEVEMENTS = [
  {id: 'first_broadcast', label: '첫 방송', desc: '첫 방송을 마쳤다', check: s => s.completedBroadcasts >= 1},
  {id: 'broadcasts_10', label: '단골 시간표', desc: '방송 10회', check: s => s.completedBroadcasts >= 10},
  {id: 'broadcasts_50', label: '반백 회', desc: '방송 50회', check: s => s.completedBroadcasts >= 50},
  {id: 'broadcasts_100', label: '백 번째 인사', desc: '방송 100회', check: s => s.completedBroadcasts >= 100},
  {id: 'first_great', label: '첫 대성공', desc: '대성공 1회', check: s => s.records.greats >= 1},
  {id: 'greats_25', label: '하이라이트 제조기', desc: '대성공 25회', check: s => s.records.greats >= 25},
  {id: 'grade_s', label: '전설의 방송', desc: 'S등급 방송', check: s => s.records.bestGrade === 'S'},
  {id: 'viewers_1000', label: '천 명의 키몽이', desc: '최고 동시 시청 1,000명', check: s => s.records.bestViewers >= 1000},
  {id: 'viewers_10000', label: '만 명의 키몽이', desc: '최고 동시 시청 10,000명', check: s => s.records.bestViewers >= 10000},
  {id: 'first_donation', label: '첫 응원', desc: '응원 받기', check: s => s.records.donations >= 1},
  {id: 'jackpot', label: '대박 응원', desc: '대박 응원 받기', check: s => (s.records.jackpots || 0) >= 1},
  {id: 'donation_10m', label: '따뜻한 지갑들', desc: '응원 누적 1,000만원', check: s => s.records.donationTotal >= 10000000},
  {id: 'first_outfit', label: '커튼 오픈', desc: '첫 신의상 공개', check: s => outfitsRevealed(s) >= 1},
  {id: 'all_outfits', label: '옷장 완성', desc: '신의상 4벌 모두 공개', check: s => outfitsRevealed(s) >= 4},
  {id: 'leak', label: '어? 방금 화면에…', desc: '의상 유출 사건 겪기', check: s => Object.keys(s.leaked).length >= 1},
  {id: 'reveal_fail', label: '단추가 데구루루', desc: '공개 실패 해프닝', check: s => Object.keys(s.outfitRevealFailed || {}).length >= 1},
  {id: 'first_project', label: '기획자의 첫걸음', desc: '첫 기획 완성', check: s => projectsDone(s) >= 1},
  {id: 'projects_5', label: '기획 노트 한 권', desc: '기획 5개 완성', check: s => projectsDone(s) >= 5},
  {id: 'first_ending', label: '한 장의 마지막', desc: '첫 결말', check: s => s.reachedEndings.length >= 1},
  {id: 'endings_5', label: '이야기 수집가', desc: '결말 5종', check: s => new Set(s.reachedEndings.map(e => e.id)).size >= 5},
  {id: 'mission_perfect', label: '이달의 개근', desc: '한 달 미션 3개 모두 달성', check: s => (s.records.missionPerfect || 0) >= 1},
  {id: 'scale_major', label: '대형 방송', desc: '방송 규모 대형 단계', check: s => s.scaleIndex >= 3},
  {id: 'celebration', label: '오늘은 특별한 날', desc: '생일 또는 주년 방송', check: s => s.celebrations.length >= 1},
  {id: 'module_done', label: '끝까지 함께', desc: '장기 콘텐츠 완주', check: s => s.moduleArchive.some(m => m.phase === 'closed' && !m.abandoned)},
  {id: 'events_40', label: '사건 도감 절반', desc: '서로 다른 사건 40개 만나기', check: s => eventsSeen(s) >= 40},
];
export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map(a => a.id);

/** 새로 달성한 업적을 기록하고 id 목록을 돌려준다 */
export function unlockAchievements(s) {
  s.achievements ??= {};
  const fresh = [];
  for (const a of ACHIEVEMENTS) if (!s.achievements[a.id] && a.check(s)) { s.achievements[a.id] = s.date; fresh.push(a.id); }
  return fresh;
}
