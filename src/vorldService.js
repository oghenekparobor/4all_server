import { io } from 'socket.io-client';
import axios from 'axios';

/**
 * Vorld Arena Arcade Service
 * Handles connection to Vorld API and processes viewer interaction events
 */
export class VorldArenaService {
  constructor(config) {
    this.config = config;
    this.socket = null;
    this.gameState = null;
    this.connected = false;
    
    // Event handlers (to be set by the bridge)
    this.onArenaBegins = null;
    this.onPlayerBoostActivated = null;
    this.onPackageDrop = null;
    this.onImmediateItemDrop = null;
    this.onEventTriggered = null;
    this.onGameCompleted = null;
    this.onCountdownUpdate = null;
    this.onArenaCountdownStarted = null;
  }

  /**
   * Initialize game session with Vorld Arena Arcade
   */
  async initializeGame() {
    try {
      console.log('🎮 Initializing game with Vorld Arena Arcade...');
      
      const response = await axios.post(
        `${this.config.gameApiUrl}/${this.config.streamUrl}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.config.userToken}`,
            'X-Arena-Arcade-Game-ID': this.config.arenaGameId,
            'X-Vorld-App-ID': this.config.vorldAppId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        this.gameState = response.data.data;
        console.log('✅ Game initialized successfully');
        console.log(`   Game ID: ${this.gameState.gameId}`);
        console.log(`   WebSocket URL: ${this.gameState.websocketUrl}`);
        console.log(`   Status: ${this.gameState.status}`);
        return { success: true, data: this.gameState };
      }

      return { success: false, error: 'Failed to initialize game' };
    } catch (error) {
      console.error('❌ Failed to initialize game:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to Vorld WebSocket for real-time events
   */
  async connectWebSocket() {
    if (!this.gameState || !this.gameState.websocketUrl) {
      throw new Error('Game must be initialized before connecting to WebSocket');
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to Vorld WebSocket...');
        
        this.socket = io(this.gameState.websocketUrl, {
          auth: {
            token: this.config.userToken,
            appId: this.config.vorldAppId
          },
          transports: ['websocket']
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to Vorld Arena WebSocket');
          this.connected = true;
          this.setupEventListeners();
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error.message);
          this.connected = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Disconnected from Vorld WebSocket');
          this.connected = false;
        });

      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up all WebSocket event listeners for Vorld events
   */
  setupEventListeners() {
    // Arena lifecycle events
    this.socket.on('arena_countdown_started', (data) => {
      console.log('⏱️  Arena countdown started:', data.countdown, 'seconds');
      this.onArenaCountdownStarted?.(data);
    });

    this.socket.on('countdown_update', (data) => {
      console.log('⏱️  Countdown:', data.secondsRemaining, 'seconds remaining');
      this.onCountdownUpdate?.(data);
    });

    this.socket.on('arena_begins', (data) => {
      console.log('🎮 Arena is LIVE! Viewers can now interact');
      this.onArenaBegins?.(data);
    });

    // Boost events (viewers spending coins to boost players)
    this.socket.on('player_boost_activated', (data) => {
      console.log(`💪 ${data.boosterUsername} boosted ${data.playerName} with ${data.boostAmount} points (${data.arenaCoinsSpent} coins)`);
      this.onPlayerBoostActivated?.(data);
    });

    this.socket.on('boost_cycle_update', (data) => {
      console.log('🔄 Boost cycle update');
      // Optional: handle cycle updates
    });

    this.socket.on('boost_cycle_complete', (data) => {
      console.log('✅ Boost cycle complete');
      // Optional: handle cycle completion
    });

    // Package and item drop events (viewers triggering in-game effects)
    this.socket.on('package_drop', (data) => {
      console.log(`📦 Package drop! Cycle ${data.currentCycle}`);
      console.log(`   Items dropped:`, data.astrokidzItems || data.aquaticansItems);
      this.onPackageDrop?.(data);
    });

    this.socket.on('immediate_item_drop', (data) => {
      console.log(`🎁 Immediate item drop:`, data);
      this.onImmediateItemDrop?.(data);
    });

    // Custom game events
    this.socket.on('event_triggered', (data) => {
      console.log('⚡ Custom event triggered:', data.event);
      this.onEventTriggered?.(data);
    });

    // Game completion
    this.socket.on('game_completed', (data) => {
      console.log('🏁 Game completed');
      this.onGameCompleted?.(data);
    });

    this.socket.on('game_stopped', (data) => {
      console.log('🛑 Game stopped');
      // Handle game stop
    });
  }

  /**
   * Get game details
   */
  async getGameDetails() {
    try {
      const response = await axios.get(
        `${this.config.gameApiUrl}/game/${this.gameState.gameId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.userToken}`,
            'X-Arena-Arcade-Game-ID': this.config.arenaGameId,
            'X-Vorld-App-ID': this.config.vorldAppId
          }
        }
      );

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Failed to get game details:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current game state
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.gameState = null;
  }
}

