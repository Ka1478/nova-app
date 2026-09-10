import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest, signToken } from '@/lib/auth';

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

    const db = getDb();
    
    db.prepare(`
      UPDATE users
      SET name = ?,
          avatar_url = ?,
          department = ?
      WHERE id = ?
    `).run(name, avatar_url, department, user.id);

    const updatedUser = db.prepare('SELECT id, name, email, role, department, avatar_url FROM users WHERE id = ?').get(user.id) as any;

    if (!updatedUser) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    // Issue updated token
    const token = signToken({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      avatar_url: updatedUser.avatar_url,
    });

    const response = NextResponse.json({
      user: updatedUser,
      token,
      message: 'Profile updated successfully',
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
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}
