// HTML 문자열 도우미. 사용자·저장본에서 온 값은 반드시 escape() 를 거쳐 템플릿에 넣는다.
export const $ = s => document.querySelector(s);
export const escape = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export const money = n => new Intl.NumberFormat('ko-KR').format(n) + '원';
export const compact = n => n >= 100000000 ? (n / 100000000).toLocaleString('ko-KR', {maximumFractionDigits: 1}) + '억'
  : n >= 10000 ? (n / 10000).toLocaleString('ko-KR', {maximumFractionDigits: 1}) + '만' : n.toLocaleString('ko-KR');
/** data-action 버튼. text·extra 는 신뢰된 고정 문자열만 넣는다(동적 값은 호출 측에서 escape). */
export const btn = (text, action, extra = '', cls = 'button') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
export const tag = text => `<span class="tag">${escape(text)}</span>`;
