// 사건·선택지 객체 생성기. 키 순서는 저장 형식(골든 해시)에 반영되므로 유지한다.
export function event(s, kind, title, body, choices, extra = {}) {
  return {id: `${s.runId}:${s.broadcastIndex}:${s.slot}:${kind}`, kind, title, body, choices, ...extra};
}
export function choice(id, text, outcome, extra = {}) {
  return {id, text, outcome, requirements: [], ...extra};
}
