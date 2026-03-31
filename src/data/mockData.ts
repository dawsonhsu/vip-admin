import dayjs from 'dayjs';

// VIP Tier definitions
export const vipTiers = [
  { range: 'Bronze', levels: [0, 1, 2, 3, 4, 5, 6] },
  { range: 'Silver', levels: [7, 8, 9, 10, 11, 12] },
  { range: 'Gold', levels: [13, 14, 15, 16, 17, 18] },
  { range: 'Platinum', levels: [19, 20, 21, 22, 23, 24] },
  { range: 'Diamond', levels: [25, 26, 27, 28, 29, 30] },
];

export const tierRanges = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

// Helper
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randDec = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2);
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

const accounts = [
  'player_ace', 'lucky_star', 'king_bet', 'golden_fish', 'mega_win',
  'dragon_88', 'royal_flush', 'big_boss', 'phantom_x', 'silver_fox',
  'thunder_01', 'neon_rider', 'alpha_dog', 'moon_walker', 'fire_bird',
  'ocean_wave', 'storm_chas', 'pixel_hero', 'iron_will', 'jade_tiger',
  'ruby_queen', 'blaze_run', 'crystal_k', 'nova_star', 'shadow_z',
  'titan_gold', 'viper_bet', 'wolf_pack', 'eagle_eye', 'lion_heart',
];

const rewardNodes = [6, 7, 16, 17, 26, 27];

function getTierRange(level: number): string {
  if (level <= 6) return 'Bronze';
  if (level <= 12) return 'Silver';
  if (level <= 18) return 'Gold';
  if (level <= 24) return 'Platinum';
  return 'Diamond';
}

// ==================== VIP Check-in Log ====================
export interface CheckinLogItem {
  id: number;
  account: string;
  uid: string;
  vipLevel: number;
  tierRange: string;
  checkinDay: number;
  consecutiveBefore: number;
  consecutiveAfter: number;
  checkinType: 'normal' | 'makeup';
  makeupDeposit: number | null;
  rewardNode: number | null;
  currentCycle: number;
  checkinTime: string;
}

export function generateCheckinLogs(count: number = 51): CheckinLogItem[] {
  const logs: CheckinLogItem[] = [];
  for (let i = 0; i < count; i++) {
    const vipLevel = rand(0, 30);
    const isMakeup = Math.random() < 0.08;
    const before = rand(0, 25);
    const after = before + 1;
    const triggered = rewardNodes.find(n => n > before && n <= after) || null;
    const daysAgo = rand(0, 60);

    logs.push({
      id: i + 1,
      account: pick(accounts),
      uid: `${rand(100000, 999999)}`,
      vipLevel,
      tierRange: getTierRange(vipLevel),
      checkinDay: after,
      consecutiveBefore: before,
      consecutiveAfter: after,
      checkinType: isMakeup ? 'makeup' : 'normal',
      makeupDeposit: isMakeup ? randDec(200, 5000) : null,
      rewardNode: triggered,
      currentCycle: rand(1, 5),
      checkinTime: dayjs().subtract(daysAgo, 'day').subtract(rand(0, 23), 'hour').format('YYYY-MM-DD HH:mm:ss'),
    });
  }
  return logs.sort((a, b) => b.checkinTime.localeCompare(a.checkinTime));
}

// ==================== VIP Rewards ====================
export interface RewardItem {
  id: number;
  account: string;
  uid: string;
  vipLevel: number;
  tierRange: string;
  rewardType: string;
  bonusAmount: number;
  freeSpins: number;
  turnoverMultiplier: number;
  claimStatus: 'pending' | 'claimed';
  distributionDate: string;
  claimDate: string | null;
}

const rewardTypes = ['簽到獎勵', '升級禮金', '生日禮金', '半月禮金', '返現獎勵'];

export function generateRewards(count: number = 35): RewardItem[] {
  const rewards: RewardItem[] = [];
  for (let i = 0; i < count; i++) {
    const vipLevel = rand(0, 30);
    const claimed = Math.random() > 0.3;
    const daysAgo = rand(0, 45);
    const distDate = dayjs().subtract(daysAgo, 'day');

    rewards.push({
      id: i + 1,
      account: pick(accounts),
      uid: `${rand(100000, 999999)}`,
      vipLevel,
      tierRange: getTierRange(vipLevel),
      rewardType: pick(rewardTypes),
      bonusAmount: randDec(10, 500),
      freeSpins: rand(0, 100),
      turnoverMultiplier: pick([1, 2, 3, 5, 8]),
      claimStatus: claimed ? 'claimed' : 'pending',
      distributionDate: distDate.format('YYYY-MM-DD HH:mm:ss'),
      claimDate: claimed ? distDate.add(rand(0, 3), 'day').format('YYYY-MM-DD HH:mm:ss') : null,
    });
  }
  return rewards.sort((a, b) => b.distributionDate.localeCompare(a.distributionDate));
}

// ==================== VIP Config ====================
export interface VipConfigItem {
  id: number;
  tierRange: string;
  vipLevel: number;
  xpRequired: number;
  upgradeBonus: number;
  birthdayBonus: number;
  biweeklyBonus: number;
  depositMin: number;
  flowRequirement: number;
  dailyNegReturn: number;
  makeupLimit: number;
  makeupDeposit: number;
  rewardDay6: number;
  rewardDay7: number;
  rewardDay16: number;
  rewardDay17: number;
  rewardDay26: number;
  rewardDay27: number;
  maintainer: string;
  maintainTime: string;
}

export function generateVipConfig(): VipConfigItem[] {
  const configs: VipConfigItem[] = [];
  let id = 1;

  for (const tier of vipTiers) {
    for (const level of tier.levels) {
      const factor = level + 1;
      configs.push({
        id: id++,
        tierRange: tier.range,
        vipLevel: level,
        xpRequired: level === 0 ? 0 : level * 1000 + rand(0, 500),
        upgradeBonus: level === 0 ? 0 : +(factor * 15).toFixed(0),
        birthdayBonus: +(factor * 10).toFixed(0),
        biweeklyBonus: +(factor * 5).toFixed(0),
        depositMin: Math.max(100, 1000 - level * 30),
        flowRequirement: factor * 3,
        dailyNegReturn: +(0.1 + level * 0.05).toFixed(2),
        makeupLimit: Math.min(1 + Math.floor(level / 6), 5),
        makeupDeposit: Math.max(200, 2000 - level * 60),
        rewardDay6: +(factor * 2).toFixed(0),
        rewardDay7: +(factor * 5).toFixed(0),
        rewardDay16: +(factor * 8).toFixed(0),
        rewardDay17: +(factor * 12).toFixed(0),
        rewardDay26: +(factor * 18).toFixed(0),
        rewardDay27: +(factor * 30).toFixed(0),
        maintainer: pick(['system', 'jack@filbetph.com', 'darren@filbetph.com']),
        maintainTime: dayjs().subtract(rand(0, 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
      });
    }
  }
  return configs;
}
