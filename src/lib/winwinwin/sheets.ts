import type { BetRow, MatchRow, OddsRow, OutrightRow, UserRow } from './types';

const CACHE_MS = 30_000;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const BET_COLUMNS: Array<keyof BetRow> = [
  'bet_id',
  'created_at',
  'email',
  'name',
  'bet_type',
  'match_name',
  'match_time',
  'api_match_id',
  'outright_id',
  'market_category',
  'market_label_zh',
  'selection_label_zh',
  'line',
  'price_decimal',
  'stake',
  'status',
];

type SheetName = 'users' | 'matches' | 'odds' | 'outrights' | 'bets';
type SheetRecord = Record<string, string>;

let sheetsClient: any = null;
const cache = new Map<string, { expiresAt: number; rows: SheetRecord[] }>();

const mockPasswordHash = 'mock:winwinwin';

const mockUsers: UserRow[] = [
  {
    email: 'darren@example.com',
    password_hash: mockPasswordHash,
    name: 'Darren',
    status: 'active',
    created_at: '2026-05-30T12:00:00Z',
  },
  {
    email: 'disabled@example.com',
    password_hash: mockPasswordHash,
    name: 'Disabled',
    status: 'disabled',
    created_at: '2026-05-30T12:00:00Z',
  },
];

const mockMatches: MatchRow[] = [
  {
    api_match_id: '1620858185',
    home_team: '墨西哥',
    away_team: '南非',
    start_time: '2026-06-11T19:00:00Z',
    status: 'upcoming',
    total_market_count: 128,
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    api_match_id: '1620858186',
    home_team: '巴西',
    away_team: '德國',
    start_time: '2026-06-12T22:00:00Z',
    status: 'upcoming',
    total_market_count: 136,
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    api_match_id: '1620858187',
    home_team: '阿根廷',
    away_team: '西班牙',
    start_time: '2026-06-13T01:00:00Z',
    status: 'upcoming',
    total_market_count: 121,
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    api_match_id: '1620858188',
    home_team: '法國',
    away_team: '英格蘭',
    start_time: '2026-06-13T19:00:00Z',
    status: 'upcoming',
    total_market_count: 144,
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    api_match_id: '1620858189',
    home_team: '日本',
    away_team: '美國',
    start_time: '2026-06-14T02:00:00Z',
    status: 'upcoming',
    total_market_count: 118,
    updated_at: '2026-05-30T14:00:00Z',
  },
];

const mockBets: BetRow[] = [];

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function hasSheetsConfig() {
  return Boolean(
    process.env.WINWINWIN_SHEETS_ID &&
      process.env.WINWINWIN_GOOGLE_SA_EMAIL &&
      process.env.WINWINWIN_GOOGLE_SA_KEY,
  );
}

function serviceAccountKey() {
  return process.env.WINWINWIN_GOOGLE_SA_KEY?.replace(/\\n/g, '\n') || '';
}

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const { google } = await import('googleapis');
  const auth = new google.auth.JWT({
    email: process.env.WINWINWIN_GOOGLE_SA_EMAIL,
    key: serviceAccountKey(),
    scopes: SCOPES,
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function optionalRequire<T = any>(packageName: string): T | null {
  try {
    const requireFn = eval('require') as NodeRequire;
    return requireFn(packageName) as T;
  } catch {
    return null;
  }
}

function rowKey(sheetName: SheetName) {
  return `${sheetName}!A:Z`;
}

async function readRows(sheetName: SheetName) {
  const cached = cache.get(sheetName);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  if (!hasSheetsConfig()) return mockRows(sheetName);

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.WINWINWIN_SHEETS_ID,
    range: rowKey(sheetName),
  });

  const values = (response.data.values ?? []) as string[][];
  const [headers = [], ...rows] = values;
  const normalized = rows
    .filter((row) => row.some((cell) => stringValue(cell).trim() !== ''))
    .map((row) =>
      headers.reduce<SheetRecord>((record, header, index) => {
        record[header] = stringValue(row[index]);
        return record;
      }, {}),
    );

  if (sheetName !== 'bets') {
    cache.set(sheetName, { expiresAt: Date.now() + CACHE_MS, rows: normalized });
  }

  return normalized;
}

function mockRows(sheetName: SheetName): SheetRecord[] {
  // TODO: replace mock with real sheets call once service account env vars are set.
  if (sheetName === 'users') return mockUsers.map((row) => stringifyRecord(row));
  if (sheetName === 'matches') return mockMatches.map((row) => stringifyRecord(row));
  if (sheetName === 'odds') return mockOdds.map((row) => stringifyRecord(row));
  if (sheetName === 'outrights') return mockOutrights.map((row) => stringifyRecord(row));
  return mockBets.map((row) => stringifyRecord(row));
}

function stringifyRecord<T extends Record<string, unknown>>(record: T) {
  return Object.entries(record).reduce<SheetRecord>((acc, [key, value]) => {
    acc[key] = stringValue(value);
    return acc;
  }, {});
}

function mapUser(row: SheetRecord): UserRow {
  return {
    email: stringValue(row.email).toLowerCase(),
    password_hash: stringValue(row.password_hash),
    name: stringValue(row.name),
    status: stringValue(row.status) === 'disabled' ? 'disabled' : 'active',
    created_at: stringValue(row.created_at),
  };
}

function mapMatch(row: SheetRecord): MatchRow {
  return {
    api_match_id: stringValue(row.api_match_id),
    home_team: stringValue(row.home_team),
    away_team: stringValue(row.away_team),
    start_time: stringValue(row.start_time),
    status: stringValue(row.status),
    total_market_count: numberValue(row.total_market_count),
    updated_at: stringValue(row.updated_at),
  };
}

function mapOdds(row: SheetRecord): OddsRow {
  return {
    api_match_id: stringValue(row.api_match_id),
    market_key: stringValue(row.market_key),
    market_category: stringValue(row.market_category),
    market_type: stringValue(row.market_type),
    market_label_zh: stringValue(row.market_label_zh),
    period: numberValue(row.period),
    selection_label_zh: stringValue(row.selection_label_zh),
    selection_key: stringValue(row.selection_key),
    line: stringValue(row.line),
    price_decimal: numberValue(row.price_decimal),
    price_american: numberValue(row.price_american),
    status: stringValue(row.status),
    updated_at: stringValue(row.updated_at),
  };
}

function mapOutright(row: SheetRecord): OutrightRow {
  return {
    outright_id: stringValue(row.outright_id),
    category_zh: stringValue(row.category_zh),
    description_zh: stringValue(row.description_zh),
    selection_label: stringValue(row.selection_label),
    selection_id: stringValue(row.selection_id),
    price_decimal: numberValue(row.price_decimal),
    price_american: numberValue(row.price_american),
    status: stringValue(row.status),
    updated_at: stringValue(row.updated_at),
  };
}

function mapBet(row: SheetRecord): BetRow {
  return {
    bet_id: stringValue(row.bet_id),
    created_at: stringValue(row.created_at),
    email: stringValue(row.email).toLowerCase(),
    name: stringValue(row.name),
    bet_type: stringValue(row.bet_type) === 'outright' ? 'outright' : 'match',
    match_name: stringValue(row.match_name),
    match_time: stringValue(row.match_time),
    api_match_id: stringValue(row.api_match_id),
    outright_id: stringValue(row.outright_id),
    market_category: stringValue(row.market_category),
    market_label_zh: stringValue(row.market_label_zh),
    selection_label_zh: stringValue(row.selection_label_zh),
    line: stringValue(row.line),
    price_decimal: numberValue(row.price_decimal),
    stake: numberValue(row.stake),
    status: 'pending',
  };
}

export async function getUsers() {
  return (await readRows('users')).map(mapUser);
}

export async function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (await getUsers()).find((user) => user.email === normalized) ?? null;
}

export async function getMatches() {
  return (await readRows('matches'))
    .map(mapMatch)
    .filter((match) => match.api_match_id)
    .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time))
    .slice(0, 5);
}

export async function getOdds(matchId?: string) {
  const rows = (await readRows('odds')).map(mapOdds).filter((row) => row.market_key);
  if (!matchId) return rows;
  return rows.filter((row) => row.api_match_id === matchId);
}

export async function getOutrights() {
  return (await readRows('outrights')).map(mapOutright).filter((row) => row.outright_id);
}

export async function getBets() {
  return (await readRows('bets')).map(mapBet).filter((row) => row.bet_id);
}

export async function appendBet(bet: BetRow) {
  if (!hasSheetsConfig()) {
    mockBets.unshift(bet);
    return bet;
  }

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.WINWINWIN_SHEETS_ID,
    range: 'bets!A:Q',
    valueInputOption: 'RAW',
    requestBody: { values: [BET_COLUMNS.map((key) => bet[key] ?? '')] },
  });

  cache.delete('bets');
  return bet;
}

function oddsRow(
  match: MatchRow,
  category: string,
  type: string,
  label: string,
  period: number,
  selection: string,
  selectionKey: string,
  line: string,
  decimal: number,
  american: number,
): OddsRow {
  const lineKey = line ? `|${line}` : '';
  return {
    api_match_id: match.api_match_id,
    market_key: `${match.api_match_id}|${type}|${period}|${selectionKey}${lineKey}`,
    market_category: category,
    market_type: type,
    market_label_zh: label,
    period,
    selection_label_zh: selection,
    selection_key: selectionKey,
    line,
    price_decimal: decimal,
    price_american: american,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  };
}

const mainPrices = [
  [1.46, 4.29, 7.18],
  [1.88, 3.55, 4.12],
  [2.2, 3.25, 3.4],
  [2.35, 3.1, 3.05],
  [2.7, 3.2, 2.55],
];

const mockOdds: OddsRow[] = mockMatches.flatMap((match, index) => {
  const [home, draw, away] = mainPrices[index];
  return [
    oddsRow(match, 'Main', 'moneyline', '獨贏', 0, match.home_team, 'home', '', home, -217 + index * 25),
    oddsRow(match, 'Main', 'moneyline', '獨贏', 0, '和局', 'draw', '', draw, 329),
    oddsRow(match, 'Main', 'moneyline', '獨贏', 0, match.away_team, 'away', '', away, 618 - index * 30),
    oddsRow(match, 'Handicap', 'spread', '讓分', 0, match.home_team, 'home', '-1.5', 2.02, 102),
    oddsRow(match, 'Handicap', 'spread', '讓分', 0, match.away_team, 'away', '+1.5', 1.82, -122),
    oddsRow(match, 'Goals', 'total', '總進球', 0, '大', 'over', '2.5', 1.91, -110),
    oddsRow(match, 'Goals', 'total', '總進球', 0, '小', 'under', '2.5', 1.91, -110),
    oddsRow(match, 'BTTS', 'special', '雙方進球', 0, '是', 'yes', '', 1.76, -132),
    oddsRow(match, 'BTTS', 'special', '雙方進球', 0, '否', 'no', '', 2.08, 108),
    oddsRow(match, 'Correct Score', 'special', '正確比分', 0, '1-0', '1-0', '', 6.5, 550),
    oddsRow(match, 'Correct Score', 'special', '正確比分', 0, '1-1', '1-1', '', 7.2, 620),
    oddsRow(match, 'Correct Score', 'special', '正確比分', 0, '2-1', '2-1', '', 8.1, 710),
    oddsRow(match, 'HT/FT', 'special', '半全場', 0, `${match.home_team}/${match.home_team}`, 'hh', '', 2.8, 180),
    oddsRow(match, 'HT/FT', 'special', '半全場', 0, `和局/${match.home_team}`, 'dh', '', 4.2, 320),
    oddsRow(match, 'Other', 'special', '單雙', 0, '單', 'odd', '', 1.95, -105),
    oddsRow(match, 'Other', 'special', '單雙', 0, '雙', 'even', '', 1.95, -105),
  ];
});

const mockOutrights: OutrightRow[] = [
  {
    outright_id: '1631462280',
    category_zh: '冠軍',
    description_zh: '世界盃冠軍',
    selection_label: 'Brazil',
    selection_id: '1631462281',
    price_decimal: 6.5,
    price_american: 550,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462280',
    category_zh: '冠軍',
    description_zh: '世界盃冠軍',
    selection_label: 'Argentina',
    selection_id: '1631462282',
    price_decimal: 7,
    price_american: 600,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462280',
    category_zh: '冠軍',
    description_zh: '世界盃冠軍',
    selection_label: 'France',
    selection_id: '1631462283',
    price_decimal: 7.5,
    price_american: 650,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462280',
    category_zh: '冠軍',
    description_zh: '世界盃冠軍',
    selection_label: 'England',
    selection_id: '1631462284',
    price_decimal: 8.2,
    price_american: 720,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462290',
    category_zh: '小組出線',
    description_zh: 'A 組出線',
    selection_label: 'Mexico',
    selection_id: '1631462291',
    price_decimal: 1.72,
    price_american: -139,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462290',
    category_zh: '小組出線',
    description_zh: 'A 組出線',
    selection_label: 'South Africa',
    selection_id: '1631462292',
    price_decimal: 2.15,
    price_american: 115,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462300',
    category_zh: '小組第一',
    description_zh: 'B 組第一',
    selection_label: 'Japan',
    selection_id: '1631462301',
    price_decimal: 3.8,
    price_american: 280,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
  {
    outright_id: '1631462300',
    category_zh: '小組第一',
    description_zh: 'B 組第一',
    selection_label: 'USA',
    selection_id: '1631462302',
    price_decimal: 2.6,
    price_american: 160,
    status: 'open',
    updated_at: '2026-05-30T14:00:00Z',
  },
];
