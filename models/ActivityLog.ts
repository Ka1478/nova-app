import mongoose, { Schema, model, models } from 'mongoose';

const ActivityLogSchema = new Schema(
  {
    project_id: { type: Schema.Types.Mixed },
    task_id: { type: Schema.Types.Mixed },
    user_id: { type: Schema.Types.Mixed },
    user_name: { type: String },
    user_avatar: { type: String },
    action: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

export const ActivityLog = models.ActivityLog || model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
