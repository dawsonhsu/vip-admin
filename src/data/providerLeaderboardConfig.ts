import type { GameType } from './memberStatsData';
import { freeSpinRestrictionCatalog } from './mockData';
import { gameOptions } from './newMemberTriDepositData';

export const PROVIDER_LEADERBOARD_ACTIVITY_ID = 34;
export const PROVIDER_LEADERBOARD_ACTIVITY_NAME = '廠商排行榜';

export interface LeaderboardProviderCatalogItem {
  code: string;
  name: string;
  gameTypes: GameType[];
  games: { code: string; name: string; gameType: GameType }[];
}

export interface LeaderboardProviderRow {
  key: string;
  providerCode: string;
  minBet: number;
  excludedGameTypes: GameType[];
  excludedGames: string[];
}

export type RewardType = 'cash' | 'freeSpin' | 'mallCoin';

export interface FreeSpinReward {
  dispatchLevel: 'OPEN' | 'PROVIDER' | 'GAME';
  provider?: string;
  gameId?: string;
  activityCode?: string;
  spins: number;
  betAmount: number;
  validityDays: number;
  minWithdraw?: number;
  maxWithdraw?: number;
}

export interface RankRewardRow {
  key: string;
  start: number;
  end: number;
  rewardType: RewardType;
  /** 現金為 PHP 金額；商城幣為幣數。 */
  amount?: number;
  freeSpin?: FreeSpinReward;
}

type CatalogEntry = [GameType, (typeof freeSpinRestrictionCatalog)[GameType]];

const mergedProviders = new Map<string, LeaderboardProviderCatalogItem>();
(Object.entries(freeSpinRestrictionCatalog) as CatalogEntry[]).forEach(
  ([gameType, providers]) => {
    providers.forEach((provider) => {
      const current = mergedProviders.get(provider.code) ?? {
        code: provider.code,
        name: provider.name,
        gameTypes: [],
        games: [],
      };
      if (!current.gameTypes.includes(gameType)) current.gameTypes.push(gameType);
      provider.games.forEach((game) => {
        current.games.push({ ...game, gameType });
      });
      mergedProviders.set(provider.code, current);
    });
  },
);

export const LEADERBOARD_PROVIDER_CATALOG = Array.from(mergedProviders.values());

// The shared Free Spin list currently contains no PG SOFT row because its source
// mock's generated PG records are neither Slot nor Free-Spin-enabled. Keep the
// shared list intact and add the catalog's PG game only for this activity picker.
const pgCatalogGame = LEADERBOARD_PROVIDER_CATALOG
  .find((provider) => provider.code === 'PG')
  ?.games.find((game) => game.code === 'mahjong_ways');
export const LEADERBOARD_FREE_SPIN_GAME_OPTIONS = gameOptions.some(
  (game) => game.provider === 'PG SOFT',
)
  ? gameOptions
  : [
      ...gameOptions,
      {
        value: pgCatalogGame?.code ?? 'mahjong_ways',
        label: pgCatalogGame?.name ?? 'Mahjong Ways',
        provider: 'PG SOFT',
        gameType: pgCatalogGame?.gameType ?? 'Slots',
      },
    ];

const providerByCode = (code: string) =>
  LEADERBOARD_PROVIDER_CATALOG.find((provider) => provider.code === code);

export const DEFAULT_LEADERBOARD_PROVIDERS: LeaderboardProviderRow[] = [
  { key: 'provider-pg', providerCode: 'PG', minBet: 1000, excludedGameTypes: [], excludedGames: [] },
  { key: 'provider-jili', providerCode: 'JILI', minBet: 1000, excludedGameTypes: ['Arcade'], excludedGames: ['golden_empire'] },
  { key: 'provider-pp', providerCode: 'PP', minBet: 2000, excludedGameTypes: [], excludedGames: [] },
  { key: 'provider-fc', providerCode: 'FC', minBet: 500, excludedGameTypes: [], excludedGames: [] },
];

const defaultPgGame = LEADERBOARD_FREE_SPIN_GAME_OPTIONS.find(
  (game) => game.provider === 'PG SOFT',
);

export const DEFAULT_RANK_COUNT = 100;
export const DEFAULT_ROLLOVER_MULTIPLIER = 1;
export const DEFAULT_DISPATCH_TIME = '04:30:00';
export const DEFAULT_POPUP_TEXT = 'Congratulations! You received a Daily Leaderboard reward!';

export const DEFAULT_RANK_REWARD_ROWS: RankRewardRow[] = [
  { key: 'rank-1', start: 1, end: 1, rewardType: 'cash', amount: 20000 },
  { key: 'rank-2', start: 2, end: 2, rewardType: 'cash', amount: 10000 },
  { key: 'rank-3', start: 3, end: 3, rewardType: 'cash', amount: 5000 },
  { key: 'rank-4-10', start: 4, end: 10, rewardType: 'cash', amount: 1000 },
  {
    key: 'rank-11-50',
    start: 11,
    end: 50,
    rewardType: 'freeSpin',
    freeSpin: {
      dispatchLevel: 'GAME',
      provider: 'PG SOFT',
      gameId: defaultPgGame?.value,
      spins: 20,
      betAmount: 1,
      validityDays: 7,
    },
  },
  { key: 'rank-51-100', start: 51, end: 100, rewardType: 'mallCoin', amount: 500 },
];

export function normalizeRankRows(rows: RankRewardRow[]): RankRewardRow[] {
  let nextStart = 1;
  return rows.map((row) => {
    const normalized = { ...row, start: nextStart };
    nextStart = row.end + 1;
    return normalized;
  });
}

export function validateRankRows(rows: RankRewardRow[] = [], rankCount: number): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['請至少設定一列名次獎勵'];

  const normalized = normalizeRankRows(rows);
  normalized.forEach((row, index) => {
    const label = `第 ${index + 1} 列`;
    if (!Number.isFinite(row.end) || row.end < row.start) {
      errors.push(`${label}的「名次迄」不可小於 ${row.start}`);
    }
    if (
      (row.rewardType === 'cash' || row.rewardType === 'mallCoin') &&
      (!Number.isFinite(row.amount) || Number(row.amount) <= 0)
    ) {
      errors.push(`${label}請輸入大於 0 的每人獎勵`);
    }
    if (row.rewardType === 'freeSpin') {
      const reward = row.freeSpin;
      if (!reward || reward.spins < 1 || reward.betAmount <= 0 || reward.validityDays < 1) {
        errors.push(`${label}的 Free Spin 次數、單次投注額與有效期必須完整且大於 0`);
      }
      if (reward && reward.dispatchLevel !== 'GAME') {
        errors.push(`${label}的 Free Spin 目前僅支援 GAME 層級`);
      }
      if (reward && !reward.provider) {
        errors.push(`${label}的 Free Spin 派發層級必須選擇廠商`);
      }
      if (reward && !reward.gameId) {
        errors.push(`${label}的 Free Spin GAME 層級必須選擇贈送遊戲`);
      }
      if (reward?.provider === 'Gemini' && !reward.activityCode?.trim()) {
        errors.push(`${label}的 Gemini Free Spin 必須輸入活動代碼`);
      }
    }
  });
  if (normalized[normalized.length - 1].end !== rankCount) {
    errors.push(`最後一列的「名次迄」必須等於排名人數 ${rankCount}`);
  }
  return errors;
}

export function validateProviders(rows: LeaderboardProviderRow[] = []): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['請至少選擇一家參與廠商'];
  const used = new Set<string>();
  rows.forEach((row, index) => {
    if (!Number.isFinite(row.minBet) || row.minBet < 0) {
      errors.push(`第 ${index + 1} 列請輸入上榜門檻`);
    }
    if (!row.providerCode) {
      errors.push(`第 ${index + 1} 列請選擇廠商`);
      return;
    }
    if (used.has(row.providerCode)) errors.push('參與廠商不可重複');
    used.add(row.providerCode);
    const provider = providerByCode(row.providerCode);
    const hasIncludedGame = provider?.games.some(
      (game) => !row.excludedGameTypes.includes(game.gameType) && !row.excludedGames.includes(game.code),
    );
    if (provider && provider.games.length > 0 && !hasIncludedGame) {
      errors.push(`${provider.name} 不可排除旗下全部遊戲`);
    }
  });
  return Array.from(new Set(errors));
}

export const DEFAULT_LEADERBOARD_RULES = `<h3>Provider Daily Leaderboard Rules</h3><ol><li>Each selected provider has its own independent daily leaderboard. A member is ranked by cumulative valid bet on that provider's games for the statistical day; each bet belongs to exactly one provider board.</li><li>The statistical day is 00:00:00–23:59:59 GMT+8. Bets are attributed by settlement time.</li><li>Each provider has its own configured minimum valid-bet threshold. A member's cumulative valid bet for that provider must be greater than or equal to (≥) its threshold to qualify. Unfilled reward slots are not paid, carried over, or backfilled.</li><li>If valid bets are equal, the member who reached the final score first by settlement time ranks higher. Ranks are not shared.</li><li>Rewards are credited automatically at 04:30 (GMT+8) the next day. One reward table is shared by all provider boards, and a member may win on multiple boards on the same day.</li><li>Cash rollover equals reward multiplied by the activity multiplier; Free Spin rollover equals winnings multiplied by the multiplier; mall coins have no rollover. A multiplier of 0 means no rollover requirement. Venue scope follows the activity configuration.</li><li>Bets on excluded game types or specific games do not count. Newly listed games under a selected provider are included automatically unless their game type is excluded.</li></ol><p>Filbet reserves the right of final interpretation.</p>`;
