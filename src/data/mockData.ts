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
  checkinDay: string;
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
      checkinDay: dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD'),
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

// ==================== Free Spin Grant (派發記錄) ====================
export interface FreeSpinGrantItem {
  id: string;
  name: string;
  playerId: string;
  sourceType: 'activity' | 'manual';
  sourceActivityName: string | null;
  grantType: 'open' | 'provider' | 'game';
  providerCode: string | null;
  providerName: string | null;
  grantedGames: { code: string; name: string }[] | null;
  selectedGame: { code: string; name: string } | null;
  totalSpins: number;
  usedSpins: number;
  betAmount: number;
  totalWin: number;
  claimStatus: 'claimed' | 'in_use' | 'completed' | 'expired';
  dispatchStatus: 'pending' | 'dispatched' | 'settled' | 'failed';
  vendorEventId: string | null;
  currency: string;
  minWithdraw: number | null;
  maxWithdraw: number | null;
  expireAt: string;
  usedAt: string | null;
  settledAt: string | null;
  failureReason: string | null;
  retryCount: number;
  createdBy: string;
  createdAt: string;
  remark: string | null;
}

// ==================== Free Spin Usage (使用記錄) ====================
export interface FreeSpinUsageItem {
  id: string;
  grantId: string;
  grantName: string;
  playerId: string;
  providerCode: string;
  providerName: string;
  gameCode: string;
  gameName: string;
  vendorRoundId: string;
  betAmount: number;
  winAmount: number;
  netWin: number;
  roundTime: string;
}

const providers = [
  {
    code: 'FC', name: 'FC Game',
    games: [
      { code: 'FC_SWEET', name: 'Sweet Bonanza' },
      { code: 'FC_NIGHT', name: 'Night Market' },
      { code: 'FC_LUCKY', name: 'Lucky Fortune' },
    ],
  },
  {
    code: 'JDB', name: 'JDB',
    games: [
      { code: 'JDB_ZEUS', name: 'Zeus' },
      { code: 'JDB_COW', name: 'Cowboys' },
      { code: 'JDB_FISH', name: 'Fishing God' },
    ],
  },
  {
    code: 'JILI', name: 'JILI',
    games: [
      { code: 'JILI_GOLD', name: 'Golden Empire' },
      { code: 'JILI_CRAZY', name: 'Crazy777' },
      { code: 'JILI_BOOM', name: 'Boom Legend' },
    ],
  },
  {
    code: 'PG', name: 'PG SOFT',
    games: [
      { code: 'PG_MAHJONG', name: 'Mahjong Ways' },
      { code: 'PG_GEMS', name: 'Gems Bonanza' },
      { code: 'PG_DRAGON', name: 'Dragon Hatch' },
    ],
  },
  {
    code: 'PP', name: 'Pragmatic Play',
    games: [
      { code: 'PP_GATES', name: 'Gates of Olympus' },
      { code: 'PP_BIGBASS', name: 'Big Bass Bonanza' },
      { code: 'PP_STARLIGHT', name: 'Starlight Princess' },
    ],
  },
];

const activities = ['春節首存活動', 'VIP月禮', '週年慶活動', '新遊戲推廣', null];
const betAmounts = [0.20, 0.50, 1.00, 2.00, 5.00];
const claimStatuses: FreeSpinGrantItem['claimStatus'][] = ['claimed', 'in_use', 'completed', 'expired'];
const dispatchStatuses: FreeSpinGrantItem['dispatchStatus'][] = ['pending', 'dispatched', 'settled', 'failed'];
const grantNames = ['春節幸運轉', 'VIP尊享轉', '週年大禮轉', '新遊嘗鮮轉', '手動補發轉', '活動回饋轉'];
const createdBys = ['system', 'jack@filbetph.com', 'darren@filbetph.com', 'admin@filbetph.com'];
const failureReasons = [
  '廠商 API 超時（Timeout）',
  '玩家帳號不存在',
  '重複的 vendor_event_id',
  '遊戲維護中',
  '廠商返回：invalid bet amount',
  '參數驗證失敗',
];

export function generateFreeSpinGrants(count: number = 60): FreeSpinGrantItem[] {
  const grants: FreeSpinGrantItem[] = [];
  for (let i = 0; i < count; i++) {
    const grantType = pick<FreeSpinGrantItem['grantType']>(['open', 'provider', 'game']);
    const provider = pick(providers);
    const claimStatus = pick(claimStatuses);
    const sourceType: FreeSpinGrantItem['sourceType'] = Math.random() < 0.7 ? 'activity' : 'manual';
    const activityName = sourceType === 'activity' ? pick(activities.filter(a => a !== null) as string[]) : null;
    const totalSpins = pick([10, 20, 30, 50, 100]);
    const hasUsed = claimStatus === 'in_use' || claimStatus === 'completed';
    const usedSpins = hasUsed ? (claimStatus === 'completed' ? totalSpins : rand(1, totalSpins - 1)) : 0;
    const betAmount = pick(betAmounts);
    const totalWin = hasUsed ? +(usedSpins * betAmount * randDec(0, 3)).toFixed(2) : 0;
    const daysAgo = rand(0, 60);
    const createdAt = dayjs().subtract(daysAgo, 'day').subtract(rand(0, 23), 'hour').format('YYYY-MM-DD HH:mm:ss');
    const expireDays = rand(3, 30);
    const expireAt = dayjs(createdAt).add(expireDays, 'day').format('YYYY-MM-DD HH:mm:ss');
    const usedAt = hasUsed || usedSpins > 0
      ? dayjs(createdAt).add(rand(0, expireDays - 1), 'day').format('YYYY-MM-DD HH:mm:ss')
      : null;

    let grantedGames: { code: string; name: string }[] | null = null;
    let providerCode: string | null = null;
    let providerName: string | null = null;

    if (grantType === 'provider') {
      providerCode = provider.code;
      providerName = provider.name;
    } else if (grantType === 'game') {
      providerCode = provider.code;
      providerName = provider.name;
      const numGames = rand(1, provider.games.length);
      grantedGames = provider.games.slice(0, numGames);
    }

    let selectedGame: { code: string; name: string } | null = null;
    if (hasUsed) {
      if (grantedGames && grantedGames.length > 0) {
        selectedGame = pick(grantedGames);
      } else {
        const useProvider = provider;
        selectedGame = pick(useProvider.games);
        if (grantType === 'open') {
          providerCode = useProvider.code;
          providerName = useProvider.name;
        }
      }
    }

    const dispatchStatus: FreeSpinGrantItem['dispatchStatus'] =
      claimStatus === 'completed' ? 'settled'
      : claimStatus === 'in_use' ? 'dispatched'
      : claimStatus === 'claimed' ? pick(['dispatched', 'pending'] as const)
      : pick(['failed', 'pending'] as const);

    grants.push({
      id: `FSG${String(i + 1).padStart(5, '0')}`,
      name: pick(grantNames),
      playerId: pick(accounts),
      sourceType,
      sourceActivityName: activityName,
      grantType,
      providerCode,
      providerName,
      grantedGames,
      selectedGame,
      totalSpins,
      usedSpins,
      betAmount,
      totalWin,
      claimStatus,
      dispatchStatus,
      vendorEventId: dispatchStatus === 'dispatched' || dispatchStatus === 'settled'
        ? `VE${rand(100000, 999999)}`
        : null,
      currency: 'PHP',
      minWithdraw: Math.random() > 0.4 ? randDec(100, 500) : null,
      maxWithdraw: Math.random() > 0.4 ? randDec(1000, 5000) : null,
      expireAt,
      usedAt,
      settledAt: dispatchStatus === 'settled'
        ? dayjs(usedAt || createdAt).add(rand(1, 24), 'hour').format('YYYY-MM-DD HH:mm:ss')
        : null,
      failureReason: dispatchStatus === 'failed' ? pick(failureReasons) : null,
      retryCount: dispatchStatus === 'failed' ? rand(1, 3) : 0,
      createdBy: pick(createdBys),
      createdAt,
      remark: Math.random() > 0.7 ? '客服手動補發' : null,
    });
  }
  return grants.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function generateFreeSpinUsage(count: number = 120, grants: FreeSpinGrantItem[]): FreeSpinUsageItem[] {
  const usableGrants = grants.filter(g => g.usedSpins > 0);
  if (usableGrants.length === 0) return [];

  const usage: FreeSpinUsageItem[] = [];
  for (let i = 0; i < count; i++) {
    const grant = pick(usableGrants);
    const provider = providers.find(p => p.code === grant.providerCode) || pick(providers);
    const game = grant.selectedGame || (grant.grantedGames ? pick(grant.grantedGames) : pick(provider.games));
    const betAmount = grant.betAmount;
    const winAmount = +(betAmount * randDec(0, 4)).toFixed(2);
    const netWin = +(winAmount - betAmount).toFixed(2);
    const roundTime = grant.usedAt
      ? dayjs(grant.usedAt).add(rand(0, 60), 'minute').format('YYYY-MM-DD HH:mm:ss')
      : dayjs().subtract(rand(0, 30), 'day').format('YYYY-MM-DD HH:mm:ss');

    usage.push({
      id: `FSU${String(i + 1).padStart(6, '0')}`,
      grantId: grant.id,
      grantName: grant.name,
      playerId: grant.playerId,
      providerCode: provider.code,
      providerName: provider.name,
      gameCode: game.code,
      gameName: game.name,
      vendorRoundId: `VR${rand(1000000, 9999999)}`,
      betAmount,
      winAmount,
      netWin,
      roundTime,
    });
  }
  return usage.sort((a, b) => b.roundTime.localeCompare(a.roundTime));
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
