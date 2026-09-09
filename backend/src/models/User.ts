import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  tier: { type: String, default: 'free', enum: ['free', 'pro'] },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
