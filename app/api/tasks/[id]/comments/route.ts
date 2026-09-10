import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const taskId = parseInt(params.id);

    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(taskId);

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const db = getDb();
    const task = db.prepare('SELECT project_id, title FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const result = db.prepare(`
      INSERT INTO comments (task_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(taskId, user.id, content.trim());

    // Log Activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'COMMENT_ADDED', ?)
    `).run(task.project_id, taskId, user.id, `Commented on "${task.title}"`);

    const newComment = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
