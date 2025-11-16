import { VorldArenaService } from '../src/vorldService.js';
import { buildConfig } from '../src/serverlessConfig.js';

export default async function handler(req, res) {
  const { gameId, action } = req.query;
  const { method } = req;

  try {
    const service = new VorldArenaService(buildConfig());
    let result;

    // Route based on action and method
    if (!gameId && method === 'POST') {
      // POST /api/games - Initialize game
      const { streamUrl } = req.body || {};
      result = await service.initializeGame(streamUrl);
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(201).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (gameId && method === 'GET' && !action) {
      // GET /api/games?gameId=xxx - Get game details
      result = await service.getGameDetails(gameId);
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (gameId && method === 'POST' && action === 'stop') {
      // POST /api/games?gameId=xxx&action=stop - Stop game
      result = await service.stopGame(gameId);
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (gameId && method === 'PUT' && action === 'stream-url') {
      // PUT /api/games?gameId=xxx&action=stream-url - Update stream URL
      const { streamUrl, oldStreamUrl } = req.body || {};
      
      if (!streamUrl) {
        return res
          .status(400)
          .json({ success: false, error: 'streamUrl is required' });
      }
      
      result = await service.updateStreamUrl(gameId, {
        streamUrl,
        oldStreamUrl
      });
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (method === 'POST' && action === 'runs') {
      // POST /api/games?action=runs - Submit run summary
      const summaryPayload = req.body || {};
      result = await service.submitRunSummary(summaryPayload);
      
      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to submit run summary',
          details: result?.details || undefined
        });
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (method === 'POST' && action === 'stats') {
      // POST /api/games?action=stats - Update player stats
      const statsPayload = req.body || {};
      result = await service.updatePlayerStats(statsPayload);
      
      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to update player stats',
          details: result?.details || undefined
        });
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    // Invalid route
    return res.status(400).json({
      success: false,
      error: 'Invalid games endpoint. Check gameId, action, and method.'
    });
  } catch (error) {
    console.error('❌ /api/games error:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}

