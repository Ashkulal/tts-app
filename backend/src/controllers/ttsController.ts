import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Conversion } from '../models/Conversion';
import { extractTextFromPDF, extractTextFromURL } from '../services/textExtractor';
import { generateSpeech } from '../services/ttsService';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const audioDir = path.join(__dirname, '../../audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export async function convert(req: AuthRequest, res: Response) {
  try {
    const { text, url } = req.body;
    const file = req.file;

    let extractedText = '';
    let inputType = 'text';

    if (file) {
      inputType = 'pdf';
      extractedText = await extractTextFromPDF(file.buffer);
    } else if (url) {
      inputType = 'url';
      extractedText = await extractTextFromURL(url);
    } else if (text) {
      inputType = 'text';
      extractedText = text;
    } else {
      return res.status(400).json({ error: 'Provide text, URL, or PDF file' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No readable text found' });
    }

    const user = await User.findById(req.userId);
    const tier = user?.tier || 'free';
    const limit = tier === 'pro' ? config.proTierLimit : config.freeTierLimit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await Conversion.countDocuments({
      userId: req.userId,
      createdAt: { $gte: todayStart }
    });

    if (todayCount >= limit) {
      return res.status(429).json({ error: `Daily limit reached (${limit}). Upgrade to Pro for unlimited.` });
    }

    const audioBuffer = await generateSpeech(extractedText);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = path.join(audioDir, filename);
    fs.writeFileSync(filePath, audioBuffer);

    const conversion = await Conversion.create({
      userId: req.userId,
      inputType,
      sourceText: extractedText.substring(0, 1000),
      audioUrl: `/audio/${filename}`,
      charCount: extractedText.length,
    });

    res.json({
      conversion,
      audioUrl: `/audio/${filename}`,
      charCount: extractedText.length,
    });
  } catch (error: any) {
    console.error('Convert error:', error);
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
}
