import { headers } from 'next/headers';

export async function getBaseUrl() {
  const hdrs = await headers();
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');

  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const fallbackHost = process.env.VERCEL_URL ?? 'localhost:3000';
  const fallbackProto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${fallbackProto}://${fallbackHost}`;
}
