import type { GameType } from './memberStatsData';

/**
 * 輸值返利（Loss Rebate）共用設定。
 *
 * 計算式：有效投注額 − 派彩金額 = 淨輸值；淨輸值 × 返利比例 = 返利金額。
 * 淨輸值 ≤ 0（玩家贏錢）時不派發。
 *
 * 這份檔案同時被 LossRebateConfigModal（後台配置預設值）與
 * lossRebateReportData（報表 mock 推算）引用，避免兩邊數值漂移。
 */

export const LOSS_REBATE_ACTIVITY_ID = 33;
export const LOSS_REBATE_ACTIVITY_NAME = '輸值返利';

/** 矩陣欄位順序（與 memberStatsData 的 gameTypes 同一組，僅排序不同以對齊需求版面） */
export const LOSS_REBATE_GAME_TYPES: GameType[] = [
  'Slots',
  'Live',
  'Table',
  'Arcade',
  'Bingo',
  'Fishing',
  'Sports',
];

export type VipTierKey = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface VipTierDef {
  key: VipTierKey;
  label: string;
  /** VIP 數字等級區間（含頭含尾），取自 src/data/vipConfigData.ts 的 tierRange 分佈 */
  minLevel: number;
  maxLevel: number;
  levelRange: string;
}

export const VIP_TIERS: VipTierDef[] = [
  { key: 'Bronze', label: 'Bronze', minLevel: 0, maxLevel: 6, levelRange: 'VIP 0-6' },
  { key: 'Silver', label: 'Silver', minLevel: 7, maxLevel: 12, levelRange: 'VIP 7-12' },
  { key: 'Gold', label: 'Gold', minLevel: 13, maxLevel: 18, levelRange: 'VIP 13-18' },
  { key: 'Platinum', label: 'Platinum', minLevel: 19, maxLevel: 24, levelRange: 'VIP 19-24' },
  { key: 'Diamond', label: 'Diamond', minLevel: 25, maxLevel: 30, levelRange: 'VIP 25-30' },
];

/** 由 VIP 數字等級反查分級；超出 30 一律歸 Diamond */
export function vipTierOfLevel(level: number): VipTierKey {
  const tier = VIP_TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel);
  return tier ? tier.key : 'Diamond';
}

export type VipRateMatrix = Record<VipTierKey, Record<GameType, number>>;

/** 基準層預設返利比例（%），依 VIP 分級遞增 */
export const DEFAULT_VIP_RATE_MATRIX: VipRateMatrix = {
  Bronze: { Slots: 1.0, Live: 0.5, Table: 0.5, Arcade: 0.8, Bingo: 0.6, Fishing: 0.8, Sports: 0.4 },
  Silver: { Slots: 1.5, Live: 0.8, Table: 0.8, Arcade: 1.2, Bingo: 0.9, Fishing: 1.2, Sports: 0.6 },
  Gold: { Slots: 2.0, Live: 1.0, Table: 1.0, Arcade: 1.5, Bingo: 1.2, Fishing: 1.5, Sports: 0.8 },
  Platinum: { Slots: 2.5, Live: 1.3, Table: 1.3, Arcade: 2.0, Bingo: 1.5, Fishing: 2.0, Sports: 1.0 },
  Diamond: { Slots: 3.0, Live: 1.6, Table: 1.6, Arcade: 2.5, Bingo: 1.8, Fishing: 2.5, Sports: 1.2 },
};

export type RowStatus = 'enabled' | 'disabled';

export interface LossRebateOverrideGroup {
  key: string;
  groupName: string;
  /** Cascader 三層路徑：[遊戲類型, 廠商代碼, 遊戲代碼] */
  gamePaths: string[][];
  /** 覆蓋比例（%），不分 VIP 分級 */
  rate: number;
  status: RowStatus;
}

/**
 * 覆蓋層預設分組（即需求中的「遊戲推薦」，同一份資料）。
 * 所有 code 均已對照 src/data/mockData.ts 的 freeSpinRestrictionCatalog 驗證存在。
 */
export const DEFAULT_OVERRIDE_GROUPS: LossRebateOverrideGroup[] = [
  {
    key: 'override-1',
    groupName: '熱門電子',
    gamePaths: [
      ['Slots', 'JILI', 'super_ace'],
      ['Slots', 'PG', 'mahjong_ways'],
    ],
    rate: 2.5,
    status: 'enabled',
  },
  {
    key: 'override-2',
    groupName: '經典捕魚',
    gamePaths: [
      ['Fishing', 'JDB', 'fishing_god'],
      ['Fishing', 'FC', 'golden_shark'],
    ],
    rate: 2.0,
    status: 'enabled',
  },
];

export type SettleCycle = 'daily' | 'weekly' | 'monthly';

export const SETTLE_CYCLE_OPTIONS: { value: SettleCycle; label: string }[] = [
  { value: 'daily', label: '日結' },
  { value: 'weekly', label: '週結' },
  { value: 'monthly', label: '月結' },
];

/**
 * 返利設置為「全活動共用一組」，不分 VIP、不分遊戲。
 * rebateCap 為 undefined 代表無上限（需求原文：空置為無上限）。
 */
export interface LossRebateSettings {
  minNetLoss: number;
  rebateCap?: number;
  rolloverMultiplier: number;
  settleCycle: SettleCycle;
  /** 'HH:mm:ss' */
  dispatchTime: string;
}

export const DEFAULT_LOSS_REBATE_SETTINGS: LossRebateSettings = {
  minNetLoss: 500,
  rebateCap: 5000,
  rolloverMultiplier: 1,
  settleCycle: 'daily',
  dispatchTime: '04:00:00',
};

export const DEFAULT_POPUP_TEXT = 'Congratulations! You received Loss Rebate Bonus!';

export const DEFAULT_ACTIVITY_RULES = [
  '<h3>Loss Rebate Bonus Rules</h3>',
  '<ol>',
  '<li>Loss rebate is calculated as valid turnover minus payout for the settlement period; only a net loss qualifies.</li>',
  '<li>The rebate rate is determined by your VIP tier and the game type; selected games may use their own rate.</li>',
  '<li>Excluded games are not counted towards the loss rebate.</li>',
  '<li>Your net loss must reach the minimum loss amount, and the payout is limited by the rebate cap.</li>',
  '<li>Filbet reserves the right of final interpretation of this promotion.</li>',
  '</ol>',
].join('');
