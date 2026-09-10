import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const projectId = parseInt(params.id);

    const project = db.prepare(`
      SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(projectId) as any;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.department, pm.role as project_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(projectId);

    const tasks = db.prepare(`
      SELECT t.*, 
             a.name as assignee_name, a.avatar_url as assignee_avatar,
             r.name as reporter_name
      FROM tasks t
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users r ON t.reporter_id = r.id
      WHERE t.project_id = ?
      ORDER BY t.position ASC, t.created_at DESC
    `).all(projectId) as any[];

    const tasksParsed = tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));

    const activity = db.prepare(`
      SELECT al.*, u.name as user_name, u.avatar_url as user_avatar
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.project_id = ?
      ORDER BY al.created_at DESC
      LIMIT 30
    `).all(projectId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      project: {
        ...project,
        progress,
        totalTasks,
        completedTasks,
      },
      members,
      tasks: tasksParsed,
      activity,
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

    const projectId = parseInt(params.id);
    const body = await req.json();
    const { name, description, status, priority, category, start_date, due_date } = body;

    const db = getDb();
    db.prepare(`
      UPDATE projects 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          category = COALESCE(?, category),
          start_date = COALESCE(?, start_date),
          due_date = COALESCE(?, due_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, status, priority, category, start_date, due_date, projectId);

    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'PROJECT_UPDATED', ?)
    `).run(projectId, user.id, `Updated project details`);

    return NextResponse.json({ message: 'Project updated successfully' });
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

    const projectId = parseInt(params.id);
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
