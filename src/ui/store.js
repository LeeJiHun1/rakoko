// UI 공유 상태. 게임 상태(state)는 엔진 dispatch 결과로만 교체한다(commands.js 참고).
export const store = {
  catalog: null,   // src/data/catalog.json
  state: null,     // 현재 일지(엔진 상태)
  view: 'broadcast', // broadcast | projects | wardrobe | journal
  busy: false,     // 저장 중 — 중복 명령 방지
  stale: false,    // 다른 탭이 더 새로운 일지를 저장함
  saveError: false,
};

export const outfit = () => store.catalog.outfits.find(x => x.id === store.state.equipped) || store.catalog.outfits[0];
export const gameName = id => store.catalog.games.find(g => g.id === id)?.name || '게임';
export const currentProject = () => store.catalog.projects.find(p => p.id === store.state.project?.id);
