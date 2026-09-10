import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';

import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const filter: any = {};
      if (projectId) filter.project_id = projectId;
      if (assigneeId) filter.assignee_id = assigneeId;
      if (status && status !== 'All') filter.status = status;
      if (priority && priority !== 'All') filter.priority = priority;
      if (search) filter.title = { $regex: search, $options: 'i' };

      const rawTasks = await Task.find(filter).sort({ updatedAt: -1 }).lean();
      const projects = await Project.find().lean();
      const users = await User.find().lean();

      const projMap = new Map(projects.map((p: any) => [p._id.toString(), p]));
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      const tasksParsed = rawTasks.map((t: any) => {
        const proj = projMap.get(t.project_id?.toString());
        const assignee = userMap.get(t.assignee_id?.toString());
        const reporter = userMap.get(t.reporter_id?.toString());

        return {
          id: t._id.toString(),
          project_id: t.project_id,
          project_name: proj?.name,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignee_id: t.assignee_id,
          assignee_name: assignee?.name,
          assignee_avatar: assignee?.avatar_url,
          reporter_name: reporter?.name,
          due_date: t.due_date,
          estimated_hours: t.estimated_hours,
          logged_hours: t.logged_hours,
          tags: t.tags || [],
        };
      });

      return NextResponse.json({ tasks: tasksParsed });
    }

    // SQLite Fallback
    const db = getDb();
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

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const newTask = await Task.create({
        project_id,
        title,
        description: description || '',
        status: status || 'To Do',
        priority: priority || 'Medium',
        assignee_id: assignee_id || null,
        reporter_id: user.id,
        due_date: due_date || '',
        estimated_hours: estimated_hours || 0,
        tags: tags || [],
      });

      await createActivityLog({
        userId: user.id,
        action: 'TASK_CREATED',
        details: `Created task "${title}"`,
        projectId: project_id,
        taskId: newTask._id.toString(),
      });

      return NextResponse.json({ id: newTask._id.toString(), message: 'Task created' }, { status: 201 });
    }

    // SQLite Fallback
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

    await createActivityLog({
      userId: user.id,
      action: 'TASK_CREATED',
      details: `Created task "${title}"`,
      projectId: project_id,
      taskId,
    });

    return NextResponse.json({ id: taskId, message: 'Task created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
