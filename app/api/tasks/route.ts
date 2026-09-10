import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    let query = `
      SELECT t.*, 
             p.name as project_name, p.category as project_category,
             a.name as assignee_name, a.avatar_url as assignee_avatar,
             r.name as reporter_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users r ON t.reporter_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (projectId) {
      query += ` AND t.project_id = ?`;
      params.push(projectId);
    }
    if (assigneeId) {
      query += ` AND t.assignee_id = ?`;
      params.push(assigneeId);
    }
    if (status && status !== 'All') {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'All') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.updated_at DESC`;

    const tasks = db.prepare(query).all(...params) as any[];

    const tasksParsed = tasks.map(t => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : []
    }));

    return NextResponse.json({ tasks: tasksParsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, title, description, status, priority, assignee_id, due_date, estimated_hours, tags } = await req.json();

    if (!project_id || !title) {
      return NextResponse.json({ error: 'Project ID and task title are required' }, { status: 400 });
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_hours, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_id,
      title,
      description || '',
      status || 'To Do',
      priority || 'Medium',
      assignee_id || null,
      user.id,
      due_date || '',
      estimated_hours || 0,
      JSON.stringify(tags || [])
    );

    const taskId = result.lastInsertRowid as number;

    // Log Activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
      VALUES (?, ?, ?, 'TASK_CREATED', ?)
    `).run(project_id, taskId, user.id, `Created task "${title}"`);

    return NextResponse.json({ id: taskId, message: 'Task created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
