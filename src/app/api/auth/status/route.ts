import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookieClientId = req.cookies.get('google_client_id')?.value;
  const envClientId = process.env.GOOGLE_CLIENT_ID;

  const validCookie = Boolean(
    cookieClientId &&
    decodeURIComponent(cookieClientId).trim() !== '' &&
    decodeURIComponent(cookieClientId) !== 'dummy-client-id'
  );
  const validEnv = Boolean(
    envClientId &&
    envClientId.trim() !== '' &&
    envClientId !== 'dummy-client-id'
  );

  return NextResponse.json({
    configured: validCookie || validEnv,
    hasEnv: validEnv,
    hasCookie: validCookie,
  });
}
