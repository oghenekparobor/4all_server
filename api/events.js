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

  try {
    const config = buildConfig();
    const service = new VorldArenaService(config);
    let result;

    if (action === 'ack') {
      // POST /api/events?action=ack - Acknowledge event
      const ackPayload = req.body || {};
      result = await service.acknowledgeEvent(ackPayload);
      
      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to acknowledge event',
          details: result?.details || undefined
        });
      }
      return res.status(200).json({
        success: true,
        data: result.data ?? result.raw ?? null
      });
    }

    if (action === 'trigger' && gameId) {
      // POST /api/events?gameId=xxx&action=trigger - Trigger event
      const { eventId, targetPlayer } = req.body || {};

      if (!gameId) {
        return res
          .status(400)
          .json({ success: false, error: 'gameId is required' });
      }

      if (!eventId) {
        return res
          .status(400)
          .json({ success: false, error: 'eventId is required' });
      }

      result = await service.triggerEvent(gameId, {
        eventId,
        targetPlayer
      });
      
      if (!result?.success) {
        const status = result?.status || 500;
        return res.status(status).json({
          success: false,
          error: result?.error || 'Failed to trigger event',
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
      error: 'Invalid events endpoint. Use action=ack or action=trigger with gameId.'
    });
  } catch (error) {
    console.error('❌ /api/events error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

