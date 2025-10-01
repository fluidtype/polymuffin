import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // TODO: implementazione reale con Bearer token;
  // per ora STUB con 5 tweet finti
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const data = Array.from({ length: 5 }, (_,i)=>({
    id: String(i+1),
    text: `[STUB] Top tweet su "${q}"`,
    author: '@stub',
    like_count: 50 - i*3,
    retweet_count: 10 + i
  }));
  return NextResponse.json({ data });
}
