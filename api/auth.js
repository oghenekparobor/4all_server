import { VorldArenaService } from '../src/vorldService.js';
import { buildConfig } from '../src/serverlessConfig.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  // Extract action from query parameter or URL path
  const { action } = req.query;
  const { email, password, otp } = req.body || {};

  try {
    const config = buildConfig();
    const service = new VorldArenaService(config);
    let result;

    switch (action) {
      case 'login':
        if (!email || !password) {
          return res
            .status(400)
            .json({ success: false, error: 'email and password are required' });
        }
        result = await service.login(email, password);
        break;

      case 'request-otp':
        if (!email || !password) {
          return res
            .status(400)
            .json({ success: false, error: 'email and password are required' });
        }
        result = await service.requestOtp(email, password);
        break;

      case 'verify-otp':
        if (!email || !otp) {
          return res
            .status(400)
            .json({ success: false, error: 'email and otp are required' });
        }
        result = await service.verifyOtp(email, otp);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: login, request-otp, or verify-otp'
        });
    }

    if (!result?.success) {
      const status = result?.status || 500;
      return res.status(status).json({
        success: false,
        error: result?.error || `${action} failed`,
        details: result?.details || undefined
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data ?? result.raw ?? null
    });
  } catch (error) {
    console.error(`❌ /api/auth?action=${action} error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

