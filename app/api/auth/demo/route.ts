import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { signToken } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    let email = 'alex@nova.app';
    if (role === 'PM') email = 'sophia@nova.app';
    if (role === 'Developer') email = 'marcus@nova.app';
    if (role === 'Designer') email = 'elena@nova.app';

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.findOne({});
      }

      if (!user) {
        return NextResponse.json({ error: 'Demo user not found.' }, { status: 404 });
      }

      const payload = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar_url: user.avatar_url,
      };

      const token = signToken(payload);
      const response = NextResponse.json({ user: payload, token });
      response.cookies.set('nova_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      return response;
    }

    // SQLite Fallback
    const db = getDb();
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
    const response = NextResponse.json({ user: payload, token });
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
