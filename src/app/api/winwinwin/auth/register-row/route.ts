import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Body = {
  email?: unknown;
  name?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (!name || name.length > 32) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }
  if (!password || password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
  }

  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const row = [email, hash, name, 'active', createdAt].join('\t');
  return NextResponse.json({ row, email, name, createdAt });
}
