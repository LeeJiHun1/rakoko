// 상태와 무관한 순수 도우미.
export const clone = x => JSON.parse(JSON.stringify(x));
export const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
export const getPath = (obj, path) => path.split('.').reduce((v, k) => v?.[k], obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[keys.at(-1)] = value;
}
