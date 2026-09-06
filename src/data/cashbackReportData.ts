import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';

export interface CashbackBreakdownRow {
  gameType: GameType;
  effectiveBet: number;
  rate: number;
  cashback: number;
  multiplier: number;
  rolloverForType: number;
}

export interface CashbackReportRow {
  id: number;
  account: string;
  uid: string;
  vipLevel: number;
  effectiveBet: number;
  cashbackAmount: number;
  rolloverRequired: number;
  rolloverProgress: number;
  rolloverDone: boolean;
  settledAt: string;
  breakdown: CashbackBreakdownRow[];
}

const gameTypes: GameType[] = [
  'Slots',
  'Live',
  'Table',
  'Arcade',
  'Bingo',
  'Fishing',
  'Sports',
];

const rates: Record<GameType, number> = {
  Slots: 0.8,
  Live: 0.3,
  Table: 0.3,
  Arcade: 0.6,
  Bingo: 0.5,
  Fishing: 0.6,
  Sports: 0.4,
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export function generateCashbackReport(count: number = 35): CashbackReportRow[] {
  const rows = Array.from({ length: count }, (_, index) => {
    const breakdownCount = 2 + (index % 3);
    const breakdown: CashbackBreakdownRow[] = Array.from(
      { length: breakdownCount },
      (_, breakdownIndex) => {
        const gameType = gameTypes[(index * 2 + breakdownIndex) % gameTypes.length];
        const effectiveBet = roundCurrency(
          800 + ((index + 3) * (breakdownIndex + 5) * 379) % 24500 + breakdownIndex * 125.5
        );
        const rate = rates[gameType];
        const cashback = roundCurrency((effectiveBet * rate) / 100);
        const multiplier = [1, 1.5, 2][(index + breakdownIndex) % 3];
        const rolloverForType = roundCurrency(cashback * multiplier);

        return {
          gameType,
          effectiveBet,
          rate,
          cashback,
          multiplier,
          rolloverForType,
        };
      }
    );

    const effectiveBet = roundCurrency(
      breakdown.reduce((sum, item) => sum + item.effectiveBet, 0)
    );
    const cashbackAmount = roundCurrency(
      breakdown.reduce((sum, item) => sum + item.cashback, 0)
    );
    const rolloverRequired = roundCurrency(
      breakdown.reduce((sum, item) => sum + item.rolloverForType, 0)
    );
    const progressRatio = index % 4 === 0 ? 1 : [0.35, 0.6, 0.85][index % 3];
    const rolloverProgress = Math.min(
      rolloverRequired,
      roundCurrency(rolloverRequired * progressRatio)
    );
    const uid = String(810001 + index);

    return {
      id: index + 1,
      account: `member${uid}`,
      uid,
      vipLevel: (index * 7 + 3) % 31,
      effectiveBet,
      cashbackAmount,
      rolloverRequired,
      rolloverProgress,
      rolloverDone: rolloverProgress >= rolloverRequired,
      settledAt: dayjs('2026-09-07 01:30:00')
        .add(Math.floor(index / 3), 'day')
        .add((index % 3) * 37, 'minute')
        .format('YYYY-MM-DD HH:mm:ss'),
      breakdown,
    };
  });

  return rows.sort((a, b) => b.settledAt.localeCompare(a.settledAt));
}
