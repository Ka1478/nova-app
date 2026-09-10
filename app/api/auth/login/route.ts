import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
