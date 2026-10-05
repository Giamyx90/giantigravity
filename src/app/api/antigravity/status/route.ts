import { NextResponse } from 'next/server';
import { getAgyExecutablePath, isAgyInstalled } from '@/lib/agy-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const agyPath = getAgyExecutablePath();
  const installed = isAgyInstalled();

  return NextResponse.json({
    available: installed,
    executable: agyPath,
    engine: 'Antigravity CLI (Nativo Windows)',
    description: 'Connessione diretta alla sessione Google Antigravity senza API Key e senza rate limit',
  });
}
