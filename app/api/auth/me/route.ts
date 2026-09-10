import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = getCurrentUser(tokenUser.id) || tokenUser;
  return NextResponse.json({ user });
}
