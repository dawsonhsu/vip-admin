import dayjs from 'dayjs';
import { AGENCY_BONUS_SEED, generateAgencyBonuses, type AgencyBonusRow } from './commission';
import { AGENCY_DATA_NOW, AGENCY_MEMBER_SEED, agencyHistoricFirstDepositAt, agencyMembers, agencyMonthProfile } from './shared';
import { agencyEventTime, agencySeed, createRng, rngInt } from '@/lib/agencyUtils';

// 事件金額一律整數「分」；篩選只切同一份事件，絕不因區間重新抽樣。
export interface AgencyCashEvent {
  id: string;
  uid: string;
  created_at: number;
  amount_cents: number;
}

export interface AgencyBetDay {
  uid: string;
  created_at: number;
  valid_bet_cents: number;
  ggr_cents: number;
}

export interface AgencyDailyEvents {
  start_time: number;
  end_time: number;
  deposits: AgencyCashEvent[];
  withdrawals: AgencyCashEvent[];
  bets: AgencyBetDay[];
  // 首存是存款事件的引用，不會再計入存款總額。
  firstDeposits: AgencyCashEvent[];
  bonuses: AgencyBonusRow[];
}

export const AGENCY_DAILY_SEED = agencySeed('agency-daily', 20260916);
const cents = (value: string) => Math.round(Number(value) * 100);

// 以分分攤，尾差歸最後一筆；現金／有效投注每筆至少一分，GGR 可為負數。
function allocateCents(total: number, weights: number[], minimum = 0): number[] {
  if (!weights.length) return [];
  const sign = total < 0 ? -1 : 1;
  const distributable = Math.abs(total) - minimum * weights.length;
  const denominator = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = Math.abs(total);
  return weights.map((weight, index) => {
    const value = index === weights.length - 1
      ? remaining
      : minimum + Math.floor(distributable * weight / denominator);
    remaining -= value;
    return sign * value;
  });
}

export function generateAgencyDailyEvents(seed = AGENCY_DAILY_SEED): AgencyDailyEvents {
  const now = dayjs.unix(AGENCY_DATA_NOW);
  const monthStart = now.startOf('month');
  const windowStart = monthStart.subtract(6, 'month').unix();
  const deposits: AgencyCashEvent[] = [];
  const withdrawals: AgencyCashEvent[] = [];
  const bets: AgencyBetDay[] = [];
  const firstDeposits: AgencyCashEvent[] = [];

  for (const member of agencyMembers) {
    const isNew = member.created_at >= monthStart.unix();
    let historicFirst: AgencyCashEvent | undefined;
    if (!isNew && member.first_deposit === 1) {
      const rng = createRng(agencySeed(seed, member.uid, 'first-deposit'));
      // 首存可延後最多 30 天；月底註冊者夾到本月月初前一秒，不污染本月加總。
      const createdAt = agencyHistoricFirstDepositAt(AGENCY_MEMBER_SEED, member.uid, member.created_at);
      historicFirst = {
        id: `${member.uid}-first-deposit`, uid: member.uid, created_at: createdAt,
        amount_cents: rngInt(rng, 30000, 1500000),
      };
      if (createdAt >= windowStart) {
        firstDeposits.push(historicFirst);
        deposits.push(historicFirst);
      }
    }

    for (let offset = 6; offset >= 0; offset--) {
      const month = monthStart.subtract(offset, 'month');
      const start = Math.max(month.unix(), member.created_at);
      const end = Math.min(AGENCY_DATA_NOW, month.endOf('month').unix());
      if (start > end) continue;
      const rng = createRng(agencySeed(seed, member.uid, month.format('YYYY-MM')));
      const current = offset === 0;
      const profile = agencyMonthProfile(AGENCY_MEMBER_SEED, member.uid, month.format('YYYY-MM'));
      // 各歷史月先判定行為資格，再依年資與當月可活動天數推算金額。
      const ageMonths = Math.max(1, now.diff(dayjs.unix(member.created_at), 'month', true));
      const days = dayjs.unix(end).startOf('day').diff(dayjs.unix(start).startOf('day'), 'day') + 1;
      const scale = (0.65 + rng() * 0.6) / ageMonths * days / month.daysInMonth();
      const depositCents = current ? cents(member.stat.deposit_amount_month) : profile.hasDeposit ? Math.round(cents(member.deposit_total) * scale) : 0;
      const withdrawCents = current ? cents(member.stat.withdraw_amount_month) : profile.hasWithdraw ? Math.round(cents(member.withdraw_total) * scale) : 0;
      const depositCount = current ? member.stat.deposit_count_month : Math.min(depositCents, Math.max(1, Math.round(member.deposit_count * scale)));
      const withdrawCount = current ? member.stat.withdraw_count_month : Math.min(withdrawCents, Math.max(1, Math.round(member.withdraw_count * scale)));

      const cashEvents = (kind: string, total: number, count: number): AgencyCashEvent[] => {
        if (total <= 0 || count <= 0) return [];
        const cashStart = kind === 'deposit' ? Math.max(start, historicFirst?.created_at ?? 0) : start;
        if (cashStart > end) return [];
        const amounts = allocateCents(total, Array.from({ length: count }, () => rngInt(rng, 1, 100)), 1);
        return amounts.map((amount_cents, index) => ({
          id: `${member.uid}-${month.format('YYYYMM')}-${kind}-${index}`,
          uid: member.uid, created_at: agencyEventTime(rng, cashStart, end), amount_cents,
        })).sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id));
      };
      const monthDeposits = cashEvents('deposit', depositCents, depositCount);
      const monthWithdrawals = cashEvents('withdraw', withdrawCents, withdrawCount);
      deposits.push(...monthDeposits);
      withdrawals.push(...monthWithdrawals);
      if (current && isNew && member.first_deposit === 1 && monthDeposits.length) {
        firstDeposits.push(monthDeposits[0]);
      }

      const validBet = current ? cents(member.stat.valid_bet_month) : profile.hasBet ? Math.round(cents(member.stat.valid_bet) * scale) : 0;
      const ggr = current ? cents(member.stat.ggr_month) : profile.hasBet ? Math.round(cents(member.stat.ggr) * scale) : 0;
      if (validBet <= 0) continue;
      const betRng = createRng(agencySeed(seed, member.uid, month.format('YYYY-MM'), 'bet-days'));
      const firstDay = dayjs.unix(start).startOf('day');
      const availableDays = Array.from({ length: days }, (_, index) => firstDay.add(index, 'day').unix());
      const dayCount = rngInt(betRng, 1, Math.min(availableDays.length, validBet, 20));
      const selectedDays: number[] = [];
      // 不依賴存提款日期；按每日已經過的秒數加權、不放回抽樣。
      for (let index = 0; index < dayCount; index++) {
        const weights = availableDays.map((day) => Math.min(end, dayjs.unix(day).endOf('day').unix()) - Math.max(start, day) + 1);
        let draw = betRng() * weights.reduce((sum, weight) => sum + weight, 0);
        const selected = weights.findIndex((weight) => (draw -= weight) < 0);
        selectedDays.push(availableDays.splice(selected, 1)[0]);
      }
      const betDays = selectedDays.sort((a, b) => a - b);
      const validAmounts = allocateCents(validBet, betDays.map(() => rngInt(betRng, 1, 100)), 1);
      const ggrAmounts = allocateCents(ggr, validAmounts);
      betDays.forEach((day, index) => bets.push({
        uid: member.uid,
        created_at: rngInt(betRng, Math.max(start, day), Math.min(end, dayjs.unix(day).endOf('day').unix())),
        valid_bet_cents: validAmounts[index], ggr_cents: ggrAmounts[index],
      }));
    }
  }

  return {
    start_time: windowStart, end_time: AGENCY_DATA_NOW,
    deposits, withdrawals, bets, firstDeposits,
    // 直接複用禮金列表同一 generator 和 seed；包含列表所有審核狀態，保持同口徑。
    bonuses: generateAgencyBonuses(AGENCY_BONUS_SEED)
      .filter((row) => row.created_at >= windowStart && row.created_at <= AGENCY_DATA_NOW),
  };
}

export const agencyDailyEvents = generateAgencyDailyEvents();
