# 🚀 Quick Start Guide - Deploy to Render in 5 Minutes

## What I Need to Know:

**Your App:** Node.js WebSocket server that bridges Vorld Arena to Godot  
**Why Render:** Supports WebSockets, long-running processes, FREE tier  
**Time:** 5-10 minutes  

---

## The 4-Step Process:

```
1. Push code to GitHub
   ↓
2. Create Render account
   ↓
3. Configure service
   ↓
4. Add environment variables
   ↓
   ✅ LIVE!
```

---

## Step 1: Push to GitHub (1 minute)

```bash
cd /Users/oghenekparoboreminokanju/4ALL_server

git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

## Step 2: Create Render Account (2 minutes)

1. Go to: **https://render.com**
2. Click: **"Get Started for Free"**
3. Click: **"GitHub"** button
4. Authorize Render

✅ You're in!

---

## Step 3: Configure Service (2 minutes)

1. Click: **"New +"** → **"Web Service"**
2. Find: **"4ALL_server"** → Click **"Connect"**
3. Fill in:

```
Name:          4all-vorld-bridge
Runtime:       Node
Build Command: npm install
Start Command: npm start
Plan:          Free
```

---

## Step 4: Add Environment Variables (2 minutes)

Click **"Advanced"**, then add these 4 REQUIRED variables:

```
VORLD_APP_ID    = app_mh3vsu8y_6de37169        (your actual ID)
ARENA_GAME_ID   = arcade_mhcg6dxr_19395e5c     (your actual ID)
USER_TOKEN      = eyJhbGciOiJIUzI1NiIsIn...    (your actual token)
STREAM_URL      = https://twitch.tv/yourname   (your channel)
```

**Optional** (have defaults):
```
ARENA_SERVER_URL = wss://airdrop-arcade.onrender.com
GAME_API_URL     = https://airdrop-arcade.onrender.com
AUTH_API_URL     = https://vorld-auth.onrender.com/api
```

---

## Step 5: Deploy

Click: **"Create Web Service"**

Wait 2-3 minutes...

✅ **LIVE!** You'll get: `https://4all-vorld-bridge.onrender.com`

---

## What to Configure:

### Render Dashboard (render.com):
- Service name
- Build/start commands  
- Environment variables
- Plan (Free)

### You DON'T Configure:
- ❌ Port (Render auto-assigns)
- ❌ Domain (auto-generated)
- ❌ SSL/HTTPS (automatic)
- ❌ Server (managed for you)

---

## Your Values to Find:

| Variable | Where to Find It |
|----------|------------------|
| `VORLD_APP_ID` | Vorld.com → Developer → Auth Apps → Copy ID |
| `ARENA_GAME_ID` | Vorld.com → Arena Arcade → Your Game → Copy ID |
| `USER_TOKEN` | Run `npm run get-token` (in scripts/) |
| `STREAM_URL` | Your Twitch/YouTube stream URL |

---

## After Deployment:

### Test It:
```bash
# Replace with YOUR url
curl https://4all-vorld-bridge.onrender.com/health

# Should return:
{"status":"ok","godotConnected":false,"timestamp":"..."}
```

### Update Godot:
```gdscript
# In your Godot game, change:
var ws_url = "wss://4all-vorld-bridge.onrender.com"
```

### Monitor Logs:
Dashboard → Logs tab → See real-time output

---

## Free Tier Notes:

✅ **Free Forever**
✅ 750 hours/month (enough for 24/7)
✅ WebSocket support
✅ Auto-deploys from GitHub

⚠️ **Service sleeps after 15 min inactivity**
- First request takes 30-60s to wake
- Upgrade to $7/month for 24/7

---

## Troubleshooting:

**Build Failed?**
→ Check Logs tab for errors
→ Ensure `package.json` has `"start": "node src/index.js"`

**Service Won't Start?**
→ Check environment variables spelling
→ Look at Logs for specific error

**Can't Connect?**
→ Use `wss://` not `ws://`
→ Don't add port number

---

## Quick Commands:

```bash
# Test health
curl https://YOUR-URL.onrender.com/health

# Test status  
curl https://YOUR-URL.onrender.com/status

# View logs
# (Use Render Dashboard → Logs tab)

# Redeploy
git push origin main
# (Auto-deploys!)
```

---

## The Big Picture:

```
┌─────────────┐
│ Your GitHub │
│   Repo      │
└──────┬──────┘
       │
       │ git push
       │
       ↓
┌─────────────┐      ┌────────────┐      ┌──────────┐
│   Render    │ ←────│ Vorld API  │ ────→│ Viewers  │
│   Server    │      │ (Events)   │      │ (Twitch) │
└──────┬──────┘      └────────────┘      └──────────┘
       │
       │ WebSocket
       │
       ↓
┌─────────────┐
│ Godot Game  │
│ (Your PC)   │
└─────────────┘
```

---

## Need Full Guide?

See: **RENDER_DEPLOYMENT.md** (detailed step-by-step with screenshots)

---

## ✅ Checklist:

- [ ] Code on GitHub
- [ ] Render account created
- [ ] Service configured
- [ ] 4 environment variables added
- [ ] Deployed successfully
- [ ] Health endpoint responds
- [ ] Godot game updated with new URL
- [ ] Tested end-to-end

**Time to complete: ~5-10 minutes** ⏱️

🎉 **You're done! Your server is live!**

