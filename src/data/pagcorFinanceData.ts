import type { Dayjs } from 'dayjs';
import type { PagcorDataSite } from '@/components/PagcorSiteContext';
import { pagcorSites } from '@/data/pagcorMockData';

export const pagcorDepositChannels: Record<PagcorDataSite, string[]> = {
  filbet: ['GCash', 'Maya', 'QRPH', 'Bank Transfer', '7-Eleven'],
  filplay: ['GCash', 'Maya', 'QRPH'],
};

export const pagcorWithdrawAccountTypes: Record<PagcorDataSite, string[]> = {
  filbet: ['GCash', 'Maya', 'Bank'],
  filplay: ['GCash', 'Maya'],
};

export const pagcorDepositStatuses = ['Pending', 'Canceled', 'Completed', 'Timeout'] as const;
export const pagcorWithdrawalStatuses = ['Under Review', 'Paying', 'Timeout', 'Completed', 'Canceled'] as const;
export const pagcorTransactionTypes = ['存款', '提款', '投注', '派彩', '红利', '人工调整'] as const;

interface FinanceUser {
  uid: string;
  username: string;
  phone: string;
  site: string;
  vip: number;
}

interface FinanceRecord extends FinanceUser {
  id: string;
  amount: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PagcorDeposit extends FinanceRecord {
  channel: string;
  externalOrderId: string;
  status: typeof pagcorDepositStatuses[number];
}

export interface PagcorWithdrawal extends FinanceRecord {
  fee: number;
  accountType: string;
  status: typeof pagcorWithdrawalStatuses[number];
}

export interface PagcorTransaction extends FinanceUser {
  id: string;
  type: typeof pagcorTransactionTypes[number];
  before: number;
  amount: number;
  after: number;
  createdAt: string;
}

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomDigits(random: () => number, length: number): string {
  return String(1 + Math.floor(random() * 9)) + Array.from({ length: length - 1 }, () => Math.floor(random() * 10)).join('');
}

function usersFor(brand: PagcorDataSite): FinanceUser[] {
  const random = mulberry32(brand === 'filbet' ? 5501 : 5502);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 40 }, (_, index) => {
    const fromFilbet = brand === 'filbet' || index % 10 < 3;
    const suffix = Array.from({ length: fromFilbet ? 6 : 8 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
    return {
      uid: randomDigits(random, 17 + Math.floor(random() * 3)),
      username: `${fromFilbet ? 'filbet' : 'filplay'}_${suffix}`,
      phone: `+63 9${randomDigits(random, 9)}`,
      site: pagcorSites[Math.floor(random() * pagcorSites.length)],
      vip: Math.floor(random() * 11),
    };
  });
}

const financeUsers: Record<PagcorDataSite, FinanceUser[]> = {
  filbet: usersFor('filbet'), filplay: usersFor('filplay'),
};

const externalOrderPrefixes: Record<string, string> = {
  GCash: 'GC', Maya: 'MY', QRPH: 'QR', 'Bank Transfer': 'BT', '7-Eleven': 'SE',
};

function timestamps(anchor: Dayjs, random: () => number, index: number) {
  const offset = index === 0 ? 0 : Math.floor(random() * 45 * 86400);
  const created = anchor.subtract(offset, 'second');
  const updated = created.add(Math.min(offset, Math.floor(random() * 7200)), 'second');
  return { createdAt: created.format('YYYY-MM-DD HH:mm:ss'), updatedAt: updated.format('YYYY-MM-DD HH:mm:ss') };
}

export function generatePagcorDeposits(brand: PagcorDataSite, anchor: Dayjs, count = brand === 'filbet' ? 260 : 90): PagcorDeposit[] {
  const random = mulberry32(brand === 'filbet' ? 1101 : 1102);
  const users = financeUsers[brand];
  const channels = pagcorDepositChannels[brand];
  const statuses: PagcorDeposit['status'][] = ['Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Canceled', 'Timeout'];
  return Array.from({ length: count }, (_, index) => {
    const user = users[index % users.length];
    const amount = (10000 + Math.floor(random() * 1990000)) / 100;
    const channel = channels[Math.floor(random() * channels.length)];
    const status = statuses[Math.floor(random() * statuses.length)];
    const fee = channel === 'Bank Transfer' || channel === '7-Eleven' ? 10 : 0;
    return {
      ...user, id: `D${randomDigits(random, 18)}`, amount,
      paidAmount: status === 'Completed' ? Math.round((amount - fee) * 100) / 100 : 0,
      channel, externalOrderId: `${externalOrderPrefixes[channel]}${randomDigits(random, 14)}`, status,
      ...timestamps(anchor, random, index),
    };
  });
}

export function generatePagcorWithdrawals(brand: PagcorDataSite, anchor: Dayjs, count = brand === 'filbet' ? 180 : 60): PagcorWithdrawal[] {
  const random = mulberry32(brand === 'filbet' ? 2201 : 2202);
  const users = financeUsers[brand];
  const accountTypes = pagcorWithdrawAccountTypes[brand];
  const statuses: PagcorWithdrawal['status'][] = ['Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Under Review', 'Paying', 'Timeout', 'Canceled'];
  return Array.from({ length: count }, (_, index) => {
    const amount = (20000 + Math.floor(random() * 2980000)) / 100;
    const accountType = accountTypes[Math.floor(random() * accountTypes.length)];
    const fee = random() < 0.3 ? 15 : 0;
    const status = statuses[Math.floor(random() * statuses.length)];
    return {
      ...users[index % users.length], id: `W${randomDigits(random, 18)}`, amount,
      paidAmount: status === 'Completed' ? Math.round((amount - fee) * 100) / 100 : 0,
      fee, accountType, status, ...timestamps(anchor, random, index),
    };
  });
}

export function generatePagcorTransactions(brand: PagcorDataSite, anchor: Dayjs, count = brand === 'filbet' ? 400 : 150): PagcorTransaction[] {
  const random = mulberry32(brand === 'filbet' ? 3301 : 3302);
  const users = financeUsers[brand];
  return Array.from({ length: count }, (_, index) => {
    const user = users[index % users.length];
    const type = pagcorTransactionTypes[Math.floor(random() * pagcorTransactionTypes.length)];
    const magnitude = 100 + Math.floor(random() * 500000);
    const negative = type === '提款' || type === '投注' || (type === '人工调整' && random() < 0.5);
    const amountCents = negative ? -magnitude : magnitude;
    const beforeCents = Math.floor(random() * 2000000) + (negative ? magnitude : 0);
    return {
      ...user, id: randomDigits(random, 19), type, before: beforeCents / 100,
      amount: amountCents / 100, after: (beforeCents + amountCents) / 100,
      createdAt: timestamps(anchor, random, index).createdAt,
    };
  });
}
