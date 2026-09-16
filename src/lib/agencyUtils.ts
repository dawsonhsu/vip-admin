import dayjs, { Dayjs } from 'dayjs';

// 代理推廣後台 demo 共用工具
// 對應後端：~/claudeproject/agency（Go 服務）/agency/* 路由

export type AgencyQuickRange = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth';

// 兩端各自從同一時間戳獨立建構 dayjs 實例，避免 rc-util isEqual 的循環參照警告
export function agencyRangeOf(key: AgencyQuickRange): [Dayjs, Dayjs] {
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

// 同一輸入產出同一 seed，讓假資料可重現
export function agencySeed(...parts: Array<string | number | undefined>): number {
  const value = parts.filter((p) => p !== undefined).join(':');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32：小而穩定的 PRNG，同 seed 必得同序列
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

// 後端金額一律回 string（decimal），前端顯示加 P 前綴
export function formatAmount(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPeso(value: number | string): string {
  return `P ${formatAmount(value)}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

// 後端時間戳為秒級 int64
export function formatTs(seconds: number): string {
  if (!seconds) return '-';
  return dayjs.unix(seconds).format('YYYY-MM-DD HH:mm:ss');
}

export function formatPercent(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(2)}%`;
}

// ---- 列舉對照 ----

// modules.Member.state
export const memberStateLabels: Record<number, string> = {
  1: '正常',
  2: '停用',
  3: '刪除',
};

// modules.GameRecord.state 結算狀態
export const betStateLabels: Record<number, string> = {
  0: '未結算',
  1: '已結算',
  2: '會員取消',
  3: '無效',
};

// modules.GameRecord.bet_type 注單類型
export const betTypeLabels: Record<number, string> = {
  1: '普通注單',
  2: '免費旋轉',
  3: 'Jackpot',
  4: '紅利',
};

// modules.Commission.state 佣金狀態
export const commissionStateLabels: Record<number, string> = {
  0: '當月不達標',
  1: '當月不達標',
  2: '待審核',
  3: '審核通過',
  4: '審核拒絕',
};

export const commissionStateColors: Record<number, string> = {
  0: 'default',
  1: 'default',
  2: 'geekblue',
  3: 'green',
  4: 'red',
};

// fb_agency_setting.settle_type
export const settleTypeLabels: Record<number, string> = {
  1: '每週結算',
  2: '每月結算',
};

// ty 參數：統計口徑
export const statTyLabels: Record<number, string> = {
  1: '按月',
  2: '累計',
};

// PromoBonusDb.review_state
export const bonusReviewStateLabels: Record<number, string> = {
  1: '待審核',
  2: '已通過',
  3: '已拒絕',
};

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' });
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
