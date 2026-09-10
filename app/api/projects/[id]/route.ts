import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import User from '@/models/User';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();

      // Find project by MongoDB ObjectId string
      const project = await Project.findById(id).lean().catch(() => null) ||
                      await Project.findOne({ _id: id }).lean().catch(() => null);

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Fetch users for owner and member mapping
      const users = await User.find().lean();
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      const owner = userMap.get(project.owner_id?.toString());
      const members = (project.members || [])
        .map((mid: any) => userMap.get(mid?.toString()))
        .filter(Boolean)
        .map((m: any) => ({
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          avatar_url: m.avatar_url,
          role: m.role,
          department: m.department,
          project_role: m._id.toString() === project.owner_id?.toString() ? 'Owner' : 'Member',
        }));

      // Fetch tasks for this project
      const tasksRaw = await Task.find({
        $or: [{ project_id: id }, { project_id: project._id.toString() }]
      }).sort({ position: 1, updatedAt: -1 }).lean();

      const tasks = tasksRaw.map((t: any) => {
        const assignee = userMap.get(t.assignee_id?.toString());
        const reporter = userMap.get(t.reporter_id?.toString());
        return {
          id: t._id.toString(),
          project_id: t.project_id?.toString(),
          project_name: project.name,
          title: t.title,
          description: t.description || '',
          status: t.status || 'To Do',
          priority: t.priority || 'Medium',
          assignee_id: t.assignee_id?.toString(),
          assignee_name: assignee?.name,
          assignee_avatar: assignee?.avatar_url,
          reporter_name: reporter?.name,
          due_date: t.due_date,
          estimated_hours: t.estimated_hours || 0,
          logged_hours: t.logged_hours || 0,
          tags: Array.isArray(t.tags) ? t.tags : [],
          checklists: t.checklists || [],
          comments: t.comments || [],
        };
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'Done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return NextResponse.json({
        project: {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          category: project.category,
          start_date: project.start_date,
          due_date: project.due_date,
          owner_name: owner?.name,
          owner_avatar: owner?.avatar_url,
          progress,
          totalTasks,
          completedTasks,
        },
        members,
        tasks,
        activity: [],
      });
    }

    // SQLite Fallback
    const db = getDb();
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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

    const { id } = params;
    const body = await req.json();
    const { name, description, status, priority, category, start_date, due_date } = body;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (category !== undefined) updateData.category = category;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (due_date !== undefined) updateData.due_date = due_date;

      await Project.findByIdAndUpdate(id, updateData);
      return NextResponse.json({ message: 'Project updated successfully' });
    }

    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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

    const { id } = params;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await Project.findByIdAndDelete(id);
      await Task.deleteMany({ project_id: id });
      return NextResponse.json({ message: 'Project deleted successfully' });
    }

    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
