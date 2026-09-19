import { agencySeed } from '@/lib/agencyUtils';
import { agencyMemberDailyCents } from './memberStats';
import { agencyAccount } from './shared';

export interface AdminAgent {
  uid: string;
  username: string;
}

export const adminAgents: AdminAgent[] = [
  { uid: agencyAccount.uid, username: agencyAccount.username },
  { uid: '80251201', username: 'agent_luna' },
  { uid: '80251202', username: 'agent_nova' },
  { uid: '80251203', username: 'agent_mika' },
  { uid: '80251204', username: 'agent_rico' },
  { uid: '80251205', username: 'agent_sora' },
];

const otherAgents = adminAgents.slice(1);

export const adminMemberAgentAssignments: Record<string, AdminAgent> = Object.fromEntries(
  Array.from({ length: 50 }, (_, index) => `U${10001 + index}`)
    .filter((uid) => agencySeed('admin-agent-assignment', uid) % 10 < 7)
    .map((uid) => [uid, otherAgents[agencySeed('admin-agent-owner', uid) % otherAgents.length]]),
);

const seededRate = (uid: string, date: string, label: string, maxPermille: number) => (
  agencySeed('agency-admin-stat', uid, date, label) % (maxPermille + 1)
);

/** 將代理端的整數分日事件映射成內部後台的個人日統計欄位。 */
export const agencyAdminPersonalStats = agencyMemberDailyCents().map((row) => {
  const excludedBetCents = Math.round(row.validBetCents * seededRate(row.uid, row.date, 'excluded', 80) / 1000);
  const totalBetCents = row.validBetCents + excludedBetCents;
  const fsBetCents = Math.round(row.validBetCents * seededRate(row.uid, row.date, 'fs-bet', 25) / 1000);
  const jpBetCents = Math.round(row.validBetCents * seededRate(row.uid, row.date, 'jp-bet', 15) / 1000);
  const fsGgrCents = Math.round(row.ggrCents * seededRate(row.uid, row.date, 'fs-ggr', 20) / 1000);
  const jpGgrCents = Math.round(row.ggrCents * seededRate(row.uid, row.date, 'jp-ggr', 12) / 1000);
  return {
    date: row.date,
    uid: row.uid,
    username: row.username,
    phone: row.phone,
    agencyUid: agencyAccount.uid,
    agencyUsername: agencyAccount.username,
    depositCount: row.depositCount,
    totalDeposit: row.totalDepositCents / 100,
    withdrawCount: row.withdrawCount,
    totalWithdraw: row.totalWithdrawCents / 100,
    depositFee: Math.round(row.totalDepositCents * seededRate(row.uid, row.date, 'deposit-fee', 12) / 1000) / 100,
    withdrawFee: Math.round(row.totalWithdrawCents * seededRate(row.uid, row.date, 'withdraw-fee', 15) / 1000) / 100,
    totalBet: totalBetCents / 100,
    excludedBet: excludedBetCents / 100,
    validBet: row.validBetCents / 100,
    totalPayout: (totalBetCents - row.ggrCents) / 100,
    ggr: row.ggrCents / 100,
    fsBet: fsBetCents / 100,
    fsGgr: fsGgrCents / 100,
    jpBet: jpBetCents / 100,
    jpGgr: jpGgrCents / 100,
    totalBonus: row.totalBonusCents / 100,
    totalCommission: 0,
    achievedInvitation: false,
  };
});
