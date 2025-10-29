# 4ALL × Vorld Arena Arcade Bridge

This Node.js service connects your Godot game to Vorld Arena Arcade, enabling real-time viewer interaction through coin spending.

## Prerequisites

1. **Node.js 18+** installed
2. **Vorld Arena Arcade account** at https://thevorld.com
3. **Arena Arcade game created** (follow the setup guide in the images)

## Setup Instructions

### 1. Install Dependencies

```bash
cd 4ALL_server
npm install
```

### 2. Configure Environment

Copy the template and fill in your values:

```bash
cp env.template .env
```

Edit `.env` with your credentials:

```env
VORLD_APP_ID=your_app_id_here          # From Vorld Auth App
ARENA_GAME_ID=your_arena_game_id_here  # From Arena Arcade Portal
USER_TOKEN=your_jwt_token_here         # From Vorld Auth
STREAM_URL=https://twitch.tv/your_channel
```

### 3. Get Your Credentials

#### A. Create Vorld Auth App
1. Go to https://thevorld.com
2. Navigate to Developer section
3. Create a new Auth App
4. Copy your `VORLD_APP_ID`

#### B. Create Arena Arcade Game
1. In Vorld, go to ARENA ARCADE tab
2. Click "Create Arena Arcade Game"
3. Fill in game details
4. Copy your `ARENA_GAME_ID`

#### C. Get JWT Token
1. Use Vorld Auth API to authenticate
2. You'll receive a JWT token
3. Copy it to `USER_TOKEN`

### 4. Run the Bridge

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║              🎮 SYSTEM READY 🎮                        ║
╠════════════════════════════════════════════════════════╣
║  1. Start your Godot game                              ║
║  2. Connect to: ws://localhost:9080                    ║
║  3. Start streaming on: https://twitch.tv/...          ║
║  4. Viewers can now influence the game!                ║
╚════════════════════════════════════════════════════════╝
```

## How It Works

```
┌─────────┐        ┌──────────┐        ┌────────────┐        ┌───────────┐
│ Viewers │ ──────>│ Vorld API│ ──────>│ This Bridge│ ──────>│ Godot Game│
│ (Twitch)│ Coins  │ (Events) │ WebSoc │  (Forward) │ WebSoc │  (Effects)│
└─────────┘        └──────────┘        └────────────┘        └───────────┘
```

1. **Viewers** watch your stream and spend Arena coins
2. **Vorld API** processes the transaction and emits events
3. **Bridge Service** (this) receives events via WebSocket
4. **Godot Game** connects to bridge and applies effects in real-time

## Events Forwarded to Godot

| Vorld Event | Godot Event | Description |
|-------------|-------------|-------------|
| `player_boost_activated` | `player_boost` | Viewer boosted player with coins |
| `package_drop` | `package_drop` | Items/enemies dropped at cycle end |
| `immediate_item_drop` | `immediate_item_drop` | Instant item spawn |
| `event_triggered` | `custom_event` | Custom game event |
| `arena_begins` | `arena_begins` | Arena goes live |
| `arena_countdown_started` | `arena_countdown_started` | Countdown begins |
| `countdown_update` | `countdown_update` | Countdown tick |
| `game_completed` | `game_completed` | Game finished |

## Testing Without Streaming

For development, you can trigger test events using the Vorld Arena Arcade dashboard:
1. Go to your game's management page
2. Use the "Test Events" section
3. Trigger boosts, drops, etc. manually

## Troubleshooting

### "Failed to initialize game"
- Check your `VORLD_APP_ID` and `ARENA_GAME_ID`
- Verify your game is Active in Vorld dashboard

### "WebSocket connection error"
- Ensure your `USER_TOKEN` is valid (they expire!)
- Check network connectivity
- Verify `ARENA_SERVER_URL` is correct

### "No Godot client connected"
- Start the bridge first, then the Godot game
- Check Godot is connecting to `ws://localhost:9080`
- Look for connection logs in both services

## API Endpoints

- **Health Check**: `http://localhost:3000/health`
- **Status**: `http://localhost:3000/status`

## Next Steps

Now integrate the Godot client side:
1. See `/4ALL/Manager/vorld_integration.gd`
2. Follow Godot integration guide
3. Map events to in-game effects

## Support

For Vorld API issues: https://thevorld.com/docs
For this bridge: Check console logs and GitHub issues

