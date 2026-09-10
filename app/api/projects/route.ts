import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT p.*, 
             u.name as owner_name, u.avatar_url as owner_avatar,
             COUNT(t.id) as total_tasks,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ` AND p.category = ?`;
      params.push(category);
    }
    if (status && status !== 'All') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY p.id ORDER BY p.updated_at DESC`;

    const projects = db.prepare(query).all(...params) as any[];

    const projectsWithMembers = projects.map(proj => {
      const members = db.prepare(`
        SELECT u.id, u.name, u.email, u.avatar_url, u.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
      `).all(proj.id);

      const total = proj.total_tasks || 0;
      const completed = proj.completed_tasks || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...proj,
        progress,
        members,
      };
    });

    return NextResponse.json({ projects: projectsWithMembers });
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

    const { name, description, status, priority, category, start_date, due_date, member_ids } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO projects (name, description, status, priority, category, start_date, due_date, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || '',
      status || 'Active',
      priority || 'Medium',
      category || 'Engineering',
      start_date || new Date().toISOString().split('T')[0],
      due_date || '',
      user.id
    );

    const projectId = result.lastInsertRowid as number;

    // Add creator as owner member
    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (?, ?, 'Owner')
    `).run(projectId, user.id);

    // Add assigned team members
    if (Array.isArray(member_ids)) {
      const insertMember = db.prepare(`
        INSERT OR IGNORE INTO project_members (project_id, user_id, role)
        VALUES (?, ?, 'Member')
      `);
      member_ids.forEach((uid: number) => {
        if (uid !== user.id) {
          insertMember.run(projectId, uid);
        }
      });
    }

    // Log Activity
    db.prepare(`
      INSERT INTO activity_logs (project_id, user_id, action, details)
      VALUES (?, ?, 'PROJECT_CREATED', ?)
    `).run(projectId, user.id, `Created project "${name}"`);

    return NextResponse.json({ id: projectId, message: 'Project created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
