const mongoose = require('mongoose');

let cached = null;

async function connectDB() {
  if (cached) return cached;
  
  cached = await mongoose.connect(process.env.MONGODB_URI);
  return cached;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  tier: { type: String, default: 'free', enum: ['free', 'pro'] },
}, { timestamps: true });

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputType: { type: String, required: true, enum: ['text', 'url', 'pdf'] },
  sourceText: { type: String },
  audioUrl: { type: String },
  charCount: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Conversion = mongoose.models.Conversion || mongoose.model('Conversion', conversionSchema);

module.exports = { connectDB, User, Conversion };
