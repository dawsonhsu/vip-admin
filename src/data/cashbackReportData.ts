import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';

// 'game' = 指定遊戲（覆蓋層）, 'type' = 遊戲類型（基準層）。
// Hit priority is 指定遊戲 > 遊戲類型, so one bet only ever matches one rule.
export type CashbackRuleTier = 'game' | 'type';

export interface CashbackBreakdownRow {
  key: string;               // 唯一 key，例如 `type-Slots` / `game-super_ace`
  ruleTier: CashbackRuleTier;
  gameType: GameType;        // 指定遊戲列也帶它所屬的遊戲類型
  gameName?: string;         // 僅 ruleTier === 'game'：遊戲名，如 'Super Ace'
  providerName?: string;     // 僅 ruleTier === 'game'：廠商，如 'JILI'
  effectiveBet: number;      // 該規則有效投注額
  rate: number;              // 返利率 %
  cashbackBeforeCap: number; // 封頂前返利金額 = effectiveBet * rate / 100
  cap: number;               // 該規則返利上限，0 = 不限
  cashback: number;          // 實派返利金額 = cap > 0 ? min(cashbackBeforeCap, cap) : cashbackBeforeCap
  capped: boolean;           // cap > 0 && cashbackBeforeCap > cap
  multiplier: number;        // 打碼倍數
  rolloverForType: number;   // 該規則打碼要求 = cashback(實派) * multiplier
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
  gameRuleCashback: number; // = sum(breakdown where ruleTier === 'game').cashback
  typeRuleCashback: number; // = sum(breakdown where ruleTier === 'type').cashback
  settledAt: string;        // T+1 04:00:00 結算時間
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

// Override tier (指定遊戲). Mirrors initialOverrideRows in CashbackConfigModal.
const OVERRIDE_GAMES = [
  { code: 'super_ace', name: 'Super Ace', provider: 'JILI', gameType: 'Slots' as GameType },
  { code: 'mahjong_ways', name: 'Mahjong Ways', provider: 'PG', gameType: 'Slots' as GameType },
];
const OVERRIDE_RATE = 1;       // %
const OVERRIDE_CAP = 800;
const OVERRIDE_MULTIPLIER = 1;

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
      key: `type-${gameType}`,
      ruleTier: 'type' as const,
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

// Override-tier rows (指定遊戲). Roughly half of the member-days get one, and a
// smaller slice gets both games, so the demo shows the 指定遊戲 > 遊戲類型
// priority without every row looking the same.
const buildOverrideBreakdown = (
  uid: string,
  statDate: string,
  memberIndex: number,
  dayIndex: number
): CashbackBreakdownRow[] => {
  const bucket = hashString(`${uid}-${statDate}-override`) % 10;
  if (bucket >= 5) return [];
  const gameCount = bucket < 2 ? 2 : 1;
  const startIndex = hashString(`${uid}-${statDate}-override-start`) % OVERRIDE_GAMES.length;

  return Array.from({ length: gameCount }, (_, index) => {
    const game = OVERRIDE_GAMES[(startIndex + index) % OVERRIDE_GAMES.length];
    // High rollers stay above ₱80,000 (1% > the ₱800 cap) and everyone else
    // stays below it, so both 已封頂 and 未封頂 override rows always exist.
    const isHighRoller =
      hashString(`${uid}-${statDate}-${game.code}-override-high`) % 3 === 0;
    const effectiveBet = roundCurrency(
      isHighRoller
        ? 85000 + (((memberIndex + 2) * (dayIndex + 3) * (index + 5) * 733) % 35000)
        : 5000 +
            (((memberIndex + 4) * (dayIndex + 2) * (index + 6) * 617) % 69000) +
            index * 55.5
    );
    const cashbackBeforeCap = roundCurrency((effectiveBet * OVERRIDE_RATE) / 100);
    const capped = cashbackBeforeCap > OVERRIDE_CAP;
    const cashback = capped ? OVERRIDE_CAP : cashbackBeforeCap;

    return {
      key: `game-${game.code}`,
      ruleTier: 'game' as const,
      gameType: game.gameType,
      gameName: game.name,
      providerName: game.provider,
      effectiveBet,
      rate: OVERRIDE_RATE,
      cashbackBeforeCap,
      cap: OVERRIDE_CAP,
      cashback,
      capped,
      multiplier: OVERRIDE_MULTIPLIER,
      rolloverForType: roundCurrency(cashback * OVERRIDE_MULTIPLIER),
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
      // Override rows come first, mirroring the 指定遊戲 > 遊戲類型 hit priority.
      const breakdown = [
        ...buildOverrideBreakdown(uid, statDate, memberIndex, dayIndex),
        ...buildBreakdown(uid, statDate, memberIndex, dayIndex),
      ];

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
        gameRuleCashback: roundCurrency(
          breakdown
            .filter((item) => item.ruleTier === 'game')
            .reduce((sum, item) => sum + item.cashback, 0)
        ),
        typeRuleCashback: roundCurrency(
          breakdown
            .filter((item) => item.ruleTier === 'type')
            .reduce((sum, item) => sum + item.cashback, 0)
        ),
        // T+1 04:00:00 batch settlement (fixed run time for the whole day's turnover).
        settledAt: dayjs(`${statDate} 04:00:00`)
          .add(1, 'day')
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
