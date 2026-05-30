import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/winwinwin/sheets';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ exists: false });

  return NextResponse.json({ exists: true, name: user.name });
}
