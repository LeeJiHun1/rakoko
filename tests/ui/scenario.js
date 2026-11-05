// UI 회귀 비교 시나리오 (선택 실행 — npm test 에는 포함하지 않음, 외부 패키지 금지 규칙 때문)
// 사용법: 변경 전/후 버전을 서로 다른 포트로 띄우고(PORT=5391 npm run dev …),
//         Playwright(MCP browser_run_code 또는 npx playwright)로 각 페이지에서 아래 함수를 실행해
//         반환된 steps(단계별 #app·#modal HTML 해시)를 diff 한다. 동작을 바꾸지 않는 리팩터링이면 완전히 같아야 한다.
// 고정 시드(4242) 저장본을 IndexedDB 에 넣고 같은 순서로 클릭하므로 결과는 결정적이다.
async (page) => {
  const base = page.url().match(/^https?:\/\/[^/]+/)[0];
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/');
  await page.waitForSelector('.topbar');
  await page.evaluate(async () => {
    const eng = await import('/src/engine.js');
    const now = Date.now; Date.now = () => 1767225600000; const s = eng.newGame(4242); Date.now = now;
    await new Promise((res, rej) => {
      const r = indexedDB.open('rakoko-journal-v1', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('journal');
      r.onsuccess = () => {
        const tx = r.result.transaction('journal', 'readwrite');
        tx.objectStore('journal').put(s, 'current'); tx.objectStore('journal').delete('previous');
        tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = rej;
      };
    });
    localStorage.removeItem('rakoko-preferences');
  });
  await page.goto(base + '/');
  await page.waitForSelector('.topbar');
  const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  const steps = [];
  const snap = async name => {
    await page.waitForTimeout(150);
    const h = await page.evaluate(() => ({app: document.querySelector('#app').innerHTML, modal: document.querySelector('#modal').open ? document.querySelector('#modal').innerHTML : ''}));
    steps.push({name, app: fnv(h.app), modal: fnv(h.modal), len: h.app.length});

  };
  const click = async sel => { await page.locator(sel).first().click(); };
  const closeModal = async () => { if (await page.locator('#modal[open]').count()) await click('#modal [data-action="closeModal"]'); };
  const playBroadcast = async tag => {
    await click('[data-action="start"]'); await snap(tag + ':start');
    for (let i = 0; i < 3; i++) {
      await click('.choice:not([disabled])'); await snap(tag + ':choice' + i);
      await click('[data-action="advance"]'); await snap(tag + ':advance' + i);
    }
  };

  await snap('prep');
  await click('[data-action="prepare"][data-kind="data"]'); await snap('prep-data');
  await click('[data-action="prepare"][data-kind="check"]'); await snap('prep-check');
  await click('details.optional-options > summary'); await snap('details-open');
  await page.selectOption('select[data-change="plan"][data-index="2"]', 'S'); await snap('plan-S');
  await page.locator('details.optional-options').first().evaluate(d => d.open = true);
  await page.selectOption('select[data-change="game"]', 'strategy'); await snap('game-strategy');
  for (const v of ['projects', 'wardrobe', 'journal']) { await click(`[data-view="${v}"]`); await snap('view-' + v); }
  await click('[data-action="collection"]'); await snap('dlg-collection'); await closeModal();
  await click('[data-view="broadcast"]'); await snap('view-broadcast');
  await click('[data-action="settings"]'); await snap('dlg-settings'); await closeModal();
  await click('[data-action="about"]'); await snap('dlg-about'); await closeModal();
  await click('[data-action="datePicker"]'); await snap('dlg-date'); await closeModal();
  await playBroadcast('b1');
  await click('[data-action="representative"][data-index="1"]'); await snap('b1:rep');
  await click('[data-action="nextWeek"]'); await snap('b1:nextWeek');
  await click('[data-view="projects"]');
  await click('[data-action="project"][data-id="END-001"]'); await snap('project-start');
  await click('[data-view="wardrobe"]');
  await click('[data-action="craftAndPrepare"]:not([disabled])'); await snap('craft');
  await click('[data-view="broadcast"]');
  await playBroadcast('b2');
  await click('[data-action="nextCelebration"]'); await snap('b2:nextCelebration');
  for (let n = 3; n <= 7; n++) {
    await playBroadcast('b' + n);
    await click('[data-action="nextWeek"]'); await snap(`b${n}:next`);
  }
  await click('[data-view="projects"]'); await snap('projects-late');
  await click('[data-view="journal"]'); await snap('journal-late');
  await click('[data-view="wardrobe"]'); await snap('wardrobe-late');
  return {errors, count: steps.length, steps: steps.map(s => `${s.name} ${s.app}/${s.modal} ${s.len}`).join('\n')};
}
