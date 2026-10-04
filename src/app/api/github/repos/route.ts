import { NextRequest, NextResponse } from 'next/server';
import { listUserRepos, listRepoBranches } from '@/lib/github';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const token = tokenHeader || process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'GitHub Token mancante.' }, { status: 401 });
    }

    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (owner && repo) {
      // Fetch branches for this repo
      const branches = await listRepoBranches(token, owner, repo);
      return NextResponse.json({ branches });
    }

    // Otherwise list user repos
    const repos = await listUserRepos(token);
    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore GitHub API' }, { status: 500 });
  }
}
