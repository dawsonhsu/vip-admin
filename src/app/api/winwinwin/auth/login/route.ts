import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/winwinwin/auth';
import { getUserByEmail } from '@/lib/winwinwin/sheets';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const passwordOk = await comparePassword(password, user.password_hash);
  if (!passwordOk) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  if (user.status === 'disabled') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, name: user.name });
  setSessionCookie(response, await createSessionToken({ email: user.email, name: user.name }));
  return response;
}
