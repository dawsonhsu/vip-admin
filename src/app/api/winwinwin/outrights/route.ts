import { NextResponse } from 'next/server';
import { getOutrights } from '@/lib/winwinwin/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const outrights = await getOutrights();
  return NextResponse.json({ outrights });
}
