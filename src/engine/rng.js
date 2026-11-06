// 저장되는 시드 기반 난수(mulberry32). 게임 난수는 반드시 이 함수만 사용한다.
// 호출할 때마다 s.seed 가 바뀌므로, 호출 순서를 바꾸면 저장된 일지의 재현성이 깨진다.
export function random(s) {
  s.seed = (s.seed + 0x6D2B79F5) >>> 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
