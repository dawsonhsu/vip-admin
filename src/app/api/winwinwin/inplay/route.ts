import { NextRequest, NextResponse } from 'next/server';
import { getInPlayData } from '@/lib/winwinwin/inplay';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sport = request.nextUrl.searchParams.get('sport') || '足球';

  try {
    return NextResponse.json(await getInPlayData(sport));
  } catch {
    return NextResponse.json({
      updated_at: new Date().toISOString(),
      matches: [],
    });
  }
}
