import getDb from '@/lib/db';
import connectMongoDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';

export async function createActivityLog({
  userId,
  action,
  details,
  projectId,
  taskId,
}: {
  userId?: any;
  action: string;
  details: string;
  projectId?: any;
  taskId?: any;
}) {
  try {
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      let userName = 'User';
      let userAvatar = '';
      if (userId) {
        const u = await User.findById(userId).lean().catch(() => null);
        if (u) {
          userName = u.name;
          userAvatar = u.avatar_url || '';
        }
      }

      await ActivityLog.create({
        project_id: projectId || null,
        task_id: taskId || null,
        user_id: userId || null,
        user_name: userName,
        user_avatar: userAvatar,
        action,
        details,
      });
    } else {
      const db = getDb();
      db.prepare(`
        INSERT INTO activity_logs (project_id, task_id, user_id, action, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(projectId || null, taskId || null, userId || null, action, details);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
