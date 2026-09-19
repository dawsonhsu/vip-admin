import dayjs from 'dayjs';
import {
  DEFAULT_DISPATCH_TIME,
  DEFAULT_LEADERBOARD_PROVIDERS,
  DEFAULT_RANK_REWARD_ROWS,
  DEFAULT_ROLLOVER_MULTIPLIER,
  LEADERBOARD_FREE_SPIN_GAME_OPTIONS,
  LEADERBOARD_PROVIDER_CATALOG,
  type RewardType,
} from './providerLeaderboardConfig';

export interface ProviderLeaderboardReportRow {
  id: string;
  statisticalDate: string;
  providerCode: string;
  providerName: string;
  rank: number;
  account: string;
  phone: string;
  validBet: number;
  reachedAt: string;
  rewardType: RewardType;
  rewardTypeLabel: string;
  rewardContent: string;
  cashAmount: number;
  freeSpinSpins: number;
  mallCoinAmount: number;
  rolloverRequirement: string;
  dispatchedAt: string;
  dispatchStatus: '已派發';
}

export const PROVIDER_LEADERBOARD_REPORT_END_DATE = '2026-09-18';
export const PROVIDER_LEADERBOARD_SHORTAGE_DATE = '2026-09-15';
export const PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE = 'FC';
export const PROVIDER_LEADERBOARD_SHORTAGE_QUALIFIED_COUNT = 37;

const statisticalDates = Array.from({ length: 7 }, (_, index) =>
  dayjs(PROVIDER_LEADERBOARD_REPORT_END_DATE).subtract(6 - index, 'day').format('YYYY-MM-DD'),
);

const providerNameOf = (code: string) =>
  LEADERBOARD_PROVIDER_CATALOG.find((provider) => provider.code === code)?.name ?? code;

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const maskedPhone = (seed: string) =>
  `09****${String(1000 + (hashString(`${seed}-phone`) % 9000))}`;

const rewardForRank = (rank: number) =>
  DEFAULT_RANK_REWARD_ROWS.find((reward) => rank >= reward.start && rank <= reward.end)!;

const MULTI_BOARD_MEMBER_COUNT = 6;
const MULTI_BOARD_ACCOUNT_COUNT = statisticalDates.length * MULTI_BOARD_MEMBER_COUNT;

// 7,919 is coprime with 900,000, so this permutes six-digit values without collisions.
const accountNumberForCounter = (counter: number) =>
  100000 + ((counter * 7919) % 900000);

const buildMultiBoardPlacements = (statisticalDate: string, dateIndex: number) => {
  const placements = new Map<string, number>();
  const occupiedRanks = DEFAULT_LEADERBOARD_PROVIDERS.map(() => new Set<number>());

  for (let memberIndex = 0; memberIndex < MULTI_BOARD_MEMBER_COUNT; memberIndex += 1) {
    const firstProviderIndex = (dateIndex + memberIndex) % DEFAULT_LEADERBOARD_PROVIDERS.length;
    const secondProviderIndex = (
      firstProviderIndex + 1 + (memberIndex % (DEFAULT_LEADERBOARD_PROVIDERS.length - 1))
    ) % DEFAULT_LEADERBOARD_PROVIDERS.length;
    let firstRank: number | undefined;

    [firstProviderIndex, secondProviderIndex].forEach((providerIndex, appearanceIndex) => {
      const providerCode = DEFAULT_LEADERBOARD_PROVIDERS[providerIndex].providerCode;
      const rankLimit =
        statisticalDate === PROVIDER_LEADERBOARD_SHORTAGE_DATE &&
        providerCode === PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE
          ? PROVIDER_LEADERBOARD_SHORTAGE_QUALIFIED_COUNT
          : 80;
      const rankSeed = dateIndex * 23 + memberIndex * 29 + appearanceIndex * 37;
      let rank = (rankSeed % rankLimit) + 1;

      while (
        occupiedRanks[providerIndex].has(rank) ||
        (appearanceIndex === 1 && rank === firstRank) ||
        (dateIndex === 0 && providerCode === 'PG' && (rank === 5 || rank === 6))
      ) {
        rank = (rank % rankLimit) + 1;
      }

      occupiedRanks[providerIndex].add(rank);
      placements.set(`${providerIndex}-${rank}`, memberIndex);
      if (appearanceIndex === 0) firstRank = rank;
    });
  }

  return placements;
};

const buildMember = (
  dateIndex: number,
  providerIndex: number,
  rank: number,
  multiBoardMemberIndex?: number,
) => {
  const isMultiBoardMember = multiBoardMemberIndex !== undefined;
  const memberSeed = isMultiBoardMember
    ? `shared-${dateIndex}-${multiBoardMemberIndex}`
    : `provider-${dateIndex}-${providerIndex}-${rank}`;
  // Shared placements reuse one counter; all other date/provider/rank tuples get their own.
  const accountCounter = isMultiBoardMember
    ? dateIndex * MULTI_BOARD_MEMBER_COUNT + multiBoardMemberIndex
    : MULTI_BOARD_ACCOUNT_COUNT + dateIndex * 400 + providerIndex * 100 + (rank - 1);
  return {
    account: `player_${accountNumberForCounter(accountCounter)}`,
    phone: maskedPhone(memberSeed),
  };
};

export function generateProviderLeaderboardReport(): ProviderLeaderboardReportRow[] {
  const rows: ProviderLeaderboardReportRow[] = [];
  statisticalDates.forEach((statisticalDate, dateIndex) => {
    const multiBoardPlacements = buildMultiBoardPlacements(statisticalDate, dateIndex);
    DEFAULT_LEADERBOARD_PROVIDERS.forEach((provider, providerIndex) => {
      const isShortBoard =
        statisticalDate === PROVIDER_LEADERBOARD_SHORTAGE_DATE &&
        provider.providerCode === PROVIDER_LEADERBOARD_SHORTAGE_PROVIDER_CODE;
      const qualifiedCount = isShortBoard ? PROVIDER_LEADERBOARD_SHORTAGE_QUALIFIED_COUNT : 100;

      for (let rank = 1; rank <= qualifiedCount; rank += 1) {
        const member = buildMember(
          dateIndex,
          providerIndex,
          rank,
          multiBoardPlacements.get(`${providerIndex}-${rank}`),
        );
        const reward = rewardForRank(rank);
        const isTiePair = dateIndex === 0 && provider.providerCode === 'PG' && (rank === 5 || rank === 6);
        const baseValidBet = 620000 - rank * 4800 - dateIndex * 975 - providerIndex * 310;
        const validBet = Math.max(
          provider.minBet,
          isTiePair ? 596000 - dateIndex * 975 - providerIndex * 310 : baseValidBet,
        );
        // 同分第 5 名比第 6 名早 20 分鐘達到最終分數。
        const reachedSeconds = isTiePair
          ? (rank === 5 ? 18 * 3600 + 5 * 60 : 18 * 3600 + 25 * 60)
          : 8 * 3600 + rank * 390 + providerIndex * 37 + dateIndex * 19;
        const reachedAt = dayjs(statisticalDate)
          .startOf('day')
          .add(Math.min(reachedSeconds, 23 * 3600 + 59 * 60), 'second')
          .format('YYYY-MM-DD HH:mm:ss');

        let rewardTypeLabel = '現金';
        let rewardContent = '';
        let rolloverRequirement = '';
        let cashAmount = 0;
        let freeSpinSpins = 0;
        let mallCoinAmount = 0;

        if (reward.rewardType === 'cash') {
          cashAmount = Number(reward.amount ?? 0);
          rewardContent = `₱${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          rolloverRequirement = `₱${cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${DEFAULT_ROLLOVER_MULTIPLIER} = ₱${(cashAmount * DEFAULT_ROLLOVER_MULTIPLIER).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (reward.rewardType === 'freeSpin') {
          rewardTypeLabel = 'Free Spin';
          freeSpinSpins = reward.freeSpin?.spins ?? 0;
          const gameName = LEADERBOARD_FREE_SPIN_GAME_OPTIONS.find((game) => game.value === reward.freeSpin?.gameId)?.label ?? reward.freeSpin?.gameId ?? '—';
          rewardContent = `${reward.freeSpin?.provider ?? '—'} · ${gameName} · ${freeSpinSpins} 次 · ₱${Number(reward.freeSpin?.betAmount ?? 0).toFixed(2)}/次 · ${reward.freeSpin?.validityDays ?? 0} 天`;
          rolloverRequirement = `贏得金額 × ${DEFAULT_ROLLOVER_MULTIPLIER} 倍`;
        } else {
          rewardTypeLabel = '商城幣';
          mallCoinAmount = Number(reward.amount ?? 0);
          rewardContent = `${mallCoinAmount.toLocaleString()} 幣`;
          rolloverRequirement = '—';
        }

        rows.push({
          id: `${statisticalDate}-${provider.providerCode}-${rank}`,
          statisticalDate,
          providerCode: provider.providerCode,
          providerName: providerNameOf(provider.providerCode),
          rank,
          ...member,
          validBet,
          reachedAt,
          rewardType: reward.rewardType,
          rewardTypeLabel,
          rewardContent,
          cashAmount,
          freeSpinSpins,
          mallCoinAmount,
          rolloverRequirement,
          dispatchedAt: `${dayjs(statisticalDate).add(1, 'day').format('YYYY-MM-DD')} ${DEFAULT_DISPATCH_TIME}`,
          dispatchStatus: '已派發',
        });
      }
    });
  });
  return rows;
}

export const providerLeaderboardReportData = generateProviderLeaderboardReport();
