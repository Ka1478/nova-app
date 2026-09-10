import mongoose, { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema(
  {
    project_id: { type: Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'To Do' },
    priority: { type: String, default: 'Medium' },
    assignee_id: { type: Schema.Types.Mixed },
    reporter_id: { type: Schema.Types.Mixed },
    due_date: { type: String },
    estimated_hours: { type: Number, default: 0 },
    logged_hours: { type: Number, default: 0 },
    tags: [{ type: String }],
    position: { type: Number, default: 0 },
    checklists: [
      {
        title: { type: String },
        is_completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Task = models.Task || model('Task', TaskSchema);
export default Task;
