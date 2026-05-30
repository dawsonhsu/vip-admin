import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { WinSession } from './types';

export const WINWINWIN_COOKIE = 'winwinwin_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getJwtSecret() {
  // TODO: replace dev fallback by setting WINWINWIN_JWT_SECRET in production.
  return process.env.WINWINWIN_JWT_SECRET || 'dev-only-winwinwin-jwt-secret-change-me';
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function signHs256(unsignedToken: string) {
  return createHmac('sha256', getJwtSecret()).update(unsignedToken).digest('base64url');
}

function optionalRequire<T = any>(packageName: string): T | null {
  try {
    const requireFn = eval('require') as NodeRequire;
    return requireFn(packageName) as T;
  } catch {
    return null;
  }
}

export async function createSessionToken(session: WinSession) {
  const jwt = (await import('jsonwebtoken')).default;
  return jwt.sign(session, getJwtSecret(), { expiresIn: MAX_AGE_SECONDS });
}

export function verifySessionToken(token?: string): WinSession | null {
  if (!token) return null;

  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;

    const unsignedToken = `${header}.${payload}`;
    const expected = signHs256(unsignedToken);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: unknown;
      name?: unknown;
      exp?: unknown;
    };

    if (typeof decoded.exp === 'number' && decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    const email = decoded.email;
    const name = decoded.name;
    if (typeof email !== 'string' || typeof name !== 'string') return null;

    return { email, name };
  } catch {
    return null;
  }
}

export async function comparePassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith('mock:')) {
    return password === passwordHash.slice('mock:'.length);
  }

  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(password, passwordHash);
}

export function getSessionFromCookies() {
  return verifySessionToken(cookies().get(WINWINWIN_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(WINWINWIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(WINWINWIN_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
