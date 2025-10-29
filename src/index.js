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
  }

  loadConfig() {
    const required = ['VORLD_APP_ID', 'ARENA_GAME_ID', 'USER_TOKEN', 'STREAM_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.error('   Please copy env.template to .env and fill in your values');
      process.exit(1);
    }

    return {
      vorldAppId: process.env.VORLD_APP_ID,
      arenaGameId: process.env.ARENA_GAME_ID,
      userToken: process.env.USER_TOKEN,
      streamUrl: process.env.STREAM_URL,
      arenaServerUrl: process.env.ARENA_SERVER_URL || 'wss://airdrop-arcade.onrender.com/ws',
      gameApiUrl: process.env.GAME_API_URL || 'https://airdrop-arcade.onrender.com',
      godotPort: parseInt(process.env.GODOT_WEBSOCKET_PORT || '9080')
    };
  }

  async start() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   4ALL Game × Vorld Arena Arcade Integration          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // Step 1: Initialize Godot Bridge
      console.log('📡 Step 1: Starting Godot Bridge Server...');
      this.godotBridge = new GodotBridge(this.config.godotPort);
      await this.godotBridge.start();
      console.log('');

      // Step 2: Initialize Vorld Service
      console.log('🌐 Step 2: Connecting to Vorld Arena Arcade...');
      this.vorldService = new VorldArenaService(this.config);
      
      const initResult = await this.vorldService.initializeGame();
      if (!initResult.success) {
        throw new Error('Failed to initialize Vorld game: ' + initResult.error);
      }
      console.log('');

      // Step 3: Connect to Vorld WebSocket
      console.log('🔌 Step 3: Establishing WebSocket connection...');
      await this.vorldService.connectWebSocket();
      console.log('');

      // Step 4: Wire up event handlers
      console.log('⚡ Step 4: Setting up event handlers...');
      this.setupEventHandlers();
      console.log('');

      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              🎮 SYSTEM READY 🎮                        ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log('║  1. Start your Godot game                              ║');
      console.log('║  2. Connect to: ws://localhost:' + this.config.godotPort.toString().padEnd(23) + '    ║');
      console.log('║  3. Start streaming on: ' + this.config.streamUrl.substring(0, 28).padEnd(28) + ' ║');
      console.log('║  4. Viewers can now influence the game!                ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('📊 Game Status: ' + (this.vorldService.getGameState()?.status || 'unknown'));
      console.log('🆔 Game ID: ' + (this.vorldService.getGameState()?.gameId || 'unknown'));
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('');

    } catch (error) {
      console.error('');
      console.error('╔════════════════════════════════════════════════════════╗');
      console.error('║                    ❌ ERROR ❌                         ║');
      console.error('╚════════════════════════════════════════════════════════╝');
      console.error('');
      console.error(error.message);
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

