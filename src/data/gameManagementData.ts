import dayjs from 'dayjs';

export type VenueCode = 'mi' | 'fc' | 'op' | 'pp' | 'bti';
export type ProviderName = 'FC Game' | 'JDB' | 'JILI' | 'PG SOFT' | 'Pragmatic Play';
export type GameType = 'Slot' | 'Live' | 'Fishing' | 'Sport' | 'Card';
export type WeightTag = 'A' | 'B' | 'C' | 'S';
export type GameStatus = '上架' | '下架' | '維護中';
export type ApiStatus = '正常' | '異常';
export type PagcorCategory = 'Slot Machine' | 'Live Casino' | 'Bingo' | 'Sports';

export interface GameManagementRecord {
  key: string;
  gameId: string;
  providerGameId: string;
  gameNameEn: string;
  gameNameTg: string;
  gameType: GameType;
  status: GameStatus;
  apiStatus: ApiStatus;
  provider: ProviderName;
  venue: VenueCode;
  compliant: boolean;
  hasFreeSpin: boolean;
  pagcorCategory: PagcorCategory;
  blindBoxEnabled: boolean;
  rateTemplate: string;
  sortWeight: number;
  weightedTags: WeightTag[];
  finalWeight: number;
  hot: boolean;
  isNew: boolean;
  updatedAt: string;
  maintainer: string;
}

export const venueOptions: VenueCode[] = ['mi', 'fc', 'op', 'pp', 'bti'];
export const providerOptions: ProviderName[] = ['FC Game', 'JDB', 'JILI', 'PG SOFT', 'Pragmatic Play'];
export const gameTypeOptions: GameType[] = ['Slot', 'Live', 'Fishing', 'Sport', 'Card'];
export const weightTagOptions: WeightTag[] = ['A', 'B', 'C', 'S'];
export const gameStatusOptions: GameStatus[] = ['上架', '下架', '維護中'];
export const yesNoOptions = ['是', '否'] as const;

const providerPrefixes: Record<ProviderName, string> = {
  'FC Game': 'FC',
  JDB: 'JDB',
  JILI: 'JILI',
  'PG SOFT': 'PG',
  'Pragmatic Play': 'PP',
};

const weightFactors: Record<WeightTag, number> = {
  S: 1.5,
  A: 1.3,
  B: 1.15,
  C: 1.05,
};

const maintainerOptions = ['Ariel', 'Bianca', 'Carlos', 'Darren', 'Elaine', 'Felix', 'Harper'];

const gameNamePools: Record<ProviderName, { en: string; tg: string }[]> = {
  'FC Game': [
    { en: 'Night Market Spins', tg: 'Ikot sa Pamilihan sa Gabi' },
    { en: 'Dragon Harvest', tg: 'Ani ng Dragon' },
    { en: 'Lucky Lanterns', tg: 'Maswerteng Parol' },
    { en: 'Pearl Diver', tg: 'Maninisid ng Perlas' },
    { en: 'Golden Koi', tg: 'Gintong Koi' },
    { en: 'Street Feast', tg: 'Piging sa Kalye' },
  ],
  JDB: [
    { en: 'Fortune Crown', tg: 'Korona ng Suwerte' },
    { en: 'Zeus Thunder', tg: 'Kulob ni Zeus' },
    { en: 'Treasure Reef', tg: 'Bahura ng Yaman' },
    { en: 'Royal Bengal', tg: 'Maharlikang Bengal' },
    { en: 'Pirate Harbor', tg: 'Daungan ng Pirata' },
    { en: 'Lucky Volcano', tg: 'Maswerteng Bulkan' },
  ],
  JILI: [
    { en: 'Super Ace Deluxe', tg: 'Marangyang Super Ace' },
    { en: 'Fortune Gems', tg: 'Hiyas ng Suwerte' },
    { en: 'Pharaoh Spins', tg: 'Ikot ng Paraon' },
    { en: 'Neon Arcade', tg: 'Maliwanag na Arkada' },
    { en: 'Lucky Samba', tg: 'Maswerteng Samba' },
    { en: 'Wild Safari', tg: 'Mailap na Safari' },
  ],
  'PG SOFT': [
    { en: 'Mahjong Ways Max', tg: 'Pinakamalaking Mahjong Ways' },
    { en: 'Fortune Tiger Rush', tg: 'Dagsa ng Fortune Tiger' },
    { en: 'Bakery Bonanza', tg: 'Pistahan sa Panaderya' },
    { en: 'Crypto Gold', tg: 'Gintong Crypto' },
    { en: 'Dream Genie', tg: 'Henyo ng Pangarap' },
    { en: 'Candy Burst', tg: 'Pagsabog ng Kendi' },
  ],
  'Pragmatic Play': [
    { en: 'Sweet Bonanza X', tg: 'Matamis na Bonanza X' },
    { en: 'Gates of Olympus Rise', tg: 'Pag-angat ng Pintuan ng Olympus' },
    { en: 'Starlight Princess Nova', tg: 'Bagong Bituing Prinsesa' },
    { en: 'Wolf Gold Ultra', tg: 'Napakayamang Lobo' },
    { en: 'Big Bass Splash', tg: 'Malaking Huli sa Lawa' },
    { en: 'Fire Archer', tg: 'Mamamanang Apoy' },
  ],
};

const getStatus = (index: number): GameStatus => {
  if (index % 10 === 0) return '維護中';
  if (index % 10 === 1 || index % 10 === 6) return '下架';
  return '上架';
};

const getTags = (index: number): WeightTag[] => {
  const pattern = index % 8;
  if (pattern === 0) return ['S'];
  if (pattern === 1 || pattern === 5) return ['A'];
  if (pattern === 2 || pattern === 6) return ['B'];
  if (pattern === 3) return ['C'];
  if (pattern === 4) return ['A', 'S'];
  return ['B', 'C'];
};

const getFinalWeight = (sortWeight: number, tags: WeightTag[]) => {
  const factor = tags.reduce((max, tag) => Math.max(max, weightFactors[tag]), 1);
  return Number((sortWeight * factor).toFixed(2));
};

export const gameManagementData: GameManagementRecord[] = Array.from({ length: 60 }, (_, index) => {
  const provider = providerOptions[index % providerOptions.length];
  const venue = venueOptions[(index * 2) % venueOptions.length];
  const gameType = gameTypeOptions[(index * 3) % gameTypeOptions.length];
  const pool = gameNamePools[provider];
  const nameSeed = pool[Math.floor(index / providerOptions.length) % pool.length];
  const weightedTags = getTags(index);
  const sortWeight = 40 + ((index * 17) % 155);
  const updatedAt = dayjs('2026-04-28 18:00:00')
    .subtract(index * 9, 'hour')
    .add((index % 5) * 11, 'minute')
    .format('YYYY-MM-DD HH:mm:ss');

  return {
    key: `gm-${index + 1}`,
    gameId: String(100001 + index),
    providerGameId: `${providerPrefixes[provider]}-${String(700001 + index)}`,
    gameNameEn: `${nameSeed.en} ${Math.floor(index / providerOptions.length) + 1}`,
    gameNameTg: `${nameSeed.tg} ${Math.floor(index / providerOptions.length) + 1}`,
    gameType,
    status: getStatus(index),
    apiStatus: index % 10 === 4 ? '異常' : '正常',
    provider,
    venue,
    compliant: index % 7 !== 0,
    hasFreeSpin: index % 10 < 3,
    pagcorCategory: gameType === 'Slot'
      ? 'Slot Machine'
      : gameType === 'Live'
        ? 'Live Casino'
        : gameType === 'Sport'
          ? 'Sports'
          : 'Bingo',
    blindBoxEnabled: index % 4 === 0,
    rateTemplate: index % 6 === 0 ? 'VIP 0.90' : index % 5 === 0 ? '標準 0.88' : '標準 0.85',
    sortWeight,
    weightedTags,
    finalWeight: getFinalWeight(sortWeight, weightedTags),
    hot: index % 5 === 0,
    isNew: index % 20 < 3,
    updatedAt,
    maintainer: maintainerOptions[index % maintainerOptions.length],
  };
});
