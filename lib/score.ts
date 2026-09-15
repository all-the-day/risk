// 计分规则（纯函数，不依赖 prisma）
// 单次得分 = score / checksPerWeek；超过每周次数封顶，不足则按已完成次数线性给分。
// 为避免 7/2 这类除不尽的分值逐项舍入后漂移，内部一律按「分 × 100」整数累加，
// 只在最终展示时四舍五入回整数分。

export function normalizeChecks(checksPerWeek: number): number {
  return checksPerWeek > 0 ? checksPerWeek : 1;
}

// 某事项本周得分，单位：分 × 100
export function earnedCenti(
  count: number,
  score: number,
  checksPerWeek: number
): number {
  const cap = normalizeChecks(checksPerWeek);
  const done = Math.min(Math.max(count, 0), cap);
  return Math.round((done * score * 100) / cap);
}

export function sumCenti(parts: number[]): number {
  let sum = 0;
  for (const part of parts) sum += part;
  return sum;
}

// 分 × 100 → 展示用整数分
export function displayScore(centi: number): number {
  return Math.round(centi / 100);
}

// 完成度百分比（0-100 整数）；入参为展示分数，不是分×100
export function percent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}
