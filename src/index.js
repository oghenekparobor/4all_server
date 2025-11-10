import dotenv from 'dotenv';
import { VorldArenaService } from './vorldService.js';
import { GodotBridge } from './godotBridge.js';

dotenv.config();

/**
 * Main Application
 * Connects Vorld Arena Arcade API to Godot game via WebSocket bridge
 */
class VorldGodotBridge {
  constructor() {
    this.vorldService = null;
    this.godotBridge = null;
    this.config = this.loadConfig();
    this.autoInit = process.env.AUTO_INIT !== 'false';
    this.lastInitResult = null;
  }

  loadConfig() {
    const required = ['VORLD_APP_ID', 'ARENA_GAME_ID', 'STREAM_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.error('   Please copy env.template to .env and fill in your values');
      process.exit(1);
    }

    console.log('ARENA_SERVER_URL', process.env.ARENA_SERVER_URL);
    console.log('GAME_API_URL', process.env.GAME_API_URL);
    const userTokenPresent = !!process.env.USER_TOKEN;
    if (!userTokenPresent) {
      console.warn('⚠️  USER_TOKEN not provided in environment. Set it via /api/config/user-token before initializing the game.');
    }
    console.log('USER_TOKEN', userTokenPresent ? '[present]' : '[missing]');
    console.log('STREAM_URL', process.env.STREAM_URL);
    console.log('VORLD_APP_ID', process.env.VORLD_APP_ID);
    console.log('ARENA_GAME_ID', process.env.ARENA_GAME_ID);
    console.log('AUTH_API_URL', process.env.AUTH_API_URL);

    return {
      vorldAppId: process.env.VORLD_APP_ID,
      arenaGameId: process.env.ARENA_GAME_ID,
      userToken: process.env.USER_TOKEN,
      streamUrl: process.env.STREAM_URL,
      arenaServerUrl: process.env.ARENA_SERVER_URL || 'wss://airdrop-arcade.onrender.com/ws/arcade_mhcg6dxr_19395e5c',
      gameApiUrl: process.env.GAME_API_URL || 'https://airdrop-arcade.onrender.com',
      authApiUrl: process.env.AUTH_API_URL || 'https://vorld-auth.onrender.com/api',
      godotPort: parseInt(process.env.GODOT_WEBSOCKET_PORT || '9080')
    };
  }

  async start() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   4ALL Game × Vorld Arena Arcade Integration           ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // Step 1: Initialize Godot Bridge
      console.log('📡 Step 1: Starting Godot Bridge Server...');
      this.godotBridge = new GodotBridge(this.config.godotPort);
      await this.godotBridge.start();
      console.log('');

      // Step 2: Prepare Vorld Service and REST API
      console.log('🌐 Step 2: Preparing Vorld Arena service...');
      this.vorldService = new VorldArenaService(this.config);
      this.setupEventHandlers();
      this.setupApiRoutes();
      console.log('✅ REST API endpoints ready at /api/*');
      console.log('');

      if (this.autoInit && this.config.userToken) {
        console.log('🚀 Auto-initializing game session with configured STREAM_URL...');
        const initResult = await this.initializeBridge();

        if (!initResult.success) {
          console.warn('⚠️  Auto-initialization failed:', initResult.error);
          if (initResult.details) {
            const detailString =
              typeof initResult.details === 'object'
                ? JSON.stringify(initResult.details, null, 2)
                : initResult.details;
            console.warn('   Details:', detailString);
          }
          console.warn('   Use POST /api/games with {"streamUrl": "..."} to retry.');
          console.log('');
        }
      } else if (!this.autoInit) {
        console.log('⏳ Auto-initialization disabled (set AUTO_INIT=false).');
        console.log('   Use POST /api/games with {"streamUrl": "..."} to start a session.');
        console.log('');
      } else if (!this.config.userToken) {
        console.log('⏳ Skipping auto-initialization: USER_TOKEN not configured.');
        console.log('   Use POST /api/config/user-token to provide the token, then POST /api/games to start a session.');
        console.log('');
      }

      if (!this.lastInitResult || !this.lastInitResult.success) {
        console.log('ℹ️  Waiting for game initialization...');
        console.log(`   REST API  : http://localhost:${this.config.godotPort}/api`);
        console.log(`   Health    : http://localhost:${this.config.godotPort}/health`);
        console.log('   Status    : http://localhost:${this.config.godotPort}/status');
        console.log('');
        console.log('Press Ctrl+C to stop');
        console.log('');
      }
    } catch (error) {
      console.error('');
      console.error('╔════════════════════════════════════════════════════════╗');
      console.error('║                    ❌ ERROR ❌                         ║');
      console.error('╚════════════════════════════════════════════════════════╝');
      console.error('');
      console.error(error.message);
      if (error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
      console.error('');
      console.error('Troubleshooting:');
      console.error('  1. Check your .env file has correct values');
      console.error('  2. Verify your Vorld Arena Arcade game is created');
      console.error('  3. Ensure your USER_TOKEN is valid');
      console.error('  4. Check network connectivity');
      console.error('');
      process.exit(1);
    }
  }

  setupEventHandlers() {
    // Forward all Vorld events to Godot game

    this.vorldService.onArenaCountdownStarted = (data) => {
      console.log('⏱️  → Forwarding countdown start to Godot');
      this.godotBridge.forwardArenaCountdownStarted(data);
    };

    this.vorldService.onCountdownUpdate = (data) => {
      this.godotBridge.forwardCountdownUpdate(data);
    };

    this.vorldService.onArenaBegins = (data) => {
      console.log('🎮 → Forwarding arena start to Godot');
      this.godotBridge.forwardArenaBegins(data);
    };

    this.vorldService.onPlayerBoostActivated = (data) => {
      console.log(`💪 → Forwarding boost to Godot: ${data.boosterUsername} → ${data.playerName} (+${data.boostAmount})`);
      this.godotBridge.forwardPlayerBoostActivated(data);
    };

    this.vorldService.onPackageDrop = (data) => {
      console.log('📦 → Forwarding package drop to Godot');
      this.godotBridge.forwardPackageDrop(data);
    };

    this.vorldService.onImmediateItemDrop = (data) => {
      console.log('🎁 → Forwarding immediate item drop to Godot');
      this.godotBridge.forwardImmediateItemDrop(data);
    };

    this.vorldService.onEventTriggered = (data) => {
      console.log('⚡ → Forwarding custom event to Godot');
      this.godotBridge.forwardEventTriggered(data);
    };

    this.vorldService.onGameCompleted = (data) => {
      console.log('🏁 → Forwarding game completion to Godot');
      this.godotBridge.forwardGameCompleted(data);
    };

    console.log('✅ All event handlers configured');
  }

  setupApiRoutes() {
    if (!this.godotBridge?.app) {
      console.warn('⚠️  Express app not available; API routes were not registered.');
      return;
    }

    const app = this.godotBridge.app;

    const asyncRoute = (handler) => async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error('❌ Route handler error:', error);

        const normalizedError =
          this.vorldService?.formatFailure?.(
            error instanceof Error ? error : new Error(String(error)),
            'Internal server error'
          ) || {
            success: false,
            error: error?.message || 'Internal server error',
            status: 500
          };

        res.status(normalizedError.status || 500).json({
          success: false,
          error: normalizedError.error,
          details: normalizedError.details || undefined
        });
      }
    };

    app.get(
      '/api/status',
      asyncRoute((req, res) => {
        res.json({
          success: true,
          data: {
            connected: this.vorldService?.isConnected() || false,
            gameState: this.vorldService?.getGameState() || null
          }
        });
      })
    );

    app.post(
      '/api/games',
      asyncRoute(async (req, res) => {
        const { streamUrl } = req.body || {};
        const result = await this.initializeBridge(streamUrl);
        this.sendServiceResponse(res, result, 201);
      })
    );

    app.get(
      '/api/games/:gameId',
      asyncRoute(async (req, res) => {
        const result = await this.vorldService.getGameDetails(req.params.gameId);
        this.sendServiceResponse(res, result);
      })
    );

    app.get(
      '/api/games/boost/players/stats/:gameId',
      asyncRoute(async (req, res) => {
        const result = await this.vorldService.getPlayerBoostStats(
          req.params.gameId
        );
        this.sendServiceResponse(res, result);
      })
    );

    app.put(
      '/api/games/:gameId/stream-url',
      asyncRoute(async (req, res) => {
        const { streamUrl, oldStreamUrl } = req.body || {};

        if (!streamUrl) {
          return res.status(400).json({
            success: false,
            error: 'streamUrl is required'
          });
        }

        const result = await this.vorldService.updateStreamUrl(req.params.gameId, {
          streamUrl,
          oldStreamUrl
        });
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/games/:gameId/stop',
      asyncRoute(async (req, res) => {
        const result = await this.vorldService.stopGame(req.params.gameId);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/games/boost/:faction/:gameId',
      asyncRoute(async (req, res) => {
        const { amount, username } = req.body || {};
        const boostAmount = Number(amount);

        if (!username || Number.isNaN(boostAmount)) {
          return res.status(400).json({
            success: false,
            error: 'username and numeric amount are required'
          });
        }

        const result = await this.vorldService.boostFaction(
          req.params.gameId,
          req.params.faction,
          {
            amount: boostAmount,
            username
          }
        );
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/games/boost/player/:gameId/:playerId',
      asyncRoute(async (req, res) => {
        const { amount, username } = req.body || {};
        const boostAmount = Number(amount);

        if (!username || Number.isNaN(boostAmount)) {
          return res.status(400).json({
            success: false,
            error: 'username and numeric amount are required'
          });
        }

        const result = await this.vorldService.boostPlayer(
          req.params.gameId,
          req.params.playerId,
          {
            amount: boostAmount,
            username
          }
        );
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/items/drop/:gameId',
      asyncRoute(async (req, res) => {
        const { itemId, targetPlayer } = req.body || {};

        if (!itemId || !targetPlayer) {
          return res.status(400).json({
            success: false,
            error: 'itemId and targetPlayer are required'
          });
        }

        const result = await this.vorldService.dropItem(req.params.gameId, {
          itemId,
          targetPlayer
        });
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/events/trigger/:gameId',
      asyncRoute(async (req, res) => {
        const { eventId, targetPlayer } = req.body || {};

        if (!eventId) {
          return res.status(400).json({
            success: false,
            error: 'eventId is required'
          });
        }

        const result = await this.vorldService.triggerEvent(req.params.gameId, {
          eventId,
          targetPlayer
        });
        this.sendServiceResponse(res, result);
      })
    );

    app.get(
      '/api/profile',
      asyncRoute(async (req, res) => {
        const result = await this.vorldService.fetchProfile();
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/config/user-token',
      asyncRoute(async (req, res) => {
        const { token } = req.body || {};

        if (typeof token !== 'string' || token.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'token is required'
          });
        }

        const trimmedToken = token.trim();
        this.config.userToken = trimmedToken;
        this.vorldService?.setUserToken(trimmedToken);

        const maskedToken =
          trimmedToken.length > 12
            ? `${trimmedToken.slice(0, 6)}...${trimmedToken.slice(-6)}`
            : '[token updated]';
        console.log(`🔐 USER_TOKEN updated via API (${maskedToken})`);

        res.json({
          success: true,
          data: {
            userTokenUpdated: true,
            maskedToken
          }
        });
      })
    );

    app.post(
      '/api/auth/request-otp',
      asyncRoute(async (req, res) => {
        const { email, password } = req.body || {};

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'email and password are required'
          });
        }

        const result = await this.vorldService.requestOtp(email, password);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/auth/verify-otp',
      asyncRoute(async (req, res) => {
        const { email, otp } = req.body || {};

        if (!email || !otp) {
          return res.status(400).json({
            success: false,
            error: 'email and otp are required'
          });
        }

        const result = await this.vorldService.verifyOtp(email, otp);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/auth/login',
      asyncRoute(async (req, res) => {
        const { email, password } = req.body || {};

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'email and password are required'
          });
        }

        const result = await this.vorldService.login(email, password);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/games/stats',
      asyncRoute(async (req, res) => {
        const statsPayload = req.body || {};
        const result = await this.vorldService.updatePlayerStats(statsPayload);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/games/runs',
      asyncRoute(async (req, res) => {
        const summaryPayload = req.body || {};
        const result = await this.vorldService.submitRunSummary(summaryPayload);
        this.sendServiceResponse(res, result);
      })
    );

    app.post(
      '/api/events/ack',
      asyncRoute(async (req, res) => {
        const ackPayload = req.body || {};
        const result = await this.vorldService.acknowledgeEvent(ackPayload);
        this.sendServiceResponse(res, result);
      })
    );
  }

  sendServiceResponse(res, result, successStatus = 200) {
    if (result?.success) {
      const payload = result.raw ?? result.data ?? null;

      const responseBody = {
        success: true,
        data: payload
      };

      if (result.websocketUrl) {
        responseBody.websocketUrl = result.websocketUrl;
      }

      res.status(successStatus).json(responseBody);
      return;
    }

    const status = result?.status || 500;
    res.status(status).json({
      success: false,
      error: result?.error || 'Request failed',
      details: result?.details || undefined
    });
  }

  async initializeBridge(streamUrl) {
    if (!this.vorldService) {
      const failure = {
        success: false,
        error: 'Vorld service not ready',
        status: 500
      };
      this.lastInitResult = failure;
      return failure;
    }

    if (!this.config.userToken) {
      const failure = {
        success: false,
        error: 'USER_TOKEN not configured. Use POST /api/config/user-token to set it before initializing.',
        status: 400
      };
      this.lastInitResult = failure;
      return failure;
    }

    this.vorldService.setUserToken(this.config.userToken);

    if (this.vorldService.isConnected()) {
      console.log('🔄 Existing Vorld WebSocket connection detected. Disconnecting...');
      this.vorldService.disconnect();
    }

    const initResult = await this.vorldService.initializeGame(streamUrl);
    this.lastInitResult = initResult;

    if (!initResult.success) {
      return initResult;
    }

    const websocketUrl = initResult.data?.websocketUrl;
    if (!websocketUrl) {
      const failure = {
        success: false,
        error: 'Initialization did not return a WebSocket URL',
        status: 500,
        details: initResult
      };
      this.lastInitResult = failure;
      return failure;
    }

    try {
      console.log('🔌 Establishing WebSocket connection to Vorld Arena...');
      await this.vorldService.connectWebSocket(websocketUrl);
      console.log('');
    } catch (error) {
      const formattedError = this.vorldService.formatFailure(
        error instanceof Error
          ? error
          : new Error(error?.message || 'Failed to connect to Vorld WebSocket'),
        'Failed to connect to Vorld WebSocket'
      );
      this.lastInitResult = formattedError;
      return formattedError;
    }

    console.log('initResult', initResult);
    console.log('');

    this.printSystemReady();

    const successResult = {
      ...initResult,
      success: true,
      websocketUrl
    };
    this.lastInitResult = successResult;
    return successResult;
  }

  printSystemReady() {
    const gameState = this.vorldService?.getGameState() || {};
    const streamUrlBase = this.config.streamUrl
      ? this.config.streamUrl.substring(0, 28)
      : 'Not set';
    const streamUrlDisplay = streamUrlBase.padEnd(28);

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              🎮 SYSTEM READY 🎮                        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(
      '║  1. Start your Godot game                              ║'
    );
    console.log(
      '║  2. Connect to: ws://localhost:' +
        this.config.godotPort.toString().padEnd(23) +
        '    ║'
    );
    console.log(
      '║  3. Start streaming on: ' + streamUrlDisplay + ' ║'
    );
    console.log(
      '║  4. Viewers can now influence the game!                ║'
    );
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Game Status: ' + (gameState.status || 'unknown'));
    console.log('🆔 Game ID: ' + (gameState.gameId || 'unknown'));
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
  }

  async stop() {
    console.log('');
    console.log('🛑 Shutting down...');
    
    if (this.vorldService) {
      this.vorldService.disconnect();
    }
    
    if (this.godotBridge) {
      this.godotBridge.stop();
    }
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  }
}

// Start the bridge
const bridge = new VorldGodotBridge();
bridge.start();

// Graceful shutdown
process.on('SIGINT', () => bridge.stop());
process.on('SIGTERM', () => bridge.stop());

