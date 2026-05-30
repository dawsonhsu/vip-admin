import { NextRequest, NextResponse } from 'next/server';
import { getOdds } from '@/lib/winwinwin/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get('match_id') ?? undefined;
  const odds = await getOdds(matchId);
  return NextResponse.json({ odds });
}
