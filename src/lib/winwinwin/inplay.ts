import type { InPlayMatch, InPlayMarket, InPlayResponse } from './types';

const LIVE_GAMES_URL = 'https://blob3rd.sportslottery.com.tw/apidata/Live/Games.zh.json';
const CACHE_MS = 10_000;

type JsonRecord = Record<string, unknown>;

type LiveCache = {
  expiresAt: number;
  fetchedAt: string;
  etag?: string;
  lastModified?: string;
  events: JsonRecord[];
};

let liveCache: LiveCache | null = null;
let pendingFetch: Promise<LiveCache> | null = null;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function booleanValue(value: unknown) {
  return value === true || value === 'true';
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function selectionKey(value: unknown) {
  if (value === 'H') return 'home';
  if (value === 'D') return 'draw';
  if (value === 'A') return 'away';
  return '';
}

function decodeOdds(pd: unknown, pu: unknown) {
  const denominator = numberValue(pd);
  const numerator = numberValue(pu);
  if (!denominator || numerator === null) return null;
  return Math.round((1 + numerator / denominator) * 100) / 100;
}

function parsePeriod(name: string) {
  if (name.includes('[上半場]') || name.includes('上半場')) return 1;
  return 0;
}

export function classify(name: string) {
  // Order matters: more-specific substrings first.
  // '不讓分' contains '讓分', so it MUST be checked before the Handicap rule,
  // otherwise the 1X2 main market is mis-tagged as Handicap (and the list
  // card's mainMarket() lookup finds nothing → no quick odds buttons).
  if (name.includes('不讓分') || name.includes('獨贏')) return 'Main';
  if (name.includes('半/全場') || name.includes('半全場')) return 'HT/FT';
  if (name.includes('正確比數')) return 'Correct Score';
  // '單雙' before '總分/大小': e.g. '[總分]單雙' contains '總分' but is Odd/Even.
  if (name.includes('單雙')) return 'Odd/Even';
  if (name.includes('讓分') || name.includes('讓球')) return 'Handicap';
  if (name.includes('角球')) return 'Corners';
  if (name.includes('進球數')) return 'Goals';
  if (name.includes('大小') || name.includes('總分')) return 'Goals';
  if (name.includes('雙方') || name.includes('兩隊')) return 'BTTS';
  if (name.includes('勝分差')) return 'Margin';
  if (name.includes('組合')) return 'Combo';
  if (name.includes('球隊')) return 'Team Specials';
  return 'Other';
}

function parseLive(ldss: unknown): InPlayMatch['live'] {
  if (!ldss) return null;

  let parsed: JsonRecord | null = null;
  if (typeof ldss === 'string') {
    try {
      parsed = asRecord(JSON.parse(ldss));
    } catch {
      parsed = null;
    }
  } else {
    parsed = asRecord(ldss);
  }

  if (!parsed) return null;

  const rawScores = asRecord(parsed.scores);
  const scores = rawScores
    ? Object.entries(rawScores).reduce<Record<string, { home: number; away: number }>>((acc, [key, value]) => {
        const score = asRecord(value);
        const home = numberValue(score?.home);
        const away = numberValue(score?.away);
        if (home !== null && away !== null) {
          acc[key] = { home, away };
        }
        return acc;
      }, {})
    : {};

  return {
    status: parsed.status === undefined || parsed.status === null ? null : String(parsed.status),
    serve: parsed.serve === undefined || parsed.serve === null ? null : String(parsed.serve),
    scores: Object.keys(scores).length > 0 ? scores : null,
  };
}

function normalizeMarket(marketValue: unknown): InPlayMarket | null {
  const market = asRecord(marketValue);
  if (!market) return null;

  const marketId = stringValue(market.id);
  const marketName = stringValue(market.name);
  if (!marketId || !marketName) return null;

  const selections = asArray(market.cs)
    .map((selectionValue) => {
      const selection = asRecord(selectionValue);
      if (!selection) return null;

      const selectionId = stringValue(selection.id);
      const priceDecimal = decodeOdds(selection.pd, selection.pu);
      if (!selectionId || priceDecimal === null) return null;

      return {
        selection_id: selectionId,
        selection_label_zh: stringValue(selection.name),
        selection_key: selectionKey(selection.v),
        line: stringValue(selection.hv),
        price_decimal: priceDecimal,
      };
    })
    .filter((selection): selection is NonNullable<typeof selection> => Boolean(selection));

  if (selections.length === 0) return null;

  return {
    market_id: marketId,
    market_label_zh: marketName,
    market_category: classify(marketName),
    period: parsePeriod(marketName),
    in_running: booleanValue(market.iir),
    selections,
  };
}

function normalizeEvent(eventValue: unknown): InPlayMatch | null {
  const event = asRecord(eventValue);
  if (!event) return null;

  const no = stringValue(event.no);
  const homeTeam = stringValue(event.hn);
  const awayTeam = stringValue(event.an);
  const startTime = stringValue(event.kt);
  if (!no || !homeTeam || !awayTeam || !startTime) return null;

  const rawMarkets = asArray(event.ms);
  const markets = rawMarkets
    .map(normalizeMarket)
    .filter((market): market is InPlayMarket => Boolean(market));

  return {
    no,
    api_match_id: `tw:${no}`,
    home_team: homeTeam,
    away_team: awayTeam,
    start_time: startTime,
    tournament: stringValue(event.tn),
    country: stringValue(event.cn),
    sr_id: stringValue(event.er),
    live: parseLive(event.ldss),
    total_market_count: rawMarkets.length,
    markets,
  };
}

async function fetchLiveEvents() {
  const now = Date.now();
  if (liveCache && liveCache.expiresAt > now) return liveCache;
  if (pendingFetch) return pendingFetch;

  pendingFetch = (async () => {
    try {
      // 運彩 sends NO cache-control. CloudFront edges in datacenter regions
      // (where Vercel functions run) cache this file STALE — consumer ISP edges
      // stay fresh from traffic, but low-traffic datacenter edges serve an old
      // copy under the default TTL. A unique query param per fetch is never in
      // any edge's cache → forces a MISS → S3 origin → fresh data every time.
      const bustUrl = `${LIVE_GAMES_URL}?_=${Date.now()}`;
      const response = await fetch(bustUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (winwinwin-inplay)',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (liveCache) return liveCache;
        throw new Error(`Taiwan Sports Lottery live fetch failed: ${response.status}`);
      }

      const payload = await response.json();
      const events = asArray(payload).filter((value): value is JsonRecord => Boolean(asRecord(value)));
      liveCache = {
        expiresAt: Date.now() + CACHE_MS,
        fetchedAt: new Date().toISOString(),
        events,
      };
      return liveCache;
    } catch (error) {
      if (liveCache) return liveCache;
      throw error;
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

export async function getInPlayData(sport = '足球'): Promise<InPlayResponse> {
  const cache = await fetchLiveEvents();
  const matches = cache.events
    .filter((event) => !sport || stringValue(event.sn) === sport)
    .map(normalizeEvent)
    .filter((match): match is InPlayMatch => Boolean(match));

  return {
    updated_at: cache.fetchedAt,
    matches,
  };
}

export async function getInPlayMatch(no: string, sport = '足球') {
  const data = await getInPlayData(sport);
  return data.matches.find((match) => match.no === no) ?? null;
}
