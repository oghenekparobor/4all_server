import { io } from 'socket.io-client';
import axios from 'axios';
import crypto from 'crypto';

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

  setUserToken(token) {
    this.config.userToken = token;
  }

  /**
   * Build full API URL using configured base path
   */
  buildUrl(path) {
    if (!this.config.gameApiUrl) {
      throw new Error('GAME_API_URL is not configured');
    }

    const base = this.config.gameApiUrl.endsWith('/')
      ? this.config.gameApiUrl
      : `${this.config.gameApiUrl}/`;

    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalizedPath}`;
  }

  /**
   * Build auth API URL
   */
  buildAuthUrl(path) {
    if (!this.config.authApiUrl) {
      throw new Error('AUTH_API_URL is not configured');
    }

    const base = this.config.authApiUrl.endsWith('/')
      ? this.config.authApiUrl
      : `${this.config.authApiUrl}/`;

    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalizedPath}`;
  }

  /**
   * Default headers required by Vorld Arena Arcade API
   */
  buildHeaders(extraHeaders = {}) {
    const { userToken, arenaGameId, vorldAppId } = this.config;

    if (!userToken || !arenaGameId || !vorldAppId) {
      throw new Error('Missing authentication headers for Vorld API');
    }

    return {
      Authorization: `Bearer ${userToken}`,
      'X-Arena-Arcade-Game-ID': arenaGameId,
      'X-Vorld-App-ID': vorldAppId,
      'Content-Type': 'application/json',
      ...extraHeaders
    };
  }

  buildAuthHeaders(extraHeaders = {}) {
    if (!this.config.vorldAppId) {
      throw new Error('VORLD_APP_ID is required for auth requests');
    }

    return {
      'Content-Type': 'application/json',
      'X-Vorld-App-ID': this.config.vorldAppId,
      ...extraHeaders
    };
  }

  /**
   * Execute an authorized HTTP request to the Vorld Arena Arcade API
   */
  async makeRequest(method, path, data) {
    try {
      const requestConfig = {
        method,
        url: this.buildUrl(path),
        headers: this.buildHeaders()
      };

      if (data !== undefined) {
        requestConfig.data = data;
      }

      const response = await axios(requestConfig);
      return response;
    } catch (error) {
      throw this.normalizeAxiosError(error);
    }
  }

  async makeAuthRequest(method, path, data) {
    try {
      const response = await axios({
        method,
        url: this.buildAuthUrl(path),
        headers: this.buildAuthHeaders(),
        data
      });

      return response;
    } catch (error) {
      throw this.normalizeAxiosError(error);
    }
  }

  /**
   * Normalize axios error format for easier upstream handling
   */
  normalizeAxiosError(error) {
    if (error.response) {
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        error.message ||
        'Vorld API request failed';

      const formattedError = new Error(message);
      formattedError.status = error.response.status;
      formattedError.details = error.response.data;
      return formattedError;
    }

    if (error.request) {
      const formattedError = new Error('No response received from Vorld API');
      formattedError.status = 503;
      formattedError.details = { message: error.message };
      return formattedError;
    }

    return error;
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Standardize failure responses from service methods
   */
  formatFailure(error, fallbackMessage) {
    return {
      success: false,
      error: error.message || fallbackMessage,
      status: error.status || 500,
      details: error.details || null
    };
  }

  /**
   * Initialize game session with Vorld Arena Arcade
   */
  async initializeGame(streamUrl) {
    try {
      console.log('🎮 Initializing game with Vorld Arena Arcade...');

      const effectiveStreamUrl = streamUrl || this.config.streamUrl;
      if (!effectiveStreamUrl) {
        throw new Error('Stream URL is required to initialize a game');
      }

      if (!this.config.userToken) {
        throw new Error('USER_TOKEN not configured. Set it before initializing the game.');
      }

      // Persist latest stream URL so subsequent calls reuse it
      this.config.streamUrl = effectiveStreamUrl;

      // Initialize game session - official endpoint from docs
      const response = await this.makeRequest('POST', 'games/init', {
        streamUrl: effectiveStreamUrl
      });

      const payload = response.data;

      if (payload && payload.success) {
        this.gameState = payload.data;
        console.log('✅ Game initialized successfully');
        console.log(`   Game ID: ${this.gameState.gameId}`);
        console.log(`   WebSocket URL: ${this.gameState.websocketUrl}`);
        console.log(`   Status: ${this.gameState.status}`);
        return { success: true, data: this.gameState, raw: payload };
      }

      return {
        success: false,
        error: payload?.error || 'Failed to initialize game',
        status: response.status,
        details: payload || null
      };
    } catch (error) {
      console.error('❌ Failed to initialize game:', error.message);
      return this.formatFailure(error, 'Failed to initialize game');
    }
  }

  /**
   * Connect to Vorld WebSocket for real-time events
   */
  async connectWebSocket(websocketUrl) {
    const targetUrl = websocketUrl || this.gameState?.websocketUrl;

    if (!targetUrl) {
      throw new Error('WebSocket URL is not available. Initialize the game first.');
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to Vorld WebSocket...');

        this.socket = io(targetUrl, {
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
  async getGameDetails(gameId) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to fetch details');
      }

      const response = await this.makeRequest('GET', `games/${targetGameId}`);
      const payload = response.data;

      if (payload?.success !== false && payload?.data) {
        return { success: true, data: payload.data, raw: payload };
      }

      return {
        success: false,
        error: payload?.error || 'Failed to retrieve game details',
        status: response.status,
        details: payload || null
      };
    } catch (error) {
      console.error('Failed to get game details:', error.message);
      return this.formatFailure(error, 'Failed to get game details');
    }
  }

  /**
   * Boost faction (legacy boost)
   */
  async boostFaction(gameId, faction, payload) {
    try {
      if (!gameId || !faction) {
        throw new Error('Game ID and faction are required for boosting');
      }

      const response = await this.makeRequest(
        'POST',
        `games/boost/${faction}/${gameId}`,
        payload
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to boost faction:', error.message);
      return this.formatFailure(error, 'Failed to boost faction');
    }
  }

  /**
   * Boost individual player
   */
  async boostPlayer(gameId, playerId, payload) {
    try {
      if (!gameId || !playerId) {
        throw new Error('Game ID and player ID are required for player boost');
      }

      const response = await this.makeRequest(
        'POST',
        `games/boost/player/${gameId}/${playerId}`,
        payload
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to boost player:', error.message);
      return this.formatFailure(error, 'Failed to boost player');
    }
  }

  /**
   * Retrieve player boost statistics
   */
  async getPlayerBoostStats(gameId) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to fetch boost stats');
      }

      const response = await this.makeRequest(
        'GET',
        `games/boost/players/stats/${targetGameId}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch player boost stats:', error.message);
      return this.formatFailure(error, 'Failed to fetch player boost stats');
    }
  }

  /**
   * Update stream URL for an active game
   */
  async updateStreamUrl(gameId, payload) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to update stream URL');
      }

      const response = await this.makeRequest(
        'PUT',
        `games/${targetGameId}/stream-url`,
        payload
      );

      if (payload?.streamUrl) {
        this.config.streamUrl = payload.streamUrl;
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update stream URL:', error.message);
      return this.formatFailure(error, 'Failed to update stream URL');
    }
  }

  /**
   * Stop an active game session
   */
  async stopGame(gameId) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to stop game');
      }

      const response = await this.makeRequest(
        'POST',
        `games/${targetGameId}/stop`
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to stop game:', error.message);
      return this.formatFailure(error, 'Failed to stop game');
    }
  }

  /**
   * Drop an item on behalf of a viewer
   */
  async dropItem(gameId, payload) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to drop item');
      }

      const response = await this.makeRequest(
        'POST',
        `items/drop/${targetGameId}`,
        payload
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to drop item:', error.message);
      return this.formatFailure(error, 'Failed to drop item');
    }
  }

  /**
   * Trigger a custom event
   */
  async triggerEvent(gameId, payload) {
    try {
      const targetGameId = gameId || this.gameState?.gameId;
      if (!targetGameId) {
        throw new Error('Game ID is required to trigger event');
      }

      const response = await this.makeRequest(
        'POST',
        `events/trigger/${targetGameId}`,
        payload
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to trigger event:', error.message);
      return this.formatFailure(error, 'Failed to trigger event');
    }
  }

  /**
   * Fetch authenticated user profile
   */
  async fetchProfile() {
    try {
      const response = await this.makeRequest('GET', 'profile');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch profile:', error.message);
      return this.formatFailure(error, 'Failed to fetch profile');
    }
  }

  /**
   * Request OTP by registering / logging in
   */
  async requestOtp(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const hashedPassword = this.hashPassword(password);
      const response = await this.makeAuthRequest('POST', 'auth/register', {
        email,
        password: hashedPassword
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to request OTP:', error.message);
      return this.formatFailure(error, 'Failed to request OTP');
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyOtp(email, otp) {
    try {
      if (!email || !otp) {
        throw new Error('Email and OTP are required');
      }

      const response = await this.makeAuthRequest('POST', 'auth/verify-otp', {
        email,
        otp
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to verify OTP:', error.message);
      return this.formatFailure(error, 'Failed to verify OTP');
    }
  }

  /**
   * Login user and obtain auth token
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const hashedPassword = this.hashPassword(password);
      const response = await this.makeAuthRequest('POST', 'auth/login', {
        email,
        password: hashedPassword
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to login:', error.message);
      return this.formatFailure(error, 'Failed to login');
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

