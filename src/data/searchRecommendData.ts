import type { GameManagementRecord } from '@/data/gameManagementData';

export const SEARCH_RECOMMEND_LIMIT = 10;

export const initialSearchRecommendIds: string[] = [
  '100003',
  '100008',
  '100004',
  '100021',
  '100013',
  '100006',
  '100009',
];

export const getClientHiddenReason = (game: GameManagementRecord): string | null => {
  if (game.status === '下架') return '下架';
  if (game.status === '維護中') return '維護中';
  if (game.apiStatus === '異常') return '接口異常';
  return null;
};

export const isSearchClientVisible = (game: GameManagementRecord) => (
  getClientHiddenReason(game) === null
);

export const getMockBetAmount30d = (game: GameManagementRecord): number => (
  ((Number(game.gameId) * 7919) % 900000) + 120000
);

export const buildTrendingGames = (
  games: GameManagementRecord[],
  limit = 5,
): GameManagementRecord[] => (
  games
    .filter(isSearchClientVisible)
    .sort((a, b) => getMockBetAmount30d(b) - getMockBetAmount30d(a))
    .slice(0, limit)
);
