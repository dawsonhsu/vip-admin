import dayjs, { Dayjs } from 'dayjs';

// 代理推广后台 demo 共用工具
// 对应后端：~/claudeproject/agency（Go 服务）/agency/* 路由

export type AgencyQuickRange = 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth';

// 两端各自从同一时间戳独立建构 dayjs 实例，避免 rc-util isEqual 的循环参照警告
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

// 同一输入产出同一 seed，让假数据可重现
export function agencySeed(...parts: Array<string | number | undefined>): number {
  const value = parts.filter((p) => p !== undefined).join(':');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32：小而稳定的 PRNG，同 seed 必得同序列
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

// 在已经过的秒数中均匀抽样，未完整的首／末日自然按可活动时数降低权重。
export function agencyEventTime(rng: () => number, startTs: number, endTs: number): number {
  return rngInt(rng, startTs, endTs);
}

// 后端金额一律回 string（decimal），前端显示加 P 前缀
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

/** 手机保留前 4 后 3 码，中间固定 4 颗星；短号码只留前 2 码。 */
export function maskPhone(phone?: string): string {
  const value = phone?.trim();
  if (!value) return '-';
  if (value.length < 8) return `${value.slice(0, 2)}${'*'.repeat(Math.max(1, value.length - 2))}`;
  return `${value.slice(0, 4)}****${value.slice(-3)}`;
}

/** 姓名每段只留首字，单字符维持原样。 */
export function maskName(name?: string): string {
  const value = name?.trim();
  if (!value) return '-';
  return value.split(/\s+/).map((part) => {
    const characters = Array.from(part);
    return `${characters[0]}${'*'.repeat(characters.length - 1)}`;
  }).join(' ');
}

// 后端时间戳为秒级 int64
export function formatTs(seconds: number): string {
  if (!seconds) return '-';
  return dayjs.unix(seconds).format('YYYY-MM-DD HH:mm:ss');
}

export function formatPercent(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '-';
  return `${n.toFixed(2)}%`;
}

// ---- 列举对照 ----

// modules.Member.state
export const memberStateLabels: Record<number, string> = {
  1: '正常',
  2: '停用',
  3: '删除',
};

// modules.GameRecord.state 结算状态
export const betStateLabels: Record<number, string> = {
  0: '未结算',
  1: '已结算',
  2: '会员取消',
  3: '无效',
};

// modules.GameRecord.bet_type 注单类型
export const betTypeLabels: Record<number, string> = {
  1: '普通注单',
  2: '免费旋转',
  3: 'Jackpot',
  4: '红利',
};

// modules.Commission.state 佣金状态
export const commissionStateLabels: Record<number, string> = {
  0: '当月不达标',
  1: '当月不达标',
  2: '待审核',
  3: '审核通过',
  4: '审核拒绝',
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
  1: '每周结算',
  2: '每月结算',
};

// ty 参数：统计口径
export const statTyLabels: Record<number, string> = {
  1: '按月',
  2: '累计',
};

// PromoBonusDb.review_state
export const bonusReviewStateLabels: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
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
