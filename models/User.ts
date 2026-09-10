import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, default: 'Member' },
    department: { type: String, default: 'Engineering' },
    avatar_url: { type: String },
  },
  { timestamps: true }
);

export const User = models.User || model('User', UserSchema);
export default User;
