import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tts_app',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  freeTierLimit: 5,
  proTierLimit: 999999,
};
