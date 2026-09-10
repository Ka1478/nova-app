import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role || 'Member';
    const userDept = department || 'Engineering';
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const existing = await User.findOne({ email });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }

      const newUser = await User.create({
        name,
        email,
        password_hash: hashedPassword,
        role: userRole,
        department: userDept,
        avatar_url: avatarUrl,
      });

      const payload = {
        id: newUser._id.toString(),
        name,
        email,
        role: userRole,
        department: userDept,
        avatar_url: avatarUrl,
      };

      const token = signToken(payload);
      const response = NextResponse.json({ user: payload, token }, { status: 201 });
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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, department, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, hashedPassword, userRole, userDept, avatarUrl);

    const userId = result.lastInsertRowid as number;

    const payload = {
      id: userId,
      name,
      email,
      role: userRole,
      department: userDept,
      avatar_url: avatarUrl,
    };

    const token = signToken(payload);
    const response = NextResponse.json({ user: payload, token }, { status: 201 });
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
