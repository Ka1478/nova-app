import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import connectMongoDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import mongoose from 'mongoose';
import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const task = await Task.findById(id).lean().catch(() => null) ||
                   await Task.findOne({ _id: id }).lean().catch(() => null);

      if (!task) return NextResponse.json({ comments: [] });

      const users = await User.find().lean();
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      const comments = (task.comments || []).map((c: any) => {
        const u = userMap.get(c.user_id?.toString());
        return {
          ...c,
          id: c._id ? c._id.toString() : c.id,
          user_name: u?.name || 'User',
          user_avatar: u?.avatar_url,
          user_role: u?.role,
        };
      });

      return NextResponse.json({ comments });
    }

    // SQLite Fallback
    const db = getDb();
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ comments: [] });
    }

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

    const { id } = params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      const task = await Task.findById(id).catch(() => null) ||
                   await Task.findOne({ _id: id }).catch(() => null);

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const users = await User.find().lean();
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
      const userDoc = userMap.get(user.id?.toString());

      const commentId = new mongoose.Types.ObjectId().toString();
      const newComment = {
        _id: commentId,
        id: commentId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      task.comments = task.comments || [];
      task.comments.push(newComment);
      await task.save();

      await createActivityLog({
        userId: user.id,
        action: 'COMMENT_ADDED',
        details: `Commented on "${task.title}"`,
        projectId: task.project_id?.toString(),
        taskId: id,
      });

      return NextResponse.json({
        comment: {
          ...newComment,
          user_name: userDoc?.name || user.name || 'User',
          user_avatar: userDoc?.avatar_url || user.avatar_url,
          user_role: userDoc?.role || user.role,
        }
      }, { status: 201 });
    }

    // SQLite Fallback
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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

    await createActivityLog({
      userId: user.id,
      action: 'COMMENT_ADDED',
      details: `Commented on "${task.title}"`,
      projectId: task.project_id,
      taskId,
    });

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
