import { VorldArenaService } from '../src/vorldService.js';
import { buildConfig } from '../src/serverlessConfig.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const { action } = req.query;

  if (action === 'user-token') {
    // POST /api/config?action=user-token - Set user token
    const { token } = req.body || {};

    if (typeof token !== 'string' || token.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'token is required' });
    }

    try {
      const trimmedToken = token.trim();
      
      // Update environment variable for this request context
      // Note: In serverless, this won't persist across invocations
      // but will work for the current request
      process.env.USER_TOKEN = trimmedToken;

      const config = buildConfig();
      config.userToken = trimmedToken;
      
      const service = new VorldArenaService(config);
      service.setUserToken(trimmedToken);

      const maskedToken =
        trimmedToken.length > 12
          ? `${trimmedToken.slice(0, 6)}...${trimmedToken.slice(-6)}`
          : '[token updated]';

      console.log(`🔐 USER_TOKEN updated via API (${maskedToken})`);

      return res.status(200).json({
        success: true,
        data: {
          userTokenUpdated: true,
          maskedToken
        }
      });
    } catch (error) {
      console.error('❌ /api/config?action=user-token error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Invalid route
  return res.status(400).json({
    success: false,
    error: 'Invalid config endpoint. Use action=user-token.'
  });
}

