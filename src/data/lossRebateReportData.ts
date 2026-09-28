import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';
import { freeSpinRestrictionCatalog } from './mockData';
import {
  DEFAULT_LOSS_REBATE_SETTINGS,
  DEFAULT_OVERRIDE_GROUPS,
  DEFAULT_VIP_RATE_MATRIX,
  LOSS_REBATE_GAME_TYPES,
  LOSS_REBATE_DISPATCH_TIME,
  vipTierOfLevel,
} from './lossRebateConfig';

// 'game' = 指定遊戲（覆蓋層）, 'type' = VIP × 遊戲類型（基準層）。
// 命中優先級 排除遊戲 > 指定遊戲 > VIP × 遊戲類型，一注只命中一條規則。
export type LossRebateRuleTier = 'game' | 'type';

export interface LossRebateBreakdownRow {
  key: string;                // 如 `type-Slots` / `group-override-1`
  ruleTier: LossRebateRuleTier;
  gameTypes: GameType[];      // 分組可包含多個場館
  groupName?: string;         // 僅 game：組名
  groupGames?: string[];      // 僅 game：組內參與遊戲（廠商 + 遊戲名）
  effectiveBet: number;       // 該規則有效投注額
  payout: number;             // 該規則派彩金額
  netLoss: number;            // = effectiveBet - payout，包含玩家淨贏
  rate: number;               // 命中的返利比例 %
  rebate: number;             // = max(netLoss, 0) * rate / 100，四捨五入至分
}

export interface LossRebateReportRow {
  id: number;
  account: string;
  uid: string;
  phone: string;
  vipLevel: number;           // 0-30 數字等級
  vipTier: string;            // Bronze/Silver/Gold/Platinum/Diamond（由 vipLevel 推導）
  statDate: string;           // 統計日期，如 '2026-09-14'
  effectiveBet: number;       // = sum(breakdown.effectiveBet)
  payout: number;             // = sum(breakdown.payout)
  netLoss: number;            // = sum(breakdown.netLoss)
  rebateBeforeCap: number;    // = sum(breakdown.rebate)
  capped: boolean;            // 活動單日返利是否封頂
  rebateAmount: number;       // 實派 = 活動單日封頂後返利
  rolloverRequired: number;   // = rebateAmount * rolloverMultiplier
  dispatchedAt: string;       // 派發時間 'YYYY-MM-DD HH:mm:ss'
  breakdown: LossRebateBreakdownRow[];
}

const { minNetLoss, rebateCap, rolloverMultiplier } = DEFAULT_LOSS_REBATE_SETTINGS;

// mock 統計日期為投注日，派發時間為隔日固定時間。
const MEMBER_COUNT = 14;
const STAT_DATES_COUNT = 5;
const FIRST_STAT_DATE = '2026-09-10';

const STAT_DATES = Array.from({ length: STAT_DATES_COUNT }, (_, dateIndex) =>
  dayjs(FIRST_STAT_DATE).add(dateIndex, 'day').format('YYYY-MM-DD')
);

const roundCurrency = (value: number) => {
  // 避免浮點誤差讓半分邊界少算一分。
  const cents = value * 100;
  return Math.round(cents + Number.EPSILON * Math.abs(cents)) / 100;
};

// Deterministic seeded hash (same helper style as cashbackReportData / memberStatsData)
// so the mock data set is byte-identical on every render / build.
const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildPhone = (uid: string) => `09${10000000 + (hashString(`${uid}-phone`) % 90000000)}`;

export interface LossRebateGameActivity {
  gameType: GameType;
  providerCode: string;
  gameCode: string;
  effectiveBet: number;
  payout: number;
}

const gamePathOf = (game: LossRebateGameActivity) =>
  [game.gameType, game.providerCode, game.gameCode].join('/');

const gameLabelOf = (game: LossRebateGameActivity) => {
  const provider = freeSpinRestrictionCatalog[game.gameType].find(
    (item) => item.code === game.providerCode
  );
  const name = provider?.games.find((item) => item.code === game.gameCode)?.name;
  return `${provider?.name ?? game.providerCode} ${name ?? game.gameCode}`;
};

// 大額淨輸 mock 用來呈現活動單日封頂的案例。
const isWhale = (uid: string, statDate: string) =>
  hashString(`${uid}-${statDate}-whale`) % 4 === 0;

const betOf = (seed: string, whale: boolean) =>
  roundCurrency(
    (whale ? 600000 + (hashString(seed) % 1000000) : 12000 + (hashString(seed) % 88000)) +
      (hashString(`${seed}-cents`) % 100) / 100
  );

// 派彩率 0.880 ~ 1.039：多數規則淨輸，約四分之一的規則玩家反贏（netLoss < 0，不返利）。
const payoutRatioOf = (seed: string) => 0.88 + (hashString(seed) % 160) / 1000;

const buildBreakdownRow = (
  key: string,
  ruleTier: LossRebateRuleTier,
  games: LossRebateGameActivity[],
  rate: number,
  groupName?: string
): LossRebateBreakdownRow[] => {
  if (games.length === 0) return [];
  const effectiveBet = roundCurrency(games.reduce((sum, game) => sum + game.effectiveBet, 0));
  const payout = roundCurrency(games.reduce((sum, game) => sum + game.payout, 0));
  const netLoss = roundCurrency(effectiveBet - payout);

  return [{
    key,
    ruleTier,
    gameTypes: LOSS_REBATE_GAME_TYPES.filter((type) => games.some((game) => game.gameType === type)),
    ...(ruleTier === 'game' ? {
      groupName,
      groupGames: Array.from(new Set(games.map(gameLabelOf))),
    } : {}),
    effectiveBet,
    payout,
    netLoss,
    rate,
    rebate: roundCurrency((Math.max(netLoss, 0) * rate) / 100),
  }];
};

// 先按完整遊戲路徑分配覆蓋組，再將剩餘遊戲分配場館；淨贏組也不回流基準層。
// 排除遊戲的 demo 預設為空，因此輸入包含所有參與遊戲。
export function calculateLossRebateBreakdown(
  games: LossRebateGameActivity[],
  vipLevel: number
): LossRebateBreakdownRow[] {
  const assignedPaths = new Set<string>();
  const groupRows = DEFAULT_OVERRIDE_GROUPS.filter((group) => group.status === 'enabled').flatMap((group) => {
    const paths = new Set(group.gamePaths.map((path) => path.join('/')));
    const groupGames = games.filter((game) => {
      const path = gamePathOf(game);
      return paths.has(path) && !assignedPaths.has(path);
    });
    groupGames.forEach((game) => assignedPaths.add(gamePathOf(game)));
    return buildBreakdownRow(
      `group-${group.key}`, 'game', groupGames, group.rate, group.groupName
    );
  });

  const tier = vipTierOfLevel(vipLevel);
  const typeRows = LOSS_REBATE_GAME_TYPES.flatMap((gameType) =>
    buildBreakdownRow(
      `type-${gameType}`,
      'type',
      games.filter((game) => game.gameType === gameType && !assignedPaths.has(gamePathOf(game))),
      DEFAULT_VIP_RATE_MATRIX[tier][gameType]
    )
  );
  return [...groupRows, ...typeRows];
}

const buildGameActivity = (
  gameType: GameType,
  providerCode: string,
  gameCode: string,
  seed: string,
  whale: boolean
): LossRebateGameActivity => {
  const effectiveBet = betOf(seed, whale);
  return {
    gameType,
    providerCode,
    gameCode,
    effectiveBet,
    payout: roundCurrency(effectiveBet * payoutRatioOf(`${seed}-payout`)),
  };
};

// 產生逐款遊戲 mock，再統一走分組 / 場館路由與門檻計算。
const buildGameActivities = (
  uid: string,
  statDate: string,
  whale: boolean
): LossRebateGameActivity[] => {
  const overridePaths = Array.from(new Set(
    DEFAULT_OVERRIDE_GROUPS.filter((group) => group.status === 'enabled')
      .flatMap((group) => group.gamePaths.map((path) => path.join('/')))
  ));
  const overrideGames = overridePaths.flatMap((path) => {
    const [gameType, providerCode, gameCode] = path.split('/');
    if (hashString(`${uid}-${statDate}-${gameCode}-join`) % 10 >= 5) return [];
    return [buildGameActivity(
      gameType as GameType, providerCode, gameCode, `${uid}-${statDate}-game-${gameCode}`, whale
    )];
  });
  const typeCount = 2 + (hashString(`${uid}-${statDate}-type-count`) % 3); // 2 ~ 4
  const startIndex = hashString(`${uid}-${statDate}-type-start`) % LOSS_REBATE_GAME_TYPES.length;
  // LOSS_REBATE_GAME_TYPES.length is prime and stride < length, so the picked types never repeat.
  const stride = 1 + (hashString(`${uid}-${statDate}-type-stride`) % 3);

  const typeGames = Array.from({ length: typeCount }, (_, index) => {
    const gameType =
      LOSS_REBATE_GAME_TYPES[(startIndex + index * stride) % LOSS_REBATE_GAME_TYPES.length];

    const candidates = freeSpinRestrictionCatalog[gameType].flatMap((provider) =>
      provider.games
        .filter((game) => !overridePaths.includes([gameType, provider.code, game.code].join('/')))
        .map((game) => ({ providerCode: provider.code, gameCode: game.code }))
    );
    if (candidates.length === 0) return [];
    const game = candidates[hashString(`${uid}-${statDate}-${gameType}-game`) % candidates.length];
    return [buildGameActivity(
      gameType, game.providerCode, game.gameCode, `${uid}-${statDate}-type-${gameType}`, whale
    )];
  }).flat();
  return [...overrideGames, ...typeGames];
};

export function generateLossRebateReport(): LossRebateReportRow[] {
  const rows: Omit<LossRebateReportRow, 'id'>[] = [];

  for (let memberIndex = 0; memberIndex < MEMBER_COUNT; memberIndex += 1) {
    const uid = String(810001 + memberIndex);
    // (memberIndex * 7 + 3) % 31 掃過 0~30，五個 VIP 分級都有樣本。
    const vipLevel = (memberIndex * 7 + 3) % 31;
    const vipTier = vipTierOfLevel(vipLevel);
    const activeDates = STAT_DATES.filter(
      (statDate) => hashString(`${uid}-${statDate}-active`) % 10 < 8
    );
    // 無活躍日期時仍產生首日投注樣本，是否派發依活動門檻判斷。
    const memberDates = activeDates.length > 0 ? activeDates : [STAT_DATES[0]];

    memberDates.forEach((statDate) => {
      const whale = isWhale(uid, statDate);
      // 覆蓋層在前，對應 指定遊戲 > VIP × 遊戲類型 的命中優先級。
      // 排除遊戲（預設為空）完全不產列，因此這裡沒有對應的 breakdown。
      const breakdown = calculateLossRebateBreakdown(
        buildGameActivities(uid, statDate, whale), vipLevel
      );
      if (breakdown.length === 0) return;

      const netLoss = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.netLoss, 0)
      );
      if (netLoss <= minNetLoss) return;
      const rebateBeforeCap = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.rebate, 0)
      );
      const capped = rebateCap > 0 && rebateBeforeCap > rebateCap;
      const rebateAmount = capped ? rebateCap : rebateBeforeCap;

      rows.push({
        account: `member${uid}`,
        uid,
        phone: buildPhone(uid),
        vipLevel,
        vipTier,
        statDate,
        effectiveBet: roundCurrency(
          breakdown.reduce((sum, item) => sum + item.effectiveBet, 0)
        ),
        payout: roundCurrency(breakdown.reduce((sum, item) => sum + item.payout, 0)),
        netLoss,
        rebateBeforeCap,
        capped,
        rebateAmount,
        rolloverRequired: roundCurrency(rebateAmount * rolloverMultiplier),
        // 日結：T+1 的派發時間統一批次結算。
        dispatchedAt: dayjs(`${statDate} ${LOSS_REBATE_DISPATCH_TIME}`)
          .add(1, 'day')
          .format('YYYY-MM-DD HH:mm:ss'),
        breakdown,
      });
    });
  }

  return rows
    .sort((a, b) =>
      b.dispatchedAt.localeCompare(a.dispatchedAt) || a.uid.localeCompare(b.uid)
    )
    .map((row, index) => ({ id: index + 1, ...row }));
}
