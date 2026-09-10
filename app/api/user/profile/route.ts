import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest, signToken } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import { createActivityLog } from '@/lib/activity';

async function handleProfileUpdate(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = body.name?.trim() || user.name;
    const avatar_url = body.avatar_url?.trim() || user.avatar_url;
    const department = body.department?.trim() || user.department;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { name, avatar_url, department },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await createActivityLog({
        userId: user.id,
        action: 'PROFILE_UPDATED',
        details: `Updated profile picture and details for ${name}`,
      });

      const payload = {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        avatar_url: updatedUser.avatar_url,
      };

      const token = signToken(payload);
      const response = NextResponse.json({ user: payload, token, message: 'Profile updated' });
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
    db.prepare(`
      UPDATE users
      SET name = ?, avatar_url = ?, department = ?
      WHERE id = ?
    `).run(name, avatar_url, department, user.id);

    await createActivityLog({
      userId: user.id,
      action: 'PROFILE_UPDATED',
      details: `Updated profile picture and details for ${name}`,
    });

    const updatedUser = db.prepare('SELECT id, name, email, role, department, avatar_url FROM users WHERE id = ?').get(user.id) as any;

    const token = signToken({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      avatar_url: updatedUser.avatar_url,
    });

    const response = NextResponse.json({ user: updatedUser, token, message: 'Profile updated' });
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

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}
