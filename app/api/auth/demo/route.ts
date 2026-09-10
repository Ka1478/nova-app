import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    const db = getDb();

    let email = 'alex@nova.app';
    if (role === 'PM') email = 'sophia@nova.app';
    if (role === 'Developer') email = 'marcus@nova.app';
    if (role === 'Designer') email = 'elena@nova.app';

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return NextResponse.json({ error: 'Demo user not found. Please run seed.' }, { status: 404 });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar_url: user.avatar_url,
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      user: payload,
      token,
    });

    response.cookies.set('nova_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
