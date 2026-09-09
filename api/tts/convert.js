const jwt = require('jsonwebtoken');
const { connectDB, User, Conversion } = require('../db');

function extractTextFromURL(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);
}

async function generateSpeech(text) {
  const chunks = [];
  const maxLength = 200;

  for (let i = 0; i < text.length; i += maxLength) {
    const chunk = text.substring(i, i + maxLength);
    const encodedText = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      chunks.push(buffer);
    }
  }

  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { text, url } = req.body;
    let extractedText = '';
    let inputType = 'text';

    if (url) {
      inputType = 'url';
      const response = await fetch(url);
      const html = await response.text();
      extractedText = extractTextFromURL(html);
    } else if (text) {
      inputType = 'text';
      extractedText = text;
    } else {
      return res.status(400).json({ error: 'Provide text or URL' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No readable text found' });
    }

    const user = await User.findById(userId);
    const tier = user?.tier || 'free';
    const limit = tier === 'pro' ? 999999 : 5;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await Conversion.countDocuments({
      userId,
      createdAt: { $gte: todayStart }
    });

    if (todayCount >= limit) {
      return res.status(429).json({ error: `Daily limit reached (${limit}). Upgrade to Pro for unlimited.` });
    }

    const audioBuffer = await generateSpeech(extractedText);

    const conversion = await Conversion.create({
      userId,
      inputType,
      sourceText: extractedText.substring(0, 1000),
      audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`,
      charCount: extractedText.length,
    });

    res.json({
      conversion,
      audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`,
      charCount: extractedText.length,
    });
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
}
