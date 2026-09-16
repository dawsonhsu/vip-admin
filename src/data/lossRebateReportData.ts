import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';
import { freeSpinRestrictionCatalog } from './mockData';
import {
  DEFAULT_LOSS_CAPS,
  DEFAULT_LOSS_REBATE_SETTINGS,
  DEFAULT_MIN_NET_LOSS,
  DEFAULT_OVERRIDE_GROUPS,
  DEFAULT_VIP_RATE_MATRIX,
  LOSS_REBATE_GAME_TYPES,
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
  netLoss: number;            // = effectiveBet - payout；僅通過門檻的規則產列
  rate: number;               // 命中的返利比例 %
  minNetLoss: number;         // 淨輸需嚴格超過此門檻，達標後以整筆淨輸計算
  rebateBeforeCap: number;    // = netLoss * rate / 100（通過門檻後）
  cap: number;                // 該規則上限；0 = 不限
  capped: boolean;            // 該規則是否觸及上限
  rebate: number;             // 該規則封頂後實派
}

export interface LossRebateReportRow {
  id: number;
  account: string;
  uid: string;
  phone: string;
  vipLevel: number;           // 0-30 數字等級
  vipTier: string;            // Bronze/Silver/Gold/Platinum/Diamond（由 vipLevel 推導）
  statPeriod: string;         // 統計週期標籤，如 '2026-09-14'
  effectiveBet: number;       // = sum(breakdown.effectiveBet)
  payout: number;             // = sum(breakdown.payout)
  netLoss: number;            // = sum(breakdown.netLoss)
  rebateBeforeCap: number;    // = sum(breakdown.rebateBeforeCap)
  capped: boolean;            // 任一規則已封頂（無全活動上限）
  rebateAmount: number;       // 實派 = sum(breakdown.rebate)
  rolloverRequired: number;   // = rebateAmount * rolloverMultiplier
  settledAt: string;          // 結算時間 'YYYY-MM-DD HH:mm:ss'
  breakdown: LossRebateBreakdownRow[];
}

// 全域流水倍數與派發時間取自 Modal Step3 共用預設值；各列門檻 / 上限同樣引用配置。
const ROLLOVER_MULTIPLIER = DEFAULT_LOSS_REBATE_SETTINGS.rolloverMultiplier; // 1 倍
const SETTLE_TIME = DEFAULT_LOSS_REBATE_SETTINGS.dispatchTime;         // '04:00:00'

// mock 以「日結」情境產出：統計週期 = 投注日，結算時間 = T+1 的派發時間。
const MEMBER_COUNT = 14;
const STAT_PERIODS_COUNT = 5;
const FIRST_STAT_PERIOD = '2026-09-10';

const STAT_PERIODS = Array.from({ length: STAT_PERIODS_COUNT }, (_, periodIndex) =>
  dayjs(FIRST_STAT_PERIOD).add(periodIndex, 'day').format('YYYY-MM-DD')
);

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

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

// 大額淨輸 mock 用來呈現各規則獨立封頂的案例。
const isWhale = (uid: string, statPeriod: string) =>
  hashString(`${uid}-${statPeriod}-whale`) % 4 === 0;

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
  minNetLoss: number,
  cap: number,
  groupName?: string
): LossRebateBreakdownRow[] => {
  const effectiveBet = roundCurrency(games.reduce((sum, game) => sum + game.effectiveBet, 0));
  const payout = roundCurrency(games.reduce((sum, game) => sum + game.payout, 0));
  const netLoss = roundCurrency(effectiveBet - payout);

  // 同場館 / 同組先合計（含贏錢遊戲），嚴格超過門檻後，整筆淨輸乘以比例。
  if (netLoss <= 0 || netLoss <= minNetLoss) return [];
  const rebateBeforeCap = roundCurrency((netLoss * rate) / 100);
  const capped = cap > 0 && rebateBeforeCap > cap;

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
    minNetLoss,
    rebateBeforeCap,
    cap,
    capped,
    rebate: capped ? cap : rebateBeforeCap,
  }];
};

// 先按完整遊戲路徑分配覆蓋組，再將剩餘遊戲分配場館；組未達門檻也不回流基準層。
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
      `group-${group.key}`, 'game', groupGames, group.rate, group.minNetLoss, group.cap, group.groupName
    );
  });

  const tier = vipTierOfLevel(vipLevel);
  const typeRows = LOSS_REBATE_GAME_TYPES.flatMap((gameType) =>
    buildBreakdownRow(
      `type-${gameType}`,
      'type',
      games.filter((game) => game.gameType === gameType && !assignedPaths.has(gamePathOf(game))),
      DEFAULT_VIP_RATE_MATRIX[tier][gameType],
      DEFAULT_MIN_NET_LOSS[gameType],
      DEFAULT_LOSS_CAPS[gameType]
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
  statPeriod: string,
  whale: boolean
): LossRebateGameActivity[] => {
  const overridePaths = Array.from(new Set(
    DEFAULT_OVERRIDE_GROUPS.filter((group) => group.status === 'enabled')
      .flatMap((group) => group.gamePaths.map((path) => path.join('/')))
  ));
  const overrideGames = overridePaths.flatMap((path) => {
    const [gameType, providerCode, gameCode] = path.split('/');
    if (hashString(`${uid}-${statPeriod}-${gameCode}-join`) % 10 >= 5) return [];
    return [buildGameActivity(
      gameType as GameType, providerCode, gameCode, `${uid}-${statPeriod}-game-${gameCode}`, whale
    )];
  });
  const typeCount = 2 + (hashString(`${uid}-${statPeriod}-type-count`) % 3); // 2 ~ 4
  const startIndex = hashString(`${uid}-${statPeriod}-type-start`) % LOSS_REBATE_GAME_TYPES.length;
  // LOSS_REBATE_GAME_TYPES.length is prime and stride < length, so the picked types never repeat.
  const stride = 1 + (hashString(`${uid}-${statPeriod}-type-stride`) % 3);

  const typeGames = Array.from({ length: typeCount }, (_, index) => {
    const gameType =
      LOSS_REBATE_GAME_TYPES[(startIndex + index * stride) % LOSS_REBATE_GAME_TYPES.length];

    const candidates = freeSpinRestrictionCatalog[gameType].flatMap((provider) =>
      provider.games
        .filter((game) => !overridePaths.includes([gameType, provider.code, game.code].join('/')))
        .map((game) => ({ providerCode: provider.code, gameCode: game.code }))
    );
    if (candidates.length === 0) return [];
    const game = candidates[hashString(`${uid}-${statPeriod}-${gameType}-game`) % candidates.length];
    return [buildGameActivity(
      gameType, game.providerCode, game.gameCode, `${uid}-${statPeriod}-type-${gameType}`, whale
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
    const activePeriods = STAT_PERIODS.filter(
      (statPeriod) => hashString(`${uid}-${statPeriod}-active`) % 10 < 8
    );
    // Every member must stay visible in the demo: fall back to the first period
    // when the skip rule happened to drop all of them.
    const memberPeriods = activePeriods.length > 0 ? activePeriods : [STAT_PERIODS[0]];

    memberPeriods.forEach((statPeriod) => {
      const whale = isWhale(uid, statPeriod);
      // 覆蓋層在前，對應 指定遊戲 > VIP × 遊戲類型 的命中優先級。
      // 排除遊戲（預設為空）完全不產列，因此這裡沒有對應的 breakdown。
      const breakdown = calculateLossRebateBreakdown(
        buildGameActivities(uid, statPeriod, whale), vipLevel
      );
      if (breakdown.length === 0) return;

      const netLoss = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.netLoss, 0)
      );
      const rebateBeforeCap = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.rebateBeforeCap, 0)
      );
      // 各規則封頂後直接加總，不再套全域門檻或上限。
      const capped = breakdown.some((item) => item.capped);
      const rebateAmount = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.rebate, 0)
      );

      rows.push({
        account: `member${uid}`,
        uid,
        phone: buildPhone(uid),
        vipLevel,
        vipTier,
        statPeriod,
        effectiveBet: roundCurrency(
          breakdown.reduce((sum, item) => sum + item.effectiveBet, 0)
        ),
        payout: roundCurrency(breakdown.reduce((sum, item) => sum + item.payout, 0)),
        netLoss,
        rebateBeforeCap,
        capped,
        rebateAmount,
        rolloverRequired: roundCurrency(rebateAmount * ROLLOVER_MULTIPLIER),
        // 日結：T+1 的派發時間統一批次結算。
        settledAt: dayjs(`${statPeriod} ${SETTLE_TIME}`)
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
