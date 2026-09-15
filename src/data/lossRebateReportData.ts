import dayjs from 'dayjs';
import type { GameType } from './memberStatsData';
import { freeSpinRestrictionCatalog } from './mockData';
import {
  DEFAULT_LOSS_REBATE_SETTINGS,
  DEFAULT_OVERRIDE_GROUPS,
  DEFAULT_VIP_RATE_MATRIX,
  LOSS_REBATE_GAME_TYPES,
  vipTierOfLevel,
} from './lossRebateConfig';

// 'game' = 指定遊戲（覆蓋層）, 'type' = VIP × 遊戲類型（基準層）。
// 命中優先級 排除遊戲 > 指定遊戲 > VIP × 遊戲類型，一注只命中一條規則。
export type LossRebateRuleTier = 'game' | 'type';

export interface LossRebateBreakdownRow {
  key: string;                // 如 `type-Slots` / `game-super_ace`
  ruleTier: LossRebateRuleTier;
  gameType: GameType;
  groupName?: string;         // 僅 game：組名
  gameName?: string;          // 僅 game
  providerName?: string;      // 僅 game
  effectiveBet: number;       // 該規則有效投注額
  payout: number;             // 該規則派彩金額
  netLoss: number;            // = effectiveBet - payout（可為負，負值不返利）
  rate: number;               // 命中的返利比例 %
  rebate: number;             // = max(netLoss,0) * rate / 100（封頂前，逐規則）
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
  rebateBeforeCap: number;    // = sum(breakdown.rebate)
  capped: boolean;            // rebateCap > 0 && rebateBeforeCap > rebateCap
  rebateAmount: number;       // 實派 = capped ? rebateCap : rebateBeforeCap
  rolloverRequired: number;   // = rebateAmount * rolloverMultiplier
  settledAt: string;          // 結算時間 'YYYY-MM-DD HH:mm:ss'
  breakdown: LossRebateBreakdownRow[];
}

// 全活動共用一組設定，直接取自 lossRebateConfig（＝ Modal Step3 的預設值），
// 不在此重新定義數字，避免配置與報表兩邊漂移。
const MIN_NET_LOSS = DEFAULT_LOSS_REBATE_SETTINGS.minNetLoss;          // 500：當期淨輸值門檻
const REBATE_CAP = DEFAULT_LOSS_REBATE_SETTINGS.rebateCap;             // 5000；undefined = 無上限
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

interface OverrideGameRef {
  key: string;
  groupName: string;
  gameType: GameType;
  providerName: string;
  gameName: string;
  rate: number;
}

// 覆蓋層以「指定遊戲」逐款展開（明細一款遊戲一列），比例取該組比例、不分 VIP 分級。
// 廠商 / 遊戲顯示名由 freeSpinRestrictionCatalog 反查，確保與配置目錄同一份資料。
const ENABLED_OVERRIDE_GAMES: OverrideGameRef[] = DEFAULT_OVERRIDE_GROUPS
  .filter((group) => group.status === 'enabled')
  .flatMap((group) =>
    group.gamePaths.map(([gameTypePath, providerCode, gameCode]) => {
      const gameType = gameTypePath as GameType;
      const provider = freeSpinRestrictionCatalog[gameType]?.find(
        (item) => item.code === providerCode
      );
      const game = provider?.games.find((item) => item.code === gameCode);

      return {
        key: gameCode,
        groupName: group.groupName,
        gameType,
        providerName: provider?.name ?? providerCode,
        gameName: game?.name ?? gameCode,
        rate: group.rate,
      };
    })
  );

// 巨額輸家（whale）才有機會把單期返利推過 ₱5,000 上限，讓報表一定看得到「已封頂」案例。
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
  gameType: GameType,
  rate: number,
  seed: string,
  whale: boolean,
  extra: Pick<LossRebateBreakdownRow, 'groupName' | 'gameName' | 'providerName'> = {}
): LossRebateBreakdownRow => {
  const effectiveBet = betOf(seed, whale);
  const payout = roundCurrency(effectiveBet * payoutRatioOf(`${seed}-payout`));
  const netLoss = roundCurrency(effectiveBet - payout);

  return {
    key,
    ruleTier,
    gameType,
    ...extra,
    effectiveBet,
    payout,
    netLoss,
    rate,
    // 淨輸值 ≤ 0（玩家贏錢）時不返利。
    rebate: roundCurrency((Math.max(netLoss, 0) * rate) / 100),
  };
};

const buildOverrideBreakdown = (
  uid: string,
  statPeriod: string,
  whale: boolean
): LossRebateBreakdownRow[] =>
  ENABLED_OVERRIDE_GAMES.flatMap((ref) => {
    // 約半數 member-period 會玩到該款指定遊戲。
    if (hashString(`${uid}-${statPeriod}-${ref.key}-join`) % 10 >= 5) return [];

    return [
      buildBreakdownRow(
        `game-${ref.key}`,
        'game',
        ref.gameType,
        ref.rate,
        `${uid}-${statPeriod}-game-${ref.key}`,
        whale,
        {
          groupName: ref.groupName,
          gameName: ref.gameName,
          providerName: ref.providerName,
        }
      ),
    ];
  });

// 基準層：該遊戲類型「扣掉指定遊戲之後」的剩餘投注，比例查 VIP 分級 × 遊戲類型矩陣。
const buildTypeBreakdown = (
  uid: string,
  statPeriod: string,
  vipLevel: number,
  whale: boolean
): LossRebateBreakdownRow[] => {
  const tier = vipTierOfLevel(vipLevel);
  const typeCount = 2 + (hashString(`${uid}-${statPeriod}-type-count`) % 3); // 2 ~ 4
  const startIndex = hashString(`${uid}-${statPeriod}-type-start`) % LOSS_REBATE_GAME_TYPES.length;
  // LOSS_REBATE_GAME_TYPES.length is prime and stride < length, so the picked types never repeat.
  const stride = 1 + (hashString(`${uid}-${statPeriod}-type-stride`) % 3);

  return Array.from({ length: typeCount }, (_, index) => {
    const gameType =
      LOSS_REBATE_GAME_TYPES[(startIndex + index * stride) % LOSS_REBATE_GAME_TYPES.length];

    return buildBreakdownRow(
      `type-${gameType}`,
      'type',
      gameType,
      DEFAULT_VIP_RATE_MATRIX[tier][gameType],
      `${uid}-${statPeriod}-type-${gameType}`,
      whale
    );
  });
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
      const breakdown = [
        ...buildOverrideBreakdown(uid, statPeriod, whale),
        ...buildTypeBreakdown(uid, statPeriod, vipLevel, whale),
      ];

      const netLoss = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.netLoss, 0)
      );
      // 最低輸值是「全活動 / 單結算週期」門檻，不是逐規則：當期淨輸值總額未達門檻
      // 就整位會員不派發，也不入報表。
      if (netLoss < MIN_NET_LOSS) return;

      const rebateBeforeCap = roundCurrency(
        breakdown.reduce((sum, item) => sum + item.rebate, 0)
      );
      // 返利上限同樣是活動層級：套用於單會員單結算週期的返利總額，非逐規則。
      // 僅 undefined 代表無上限；0 是合法上限值（＝停發），不可用 truthiness 判斷。
      const capped = REBATE_CAP !== undefined && rebateBeforeCap > REBATE_CAP;
      const rebateAmount = capped ? REBATE_CAP : rebateBeforeCap;

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
