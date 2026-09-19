import dayjs from 'dayjs';
import { agencyDailyEvents } from './daily';
import { agencyMembers } from './shared';

// 代理端只需要資金進出、佣金基礎（有效流水）、平台輸贏（GGR）與彩金成本。
// 手續費、總投注／排除投注額／總派獎、FS／JP 明細、佣金都不在代理端呈現，因此不再產生。
export interface AgencyMemberDailyStat {
  uid: string;
  username: string;
  phone: string;
  date: string;
  depositCount: number;
  totalDeposit: number;
  withdrawCount: number;
  totalWithdraw: number;
  validBet: number;
  ggr: number;
  totalBonus: number;
}

export type AgencyMemberMetrics = Omit<AgencyMemberDailyStat, 'uid' | 'username' | 'phone' | 'date'>;
export type AgencyMemberStat = Omit<AgencyMemberDailyStat, 'date'>;

export const agencyMemberMetricKeys = [
  'depositCount', 'totalDeposit', 'withdrawCount', 'totalWithdraw',
  'validBet', 'ggr', 'totalBonus',
] as const satisfies readonly (keyof AgencyMemberMetrics)[];

const isCount = (key: keyof AgencyMemberMetrics) => key === 'depositCount' || key === 'withdrawCount';
const emptyMetrics = (): AgencyMemberMetrics => ({
  depositCount: 0, totalDeposit: 0, withdrawCount: 0, totalWithdraw: 0,
  validBet: 0, ggr: 0, totalBonus: 0,
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
