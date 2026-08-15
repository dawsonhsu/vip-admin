import {
  gameManagementData,
  type GameManagementRecord,
  type GameType,
} from '@/data/gameManagementData';

export type Platform = 'filbet' | 'filgame' | 'filslot' | 'filplay';
export type SectionType = 'system' | 'category' | 'custom';
export type SectionLayout = 'landscape' | 'portrait';

export interface HomeSection {
  id: string;
  name: string;
  type: SectionType;
  enabled: boolean;
  locked: boolean;
  layout: SectionLayout;
  displayCount: number;
  gameIds: string[];
  categoryGameType?: GameType;
}

export interface HomeSectionPlatformConfig {
  draft: HomeSection[];
  published: HomeSection[];
}

export type HomeSectionConfigs = Record<Platform, HomeSectionPlatformConfig>;

export const platforms: Platform[] = ['filbet', 'filgame', 'filslot', 'filplay'];

export const platformLabels: Record<Platform, string> = {
  filbet: 'filbet',
  filgame: 'filgame',
  filslot: 'filslot',
  filplay: 'filplay',
};

export const sectionTypeLabels: Record<SectionType, string> = {
  system: '系統板塊',
  category: '基礎分類板塊',
  custom: '自定義板塊',
};

const platformGameTypes: Record<Platform, GameType[]> = {
  filbet: ['Slot', 'Live', 'Fishing', 'Sport', 'Card'],
  filgame: ['Slot', 'Live', 'Fishing', 'Sport', 'Card'],
  filslot: ['Slot'],
  filplay: ['Slot', 'Live', 'Fishing', 'Card'],
};

// Mock assumption: gameManagementData has no platform field, so each platform's
// availability is simulated with the allowed game types defined above.
export const gamesForPlatform = (platform: Platform): GameManagementRecord[] => (
  gameManagementData.filter((game) => platformGameTypes[platform].includes(game.gameType))
);

export const platformSupportsGameType = (platform: Platform, gameType: GameType) => (
  platformGameTypes[platform].includes(gameType)
);

const uniqueGameIds = (games: GameManagementRecord[]) => (
  Array.from(new Set(games.map((game) => game.gameId)))
);

const preferredPool = (
  platform: Platform,
  predicate: (game: GameManagementRecord) => boolean,
  limit = 50,
) => {
  const available = gamesForPlatform(platform);
  return uniqueGameIds([
    ...available.filter(predicate),
    ...available,
  ]).slice(0, limit);
};

const rankingSection = (platform: Platform): HomeSection => ({
  id: `${platform}-ranking`,
  name: 'Filbet Ranking',
  type: 'system',
  enabled: true,
  locked: true,
  layout: 'landscape',
  displayCount: 0,
  gameIds: [],
});

const customSection = (
  platform: Platform,
  id: string,
  name: string,
  layout: SectionLayout,
  displayCount: number,
  gameIds: string[],
): HomeSection => ({
  id: `${platform}-${id}`,
  name,
  type: 'custom',
  enabled: true,
  locked: false,
  layout,
  displayCount,
  gameIds,
});

const categorySection = (
  platform: Platform,
  gameType: GameType,
  layout: SectionLayout,
  displayCount: number,
): HomeSection => ({
  id: `${platform}-category-${gameType.toLowerCase()}`,
  name: gameType,
  type: 'category',
  enabled: false,
  locked: true,
  layout,
  displayCount,
  gameIds: gamesForPlatform(platform)
    .filter((game) => game.gameType === gameType)
    .map((game) => game.gameId),
  categoryGameType: gameType,
});

const buildFilbetSections = (): HomeSection[] => [
  rankingSection('filbet'),
  customSection(
    'filbet',
    'new-games',
    'New Games',
    'landscape',
    20,
    preferredPool('filbet', (game) => game.isNew || game.gameType === 'Slot'),
  ),
  customSection(
    'filbet',
    'hot-games',
    'Hot Games',
    'portrait',
    20,
    preferredPool('filbet', (game) => game.hot),
  ),
  categorySection('filbet', 'Slot', 'portrait', 12),
  categorySection('filbet', 'Sport', 'landscape', 8),
  categorySection('filbet', 'Live', 'portrait', 8),
];

const buildLighterSections = (platform: Exclude<Platform, 'filbet'>): HomeSection[] => {
  const useHotGames = platform === 'filplay';
  return [
    rankingSection(platform),
    customSection(
      platform,
      useHotGames ? 'hot-games' : 'new-games',
      useHotGames ? 'Hot Games' : 'New Games',
      platform === 'filslot' ? 'portrait' : 'landscape',
      platform === 'filslot' ? 8 : 12,
      preferredPool(
        platform,
        (game) => useHotGames ? game.hot : (game.isNew || game.gameType === 'Slot'),
      ),
    ),
  ];
};

export const cloneSections = (sections: HomeSection[]): HomeSection[] => (
  sections.map((section) => ({ ...section, gameIds: [...section.gameIds] }))
);

export const buildHomeSectionConfigs = (): HomeSectionConfigs => {
  const seeds: Record<Platform, HomeSection[]> = {
    filbet: buildFilbetSections(),
    filgame: buildLighterSections('filgame'),
    filslot: buildLighterSections('filslot'),
    filplay: buildLighterSections('filplay'),
  };

  return platforms.reduce((configs, platform) => {
    configs[platform] = {
      draft: cloneSections(seeds[platform]),
      published: cloneSections(seeds[platform]),
    };
    return configs;
  }, {} as HomeSectionConfigs);
};

export const resolveDisplayGames = (
  section: HomeSection,
  platform: Platform,
): GameManagementRecord[] => {
  if (section.type === 'system') return [];

  const platformGamesById = new Map(
    gamesForPlatform(platform).map((game) => [game.gameId, game]),
  );

  return section.gameIds
    .map((gameId) => platformGamesById.get(gameId))
    .filter((game): game is GameManagementRecord => game?.status === '上架')
    .slice(0, section.displayCount);
};
