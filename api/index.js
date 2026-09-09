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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;

  try {
    await connectDB();

    // Health check
    if (url === '/api/health') {
      return res.json({ status: 'ok' });
    }

    // Auth routes
    if (url === '/api/auth/register' && method === 'POST') {
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash });
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ token, user: { id: user._id, email: user.email, tier: user.tier } });
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, email: user.email, tier: user.tier } });
    }

    if (url === '/api/auth/me' && method === 'GET') {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user: { id: user._id, email: user.email, tier: user.tier } });
    }

    // TTS Convert
    if (url === '/api/tts/convert' && method === 'POST') {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      const { text, url: inputUrl } = req.body;

      let extractedText = '';
      let inputType = 'text';

      if (inputUrl) {
        inputType = 'url';
        const response = await fetch(inputUrl);
        const html = await response.text();
        extractedText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000);
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

      // Generate speech using Google Translate TTS
      const chunks = [];
      const maxLength = 200;
      for (let i = 0; i < extractedText.length; i += maxLength) {
        const chunk = extractedText.substring(i, i + maxLength);
        const encodedText = encodeURIComponent(chunk);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

        const ttsResponse = await fetch(ttsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });

        if (ttsResponse.ok) {
          const buffer = Buffer.from(await ttsResponse.arrayBuffer());
          chunks.push(buffer);
        }
      }

      const audioBuffer = Buffer.concat(chunks);
      const audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

      const conversion = await Conversion.create({
        userId,
        inputType,
        sourceText: extractedText.substring(0, 1000),
        audioUrl: audioBase64,
        charCount: extractedText.length,
      });

      return res.json({ conversion, audioUrl: audioBase64, charCount: extractedText.length });
    }

    // Dashboard history
    if (url === '/api/dashboard/history' && method === 'GET') {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const conversions = await Conversion.find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .limit(50);

      return res.json({ conversions });
    }

    // Dashboard stats
    if (url === '/api/dashboard/stats' && method === 'GET') {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const totalConversions = await Conversion.countDocuments({ userId: decoded.userId });
      const totalChars = await Conversion.aggregate([
        { $match: { userId: decoded.userId } },
        { $group: { _id: null, total: { $sum: '$charCount' } } }
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayConversions = await Conversion.countDocuments({
        userId: decoded.userId,
        createdAt: { $gte: todayStart }
      });

      const user = await User.findById(decoded.userId);

      return res.json({
        totalConversions,
        totalCharacters: totalChars[0]?.total || 0,
        todayConversions,
        tier: user?.tier || 'free',
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
