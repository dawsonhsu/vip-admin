import dayjs from 'dayjs';
import {
  gameManagementData,
  providerOptions as gameProviderNames,
} from './gameManagementData';

export type TriDepositTabKey = 'dep1' | 'dep2' | 'dep3';
export type DepositSeq = 1 | 2 | 3;
export type RewardFormula = 'ratio' | 'fixed';
export type BonusOrderStatus = 'pending' | 'claimed' | 'expired' | 'reviewing';

export interface TriDepositTierConfig {
  key: string;
  minDeposit: number;
  bonusRatio: number;
  bonusAmount: number;
  freeSpinTotal: number;
  principalRollover: number;
  bonusRollover: number;
}

export interface TriDepositTabConfig {
  key: TriDepositTabKey;
  label: string;
  rewardFormula: RewardFormula;
  bonusCap: number;
  enabled: boolean;
  tiers: TriDepositTierConfig[];
}

export interface TriDepositBonusOrderRecord {
  id: string;
  orderId: string;
  orderStatus: BonusOrderStatus;
  claimedAt: string;
  phone: string;
  account: string;
  uid: string;
  depositSeq: DepositSeq;
  depositAmount: number;
  bonusAmount: number;
  totalRolloverRequired: number;
  freeSpinTotal: number;
  freeSpinUnused: number;
  cumulativePayout: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface GameSelectOption extends SelectOption {
  provider: string;
  gameType: string;
}

const depositLabels: Record<TriDepositTabKey, string> = {
  dep1: '首存',
  dep2: '二存',
  dep3: '三存',
};

const createDefaultTiers = (tabKey: TriDepositTabKey): TriDepositTierConfig[] =>
  [100, 200, 300, 400, 500].map((minDeposit, index) => ({
    key: `${tabKey}-tier-${index + 1}`,
    minDeposit,
    bonusRatio: 1,
    bonusAmount: Math.round(minDeposit * 0.01),
    freeSpinTotal: index + 1,
    principalRollover: index < 3 ? 1 : 2,
    bonusRollover: Math.min(index + 1, 3),
  }));

export const tierConfigDefault: Record<TriDepositTabKey, TriDepositTabConfig> = {
  dep1: {
    key: 'dep1',
    label: depositLabels.dep1,
    rewardFormula: 'ratio',
    bonusCap: 500,
    enabled: true,
    tiers: createDefaultTiers('dep1'),
  },
  dep2: {
    key: 'dep2',
    label: depositLabels.dep2,
    rewardFormula: 'ratio',
    bonusCap: 500,
    enabled: true,
    tiers: createDefaultTiers('dep2'),
  },
  dep3: {
    key: 'dep3',
    label: depositLabels.dep3,
    rewardFormula: 'ratio',
    bonusCap: 500,
    enabled: true,
    tiers: createDefaultTiers('dep3'),
  },
};

export const depositChannels = [
  'GRAB',
  'INSTA',
  'maya',
  'Gcash',
  'QRPH',
  'PESONET',
  'PALAWAN',
  'UBP',
  'COINS',
  'BPI',
];

export const defaultSelectedDepositChannels = [
  'GRAB',
  'maya',
  'Gcash',
  'QRPH',
  'PALAWAN',
  'UBP',
  'COINS',
  'BPI',
];

export const bonusOrderStatusOptions: SelectOption[] = [
  { value: 'pending', label: '未领取' },
  { value: 'claimed', label: '已领取' },
  { value: 'expired', label: '已过期' },
  { value: 'reviewing', label: '待审核' },
];

export const providerOptions: SelectOption[] = gameProviderNames.map((provider) => ({
  value: provider,
  label: provider,
}));

export const gameOptions: GameSelectOption[] = gameManagementData
  .filter((game) => game.hasFreeSpin || game.gameType === 'Slot')
  .slice(0, 24)
  .map((game) => ({
    value: game.gameId,
    label: game.gameNameEn,
    provider: game.provider,
    gameType: game.gameType,
  }));

const accountSeeds = [
  'newbie_maya',
  'fresh_spin',
  'tri_deposit_ace',
  'gcash_lucky',
  'grab_rider',
  'slot_starter',
  'palawan_player',
  'coin_hunter',
  'bpi_first',
  'qrph_hero',
];

const createTodayClaimedAt = () => {
  const todayStart = dayjs().startOf('day');
  const now = dayjs();
  const maxOffsetMs = Math.max(0, now.diff(todayStart, 'millisecond'));
  const offsetMs = Math.floor(Math.random() * (maxOffsetMs + 1));

  return todayStart.add(offsetMs, 'millisecond').format('YYYY-MM-DD HH:mm:ss');
};

export const bonusOrderRecords: TriDepositBonusOrderRecord[] = Array.from(
  { length: 30 },
  (_, index) => {
    const depositSeq = ((index % 3) + 1) as DepositSeq;
    const orderStatus: BonusOrderStatus = 'claimed';
    const depositAmount = [100, 200, 300, 400, 500, 800, 1200, 1600, 2000, 2500][index % 10];
    const bonusAmount = Number((depositAmount * 0.01 * depositSeq).toFixed(2));
    const freeSpinTotal = (index % 5) + 1;
    const freeSpinUnused = Math.max(0, freeSpinTotal - ((index % 4) + 1));
    const claimedAt = createTodayClaimedAt();

    return {
      id: `tri-${index + 1}`,
      orderId: `NTD-20260523-${String(index + 1).padStart(4, '0')}`,
      orderStatus,
      claimedAt,
      phone: `09${String(171234500 + index).slice(0, 9)}`,
      account: `${accountSeeds[index % accountSeeds.length]}_${index + 1}`,
      uid: `U${String(900001 + index)}`,
      depositSeq,
      depositAmount,
      bonusAmount,
      totalRolloverRequired: depositAmount * (depositSeq === 1 ? 1 : 2) + bonusAmount * depositSeq,
      freeSpinTotal,
      freeSpinUnused,
      cumulativePayout: Number(
        (freeSpinTotal * (4.6 + (index % 4) * 1.8) + bonusAmount * (0.25 + depositSeq * 0.08)).toFixed(2)
      ),
    };
  }
);
