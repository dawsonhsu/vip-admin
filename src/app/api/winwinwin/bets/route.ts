import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/winwinwin/auth';
import { getInPlayData } from '@/lib/winwinwin/inplay';
import { appendBet, getBets, getMatches, getOdds, getOutrights } from '@/lib/winwinwin/sheets';
import type { BetPostBody, BetRow } from '@/lib/winwinwin/types';

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function validStake(value: unknown) {
  const stake = Number(value);
  if (!Number.isFinite(stake) || stake <= 0) return null;
  return Math.floor(stake);
}

export async function GET(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) return jsonError('unauthorized', 401);

  const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'all' : 'mine';
  const bets = await getBets();
  const scopedBets = scope === 'all' ? bets : bets.filter((bet) => bet.email === session.email);

  return NextResponse.json({ bets: scopedBets });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) return jsonError('unauthorized', 401);

  const body = (await request.json().catch(() => null)) as BetPostBody | null;
  const stake = validStake(body?.stake);
  if (!body || !stake) return jsonError('invalid_bet', 400);

  if (body.bet_type === 'inplay') {
    if (!body.no || !body.market_id || !body.selection_id) return jsonError('invalid_inplay_bet', 400);

    let inplay;
    try {
      inplay = await getInPlayData('足球');
    } catch {
      return jsonError('inplay_unavailable', 503);
    }

    const match = inplay.matches.find((row) => row.no === body.no);
    const market = match?.markets.find((row) => row.market_id === body.market_id);
    const selection = market?.selections.find((row) => row.selection_id === body.selection_id);
    if (!match || !market || !selection) return jsonError('inplay_market_gone', 409);

    const bet: BetRow = {
      bet_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      email: session.email,
      name: session.name,
      bet_type: 'inplay',
      match_name: `${match.home_team} vs ${match.away_team}`,
      match_time: match.start_time,
      api_match_id: match.api_match_id,
      outright_id: '',
      market_category: market.market_category,
      market_label_zh: market.market_label_zh,
      selection_label_zh: selection.selection_label_zh,
      line: selection.line,
      price_decimal: selection.price_decimal,
      stake,
      status: 'pending',
    };

    await appendBet(bet);
    return NextResponse.json({ bet }, { status: 201 });
  }

  if (body.bet_type === 'match') {
    if (!body.api_match_id || !body.market_key) return jsonError('invalid_match_bet', 400);

    const matches = await getMatches();
    const match = matches.find((row) => row.api_match_id === body.api_match_id);
    if (!match) return jsonError('match_not_found', 404);
    if (Date.parse(match.start_time) <= Date.now()) return jsonError('match_locked', 409);

    const oddsRows = await getOdds(body.api_match_id);
    const odds = oddsRows.find((row) => row.market_key === body.market_key);
    if (!odds || odds.status !== 'open') return jsonError('odds_closed', 409);

    const bet: BetRow = {
      bet_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      email: session.email,
      name: session.name,
      bet_type: 'match',
      match_name: `${match.home_team} vs ${match.away_team}`,
      match_time: match.start_time,
      api_match_id: match.api_match_id,
      outright_id: '',
      market_category: odds.market_category,
      market_label_zh: odds.market_label_zh,
      selection_label_zh: odds.selection_label_zh,
      line: odds.line,
      price_decimal: odds.price_decimal,
      stake,
      status: 'pending',
    };

    await appendBet(bet);
    return NextResponse.json({ bet }, { status: 201 });
  }

  if (body.bet_type === 'outright') {
    if (!body.outright_id || !body.selection_id) return jsonError('invalid_outright_bet', 400);

    const outrights = await getOutrights();
    const outright = outrights.find(
      (row) => row.outright_id === body.outright_id && row.selection_id === body.selection_id,
    );
    if (!outright || outright.status !== 'open') return jsonError('outright_closed', 409);

    const bet: BetRow = {
      bet_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      email: session.email,
      name: session.name,
      bet_type: 'outright',
      match_name: '',
      match_time: '',
      api_match_id: '',
      outright_id: outright.outright_id,
      market_category: outright.category_zh,
      market_label_zh: outright.description_zh,
      selection_label_zh: outright.selection_label,
      line: '',
      price_decimal: outright.price_decimal,
      stake,
      status: 'pending',
    };

    await appendBet(bet);
    return NextResponse.json({ bet }, { status: 201 });
  }

  return jsonError('invalid_bet_type', 400);
}
