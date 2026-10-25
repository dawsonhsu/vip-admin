import dayjs, { Dayjs } from 'dayjs';
import type { PagcorShopReportRow, PagcorTaxAmounts } from '@/data/pagcorMockData';
import { filplayShop } from '@/data/pagcorShopData';
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

function sumPagcorAmounts(amounts: PagcorTaxAmounts[]): PagcorTaxAmounts {
  const result: PagcorTaxAmounts = { validBet: 0, payout: 0, fsBet: 0, fsPayout: 0, jpContribution: 0, jpPayout: 0 };
  for (const key of Object.keys(result) as Array<keyof PagcorTaxAmounts>) {
    result[key] = amounts.reduce((cents, row) => cents + Math.round(row[key] * 100), 0) / 100;
  }
  return result;
}

export type PagcorShopAmountsRow = Pick<PagcorShopReportRow, 'id' | 'shop' | 'onsite' | 'online'>;

// Filter source rows before calling: a Filplay shop can contain many providers/categories.
export function scopePagcorShopReport(rows: PagcorShopReportRow[], seed: number, site: PagcorSite): PagcorShopAmountsRow[] {
  if (!rows.length) return [];
  const split = (brand: 'filbet' | 'filplay') => rows.map((row) => {
    const share = pagcorSiteShare(seed, row.shop);
    return {
      ...row,
      onsite: scopePagcorAmounts(row.onsite, share, brand),
      online: scopePagcorAmounts(row.online, share, brand),
    };
  });
  if (site === 'filbet') return split('filbet');

  const filplayRows = split('filplay');
  const filplayTotal: PagcorShopAmountsRow = {
    id: `filplay-shop-${filplayShop.id}`,
    shop: filplayShop.name,
    onsite: sumPagcorAmounts(filplayRows.map((row) => row.onsite)),
    online: sumPagcorAmounts(filplayRows.map((row) => row.online)),
  };
  if (site === 'filplay') return [filplayTotal];

  const combined: PagcorShopAmountsRow[] = split('filbet').map((row) => row.shop === filplayShop.name ? {
    ...row,
    onsite: sumPagcorAmounts([row.onsite, filplayTotal.onsite]),
    online: sumPagcorAmounts([row.online, filplayTotal.online]),
  } : row);
  // The source shop-2 row may be excluded by a provider/category filter.
  if (!combined.some((row) => row.shop === filplayShop.name)) combined.push(filplayTotal);
  return combined;
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
