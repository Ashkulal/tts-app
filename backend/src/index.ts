import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { connectDB } from './models/db';
import authRoutes from './routes/auth';
import ttsRoutes from './routes/tts';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, '../audio')));

app.use('/api/auth', authRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
