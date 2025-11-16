import { VorldArenaService } from '../src/vorldService.js';
import { buildConfig } from '../src/serverlessConfig.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const { gameId, action } = req.query;

  if (action === 'drop' && gameId) {
    // POST /api/items?gameId=xxx&action=drop - Drop item
    const { itemId, targetPlayer } = req.body || {};

    if (!gameId) {
      return res
        .status(400)
        .json({ success: false, error: 'gameId is required' });
    }

    if (!itemId || !targetPlayer) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'itemId and targetPlayer are required'
        });
    }

    try {
      const config = buildConfig();
      const service = new VorldArenaService(config);

      const result = await service.dropItem(gameId, {
        itemId,
        targetPlayer
      });

      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to drop item',
          details: result?.details || undefined
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    } catch (error) {
      console.error('❌ /api/items?action=drop error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Invalid route
  return res.status(400).json({
    success: false,
    error: 'Invalid items endpoint. Use action=drop with gameId.'
  });
}

