import dayjs, { type Dayjs } from 'dayjs';
import type { PagcorBrand } from '@/components/PagcorBrandTabs';
import { pagcorProviders } from '@/data/pagcorMockData';

export const pagcorGameCategories = ['Live', 'Fish', 'E-game', 'Chess', 'Sport', 'Esport', 'Bingo'] as const;
export const pagcorGameCategoryLabels: Record<typeof pagcorGameCategories[number], string> = {
  Live: 'Live', Fish: 'Fish', 'E-game': 'E-game', Chess: 'Chess', Sport: 'Sport', Esport: 'Esport', Bingo: 'Bingo',
};

export interface PagcorGame {
  id: string;
  name: string;
  code: string;
  category: typeof pagcorGameCategories[number];
  provider: string;
  online: boolean;
  maintained: boolean;
  createdAt: string;
  updatedAt: string;
}

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const catalogueGroups: Array<{ provider: string; category: PagcorGame['category']; names: string[] }> = [
  { provider: 'evo', category: 'Live', names: ['Baccarat Classic', 'Speed Baccarat', 'Lightning Roulette', 'Live Blackjack'] },
  { provider: 'sa', category: 'Live', names: ['VIP Baccarat', 'Classic Sic Bo', 'Dragon Tiger', 'European Roulette'] },
  { provider: 'jili', category: 'Fish', names: ['Fishing God', 'Golden Fishing', 'Coral Treasure', 'Dragon Fishing'] },
  { provider: 'jdb', category: 'Fish', names: ['Ocean Legend', 'Happy Fishing', 'Shark Attack', 'Pearl Bay'] },
  { provider: 'pg', category: 'E-game', names: ['Mahjong Ways', 'Fortune Tiger', 'Lucky Neko', 'Wild Bandito'] },
  { provider: 'pp', category: 'E-game', names: ['Gates of Olympus', 'Sweet Bonanza', 'Starlight Princess', 'The Dog House'] },
  { provider: 'cq9', category: 'E-game', names: ['Dragon Dynasty', 'Lucky Cat', 'Golden Treasure', 'Lucky Fortune'] },
  { provider: 'habanero', category: 'E-game', names: ['Jungle Adventure', 'Lucky Lantern', 'Flaming Gems', 'Pirate Chest'] },
  { provider: 'netent', category: 'E-game', names: ['Winter Wonderland', 'Starburst', 'Castle Mystery', 'Lucky Seven'] },
  { provider: 'redtiger', category: 'E-game', names: ['Red Dragon', 'Golden Falls', 'Moonlight Forest', 'Diamond Night'] },
  { provider: 'panda', category: 'Chess', names: ['Fight the Landlord', 'Happy Mahjong', 'Texas Holdem', 'Three Card Poker'] },
  { provider: 'bti', category: 'Sport', names: ['Football Arena', 'Basketball Arena', 'Tennis Arena', 'Baseball Arena'] },
  { provider: 'op', category: 'Esport', names: ['Esports Arena', 'Champions Cup', 'Esports League', 'Esports Showdown'] },
  { provider: 'jili', category: 'Bingo', names: ['Happy Bingo', 'Lucky Bingo', 'Golden Bingo', 'Starlight Bingo'] },
  { provider: 'bng', category: 'E-game', names: ['Gem Mine', 'Lucky Garden', 'Golden Route', 'Mystic Oasis'] },
  { provider: 'fc', category: 'Bingo', names: ['Rainbow Bingo', 'Classic Bingo', 'Tropical Bingo', 'Dream Bingo'] },
  { provider: 'jili', category: 'E-game', names: ['Fortune Gems', 'Super Ace', 'Golden Empire', 'Money Coming'] },
];

export function generatePagcorGames(anchor: Dayjs = dayjs()): Record<PagcorBrand, PagcorGame[]> {
  const base = catalogueGroups.flatMap((group, groupIndex) => {
    const provider = pagcorProviders.find((code) => code === group.provider) ?? pagcorProviders[groupIndex % pagcorProviders.length];
    return group.names.map((name, index) => ({
      id: String(10001 + groupIndex * 4 + index), name,
      code: `${provider}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      category: group.category, provider,
    }));
  });
  const subsetRandom = mulberry32(4400);
  const subset = new Set(base.map((game) => ({ id: game.id, rank: subsetRandom() }))
    .sort((a, b) => a.rank - b.rank).slice(0, 46).map((game) => game.id));

  const buildBrand = (brand: PagcorBrand): PagcorGame[] => {
    const random = mulberry32(brand === 'filbet' ? 4401 : 4402);
    return base.filter((game) => brand === 'filbet' || subset.has(game.id)).map((game) => {
      const createdOffset = Math.floor(random() * 45 * 86400);
      const updatedOffset = Math.floor(random() * createdOffset);
      return {
        ...game, online: random() < 0.8, maintained: random() < 0.15,
        createdAt: anchor.subtract(createdOffset, 'second').format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: anchor.subtract(updatedOffset, 'second').format('YYYY-MM-DD HH:mm:ss'),
      };
    });
  };
  return { filbet: buildBrand('filbet'), filplay: buildBrand('filplay') };
}
