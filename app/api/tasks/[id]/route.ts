import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const taskId = parseInt(params.id);

    const task = db.prepare(`
      SELECT t.*, 
             p.name as project_name,
             a.name as assignee_name, a.avatar_url as assignee_avatar,
             r.name as reporter_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users r ON t.reporter_id = r.id
      WHERE t.id = ?
    `).get(taskId) as any;

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const checklists = db.prepare('SELECT * FROM task_checklists WHERE task_id = ?').all(taskId);
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(taskId);

    return NextResponse.json({
      task: {
        ...task,
        tags: task.tags ? JSON.parse(task.tags) : [],
        checklists,
        comments,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    const body = await req.json();
    const { title, description, status, priority, assignee_id, due_date, estimated_hours, logged_hours, tags, position } = body;

    const db = getDb();
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newTags = tags ? JSON.stringify(tags) : existingTask.tags;

    db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          assignee_id = COALESCE(?, assignee_id),
          due_date = COALESCE(?, due_date),
          estimated_hours = COALESCE(?, estimated_hours),
          logged_hours = COALESCE(?, logged_hours),
          tags = COALESCE(?, tags),
          position = COALESCE(?, position),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, status, priority, assignee_id, due_date, estimated_hours, logged_hours, newTags, position, taskId
    );

    // Audit log if status changed
    if (status && status !== existingTask.status) {
      db.prepare(`
        INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
        VALUES (?, ?, ?, 'STATUS_CHANGE', ?)
      `).run(
        existingTask.project_id,
        taskId,
        user.id,
        `Moved "${existingTask.title}" from ${existingTask.status} to ${status}`
      );
    }

    return NextResponse.json({ message: 'Task updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    const db = getDb();
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
