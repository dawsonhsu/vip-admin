function taipeiParts(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const taipei = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return {
    y: taipei.getUTCFullYear(),
    m: taipei.getUTCMonth() + 1,
    day: taipei.getUTCDate(),
    h: String(taipei.getUTCHours()).padStart(2, '0'),
    min: String(taipei.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatTaipeiTime(value: string) {
  const p = taipeiParts(value);
  if (!p) return value;
  return `${p.m}/${p.day} ${p.h}:${p.min}`;
}

export function formatTaipeiDateTime(value: string) {
  const p = taipeiParts(value);
  if (!p) return value;
  const mm = String(p.m).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.y}/${mm}/${dd} ${p.h}:${p.min}`;
}
