import dayjs from 'dayjs';

export type TurnoverSource = '上分' | '禮金' | '存款' | '風控調整' | '免費旋轉派彩';

// 場館限制目錄：類別 Slot 之下的廠商
export const SLOT_PROVIDERS = [
  'bng', 'btg', 'cq9', 'fastspin', 'fc', 'funky', 'galaxsys', 'gemini', 'habanero', 'hacksaw',
  'jdb', 'jili', 'maxwin', 'mi', 'netent', 'nlc', 'op', 'panda', 'pg', 'playstar',
  'playtech', 'pp', 'redtiger', 'rtg', 'simpleplay', 'tpg', 'uu', 'we', 'yellowbat', 'ygr',
];

export interface VenueRestrictionItem {
  category: string;   // 固定 'Slot'
  provider: string;   // 例：'pg'
}

export interface TurnoverDetailItem {
  id: string;
  uid: string;
  sourceOrderId: string;
  transactionTime: string;
  source: TurnoverSource;
  amount: number;
  multiplier: number;
  requirement: number;
  completed: boolean;
  remaining: number;
  venueRestriction: VenueRestrictionItem[];
  operator: string;
}

export const TURNOVER_SOURCES: TurnoverSource[] = ['上分', '禮金', '存款', '風控調整', '免費旋轉派彩'];

const demoUids = ['U10001', 'U10002', 'U10005', 'U10020', 'U10033', 'U10041', 'U10047'];
const turnoverMultipliers = [1, 2, 3, 5, 8];
const adminEmails = ['darren@filbetph.com', 'risk.ops@filbet.com', 'ops.supervisor@filbet.com'];

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: string) => {
  let state = hashString(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randInt = (rng: () => number, min: number, max: number): number => (
  min + Math.floor(rng() * (max - min + 1))
);

const randDec = (rng: () => number, min: number, max: number): number => (
  +(rng() * (max - min) + min).toFixed(2)
);

const pick = <T>(rng: () => number, values: T[]): T => values[randInt(rng, 0, values.length - 1)];

const pickMany = <T>(rng: () => number, values: T[], count: number): T[] => {
  const source = [...values];
  const result: T[] = [];
  const size = Math.min(count, source.length);
  for (let i = 0; i < size; i += 1) {
    const index = randInt(rng, 0, source.length - 1);
    result.push(source.splice(index, 1)[0]);
  }
  return result;
};

const createSourceOrderId = (rng: () => number): string => {
  let output = String(randInt(rng, 1, 9));
  for (let i = 0; i < 16; i += 1) {
    output += String(randInt(rng, 0, 9));
  }
  return output;
};

const createVenueRestriction = (rng: () => number): VenueRestrictionItem[] => {
  const count = randInt(rng, 3, Math.min(15, SLOT_PROVIDERS.length));
  return pickMany(rng, SLOT_PROVIDERS, count)
    .sort((a, b) => SLOT_PROVIDERS.indexOf(a) - SLOT_PROVIDERS.indexOf(b))
    .map(provider => ({ category: 'Slot', provider }));
};

const generateTurnoverDetailsForUid = (uid: string): TurnoverDetailItem[] => {
  const rng = createRng(`turnover-detail-${uid}`);
  const count = randInt(rng, 12, 30);

  return Array.from({ length: count }, (_, index) => {
    const amount = randDec(rng, 100, 5000);
    const multiplier = pick(rng, turnoverMultipliers);
    const requirement = +(amount * multiplier).toFixed(2);
    const completed = rng() < 0.4;
    const remaining = completed ? 0 : randDec(rng, 0, requirement);
    // 以「天」為粒度取 dayjs()（與其他 mock 一致，避免 SSR/hydration 不一致），
    // 時:分:秒 改由 seed 決定，使伺服器與用戶端產生完全相同的字串。
    const daysAgo = randInt(rng, 0, 60);
    const secondOfDay = randInt(rng, 0, 24 * 60 * 60 - 1);
    const transactionTime = dayjs()
      .subtract(daysAgo, 'day')
      .startOf('day')
      .add(secondOfDay, 'second')
      .format('YYYY-MM-DD HH:mm:ss');

    return {
      id: `${uid}-turnover-${String(index + 1).padStart(2, '0')}`,
      uid,
      sourceOrderId: createSourceOrderId(rng),
      transactionTime,
      source: pick(rng, TURNOVER_SOURCES),
      amount,
      multiplier,
      requirement,
      completed,
      remaining,
      venueRestriction: createVenueRestriction(rng),
      operator: rng() < 0.72 ? 'system' : pick(rng, adminEmails),
    };
  }).sort((a, b) => b.transactionTime.localeCompare(a.transactionTime));
};

export function generateTurnoverDetails(): TurnoverDetailItem[] {
  return demoUids
    .flatMap(uid => generateTurnoverDetailsForUid(uid))
    .sort((a, b) => b.transactionTime.localeCompare(a.transactionTime));
}

export const turnoverDetails: TurnoverDetailItem[] = generateTurnoverDetails();

const fallbackTurnoverDetails = new Map<string, TurnoverDetailItem[]>();

export function getTurnoverDetailsByUid(uid: string): TurnoverDetailItem[] {
  const rows = turnoverDetails.filter(item => item.uid === uid);
  if (rows.length > 0) return rows;

  if (!fallbackTurnoverDetails.has(uid)) {
    fallbackTurnoverDetails.set(uid, generateTurnoverDetailsForUid(uid));
  }
  return fallbackTurnoverDetails.get(uid) ?? [];
}
