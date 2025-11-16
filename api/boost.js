import { VorldArenaService } from '../src/vorldService.js';
import { buildConfig } from '../src/serverlessConfig.js';

export default async function handler(req, res) {
  const { gameId, playerId, faction, action } = req.query;
  const { method } = req;

  try {
    const service = new VorldArenaService(buildConfig());
    let result;

    // GET /api/boost?gameId=xxx&action=stats - Get player boost stats
    if (method === 'GET' && action === 'stats' && gameId) {
      result = await service.getPlayerBoostStats(gameId);
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (method !== 'POST') {
      res.setHeader('Allow', ['POST', 'GET']);
      return res
        .status(405)
        .json({ success: false, error: 'Method not allowed' });
    }

    const { amount, username } = req.body || {};
    const boostAmount = Number(amount);

    if (!username || Number.isNaN(boostAmount)) {
      return res.status(400).json({
        success: false,
        error: 'username and numeric amount are required'
      });
    }

    // POST /api/boost?gameId=xxx&faction=xxx - Boost faction
    if (faction && gameId) {
      result = await service.boostFaction(gameId, faction, {
        amount: boostAmount,
        username
      });
      
      if (!result?.success) {
        return res.status(result.status || 500).json(result);
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    // POST /api/boost?gameId=xxx&playerId=xxx - Boost player
    if (playerId && gameId) {
      if (!gameId || !playerId) {
        return res
          .status(400)
          .json({ success: false, error: 'gameId and playerId are required' });
      }

      result = await service.boostPlayer(gameId, playerId, {
        amount: boostAmount,
        username
      });
      
      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to boost player',
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
      error: 'Invalid boost endpoint. Provide faction or playerId with gameId.'
    });
  } catch (error) {
    console.error('❌ /api/boost error:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}

