import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.avatar_url, u.created_at,
             COUNT(t.id) as assigned_tasks,
             SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as active_tasks,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id, u.name, u.email, u.role, u.department, u.avatar_url, u.created_at
      ORDER BY u.id DESC
    `).all() as any[];

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
