const jwt = require('jsonwebtoken');
const { connectDB, User, Conversion } = require('../db');

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

    res.json({
      totalConversions,
      totalCharacters: totalChars[0]?.total || 0,
      todayConversions,
      tier: user?.tier || 'free',
    });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
