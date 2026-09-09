import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputType: { type: String, required: true, enum: ['text', 'url', 'pdf'] },
  sourceText: { type: String },
  audioUrl: { type: String },
  charCount: { type: Number, default: 0 },
}, { timestamps: true });

conversionSchema.index({ userId: 1, createdAt: -1 });

export const Conversion = mongoose.model('Conversion', conversionSchema);
