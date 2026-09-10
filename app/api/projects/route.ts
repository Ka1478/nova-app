import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import User from '@/models/User';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();
      const filter: any = {};
      if (category && category !== 'All') filter.category = category;
      if (status && status !== 'All') filter.status = status;
      if (search) filter.name = { $regex: search, $options: 'i' };

      const projects = await Project.find(filter).sort({ updatedAt: -1 }).lean();
      const users = await User.find().lean();
      const tasks = await Task.find().lean();

      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      const projectsWithMembers = projects.map((proj: any) => {
        const projTasks = tasks.filter((t: any) => t.project_id?.toString() === proj._id.toString());
        const total = projTasks.length;
        const completed = projTasks.filter((t: any) => t.status === 'Done').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const owner = userMap.get(proj.owner_id?.toString());
        const members = (proj.members || [])
          .map((mid: any) => userMap.get(mid?.toString()))
          .filter(Boolean);

        return {
          id: proj._id.toString(),
          name: proj.name,
          description: proj.description,
          status: proj.status,
          priority: proj.priority,
          category: proj.category,
          start_date: proj.start_date,
          due_date: proj.due_date,
          owner_name: owner?.name,
          owner_avatar: owner?.avatar_url,
          total_tasks: total,
          completed_tasks: completed,
          progress,
          members: members.map((m: any) => ({
            id: m._id.toString(),
            name: m.name,
            email: m.email,
            avatar_url: m.avatar_url,
            role: m.role,
          })),
        };
      });

      return NextResponse.json({ projects: projectsWithMembers });
    }

    // SQLite Fallback
    const db = getDb();
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

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const members = Array.isArray(member_ids) ? [...new Set([user.id, ...member_ids])] : [user.id];
      const newProj = await Project.create({
        name,
        description: description || '',
        status: status || 'Active',
        priority: priority || 'Medium',
        category: category || 'Engineering',
        start_date: start_date || new Date().toISOString().split('T')[0],
        due_date: due_date || '',
        owner_id: user.id,
        members,
      });

      return NextResponse.json({ id: newProj._id.toString(), message: 'Project created' }, { status: 201 });
    }

    // SQLite Fallback
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

    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (?, ?, 'Owner')
    `).run(projectId, user.id);

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

    return NextResponse.json({ id: projectId, message: 'Project created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
