// 공용 대화상자(<dialog id="modal">).
import {$, btn} from './dom.js';

const modal = () => $('#modal');

/** title·body 는 이미 escape 된 HTML 이어야 한다. */
export function openDialog(title, body) {
  const m = modal();
  m.innerHTML = `<div class="modal-heading"><h2 id="modal-title">${title}</h2>${btn('×', 'closeModal', 'aria-label="닫기"', 'icon-button')}</div>${body}`;
  if (!m.open) m.showModal();
}
export const closeDialog = () => modal().close();

/** 대화상자 바깥(backdrop)을 누르면 닫는다. */
export function installBackdropClose() {
  const m = modal();
  m.addEventListener('click', e => {
    if (e.target !== m) return;
    const box = m.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) m.close();
  });
}
