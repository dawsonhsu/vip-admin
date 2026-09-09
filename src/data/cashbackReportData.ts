import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';

// 'game' = 指定遊戲（覆蓋層）, 'type' = 遊戲類型（基準層）。
// Hit priority is 指定遊戲 > 遊戲類型, so one bet only ever matches one rule.
export type CashbackRuleTier = 'game' | 'type';

export interface CashbackBreakdownRow {
  key: string;               // 唯一 key，例如 `type-Slots` / `game-super_ace`
  ruleTier: CashbackRuleTier;
  gameType: GameType;        // 指定遊戲列也帶它所屬的遊戲類型
  groupName?: string;        // 僅 ruleTier === 'game'：指定遊戲組名
  groupGames?: string[];     // 僅 group：組內遊戲名列表，供次要文字
  gameName?: string;         // 僅 ruleTier === 'game'：遊戲名，如 'Super Ace'
  providerName?: string;     // 僅 ruleTier === 'game'：廠商，如 'JILI'
  minEffectiveBet: number;   // 起始有效投注額門檻
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

const minBets: Record<GameType, number> = {
  Slots: 1000,
  Live: 2000,
  Table: 2000,
  Arcade: 1000,
  Bingo: 800,
  Fishing: 1000,
  Sports: 2000,
};

const OVERRIDE_GROUPS = [
  {
    id: 'hot_slots',
    name: '熱門電子',
    gameType: 'Slots' as GameType,
    rate: 1,
    cap: 800,
    multiplier: 1,
    minEffectiveBet: 2000,
    games: [
      { code: 'super_ace', name: 'Super Ace', provider: 'JILI' },
      { code: 'mahjong_ways', name: 'Mahjong Ways', provider: 'PG' },
    ],
  },
  {
    id: 'classic_fishing',
    name: '經典捕魚',
    gameType: 'Fishing' as GameType,
    rate: 0.8,
    cap: 500,
    multiplier: 1,
    minEffectiveBet: 1500,
    games: [
      { code: 'fishing_god', name: 'Fishing God', provider: 'JDB' },
      { code: 'golden_shark', name: 'Golden Shark', provider: 'FC' },
    ],
  },
];

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
      minEffectiveBet: minBets[gameType],
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

// 指定遊戲以「組」為單位：組內各遊戲有效投注額合併成一筆，套用該組單一門檻/費率/上限。
const buildGroupBreakdown = (
  uid: string,
  statDate: string,
  memberIndex: number,
  dayIndex: number
): CashbackBreakdownRow[] => {
  return OVERRIDE_GROUPS.flatMap((group) => {
    const bucket = hashString(`${uid}-${statDate}-group-${group.id}`) % 10;
    if (bucket >= 5) return []; // 約半數 member-day 參與該組

    const isHighRoller =
      hashString(`${uid}-${statDate}-${group.id}-high`) % 3 === 0;
    // 組內每款遊戲各自模擬有效投注額，再合併為組有效投注額。
    const groupEffectiveBet = roundCurrency(
      group.games.reduce((sum, _game, idx) => {
        const perGame = isHighRoller
          ? 45000 + (((memberIndex + 2) * (dayIndex + 3) * (idx + 5) * 733) % 30000)
          : 3000 + (((memberIndex + 4) * (dayIndex + 2) * (idx + 6) * 617) % 40000);
        return sum + perGame;
      }, 0)
    );

    // 門檻閘：組有效投注額需「超過」該組門檻才派發。
    if (groupEffectiveBet <= group.minEffectiveBet) return [];

    const cashbackBeforeCap = roundCurrency((groupEffectiveBet * group.rate) / 100);
    const capped = group.cap > 0 && cashbackBeforeCap > group.cap;
    const cashback = capped ? group.cap : cashbackBeforeCap;

    return [
      {
        key: `group-${group.id}`,
        ruleTier: 'game' as const,
        gameType: group.gameType,
        groupName: group.name,
        groupGames: group.games.map((g) => g.name),
        minEffectiveBet: group.minEffectiveBet,
        effectiveBet: groupEffectiveBet,
        rate: group.rate,
        cashbackBeforeCap,
        cap: group.cap,
        cashback,
        capped,
        multiplier: group.multiplier,
        rolloverForType: roundCurrency(cashback * group.multiplier),
      },
    ];
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
        ...buildGroupBreakdown(uid, statDate, memberIndex, dayIndex),
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
