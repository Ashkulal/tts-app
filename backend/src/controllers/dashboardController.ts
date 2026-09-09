import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Conversion } from '../models/Conversion';
import { User } from '../models/User';

export async function getHistory(req: AuthRequest, res: Response) {
  try {
    const conversions = await Conversion.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ conversions });
  } catch (error) {
    console.error('GetHistory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getStats(req: AuthRequest, res: Response) {
  try {
    const totalConversions = await Conversion.countDocuments({ userId: req.userId });

    const totalChars = await Conversion.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: null, total: { $sum: '$charCount' } } }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayConversions = await Conversion.countDocuments({
      userId: req.userId,
      createdAt: { $gte: todayStart }
    });

    const user = await User.findById(req.userId);

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
