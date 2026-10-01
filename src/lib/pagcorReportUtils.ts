import dayjs, { Dayjs } from 'dayjs';
import type { PagcorTaxAmounts } from '@/data/pagcorMockData';
import type { PagcorSite } from '@/components/PagcorSiteContext';

export function pagcorSiteShare(seed: number, rowKey: string): number {
  const value = `${seed}:${rowKey}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 0.68 + ((hash >>> 0) / 4294967295) * 0.14;
}

export function scopePagcorAmounts(amounts: PagcorTaxAmounts, share: number, site: PagcorSite): PagcorTaxAmounts {
  if (site === 'all') return amounts;
  const result = { ...amounts };
  for (const key of Object.keys(amounts) as Array<keyof PagcorTaxAmounts>) {
    const cents = Math.round(amounts[key] * 100);
    const filbetCents = Math.round(cents * share);
    result[key] = (site === 'filbet' ? filbetCents : cents - filbetCents) / 100;
  }
  return result;
}

export type PagcorQuickRange = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth';

// 兩端各自從同一時間戳獨立建構 dayjs 實例。若改用 now.startOf()/now.endOf()，
// 兩個 clone 會共用同一份內部物件參照，觸發 rc-util isEqual 的
// "There may be circular references" 警告。
export function rangeOf(key: PagcorQuickRange): [Dayjs, Dayjs] {
  const ts = Date.now();
  const from = dayjs(ts);
  const to = dayjs(ts);
  switch (key) {
    case 'today':
      return [from.startOf('day'), to.endOf('day')];
    case 'yesterday':
      return [from.subtract(1, 'day').startOf('day'), to.subtract(1, 'day').endOf('day')];
    case 'week':
      return [from.startOf('week'), to.endOf('week')];
    case 'month':
      return [from.startOf('month'), to.endOf('month')];
    case 'lastMonth':
      return [from.subtract(1, 'month').startOf('month'), to.subtract(1, 'month').endOf('month')];
  }
}

// 日期範圍相同時產出同一 seed，讓報表假資料可重現；不同範圍則會重新取樣金額。
export function seedForPagcorDateRange(
  range: [Dayjs, Dayjs] | undefined,
  baseSeed: number,
): number {
  if (!range?.[0] || !range?.[1]) return baseSeed;

  const value = `${baseSeed}:${range[0].format('YYYY-MM-DD')}:${range[1].format('YYYY-MM-DD')}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function derivePagcorAmounts(amounts: PagcorTaxAmounts, rate: number = 0) {
  const ggr = (amounts.validBet - amounts.jpContribution) - (amounts.payout - amounts.jpPayout);
  return {
    ggr,
    tax: ggr * rate,
    fsGgr: amounts.fsBet - amounts.fsPayout,
  };
}

export function formatPagcorAmount(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function toCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
