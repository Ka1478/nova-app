import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import connectMongoDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function GET(req: NextRequest) {
  try {
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();
      const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean();

      const notifications = logs.map((log: any) => ({
        id: log._id.toString(),
        title: formatActionTitle(log.action),
        description: log.details,
        time: formatTimeAgo(log.createdAt),
        unread: true,
        action: log.action,
        user_name: log.user_name || 'User',
        user_avatar: log.user_avatar,
      }));

      return NextResponse.json({ notifications, unreadCount: notifications.length });
    }

    // SQLite Fallback
    const db = getDb();
    const logs = db.prepare(`
      SELECT al.*, u.name as user_name, u.avatar_url as user_avatar
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all() as any[];

    const notifications = logs.map((log: any) => ({
      id: log.id,
      title: formatActionTitle(log.action),
      description: log.details,
      time: formatTimeAgo(log.created_at),
      unread: true,
      action: log.action,
      user_name: log.user_name || 'User',
      user_avatar: log.user_avatar,
    }));

    return NextResponse.json({ notifications, unreadCount: notifications.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

function formatActionTitle(action: string) {
  if (!action) return 'Activity Notification';
  switch (action) {
    case 'PROJECT_CREATED': return 'Project Created';
    case 'PROJECT_UPDATED': return 'Project Updated';
    case 'TASK_CREATED': return 'Task Created';
    case 'STATUS_CHANGE': return 'Task Status Updated';
    case 'COMMENT_ADDED': return 'New Comment';
    case 'PROFILE_UPDATED': return 'Profile Updated';
    case 'TASK_DELETED': return 'Task Removed';
    default: return action.replace('_', ' ');
  }
}

function formatTimeAgo(dateString: any) {
  if (!dateString) return 'Just now';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
