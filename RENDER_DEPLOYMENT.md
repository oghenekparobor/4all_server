# 🚀 Deploy to Render.com - Step-by-Step Guide

This guide will walk you through deploying your 4ALL × Vorld Arena Bridge to Render.com in about 5-10 minutes.

---

## 📋 Prerequisites

- [x] Your code is on GitHub
- [x] You have a GitHub account
- [ ] You'll need a Render.com account (we'll create it together)

---

## 🎯 Step 1: Push Your Code to GitHub

If you haven't already pushed your code:

```bash
cd /Users/oghenekparoboreminokanju/4ALL_server

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/4ALL_server.git

# Push
git push -u origin main
```

✅ **Checkpoint:** Your code should now be visible on GitHub.

---

## 🎯 Step 2: Create Render Account

1. **Go to:** https://render.com
2. **Click:** "Get Started for Free" (top right)
3. **Sign up with GitHub:**
   - Click "GitHub" button
   - Click "Authorize Render"
   - Complete account creation

✅ **Checkpoint:** You should see the Render Dashboard.

---

## 🎯 Step 3: Create a New Web Service

### 3.1 Start the Creation Process

1. **Click:** "New +" button (top right of Render dashboard)
2. **Select:** "Web Service"

   ```
   ┌─────────────────────────────────────────┐
   │  New +                            ▼     │
   ├─────────────────────────────────────────┤
   │  Web Service            ← CLICK THIS    │
   │  Static Site                            │
   │  Background Worker                      │
   │  Cron Job                               │
   └─────────────────────────────────────────┘
   ```

### 3.2 Connect Your Repository

1. **Find your repo:** Look for `4ALL_server` in the list
2. **Click:** "Connect" button next to it

   **If you don't see your repo:**
   - Click "Configure account" link
   - Select which repos Render can access
   - Come back and refresh

✅ **Checkpoint:** You should now see the configuration page.

---

## 🎯 Step 4: Configure Your Web Service

You'll see a form with several fields. Fill them in EXACTLY as shown:

### Basic Configuration

| Field | What to Enter | Why |
|-------|---------------|-----|
| **Name** | `4all-vorld-bridge` | This becomes your URL |
| **Region** | `Oregon (US West)` or closest to you | For best performance |
| **Branch** | `main` | Your main git branch |
| **Root Directory** | *(leave empty)* | Your code is at repo root |
| **Runtime** | `Node` | It's a Node.js app |
| **Build Command** | `npm install` | Installs dependencies |
| **Start Command** | `npm start` | Runs your server |

### Visual Guide:
```
┌─────────────────────────────────────────────┐
│ Name *                                      │
│ ┌─────────────────────────────────────┐   │
│ │ 4all-vorld-bridge                   │   │ ← Type this
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Runtime *                                   │
│ ┌─────────────────────────────────────┐   │
│ │ Node                            ▼   │   │ ← Select this
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Build Command *                             │
│ ┌─────────────────────────────────────┐   │
│ │ npm install                         │   │ ← Type this
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Start Command *                             │
│ ┌─────────────────────────────────────┐   │
│ │ npm start                           │   │ ← Type this
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

✅ **Checkpoint:** All fields should be filled in.

---

## 🎯 Step 5: Choose Your Plan

Scroll down to find the "Instance Type" section:

1. **Select:** "Free" plan
   ```
   ┌─────────────────────────────────────────┐
   │ ⚪ Starter - $7/month                   │
   │ 🔵 Free - $0/month     ← SELECT THIS   │
   └─────────────────────────────────────────┘
   ```

**⚠️ Important Free Plan Notes:**
- Your service will spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Perfect for development and testing
- Upgrade to Starter ($7/month) for 24/7 uptime when you go live

✅ **Checkpoint:** "Free" should be selected.

---

## 🎯 Step 6: Add Environment Variables

**This is crucial!** Scroll down to find "Environment Variables" section.

### Click "Advanced" to expand the form

You need to add 7 environment variables. For each one:

1. Click "+ Add Environment Variable"
2. Enter the KEY (left field)
3. Enter the VALUE (right field)

### Variables to Add:

```
┌──────────────────────┬─────────────────────────────────────┐
│ KEY                  │ VALUE                               │
├──────────────────────┼─────────────────────────────────────┤
│ VORLD_APP_ID         │ app_mh3vsu8y_6de37169              │ ← Your actual app ID
│ ARENA_GAME_ID        │ arcade_mhcg6dxr_19395e5c           │ ← Your actual game ID
│ USER_TOKEN           │ your_jwt_token_here                │ ← Your actual token
│ STREAM_URL           │ https://twitch.tv/your_channel     │ ← Your actual stream
│ ARENA_SERVER_URL     │ wss://airdrop-arcade.onrender.com  │ ← Use this default
│ GAME_API_URL         │ https://airdrop-arcade.onrender.com│ ← Use this default
│ AUTH_API_URL         │ https://vorld-auth.onrender.com/api│ ← Use this default
└──────────────────────┴─────────────────────────────────────┘
```

**Where to find your values:**
- **VORLD_APP_ID**: From Vorld.com → Developer → Auth Apps
- **ARENA_GAME_ID**: From Vorld.com → Arena Arcade → Your Game
- **USER_TOKEN**: From Vorld authentication (see scripts/ folder)
- **STREAM_URL**: Your Twitch/YouTube stream URL

### Visual Guide:
```
Environment Variables
┌────────────────────────────────────────────────────────────┐
│ + Add Environment Variable                                 │
│                                                             │
│ KEY                           VALUE                        │
│ ┌───────────────────────┐    ┌──────────────────────────┐│
│ │ VORLD_APP_ID          │    │ app_mh3vsu8y_6de37169   ││
│ └───────────────────────┘    └──────────────────────────┘│
│                                                             │
│ ┌───────────────────────┐    ┌──────────────────────────┐│
│ │ ARENA_GAME_ID         │    │ arcade_mhcg6dxr_19395e5c││
│ └───────────────────────┘    └──────────────────────────┘│
│                                                             │
│ ┌───────────────────────┐    ┌──────────────────────────┐│
│ │ USER_TOKEN            │    │ eyJhbGciOiJIUzI1NiIsIn...││
│ └───────────────────────┘    └──────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

✅ **Checkpoint:** All 7 environment variables should be added.

---

## 🎯 Step 7: Create the Service

1. **Scroll to the bottom**
2. **Click:** "Create Web Service" button

What happens next:
```
Building... (2-3 minutes)
├─ Cloning repository
├─ Running npm install
├─ Creating container
└─ Starting service

Deploying... (1 minute)
└─ Service going live

✅ Live! (Your URL appears)
```

**You'll see real-time logs as it builds.**

✅ **Checkpoint:** Build should complete successfully.

---

## 🎯 Step 8: Get Your Service URL

Once deployed, you'll see:

```
┌────────────────────────────────────────────────┐
│ 4all-vorld-bridge                              │
│ ● Live                                         │
│                                                │
│ https://4all-vorld-bridge.onrender.com        │ ← YOUR URL
│                                                │
│ [View Logs] [Settings] [Events]               │
└────────────────────────────────────────────────┘
```

**Your service URL will be:**
`https://YOUR-SERVICE-NAME.onrender.com`

✅ **Checkpoint:** You should see "● Live" with a green dot.

---

## 🎯 Step 9: Test Your Deployment

### Open the logs to see your server starting:

1. **Click:** "Logs" tab at the top
2. **You should see:**
   ```
   ╔════════════════════════════════════════════════════════╗
   ║   4ALL Game × Vorld Arena Arcade Integration           ║
   ╚════════════════════════════════════════════════════════╝
   
   📡 Step 1: Starting Godot Bridge Server...
   🌉 Godot Bridge listening on port 10000
   
   🌐 Step 2: Preparing Vorld Arena service...
   ✅ All event handlers configured
   ✅ REST API endpoints ready at /api/*
   ```

### Test the endpoints:

```bash
# Replace with YOUR actual URL
URL="https://4all-vorld-bridge.onrender.com"

# Test health
curl $URL/health

# Test status
curl $URL/status
```

✅ **Checkpoint:** Endpoints should return JSON responses.

---

## 🎯 Step 10: Update Your Godot Game

Your Godot game needs to connect to Render instead of localhost.

**Find this in your Godot code:**
```gdscript
# OLD (local development)
var ws_url = "ws://localhost:9080"

# NEW (production)
var ws_url = "wss://4all-vorld-bridge.onrender.com"
```

**Note:** Use `wss://` (secure WebSocket), not `ws://`

**Important:** Render uses port 10000 internally but you connect without specifying a port.

✅ **Checkpoint:** Godot should connect successfully.

---

## 📊 Understanding the Render Dashboard

### Tabs You'll Use:

**Logs** 📋
- Real-time server logs
- See all console.log output
- Debug connection issues

**Settings** ⚙️
- Change environment variables
- Update build/start commands
- Danger zone (delete service)

**Events** 📅
- Deployment history
- Auto-deploy triggers
- Build success/failure

**Metrics** 📈
- Memory usage
- CPU usage
- Request count
- (Only on paid plans)

---

## 🔄 Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub!

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Build your app
# 3. Deploy the new version
# 4. Go live (takes 2-3 minutes)
```

You'll see the deployment in the "Events" tab.

---

## 🐛 Troubleshooting

### Build Failed?

**Check:**
1. `package.json` has correct `start` script
2. All dependencies are in `dependencies`, not `devDependencies`
3. Look at build logs for specific error

**Common fixes:**
```json
// package.json should have:
"scripts": {
  "start": "node src/index.js"
}
```

### Service Won't Start?

**Check:**
1. Environment variables are set correctly
2. No typos in variable names
3. Look at service logs for errors

**View logs:**
Dashboard → Logs tab → Look for error messages

### Connection Refused?

**Check:**
1. Your server listens on `0.0.0.0`, not `localhost`
2. Use the PORT environment variable

```javascript
// GOOD
const PORT = process.env.PORT || 9080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// BAD
app.listen(9080, 'localhost');
```

### Free Tier Sleeping?

If your service "spins down" after 15 minutes of inactivity:
- First request takes 30-60 seconds to wake up
- This is normal on free tier
- Upgrade to Starter ($7/month) for 24/7 uptime

---

## 💰 Free Tier Limits

**Render Free Tier Includes:**
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic HTTPS
- ✅ Auto-deploys from GitHub
- ✅ WebSocket support
- ✅ Custom domains
- ⚠️ Service sleeps after 15 min inactivity
- ⚠️ 512MB RAM
- ⚠️ Slower builds than paid tiers

**When to Upgrade to Starter ($7/month):**
- Need 24/7 uptime (no sleep)
- Need more than 512MB RAM
- Going to production

---

## 🎉 You're Done!

Your service is now live at:
`https://YOUR-SERVICE-NAME.onrender.com`

### Next Steps:
1. ✅ Test with your Godot game
2. ✅ Test viewer interactions
3. ✅ Monitor logs during gameplay
4. ✅ Set up custom domain (optional)
5. ✅ Upgrade to paid tier when going live

---

## 📞 Support

**Render Documentation:** https://render.com/docs
**Render Community:** https://community.render.com
**Vorld Documentation:** https://thevorld.com/docs

**Common Questions:**

Q: Can I use a custom domain?
A: Yes! Settings → Custom Domain → Follow instructions

Q: How do I see errors?
A: Dashboard → Logs → Real-time server output

Q: How much does it cost?
A: Free tier: $0, Starter: $7/month, Pro: $25/month

Q: Can I deploy multiple branches?
A: Yes! Create a new web service for each branch

---

## ✅ Checklist Summary

Before deployment:
- [ ] Code is on GitHub
- [ ] `.env` file is NOT committed (use environment variables on Render)
- [ ] `package.json` has correct start script

During deployment:
- [ ] Create Render account
- [ ] Create Web Service
- [ ] Configure correctly (Node, npm install, npm start)
- [ ] Add all 7 environment variables
- [ ] Choose Free tier
- [ ] Deploy

After deployment:
- [ ] Check logs for successful start
- [ ] Test endpoints with curl
- [ ] Update Godot game with production URL
- [ ] Test game integration
- [ ] Monitor logs during testing

🎉 **Congratulations! Your server is live!**

