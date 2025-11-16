import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import http from 'http';

/**
 * Godot Bridge Server
 * WebSocket server that the Godot game connects to
 * Forwards Vorld events to the Godot client
 */
export class GodotBridge {
  constructor(port) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.godotClient = null;
    this.setupExpress();
    this.setupSocketIO();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        godotConnected: this.godotClient !== null,
        timestamp: new Date().toISOString()
      });
    });

    // Status endpoint for debugging
    this.app.get('/status', (req, res) => {
      res.json({
        godotConnected: this.godotClient !== null,
        clientId: this.godotClient?.id || null
      });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('🎮 Godot game connected:', socket.id);
      this.godotClient = socket;

      socket.on('disconnect', () => {
        console.log('🎮 Godot game disconnected');
        this.godotClient = null;
      });

      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle any messages from Godot if needed
      socket.on('game_event', (data) => {
        console.log('📨 Received event from Godot:', data);
      });
    });
  }

  /**
   * Send event to Godot game
   */
  sendToGodot(eventType, data) {
    if (this.godotClient) {
      this.godotClient.emit(eventType, data);
      return true;
    }
    console.warn('⚠️  No Godot client connected, event not sent:', eventType);
    return false;
  }

  /**
   * Forward Vorld arena countdown started
   */
  forwardArenaCountdownStarted(data) {
    this.sendToGodot('arena_countdown_started', {
      countdown: data.countdown,
      gameId: data.gameId
    });
  }

  /**
   * Forward countdown updates
   */
  forwardCountdownUpdate(data) {
    this.sendToGodot('countdown_update', {
      secondsRemaining: data.secondsRemaining
    });
  }

  /**
   * Forward arena begins event
   */
  forwardArenaBegins(data) {
    this.sendToGodot('arena_begins', {
      message: 'Arena is LIVE! Viewers can now interact',
      arenaActive: data.arenaActive
    });
  }

  /**
   * Forward player boost activated (viewer spending coins for boost)
   */
  forwardPlayerBoostActivated(data) {
    this.sendToGodot('player_boost', {
      playerName: data.playerName,
      boosterUsername: data.boosterUsername,
      boostAmount: data.boostAmount,
      coinsSpent: data.arenaCoinsSpent,
      totalPoints: data.playerTotalPoints
    });
  }

  /**
   * Forward package drop (enemies, items, etc.)
   */
  forwardPackageDrop(data) {
    this.sendToGodot('package_drop', {
      currentCycle: data.currentCycle,
      items: data.astrokidzItems || data.aquaticansItems || [],
      allItems: {
        astrokidzItems: data.astrokidzItems || [],
        aquaticansItems: data.aquaticansItems || []
      }
    });
  }

  /**
   * Forward immediate item drop
   */
  forwardImmediateItemDrop(data) {
    this.sendToGodot('immediate_item_drop', {
      itemId: data.itemId || data.id,
      itemName: data.itemName || data.name,
      targetPlayer: data.targetPlayer,
      metadata: data.metadata || {}
    });
  }

  /**
   * Forward custom event trigger
   */
  forwardEventTriggered(data) {
    this.sendToGodot('custom_event', {
      eventName: data.event?.eventName || data.eventName,
      isFinal: data.event?.isFinal || false,
      data: data
    });
  }

  /**
   * Forward game completed
   */
  forwardGameCompleted(data) {
    this.sendToGodot('game_completed', data);
  }

  /**
   * Start the bridge server
   */
  start() {
    return new Promise((resolve) => {
      // Listen on 0.0.0.0 to accept external connections (required for Render, Railway, etc.)
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`🌉 Godot Bridge listening on port ${this.port}`);
        console.log(`   WebSocket: ws://localhost:${this.port}`);
        console.log(`   Health: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  /**
   * Stop the bridge server
   */
  stop() {
    this.io.close();
    this.server.close();
  }
}

