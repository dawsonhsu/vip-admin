import dayjs from 'dayjs';
import { agencyDailyEvents } from './daily';
import { agencyMembers } from './shared';
import { agencySeed, createRng } from '@/lib/agencyUtils';

export interface AgencyMemberDailyStat {
  uid: string;
  username: string;
  phone: string;
  date: string;
  depositCount: number;
  totalDeposit: number;
  withdrawCount: number;
  totalWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  totalBet: number;
  excludedBet: number;
  validBet: number;
  totalPayout: number;
  ggr: number;
  fsBet: number;
  fsGgr: number;
  jpBet: number;
  jpGgr: number;
  totalBonus: number;
  totalCommission: number;
}

export type AgencyMemberMetrics = Omit<AgencyMemberDailyStat, 'uid' | 'username' | 'phone' | 'date'>;
export type AgencyMemberStat = Omit<AgencyMemberDailyStat, 'date'>;

export const agencyMemberMetricKeys = [
  'depositCount', 'totalDeposit', 'withdrawCount', 'totalWithdraw', 'depositFee', 'withdrawFee',
  'totalBet', 'excludedBet', 'validBet', 'totalPayout', 'ggr', 'fsBet', 'fsGgr', 'jpBet', 'jpGgr',
  'totalBonus', 'totalCommission',
] as const satisfies readonly (keyof AgencyMemberMetrics)[];

const isCount = (key: keyof AgencyMemberMetrics) => key === 'depositCount' || key === 'withdrawCount';
const emptyMetrics = (): AgencyMemberMetrics => ({
  depositCount: 0, totalDeposit: 0, withdrawCount: 0, totalWithdraw: 0,
  depositFee: 0, withdrawFee: 0, totalBet: 0, excludedBet: 0, validBet: 0, totalPayout: 0,
  ggr: 0, fsBet: 0, fsGgr: 0, jpBet: 0, jpGgr: 0, totalBonus: 0, totalCommission: 0,
});

/** 只切既有事件；建列、推導及加總時，所有金額都使用整數分。 */
export function agencyMemberDailyStats(): AgencyMemberDailyStat[] {
  const members = new Map(agencyMembers.map((member) => [member.uid, member]));
  const grouped = new Map<string, AgencyMemberDailyStat>();
  const rowFor = (uid: string, createdAt: number) => {
    const date = dayjs.unix(createdAt).format('YYYY-MM-DD');
    const key = `${uid}:${date}`;
    let row = grouped.get(key);
    if (!row) {
      const member = members.get(uid);
      if (!member) throw new Error(`Unknown agency member: ${uid}`);
      row = { uid, username: member.username, phone: member.phone, date, ...emptyMetrics() };
      grouped.set(key, row);
    }
    return row;
  };

  for (const event of agencyDailyEvents.deposits) {
    const row = rowFor(event.uid, event.created_at);
    row.depositCount += 1;
    row.totalDeposit += event.amount_cents;
  }
  for (const event of agencyDailyEvents.withdrawals) {
    const row = rowFor(event.uid, event.created_at);
    row.withdrawCount += 1;
    row.totalWithdraw += event.amount_cents;
  }
  for (const event of agencyDailyEvents.bets) {
    const row = rowFor(event.uid, event.created_at);
    row.validBet += event.valid_bet_cents;
    row.ggr += event.ggr_cents;
  }
  for (const event of agencyDailyEvents.bonuses) {
    rowFor(event.uid, event.created_at).totalBonus += Math.round(Number(event.bonus) * 100);
  }

  return Array.from(grouped.values()).filter((row) => agencyMemberMetricKeys.some((key) => row[key] !== 0))
    .map((row) => {
      row.totalBet = Math.round(row.validBet * 100 / 92);
      row.excludedBet = row.totalBet - row.validBet;
      row.totalPayout = row.totalBet - row.ggr;
      row.depositFee = 0;
      row.withdrawFee = Math.round(row.totalWithdraw / 100);
      // 只有 FS / JP 比例使用確定性亂數，其基數全部來自同日既有投注。
      const fsRng = createRng(agencySeed(row.uid, row.date, 'fs'));
      const jpRng = createRng(agencySeed(row.uid, row.date, 'jp'));
      row.fsBet = Math.min(row.totalBet, Math.round(row.totalBet * fsRng() * 0.06));
      row.jpBet = Math.min(row.totalBet - row.fsBet, Math.round(row.totalBet * jpRng() * 0.03));
      row.fsGgr = Math.min(row.fsBet, Math.round(row.fsBet * (0.02 + fsRng() * 0.06)));
      row.jpGgr = Math.min(row.jpBet, Math.round(row.jpBet * (0.02 + jpRng() * 0.06)));
      row.totalCommission = Math.round(Math.max(0, row.ggr) * 35 / 100);
      for (const key of agencyMemberMetricKeys) {
        if (!isCount(key)) row[key] /= 100;
      }
      return row;
    }).sort((a, b) => b.date.localeCompare(a.date) || a.uid.localeCompare(b.uid));
}

/** 主表、當頁小計與總計共用，禁止直接累加浮點元金額。 */
export function sumAgencyMemberStats(rows: readonly AgencyMemberMetrics[]): AgencyMemberMetrics {
  const total = emptyMetrics();
  for (const row of rows) {
    for (const key of agencyMemberMetricKeys) {
      total[key] += isCount(key) ? row[key] : Math.round(row[key] * 100);
    }
  }
  for (const key of agencyMemberMetricKeys) {
    if (!isCount(key)) total[key] /= 100;
  }
  return total;
}

export function aggregateAgencyMemberStats(rows: readonly AgencyMemberDailyStat[]): AgencyMemberStat[] {
  const grouped = new Map<string, AgencyMemberDailyStat[]>();
  for (const row of rows) {
    const memberRows = grouped.get(row.uid) ?? [];
    memberRows.push(row);
    grouped.set(row.uid, memberRows);
  }
  return Array.from(grouped.values()).map((memberRows) => {
    const { uid, username, phone } = memberRows[0];
    return { uid, username, phone, ...sumAgencyMemberStats(memberRows) };
  }).sort((a, b) => a.uid.localeCompare(b.uid));
}
