import dayjs from 'dayjs';
import { memberStatMembers, type GameType } from './memberStatsData';

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
  coverImage: string | null;
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
  wagerMultiple: number | null;
  gameRestriction: {
    gameTypes: GameType[];
    providers: string[];
    games: { code: string; name: string }[];
  } | null;
  claimStatus: 'claimed' | 'in_use' | 'completed' | 'expired' | 'voided';
  dispatchSummary: {
    lastAttemptAt: string | null;
    lastAttemptResult: 'success' | 'fail' | null;
    lastFailureReason: string | null;
    failedAttemptCount: number;
    successAttemptCount: number;
    attempts: Array<{
      attemptedAt: string;
      result: 'success' | 'fail';
      vendorErrorCode: string | null;
      vendorMessage: string | null;
    }>;
  };
  vendorEventId: string | null;
  currency: string;
  minWithdraw: number | null;
  maxWithdraw: number | null;
  expireAt: string;
  usedAt: string | null;
  settledAt: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdBy: string;
  createdAt: string;
  remark: string | null;
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
const claimStatuses: Exclude<FreeSpinGrantItem['claimStatus'], 'voided'>[] = ['claimed', 'in_use', 'completed', 'expired'];
const grantNames = ['春節幸運轉', 'VIP尊享轉', '週年大禮轉', '新遊嘗鮮轉', '手動補發轉', '活動回饋轉'];
const createdBys = ['system', 'jack@filbetph.com', 'darren@filbetph.com', 'admin@filbetph.com'];
const vendorErrorCodes = [
  'vendor_timeout',
  'vendor_5xx',
  'invalid_player',
  'duplicate',
  'game_unavailable',
  'vendor_maintenance',
] as const;
const wagerMultiples = [1, 5, 10, 20, 30];

const toSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const mockFreeSpinCoverImages = [
  toSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f766e" />
        <stop offset="100%" stop-color="#5eead4" />
      </linearGradient>
    </defs>
    <rect width="400" height="500" rx="28" fill="url(#g1)" />
    <circle cx="320" cy="90" r="72" fill="rgba(255,255,255,0.18)" />
    <text x="36" y="118" fill="#ffffff" font-size="28" font-family="Arial, sans-serif" font-weight="700">FREE SPIN</text>
    <text x="36" y="164" fill="#ccfbf1" font-size="18" font-family="Arial, sans-serif">Lucky Night</text>
    <text x="36" y="420" fill="#ffffff" font-size="88" font-family="Arial, sans-serif" font-weight="700">FS</text>
  </svg>`),
  toSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1d4ed8" />
        <stop offset="100%" stop-color="#93c5fd" />
      </linearGradient>
    </defs>
    <rect width="400" height="500" rx="28" fill="url(#g2)" />
    <path d="M0 360 C110 300 210 430 400 320 L400 500 L0 500 Z" fill="rgba(255,255,255,0.16)" />
    <text x="36" y="108" fill="#dbeafe" font-size="20" font-family="Arial, sans-serif">VIP Exclusive</text>
    <text x="36" y="156" fill="#ffffff" font-size="36" font-family="Arial, sans-serif" font-weight="700">Ocean Rush</text>
    <text x="36" y="422" fill="#ffffff" font-size="92" font-family="Arial, sans-serif" font-weight="700">FS</text>
  </svg>`),
  toSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#be123c" />
        <stop offset="100%" stop-color="#fb7185" />
      </linearGradient>
    </defs>
    <rect width="400" height="500" rx="28" fill="url(#g3)" />
    <rect x="34" y="42" width="126" height="34" rx="17" fill="rgba(255,255,255,0.18)" />
    <text x="52" y="66" fill="#ffe4e6" font-size="18" font-family="Arial, sans-serif">Event Bonus</text>
    <text x="36" y="144" fill="#ffffff" font-size="34" font-family="Arial, sans-serif" font-weight="700">Golden Burst</text>
    <text x="36" y="418" fill="#ffffff" font-size="90" font-family="Arial, sans-serif" font-weight="700">FS</text>
  </svg>`),
  toSvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c2d12" />
        <stop offset="100%" stop-color="#fdba74" />
      </linearGradient>
    </defs>
    <rect width="400" height="500" rx="28" fill="url(#g4)" />
    <circle cx="92" cy="96" r="58" fill="rgba(255,255,255,0.16)" />
    <text x="36" y="152" fill="#fff7ed" font-size="20" font-family="Arial, sans-serif">Festival Pick</text>
    <text x="36" y="198" fill="#ffffff" font-size="34" font-family="Arial, sans-serif" font-weight="700">Sunset Reels</text>
    <text x="36" y="418" fill="#ffffff" font-size="90" font-family="Arial, sans-serif" font-weight="700">FS</text>
  </svg>`),
];

type RestrictionProvider = {
  code: string;
  name: string;
  games: { code: string; name: string }[];
};

export const freeSpinRestrictionCatalog: Record<GameType, RestrictionProvider[]> = {
  Slots: [
    {
      code: 'JILI',
      name: 'JILI',
      games: [
        { code: 'super_ace', name: 'Super Ace' },
        { code: 'fortune_gems', name: 'Fortune Gems' },
        { code: 'golden_empire', name: 'Golden Empire' },
      ],
    },
    {
      code: 'PG',
      name: 'PG SOFT',
      games: [
        { code: 'mahjong_ways', name: 'Mahjong Ways' },
        { code: 'fortune_tiger', name: 'Fortune Tiger' },
        { code: 'fortune_rabbit', name: 'Fortune Rabbit' },
      ],
    },
    {
      code: 'PP',
      name: 'Pragmatic Play',
      games: [
        { code: 'sweet_bonanza', name: 'Sweet Bonanza' },
        { code: 'gates_olympus', name: 'Gates of Olympus' },
        { code: 'starlight_princess', name: 'Starlight Princess' },
      ],
    },
  ],
  Fishing: [
    {
      code: 'JDB',
      name: 'JDB',
      games: [
        { code: 'fishing_god', name: 'Fishing God' },
        { code: 'dragon_master', name: 'Dragon Master' },
        { code: 'ocean_king', name: 'Ocean King' },
      ],
    },
    {
      code: 'FC',
      name: 'FC Game',
      games: [
        { code: 'deep_sea_hunter', name: 'Deep Sea Hunter' },
        { code: 'golden_shark', name: 'Golden Shark' },
        { code: 'fishing_party', name: 'Fishing Party' },
      ],
    },
  ],
  Sports: [
    {
      code: 'SABA',
      name: 'SABA Sports',
      games: [
        { code: 'football_parlay', name: 'Football Parlay' },
        { code: 'basketball_handicap', name: 'Basketball Handicap' },
        { code: 'tennis_match_winner', name: 'Tennis Match Winner' },
      ],
    },
    {
      code: 'SBO',
      name: 'SBO Sports',
      games: [
        { code: 'live_soccer', name: 'Live Soccer' },
        { code: 'nba_specials', name: 'NBA Specials' },
        { code: 'esports_match', name: 'Esports Match' },
      ],
    },
  ],
  Table: [
    {
      code: 'WM',
      name: 'WM Casino',
      games: [
        { code: 'classic_baccarat', name: 'Classic Baccarat' },
        { code: 'speed_baccarat', name: 'Speed Baccarat' },
        { code: 'dragon_tiger', name: 'Dragon Tiger' },
      ],
    },
    {
      code: 'AG',
      name: 'Asia Gaming',
      games: [
        { code: 'roulette_gold', name: 'Roulette Gold' },
        { code: 'sicbo_pro', name: 'Sic Bo Pro' },
        { code: 'blackjack_plus', name: 'Blackjack Plus' },
      ],
    },
  ],
  Live: [
    {
      code: 'EVO',
      name: 'Evolution',
      games: [
        { code: 'lightning_roulette', name: 'Lightning Roulette' },
        { code: 'crazy_time', name: 'Crazy Time' },
        { code: 'monopoly_live', name: 'Monopoly Live' },
      ],
    },
    {
      code: 'SEXY',
      name: 'Sexy Gaming',
      games: [
        { code: 'live_baccarat', name: 'Live Baccarat' },
        { code: 'vip_roulette', name: 'VIP Roulette' },
        { code: 'speed_blackjack', name: 'Speed Blackjack' },
      ],
    },
  ],
  Arcade: [
    {
      code: 'KA',
      name: 'KA Gaming',
      games: [
        { code: 'fruit_party_arcade', name: 'Fruit Party Arcade' },
        { code: 'space_shooter', name: 'Space Shooter' },
        { code: 'monster_blast', name: 'Monster Blast' },
      ],
    },
    {
      code: 'JILI',
      name: 'JILI',
      games: [
        { code: 'boxing_king', name: 'Boxing King' },
        { code: 'jump_high', name: 'Jump High' },
        { code: 'bubble_pop', name: 'Bubble Pop' },
      ],
    },
  ],
  Bingo: [
    {
      code: 'SPRIBE',
      name: 'Spribe',
      games: [
        { code: 'bingo_blast', name: 'Bingo Blast' },
        { code: 'lucky_90', name: 'Lucky 90' },
        { code: 'speed_bingo', name: 'Speed Bingo' },
      ],
    },
    {
      code: 'JDB',
      name: 'JDB',
      games: [
        { code: 'bingo_party', name: 'Bingo Party' },
        { code: 'super_bingo', name: 'Super Bingo' },
        { code: 'fortune_bingo', name: 'Fortune Bingo' },
      ],
    },
  ],
};

const sampleUnique = <T>(items: T[], minCount: number, maxCount: number): T[] => {
  const pool = [...items];
  const target = Math.min(pool.length, rand(minCount, Math.min(maxCount, pool.length)));
  const picked: T[] = [];

  while (picked.length < target && pool.length > 0) {
    const index = rand(0, pool.length - 1);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
};

type DispatchAttempt = FreeSpinGrantItem['dispatchSummary']['attempts'][number];

const buildAttemptTime = (baseTime: dayjs.Dayjs, index: number, total: number, recentFailure: boolean) => {
  if (recentFailure && index === total - 1) {
    return dayjs().subtract(rand(5, 50), 'minute').format('YYYY-MM-DD HH:mm:ss');
  }

  return baseTime
    .add(index * rand(1, 6) + rand(0, 2), 'hour')
    .format('YYYY-MM-DD HH:mm:ss');
};

const buildDispatchSummary = (
  claimStatus: FreeSpinGrantItem['claimStatus'],
  createdAt: string
): FreeSpinGrantItem['dispatchSummary'] => {
  const baseTime = dayjs(createdAt);
  const attempts: DispatchAttempt[] = [];
  const roll = Math.random();
  const pushAttempt = (
    result: DispatchAttempt['result'],
    index: number,
    total: number,
    recentFailure: boolean
  ) => {
    const vendorErrorCode = result === 'fail' ? pick([...vendorErrorCodes]) : null;
    attempts.push({
      attemptedAt: buildAttemptTime(baseTime, index, total, recentFailure),
      result,
      vendorErrorCode,
      vendorMessage: vendorErrorCode ? `mock:${vendorErrorCode}` : null,
    });
  };

  if (claimStatus === 'claimed') {
    if (roll < 0.75) {
      return {
        lastAttemptAt: null,
        lastAttemptResult: null,
        lastFailureReason: null,
        failedAttemptCount: 0,
        successAttemptCount: 0,
        attempts: [],
      };
    }

    const consecutiveFailures = roll < 0.95 ? rand(1, 2) : rand(3, 5);
    const recentFailure = consecutiveFailures >= 3 ? Math.random() < 0.6 : Math.random() < 0.35;
    for (let i = 0; i < consecutiveFailures; i++) {
      pushAttempt('fail', i, consecutiveFailures, recentFailure);
    }
  } else if (claimStatus === 'in_use' || claimStatus === 'completed' || claimStatus === 'expired') {
    const failedBeforeSuccess = roll < 0.6
      ? 0
      : roll < 0.9
        ? rand(1, 2)
        : rand(3, 5);
    const successCount = rand(1, 2);
    const total = failedBeforeSuccess + successCount;

    for (let i = 0; i < failedBeforeSuccess; i++) {
      pushAttempt('fail', i, total, false);
    }
    for (let i = 0; i < successCount; i++) {
      pushAttempt('success', failedBeforeSuccess + i, total, false);
    }
  } else if (claimStatus === 'voided') {
    if (roll >= 0.5) {
      const failedAttempts = rand(1, 4);
      const recentFailure = failedAttempts >= 3 ? Math.random() < 0.5 : Math.random() < 0.25;
      for (let i = 0; i < failedAttempts; i++) {
        pushAttempt('fail', i, failedAttempts, recentFailure);
      }
    }
  }

  if (attempts.length === 0) {
    return {
      lastAttemptAt: null,
      lastAttemptResult: null,
      lastFailureReason: null,
      failedAttemptCount: 0,
      successAttemptCount: 0,
      attempts,
    };
  }

  const lastAttempt = attempts[attempts.length - 1];
  const lastFailureAttempt = [...attempts].reverse().find((attempt) => attempt.result === 'fail') || null;
  const failedAttemptCount = attempts.filter((attempt) => attempt.result === 'fail').length;

  return {
    lastAttemptAt: lastAttempt.attemptedAt,
    lastAttemptResult: lastAttempt.result,
    lastFailureReason: lastFailureAttempt?.vendorErrorCode || null,
    failedAttemptCount,
    successAttemptCount: attempts.filter((attempt) => attempt.result === 'success').length,
    attempts,
  };
};

export function generateFreeSpinGrants(count: number = 60): FreeSpinGrantItem[] {
  const grants: FreeSpinGrantItem[] = [];
  for (let i = 0; i < count; i++) {
    const grantType = pick<FreeSpinGrantItem['grantType']>(['open', 'provider', 'game']);
    const provider = pick(providers);
    const claimStatus: FreeSpinGrantItem['claimStatus'] = Math.random() < 0.05 ? 'voided' : pick(claimStatuses);
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
    const dispatchSummary = buildDispatchSummary(claimStatus, createdAt);
    const hasSuccessAttempt = dispatchSummary.successAttemptCount > 0;
    const coverImage = Math.random() < 0.3 ? pick(mockFreeSpinCoverImages) : null;
    const usedAt = hasUsed || usedSpins > 0
      ? dayjs(createdAt).add(rand(0, expireDays - 1), 'day').format('YYYY-MM-DD HH:mm:ss')
      : null;
    const wagerMultiple = Math.random() < 0.8 ? pick(wagerMultiples) : null;

    let gameRestriction: FreeSpinGrantItem['gameRestriction'] = null;
    if (Math.random() < 0.6) {
      const selectedGameTypes = Math.random() < 0.7
        ? ['Slots' as GameType]
        : sampleUnique(Object.keys(freeSpinRestrictionCatalog) as GameType[], 1, 3);
      const providerPool = selectedGameTypes.flatMap((gameType) =>
        freeSpinRestrictionCatalog[gameType].map((restrictionProvider) => ({
          gameType,
          provider: restrictionProvider,
        }))
      );
      const selectedProviderEntries = sampleUnique(providerPool, 1, 3);
      const gamePool = selectedProviderEntries.flatMap(({ provider: restrictionProvider }) => restrictionProvider.games);
      const selectedGames = sampleUnique(gamePool, 1, 5);

      gameRestriction = {
        gameTypes: selectedGameTypes,
        providers: selectedProviderEntries.map(({ provider: restrictionProvider }) => restrictionProvider.code),
        games: selectedGames,
      };
    }

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
    const voidedAt = claimStatus === 'voided'
      ? dayjs(createdAt).add(rand(1, Math.max(expireDays - 1, 1)), 'hour').format('YYYY-MM-DD HH:mm:ss')
      : null;
    const voidedBy = claimStatus === 'voided' ? 'darren@filbetph.com' : null;
    const voidReason = claimStatus === 'voided' ? '派發失敗，作廢處理' : null;

    grants.push({
      id: `FSG${String(i + 1).padStart(5, '0')}`,
      name: pick(grantNames),
      coverImage,
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
      wagerMultiple,
      gameRestriction,
      claimStatus,
      dispatchSummary,
      vendorEventId: hasSuccessAttempt ? `VE${rand(100000, 999999)}` : null,
      currency: 'PHP',
      minWithdraw: Math.random() > 0.4 ? randDec(100, 500) : null,
      maxWithdraw: Math.random() > 0.4 ? randDec(1000, 5000) : null,
      expireAt,
      usedAt,
      settledAt: claimStatus === 'completed'
        ? dayjs(usedAt || createdAt).add(rand(1, 24), 'hour').format('YYYY-MM-DD HH:mm:ss')
        : null,
      voidedAt,
      voidedBy,
      voidReason,
      createdBy: pick(createdBys),
      createdAt,
      remark: Math.random() > 0.7 ? '客服手動補發' : null,
    });
  }
  return grants.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

// ==================== Members ====================
export interface MemberItem {
  id: number;
  uid: string;
  account: string;
  nickname: string;
  realName: string;
  phone: string;
  mallTokenBalance: number;
  trafficSource: string;
  storeName: string;
  walletBalance: number;
  agentStatus: '未開啟' | '已開啟';
  memberStatus: 'Verified' | 'Unverified' | 'Suspended';
  kycStatus: 'Approved' | 'Pending' | 'Rejected' | 'Not Submitted';
  restrictedStatus: string;
  riskLevel: string;
  riskTag: string;
  vipLevel: number;
  xpPoints: number;
  tierRange: string;
  // VIP 進階欄位（手動調整功能用）
  currentLevelXp: number;     // 當前等級內已累積 XP
  keepExpire: string;         // 保級到期日 YYYYMMDD
  vipUpgradeAt: number;       // 上次 VIP 變動時間 ms
  isOnline: boolean;
  lastLoginTime: string;
  loginIP: string;
  loginIPDuplicates: number;
  loginDevice: string;
  loginDeviceDuplicates: number;
  clientVersion: string;
  registerTime: string;
  registerIP: string;
  totalDeposit: number;
  depositCount: number;
  totalWithdraw: number;
  withdrawCount: number;
  depositWithdrawDiff: number;
  ggr: number;
  totalBet: number;
  activityBonus: number;
  accountType: '正式' | '測試';
  parentAgentPhone: string;
  inviterPhone: string;
}

// VIP 等級配置（對應 fb_members_vip）
export interface VipLevelConfig {
  level: number;
  tier: string;
  upgradeDiffXp: number;   // 升下一級需要的 XP 差值
  keepLevelXp: number;     // 30 天內需累積的保級 XP（PRD: 升級門檻的 30%）
  upgradeBonus: number;    // 升級禮金（單級）
}

export const vipConfig: VipLevelConfig[] = (() => {
  const configs: VipLevelConfig[] = [];
  for (let level = 0; level <= 30; level++) {
    let baseXp: number;
    let upgradeBonus: number;
    if (level <= 6) {              // Bronze V0-V6
      baseXp = 100 + level * 200;
      upgradeBonus = 17;
    } else if (level <= 12) {      // Silver V7-V12
      baseXp = 2000 + (level - 7) * 800;
      upgradeBonus = 77;
    } else if (level <= 18) {      // Gold V13-V18
      baseXp = 8000 + (level - 13) * 4000;
      upgradeBonus = 377;
    } else if (level <= 24) {      // Platinum V19-V24
      baseXp = 40000 + (level - 19) * 30000;
      upgradeBonus = 777;
    } else {                       // Diamond V25-V29
      baseXp = 300000 + (level - 25) * 300000;
      upgradeBonus = 3777;
    }
    configs.push({
      level,
      tier: getTierRange(level),
      upgradeDiffXp: baseXp,
      keepLevelXp: Math.floor(baseXp * 0.3),
      upgradeBonus,
    });
  }
  return configs;
})();

export function getVipConfig(level: number): VipLevelConfig | undefined {
  return vipConfig.find(c => c.level === level);
}

const phFirstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Carlo', 'Rosa', 'Miguel', 'Liza', 'Ramon', 'Celia',
  'Felix', 'Gloria', 'Dante', 'Elena', 'Rico', 'Nora', 'Mark', 'Jessa', 'Leo', 'Tina'];
const phLastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Torres', 'Ramos', 'Flores', 'Mendoza',
  'Dela Cruz', 'Aquino', 'Villanueva', 'Gonzales', 'Castillo', 'Morales', 'Diaz', 'Pascual', 'Andres', 'Lim'];
const phStores = [
  'Quezon City Branch', 'Makati Main Store', 'Cebu City Hub', 'Davao Branch', 'Pasig Outlet',
  'Mandaluyong Store', 'Taguig Branch', 'Antipolo Hub', 'Caloocan Store', 'Parañaque Branch',
  'Las Piñas Outlet', 'Muntinlupa Store', 'Valenzuela Branch', 'Marikina Hub', 'Pasay Store',
];
const trafficSources = ['adjust', 'organic', 'facebook', 'google', 'tiktok'];
const loginDevices = ['Android', 'iOS', 'H5'];
const clientVersions = ['3.2.1', '3.1.0', '2.9.5', '-'];
const riskLevels = ['無', '低', '中', '高'];
const riskTags = ['正常', '異常充值', '多帳號', '可疑行為', ''];
const memberStatuses: MemberItem['memberStatus'][] = ['Verified', 'Unverified', 'Suspended'];
const kycStatuses: MemberItem['kycStatus'][] = ['Approved', 'Pending', 'Rejected', 'Not Submitted'];
const restrictedStatuses = ['正常', '提款限制', '登入封鎖', '全功能封鎖'];

function generatePHPhone(): string {
  const prefix = pick(['09', '639']);
  if (prefix === '09') {
    return `09${rand(100000000, 999999999)}`.slice(0, 11);
  }
  return `639${rand(100000000, 999999999)}`.slice(0, 12);
}

function generateIP(): string {
  return `${rand(1, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
}

export function generateMembers(count: number = 50): MemberItem[] {
  const members: MemberItem[] = [];
  for (let i = 0; i < count; i++) {
    const statSeed = memberStatMembers[i];
    const vipLevel = rand(0, 30);
    const totalDeposit = randDec(0, 500000);
    const totalWithdraw = randDec(0, totalDeposit * 0.9);
    const depositWithdrawDiff = +(totalDeposit - totalWithdraw).toFixed(2);
    const totalBet = +(totalDeposit * randDec(0.5, 3)).toFixed(2);
    const ggr = +(totalBet * randDec(0.01, 0.08)).toFixed(2);
    const activityBonus = +(rand(0, 5000) + Math.random() * 1000).toFixed(2);
    const daysAgo = rand(0, 365);
    const loginDaysAgo = rand(0, daysAgo);
    const firstName = pick(phFirstNames);
    const lastName = pick(phLastNames);

    // VIP 進階欄位
    const cfg = vipConfig.find(c => c.level === vipLevel);
    const upgradeDiffXp = cfg?.upgradeDiffXp ?? 1000;
    const currentLevelXp = rand(0, Math.floor(upgradeDiffXp * 0.99));
    const vipDaysAgo = rand(0, 60);
    const vipUpgradeAt = dayjs().subtract(vipDaysAgo, 'day').valueOf();
    const keepExpire = dayjs(vipUpgradeAt).add(30, 'day').format('YYYYMMDD');

    members.push({
      id: i + 1,
      uid: statSeed?.uid ?? `U${String(10001 + i)}`,
      account: statSeed?.username ?? `filbet_${rand(10000, 99999)}`,
      nickname: `${firstName}${rand(10, 99)}`,
      realName: `${firstName} ${lastName}`,
      phone: generatePHPhone(),
      mallTokenBalance: rand(0, 5000),
      trafficSource: pick(trafficSources),
      storeName: pick(phStores),
      walletBalance: randDec(0, 100000),
      agentStatus: Math.random() < 0.15 ? '已開啟' : '未開啟',
      memberStatus: pick(memberStatuses),
      kycStatus: pick(kycStatuses),
      restrictedStatus: pick(restrictedStatuses),
      riskLevel: pick(riskLevels),
      riskTag: pick(riskTags),
      vipLevel,
      xpPoints: rand(0, vipLevel * 1200 + 500),
      tierRange: getTierRange(vipLevel),
      currentLevelXp,
      keepExpire,
      vipUpgradeAt,
      isOnline: Math.random() < 0.12,
      lastLoginTime: dayjs().subtract(loginDaysAgo, 'day').subtract(rand(0, 23), 'hour').format('YYYY-MM-DD HH:mm:ss'),
      loginIP: generateIP(),
      loginIPDuplicates: rand(1, 5),
      loginDevice: pick(loginDevices),
      loginDeviceDuplicates: rand(1, 4),
      clientVersion: pick(clientVersions),
      registerTime: dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD HH:mm:ss'),
      registerIP: generateIP(),
      totalDeposit,
      depositCount: rand(0, 200),
      totalWithdraw,
      withdrawCount: rand(0, 100),
      depositWithdrawDiff,
      ggr,
      totalBet,
      activityBonus,
      accountType: Math.random() < 0.1 ? '測試' : '正式',
      parentAgentPhone: Math.random() < 0.6 ? generatePHPhone() : '-',
      inviterPhone: Math.random() < 0.5 ? generatePHPhone() : '-',
    });
  }
  return members.sort((a, b) => b.registerTime.localeCompare(a.registerTime));
}

// ==================== VIP 等級異動紀錄 ====================
export type VipLevelHistoryTy = 'Upgrade' | 'Degrade' | 'Keep' | 'ManualUpgrade' | 'ManualDowngrade';

export interface VipLevelHistoryItem {
  id: string;
  uid: string;
  username: string;
  ty: VipLevelHistoryTy;
  beforeLevel: number;
  afterLevel: number;
  beforeXp: number;
  changeXp: number;
  afterXp: number;
  remark: string;
  keepExpire: string;       // YYYY-MM-DD
  tierRange: string;
  upgradeRecordId: string;
  createdAt: string;        // ISO time
  operator: string;         // 'system' or admin email
  bonusGranted: number;     // 升級禮金（手動操作可能 0）
  resetKeepTimer: boolean;
}

export const VipHistoryTyColor: Record<VipLevelHistoryTy, string> = {
  Upgrade: 'green',
  Degrade: 'red',
  Keep: 'blue',
  ManualUpgrade: 'green',
  ManualDowngrade: 'red',
};

export const VipHistoryTyLabel: Record<VipLevelHistoryTy, string> = {
  Upgrade: '升級',
  Degrade: '降級',
  Keep: '保級',
  ManualUpgrade: '手動升級',
  ManualDowngrade: '手動降級',
};

export const VipHistoryTyIsManual: Record<VipLevelHistoryTy, boolean> = {
  Upgrade: false,
  Degrade: false,
  Keep: false,
  ManualUpgrade: true,
  ManualDowngrade: true,
};

// ==================== Module-level Store（跨頁共享）====================
// 用 module 作用域保持資料；頁面切換不會 reset
let _members: MemberItem[] | null = null;
const _vipHistoryByUid = new Map<string, VipLevelHistoryItem[]>();

export function getMembers(): MemberItem[] {
  if (!_members) {
    _members = generateMembers(50);
  }
  return _members;
}

export function getMemberByUid(uid: string): MemberItem | undefined {
  return getMembers().find(m => m.uid === uid);
}

export function getMemberById(id: number): MemberItem | undefined {
  return getMembers().find(m => m.id === id);
}

export function updateMember(id: number, patch: Partial<MemberItem>) {
  const list = getMembers();
  const idx = list.findIndex(m => m.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
  }
}

export function getVipHistory(uid: string): VipLevelHistoryItem[] {
  if (!_vipHistoryByUid.has(uid)) {
    // 初始化：給每個會員一筆「初始化」紀錄
    const m = getMemberByUid(uid);
    if (m) {
      const initial: VipLevelHistoryItem = {
        id: `INIT-${uid}`,
        uid,
        username: m.account,
        ty: 'Upgrade',
        beforeLevel: 0,
        afterLevel: m.vipLevel,
        beforeXp: 0,
        changeXp: m.xpPoints,
        afterXp: m.xpPoints,
        remark: '初始升級',
        keepExpire: dayjs(m.keepExpire, 'YYYYMMDD').format('YYYY-MM-DD'),
        tierRange: m.tierRange,
        upgradeRecordId: '0',
        createdAt: dayjs(m.vipUpgradeAt).format('YYYY-MM-DD HH:mm:ss'),
        operator: 'system',
        bonusGranted: 0,
        resetKeepTimer: true,
      };
      _vipHistoryByUid.set(uid, [initial]);
    } else {
      _vipHistoryByUid.set(uid, []);
    }
  }
  return _vipHistoryByUid.get(uid) || [];
}

export function appendVipHistory(uid: string, item: VipLevelHistoryItem) {
  const list = getVipHistory(uid);
  list.unshift(item);   // 新的在前
}
