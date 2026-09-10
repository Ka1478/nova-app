import mongoose, { Schema, model, models } from 'mongoose';

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'Active' },
    priority: { type: String, default: 'Medium' },
    category: { type: String, default: 'Engineering' },
    start_date: { type: String },
    due_date: { type: String },
    owner_id: { type: Schema.Types.Mixed },
    members: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

export const Project = models.Project || model('Project', ProjectSchema);
export default Project;
