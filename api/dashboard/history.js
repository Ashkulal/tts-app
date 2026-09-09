const jwt = require('jsonwebtoken');
const { connectDB, Conversion } = require('../db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const conversions = await Conversion.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ conversions });
  } catch (error) {
    console.error('GetHistory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
