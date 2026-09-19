import dayjs from 'dayjs';
import { agencySeed } from '@/lib/agencyUtils';
import { personalStats } from '@/data/memberStatsData';
import { agencyDailyEvents } from './daily';
import { adminAgents, adminMemberAgentAssignments } from './adminAssignments';
import { buildAgencyRangeStat } from './profile';

export { adminAgents, adminMemberAgentAssignments } from './adminAssignments';

export interface AgencyReportRow {
  uid: string;
  username: string;
  memberCount: number;
  registrationUsers: number;
  loginUsers: number;
  firstDepositUsers: number;
  firstDepositAmount: number;
  depositUsers: number;
  depositCount: number;
  depositAmount: number;
  withdrawUsers: number;
  withdrawCount: number;
  withdrawAmount: number;
  depositWithdrawDiff: number;
  betUsers: number;
  validBet: number;
  ggr: number;
  bonus: number;
  ngr: number;
}

const moneyKeys = [
  'totalDeposit', 'totalWithdraw', 'validBet', 'ggr', 'totalBonus',
] as const;

const sumRows = (rows: typeof personalStats) => {
  const cents = Object.fromEntries(moneyKeys.map((key) => [key, 0])) as Record<(typeof moneyKeys)[number], number>;
  const depositUsers = new Set<string>();
  const withdrawUsers = new Set<string>();
  const betUsers = new Set<string>();
  let depositCount = 0;
  let withdrawCount = 0;
  rows.forEach((row) => {
    depositCount += row.depositCount;
    withdrawCount += row.withdrawCount;
    moneyKeys.forEach((key) => { cents[key] += Math.round(row[key] * 100); });
    if (row.depositCount > 0) depositUsers.add(row.uid);
    if (row.withdrawCount > 0) withdrawUsers.add(row.uid);
    if (row.validBet !== 0) betUsers.add(row.uid);
  });
  return { cents, depositCount, withdrawCount, depositUsers, withdrawUsers, betUsers };
};

export function buildAgencyReportRows(startDate: string, endDate: string): AgencyReportRow[] {
  const startTs = dayjs(startDate).startOf('day').unix();
  const endTs = dayjs(endDate).endOf('day').unix();
  const darren = buildAgencyRangeStat(startTs, endTs);
  const anyEventUsers = new Set<string>();
  const inRange = (row: { uid: string; created_at: number }) => row.created_at >= startTs && row.created_at <= endTs;
  [
    ...agencyDailyEvents.deposits, ...agencyDailyEvents.withdrawals, ...agencyDailyEvents.bets,
    ...agencyDailyEvents.firstDeposits, ...agencyDailyEvents.bonuses,
  ].filter(inRange).forEach((row) => anyEventUsers.add(row.uid));
  const darrenLoginExtra = agencySeed('agent-darren-login', startDate, endDate) % 5;

  return adminAgents.map((agent) => {
    if (agent.username === 'agent_darren') {
      return {
        uid: agent.uid,
        username: agent.username,
        memberCount: darren.members,
        registrationUsers: darren.reg,
        loginUsers: Math.min(darren.members, anyEventUsers.size + darrenLoginExtra),
        firstDepositUsers: darren.first_deposit,
        firstDepositAmount: Number(darren.first_deposit_amount),
        depositUsers: darren.deposit_users,
        depositCount: darren.deposit_count,
        depositAmount: Number(darren.deposit_amount),
        withdrawUsers: darren.withdraw_users,
        withdrawCount: darren.withdraw_count,
        withdrawAmount: Number(darren.withdraw_amount),
        depositWithdrawDiff: Number(darren.dw_diff),
        betUsers: darren.bet_users,
        validBet: Number(darren.valid_bet),
        ggr: Number(darren.ggr),
        bonus: Number(darren.bonus),
        ngr: Number(darren.ngr),
      };
    }

    const rows = personalStats.filter((row) => (
      row.agencyUsername === agent.username && row.date >= startDate && row.date <= endDate
    ));
    const totals = sumRows(rows);
    const memberCount = Object.values(adminMemberAgentAssignments).filter((value) => value.uid === agent.uid).length;
    const registrationUsers = memberCount === 0 ? 0 : agencySeed('agent-reg', agent.uid, startDate, endDate) % (memberCount + 1);
    const firstDepositUsers = registrationUsers === 0 ? 0 : agencySeed('agent-first', agent.uid, startDate, endDate) % (registrationUsers + 1);
    const firstDepositAmountCents = firstDepositUsers === 0 ? 0
      : firstDepositUsers * (20000 + agencySeed('agent-first-amount', agent.uid, startDate, endDate) % 180001);
    const extraLoginUsers = agencySeed('agent-login', agent.uid, startDate, endDate) % 4;
    const ggrCents = totals.cents.ggr;
    const bonusCents = totals.cents.totalBonus;
    return {
      uid: agent.uid,
      username: agent.username,
      memberCount,
      registrationUsers,
      loginUsers: Math.min(memberCount, totals.betUsers.size + extraLoginUsers),
      firstDepositUsers,
      firstDepositAmount: firstDepositAmountCents / 100,
      depositUsers: totals.depositUsers.size,
      depositCount: totals.depositCount,
      depositAmount: totals.cents.totalDeposit / 100,
      withdrawUsers: totals.withdrawUsers.size,
      withdrawCount: totals.withdrawCount,
      withdrawAmount: totals.cents.totalWithdraw / 100,
      depositWithdrawDiff: (totals.cents.totalDeposit - totals.cents.totalWithdraw) / 100,
      betUsers: totals.betUsers.size,
      validBet: totals.cents.validBet / 100,
      ggr: ggrCents / 100,
      bonus: bonusCents / 100,
      ngr: (ggrCents - bonusCents) / 100,
    };
  });
}
