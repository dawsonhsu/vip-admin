import type { Dayjs } from 'dayjs';
import type { PagcorDataSite, PagcorSite } from '@/components/PagcorSiteContext';
import { pagcorSites } from '@/data/pagcorMockData';

export const filplayShop = { id: 2, name: pagcorSites[0] } as const;

export function pagcorShopNamesForSite(site: PagcorSite): string[] {
  return site === 'filplay' ? [filplayShop.name] : pagcorSites;
}

export interface PagcorShop {
  id: number;
  name: string;
  address: string;
  domains: string[];
  state: 1 | 2;
  createdAt: string;
  operator: string;
  operatedAt: string;
  note: string;
}

function mulberry32(seed: number) {
  return () => {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePagcorShops(anchor: Dayjs, site: PagcorDataSite = 'filbet'): PagcorShop[] {
  const rnd = mulberry32(20260931);
  const historySeconds = anchor.diff(anchor.subtract(24, 'month'), 'second');
  const shops = ['Headquarters', ...pagcorSites].map((name, index) => {
    const id = index === 0 ? 0 : index + 1;
    const offset = index === 0 ? historySeconds : Math.floor(rnd() * historySeconds);
    const created = anchor.subtract(offset, 'second');
    return {
      id,
      name,
      address: index === 0 ? 'Metro Manila' : name,
      filbetDomains: id === 0 ? ['filbet.com'] : rnd() < 0.5 ? [`s${id}.filbet.com`] : [`s${id}.filbet.com`, `s${id}-vip.filbet.com`],
      filplayDomains: id === 0 ? ['filplay.com'] : rnd() < 0.6 ? [`s${id}.filplay.com`] : [],
      state: rnd() < 0.95 ? 1 as const : 2 as const,
      createdAt: created.format('YYYY-MM-DD HH:mm:ss'),
      operator: 'system',
      operatedAt: created.add(Math.floor(rnd() * (offset + 1)), 'second').format('YYYY-MM-DD HH:mm:ss'),
      note: '',
    };
  });
  // Generate the same seed for each site, then keep only that site's records/domains.
  return shops.filter((shop) => site === 'filbet' || shop.id === filplayShop.id)
    .map(({ filbetDomains, filplayDomains, ...shop }) => ({
      ...shop, domains: site === 'filbet' ? filbetDomains : filplayDomains,
    }));
}

export function normalizePagcorDomains(value: string = ''): string[] {
  const domains = new Map<string, string>();
  for (const line of value.split(/\r?\n/)) {
    const domain = line.trim();
    if (domain && !domains.has(domain.toLowerCase())) domains.set(domain.toLowerCase(), domain);
  }
  return Array.from(domains.values());
}

export function validatePagcorDomains(domains: string[], otherDomains: string[], shops: PagcorShop[], editingId?: number): string | undefined {
  const hostname = /^(?=.{1,253}$)[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;
  for (const domain of domains) {
    if (!hostname.test(domain)) return `域名格式不正确：${domain}`;
    if (otherDomains.some((other) => other.toLowerCase() === domain.toLowerCase())) return `域名已用于另一个站点：${domain}`;
    const owner = shops.find((shop) => shop.id !== editingId && shop.domains.some((existing) => existing.toLowerCase() === domain.toLowerCase()));
    if (owner) return `域名已被门店「${owner.name}」使用：${domain}`;
  }
  return undefined;
}
