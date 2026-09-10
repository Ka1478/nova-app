import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';
import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const task = await Task.findById(id).lean().catch(() => null) ||
                   await Task.findOne({ _id: id }).lean().catch(() => null);

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const users = await User.find().lean();
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      const assignee = userMap.get(task.assignee_id?.toString());
      const reporter = userMap.get(task.reporter_id?.toString());

      const project = await Project.findById(task.project_id).lean().catch(() => null);

      return NextResponse.json({
        task: {
          id: task._id.toString(),
          project_id: task.project_id?.toString(),
          project_name: project?.name || '',
          title: task.title,
          description: task.description || '',
          status: task.status || 'To Do',
          priority: task.priority || 'Medium',
          assignee_id: task.assignee_id?.toString(),
          assignee_name: assignee?.name,
          assignee_avatar: assignee?.avatar_url,
          reporter_name: reporter?.name,
          due_date: task.due_date,
          estimated_hours: task.estimated_hours || 0,
          logged_hours: task.logged_hours || 0,
          tags: Array.isArray(task.tags) ? task.tags : [],
          checklists: task.checklists || [],
          comments: task.comments || [],
        }
      });
    }

    // SQLite Fallback
    const db = getDb();
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

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

    const { id } = params;
    const body = await req.json();
    const { title, description, status, priority, assignee_id, due_date, estimated_hours, logged_hours, tags, position } = body;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const existingTask = await Task.findById(id).lean().catch(() => null);

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
      if (logged_hours !== undefined) updateData.logged_hours = logged_hours;
      if (tags !== undefined) updateData.tags = tags;
      if (position !== undefined) updateData.position = position;

      await Task.findByIdAndUpdate(id, updateData);

      if (status && existingTask && status !== existingTask.status) {
        await createActivityLog({
          userId: user.id,
          action: 'STATUS_CHANGE',
          details: `Moved "${existingTask.title}" to ${status}`,
          projectId: existingTask.project_id?.toString(),
          taskId: id,
        });
      } else {
        await createActivityLog({
          userId: user.id,
          action: 'TASK_UPDATED',
          details: `Updated task "${title || existingTask?.title || 'task'}"`,
          projectId: existingTask?.project_id?.toString(),
          taskId: id,
        });
      }

      return NextResponse.json({ message: 'Task updated successfully' });
    }

    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

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

    if (status && status !== existingTask.status) {
      await createActivityLog({
        userId: user.id,
        action: 'STATUS_CHANGE',
        details: `Moved "${existingTask.title}" to ${status}`,
        projectId: existingTask.project_id,
        taskId,
      });
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

    const { id } = params;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const task = await Task.findById(id).lean().catch(() => null);
      if (task) {
        await createActivityLog({
          userId: user.id,
          action: 'TASK_DELETED',
          details: `Deleted task "${task.title}"`,
          projectId: task.project_id?.toString(),
          taskId: id,
        });
      }
      await Task.findByIdAndDelete(id);
      return NextResponse.json({ message: 'Task deleted successfully' });
    }

    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const db = getDb();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (task) {
      await createActivityLog({
        userId: user.id,
        action: 'TASK_DELETED',
        details: `Deleted task "${task.title}"`,
        projectId: task.project_id,
        taskId,
      });
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
