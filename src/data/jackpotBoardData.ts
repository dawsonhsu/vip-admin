import dayjs from 'dayjs';

export type SlotProviderCode = 'FC' | 'JDB' | 'JILI' | 'PG' | 'PP';
export type JackpotEventStatus = 'listed' | 'removed' | 'risk_blocked';

export interface JackpotEvent {
  key: string;
  id: number;
  triggerTime: string;
  account: string;
  accountRaw: string;
  vipLevel: string;
  game: string;
  provider: SlotProviderCode;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  status: JackpotEventStatus;
  sourceBetNo: string;
  lastOperator: string;
  removedReason?: string;
}

export interface JackpotBlacklistEntry {
  key: string;
  account: string;
  reason: string;
  operator: string;
  addedAt: string;
}

export interface JackpotOptOutEntry {
  key: string;
  account: string;
  optOutAt: string;
  scope: string;
}

export const slotProviders: Array<{ code: SlotProviderCode; name: string }> = [
  { code: 'FC', name: 'FC Game' },
  { code: 'JDB', name: 'JDB' },
  { code: 'JILI', name: 'JILI' },
  { code: 'PG', name: 'PG SOFT' },
  { code: 'PP', name: 'Pragmatic Play' },
];

export const providerGames: Record<SlotProviderCode, Array<{ code: string; name: string }>> = {
  FC: [
    { code: 'fc-night-market', name: 'Night Market' },
    { code: 'fc-sugar-bang-bang', name: 'Sugar Bang Bang' },
  ],
  JDB: [
    { code: 'jdb-zeus', name: 'Zeus' },
    { code: 'jdb-golden-genie', name: 'Golden Genie' },
  ],
  JILI: [
    { code: 'jili-super-ace', name: 'Super Ace' },
    { code: 'jili-fortune-gems', name: 'Fortune Gems' },
    { code: 'jili-golden-empire', name: 'Golden Empire' },
  ],
  PG: [
    { code: 'pg-fortune-tiger', name: 'Fortune Tiger' },
    { code: 'pg-fortune-rabbit', name: 'Fortune Rabbit' },
    { code: 'pg-mahjong-ways', name: 'Mahjong Ways' },
  ],
  PP: [
    { code: 'pp-sweet-bonanza', name: 'Sweet Bonanza' },
    { code: 'pp-gates-of-olympus', name: 'Gates of Olympus' },
    { code: 'pp-starlight-princess', name: 'Starlight Princess' },
  ],
};

const removedReasons = ['風控標記帳號', '測試帳號', '注單作廢', '重複霸榜'];
const operators = ['admin01', 'admin02', 'ops01', 'risk01'];
const betAmounts = [5, 10, 20, 25, 50, 80, 100, 150, 200, 300, 500];
const accounts = [
  'jade8888',
  'jackpot77',
  'marco2688',
  'lucky013',
  'queenie88',
  'royal520',
  'tigerwin9',
  'mnlplayer88',
  'spinhero27',
  'goldrush66',
  'acepinas18',
  'slotking08',
  'bighit728',
  'mayawin22',
  'rubyplay99',
  'fortunex11',
  'philspin31',
  'starbet888',
  'bonanza09',
  'olympus55',
  'mahjong68',
  'rabbit168',
  'superace88',
  'genie777',
  'nightwin45',
  'sugarboss12',
];

const createRng = (seed: number) => {
  let value = seed;
  return () => {
    value += 0x6D2B79F5;
    let result = Math.imul(value ^ (value >>> 15), value | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const randInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const randDec = (rng: () => number, min: number, max: number, digits = 2) =>
  Number((rng() * (max - min) + min).toFixed(digits));

const pick = <T>(rng: () => number, list: T[]): T => list[randInt(rng, 0, list.length - 1)];

const maskAccount = (account: string) => {
  if (account.length <= 4) return `${account.slice(0, 1)}***${account.slice(-1)}`;
  return `${account.slice(0, 2)}***${account.slice(-2)}`;
};

const createMultiplier = (rng: () => number) => {
  const roll = rng();
  if (roll < 0.8) return randDec(rng, 50, 300, 2);
  if (roll < 0.95) return randDec(rng, 300, 1000, 2);
  return randDec(rng, 1000, 5000, 2);
};

const createStatus = (rng: () => number): JackpotEventStatus => {
  const roll = rng();
  if (roll < 0.8) return 'listed';
  if (roll < 0.92) return 'removed';
  return 'risk_blocked';
};

export function generateJackpotEvents(count = 110): JackpotEvent[] {
  const todaySeed = Number(dayjs().format('YYYYMMDD'));
  const rng = createRng(todaySeed + 917);
  const baseTime = dayjs().startOf('hour');
  const providerCodes = slotProviders.map((provider) => provider.code);

  return Array.from({ length: count }, (_, index) => {
    const id = 880000 + count - index;
    const provider = pick(rng, providerCodes);
    const game = pick(rng, providerGames[provider]).name;
    const betAmount = pick(rng, betAmounts);
    const multiplier = createMultiplier(rng);
    const winAmount = Number((Math.round(betAmount * multiplier * 100) / 100).toFixed(2));
    const status = createStatus(rng);
    const accountRaw = `${pick(rng, accounts)}${randInt(rng, 10, 99)}`;
    const triggerTime = baseTime
      .subtract(randInt(rng, 0, 72 * 60), 'minute')
      .subtract(index * 3, 'minute');

    return {
      key: `jackpot-event-${id}`,
      id,
      triggerTime: triggerTime.format('YYYY-MM-DD HH:mm:ss'),
      account: maskAccount(accountRaw),
      accountRaw,
      vipLevel: `VIP${randInt(rng, 0, 7)}`,
      game,
      provider,
      betAmount,
      multiplier,
      winAmount,
      status,
      sourceBetNo: `BET${triggerTime.format('YYYYMMDD')}${String(id).padStart(8, '0')}`,
      lastOperator: status === 'listed' ? '-' : pick(rng, operators),
      removedReason: status === 'removed' ? pick(rng, removedReasons) : undefined,
    };
  }).sort((a, b) => b.triggerTime.localeCompare(a.triggerTime));
}

export function generateBlacklist(): JackpotBlacklistEntry[] {
  const now = dayjs().startOf('hour');
  return [
    { key: 'blacklist-1', account: 'test_slot_88', reason: '測試帳號', operator: 'admin01', addedAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { key: 'blacklist-2', account: 'risk_studio22', reason: '工作室標記', operator: 'risk01', addedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
    { key: 'blacklist-3', account: 'internal_ops7', reason: '內部員工', operator: 'admin02', addedAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') },
    { key: 'blacklist-4', account: 'chargeback09', reason: '風控標記帳號', operator: 'risk01', addedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss') },
    { key: 'blacklist-5', account: 'dup_board88', reason: '重複霸榜', operator: 'ops01', addedAt: now.subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss') },
  ];
}

export function generateOptOuts(): JackpotOptOutEntry[] {
  const now = dayjs().startOf('hour');
  return [
    { key: 'opt-out-1', account: 'whale_king88', optOutAt: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), scope: '榜單' },
    { key: 'opt-out-2', account: 'vip_scarlet7', optOutAt: now.subtract(18, 'hour').format('YYYY-MM-DD HH:mm:ss'), scope: '榜單' },
    { key: 'opt-out-3', account: 'privateace55', optOutAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'), scope: '榜單' },
    { key: 'opt-out-4', account: 'quietslot19', optOutAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), scope: '榜單' },
  ];
}
