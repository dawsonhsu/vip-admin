import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';

export interface CashbackBreakdownRow {
  gameType: GameType;
  effectiveBet: number;      // 該類型有效投注額
  rate: number;              // 返利率 %
  cashbackBeforeCap: number; // 封頂前返利金額 = effectiveBet * rate / 100
  cap: number;               // 該類型返利上限，0 = 不限
  cashback: number;          // 實派返利金額 = cap > 0 ? min(cashbackBeforeCap, cap) : cashbackBeforeCap
  capped: boolean;           // cap > 0 && cashbackBeforeCap > cap
  multiplier: number;        // 打碼倍數
  rolloverForType: number;   // 該類型打碼要求 = cashback(實派) * multiplier
}

export interface CashbackReportRow {
  id: number;
  account: string;
  uid: string;
  phone: string;
  vipLevel: number;
  statDate: string;         // 統計日期（投注發生日）
  effectiveBet: number;
  cashbackAmount: number;   // = sum(breakdown.cashback) 實派
  rolloverRequired: number; // = sum(breakdown.rolloverForType)
  settledAt: string;        // T+1 隔日凌晨結算時間
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

// Per rule / per member / per day cashback cap. 0 means unlimited.
// Mirrors DEFAULT_CAPS in CashbackConfigModal.
const caps: Record<GameType, number> = {
  Slots: 500,
  Live: 0,
  Table: 0,
  Arcade: 0,
  Bingo: 0,
  Fishing: 300,
  Sports: 0,
};

const MEMBER_COUNT = 12;
const STAT_DAYS = 5;
const FIRST_STAT_DATE = '2026-09-01';

const STAT_DATES = Array.from({ length: STAT_DAYS }, (_, dayIndex) =>
  dayjs(FIRST_STAT_DATE).add(dayIndex, 'day').format('YYYY-MM-DD')
);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

// Deterministic seeded hash (same helper style as memberStatsData) so the mock
// data set is byte-identical on every render / build.
const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildPhone = (uid: string) => `09${10000000 + (hashString(`${uid}-phone`) % 90000000)}`;

const buildBreakdown = (
  uid: string,
  statDate: string,
  memberIndex: number,
  dayIndex: number
): CashbackBreakdownRow[] => {
  const typeCount = 2 + (hashString(`${uid}-${statDate}-type-count`) % 3); // 2 ~ 4
  const startIndex = hashString(`${uid}-${statDate}-type-start`) % gameTypes.length;
  // gameTypes.length is prime and stride < length, so the picked types never repeat.
  const stride = 1 + (hashString(`${uid}-${statDate}-type-stride`) % 3);

  return Array.from({ length: typeCount }, (_, index) => {
    const gameType = gameTypes[(startIndex + index * stride) % gameTypes.length];
    // High-roller rows are the only ones large enough to push Slots / Fishing
    // cashback past the 500 / 300 caps, so the demo always shows 已封頂 rows.
    const isHighRoller =
      caps[gameType] > 0 &&
      hashString(`${uid}-${statDate}-${gameType}-high-roller`) % 4 === 0;
    const effectiveBet = roundCurrency(
      isHighRoller
        ? 70000 + (((memberIndex + 2) * (dayIndex + 3) * (index + 7) * 911) % 90000)
        : 800 +
            (((memberIndex + 3) * (dayIndex + 2) * (index + 5) * 379) % 24200) +
            index * 125.5
    );
    const rate = rates[gameType];
    const cap = caps[gameType];
    const cashbackBeforeCap = roundCurrency((effectiveBet * rate) / 100);
    const capped = cap > 0 && cashbackBeforeCap > cap;
    const cashback = capped ? cap : cashbackBeforeCap;
    const multiplier = [1, 1.5, 2][(memberIndex + dayIndex + index) % 3];
    const rolloverForType = roundCurrency(cashback * multiplier);

    return {
      gameType,
      effectiveBet,
      rate,
      cashbackBeforeCap,
      cap,
      cashback,
      capped,
      multiplier,
      rolloverForType,
    };
  });
};

export function generateCashbackReport(): CashbackReportRow[] {
  const rows: Omit<CashbackReportRow, 'id'>[] = [];

  for (let memberIndex = 0; memberIndex < MEMBER_COUNT; memberIndex += 1) {
    const uid = String(810001 + memberIndex);
    const activeDates = STAT_DATES.filter(
      (statDate) => hashString(`${uid}-${statDate}`) % 10 < 7
    );
    // Every member must stay visible in the demo: fall back to day 1 when the
    // skip rule happened to drop all of their days.
    const memberDates = activeDates.length > 0 ? activeDates : [STAT_DATES[0]];

    memberDates.forEach((statDate) => {
      const dayIndex = STAT_DATES.indexOf(statDate);
      const breakdown = buildBreakdown(uid, statDate, memberIndex, dayIndex);

      rows.push({
        account: `member${uid}`,
        uid,
        phone: buildPhone(uid),
        vipLevel: (memberIndex * 7 + 3) % 31,
        statDate,
        effectiveBet: roundCurrency(
          breakdown.reduce((sum, item) => sum + item.effectiveBet, 0)
        ),
        cashbackAmount: roundCurrency(
          breakdown.reduce((sum, item) => sum + item.cashback, 0)
        ),
        rolloverRequired: roundCurrency(
          breakdown.reduce((sum, item) => sum + item.rolloverForType, 0)
        ),
        // T+1: settled the next morning from 01:30, staggered per member.
        settledAt: dayjs(`${statDate} 01:30:00`)
          .add(1, 'day')
          .add(memberIndex * 3, 'minute')
          .format('YYYY-MM-DD HH:mm:ss'),
        breakdown,
      });
    });
  }

  return rows
    .sort((a, b) =>
      b.settledAt.localeCompare(a.settledAt) || a.uid.localeCompare(b.uid)
    )
    .map((row, index) => ({ id: index + 1, ...row }));
}
