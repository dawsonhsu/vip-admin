import { vipConfigData } from './vipConfigData';
import {
  depositChannels,
  defaultSelectedDepositChannels,
  gameOptions,
  providerOptions,
} from './newMemberTriDepositData';

export { depositChannels, defaultSelectedDepositChannels, gameOptions, providerOptions };

export type VipTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface VipCheckinTierRow {
  key: VipTierName;
  tierName: string;
  vipRange: string;
  // Day 6 / 16 / 26 — bonus only
  day6P: number;
  day6Flow: number;
  day16P: number;
  day16Flow: number;
  day26P: number;
  day26Flow: number;
  // Day 7 / 17 / 27 — bonus + FS
  day7P: number;
  day7Flow: number;
  day7FS: number;
  day7FSFlow: number;
  day17P: number;
  day17Flow: number;
  day17FS: number;
  day17FSFlow: number;
  day27P: number;
  day27Flow: number;
  day27FS: number;
  day27FSFlow: number;
  // Makeup
  makeupDeposit: number;
  makeupLimit: number;
}

const pickMin = (tierRange: string, field: keyof typeof vipConfigData[0]): number => {
  const rows = vipConfigData.filter((r) => r.tierRange === tierRange);
  if (!rows.length) return 0;
  return Math.min(...rows.map((r) => Number(r[field])));
};

const buildTierRow = (
  key: VipTierName,
  tierName: string,
  vipRange: string,
): VipCheckinTierRow => ({
  key,
  tierName,
  vipRange,
  day6P: pickMin(key, 'day6'),
  day6Flow: pickMin(key, 'day6Flow'),
  day16P: pickMin(key, 'day16'),
  day16Flow: pickMin(key, 'day16Flow'),
  day26P: pickMin(key, 'day26'),
  day26Flow: pickMin(key, 'day26Flow'),
  day7P: pickMin(key, 'day7P'),
  day7Flow: pickMin(key, 'day7Flow'),
  day7FS: pickMin(key, 'day7FS'),
  day7FSFlow: pickMin(key, 'day7FSFlow'),
  day17P: pickMin(key, 'day17P'),
  day17Flow: pickMin(key, 'day17Flow'),
  day17FS: pickMin(key, 'day17FS'),
  day17FSFlow: pickMin(key, 'day17FSFlow'),
  day27P: pickMin(key, 'day27P'),
  day27Flow: pickMin(key, 'day27Flow'),
  day27FS: pickMin(key, 'day27FS'),
  day27FSFlow: pickMin(key, 'day27FSFlow'),
  makeupDeposit: pickMin(key, 'makeupDeposit'),
  makeupLimit: pickMin(key, 'makeupLimit'),
});

export const vipCheckinTierDefaults: VipCheckinTierRow[] = [
  buildTierRow('Bronze',   'Bronze（黃銅）',   'V0 ~ V6'),
  buildTierRow('Silver',   'Silver（白銀）',   'V7 ~ V12'),
  buildTierRow('Gold',     'Gold（黃金）',     'V13 ~ V18'),
  buildTierRow('Platinum', 'Platinum（鉑金）', 'V19 ~ V24'),
  buildTierRow('Diamond',  'Diamond（鑽石）',  'V25 ~ V30'),
];

export const vipCheckinDefaultConfig = {
  cycleDays: 27,
  rewardDays: [6, 7, 16, 17, 26, 27],
};
