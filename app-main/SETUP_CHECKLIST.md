# TestFlow - Setup Checklist

## ✅ Pre-Setup Requirements

- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created and running
- [ ] Database user created in MongoDB Atlas

---

## ✅ Initial Setup (One-time)

### Step 1: Get MongoDB Connection String
- [ ] Go to https://cloud.mongodb.com/
- [ ] Navigate to your cluster
- [ ] Click "Connect" → "Drivers" → Python
- [ ] Copy connection string

### Step 2: Configure .env File
- [ ] Open `.env` file in `app-main/` directory
- [ ] Update `MONGO_URL` with your connection string
- [ ] Verify all other settings are correct
- [ ] Save file

### Step 3: Install Backend Dependencies
- [ ] Open PowerShell/Command Prompt
- [ ] Navigate: `cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend`
- [ ] Run: `python -m pip install -r requirements.txt`
- [ ] Run: `python -m playwright install`
- [ ] Wait for completion

### Step 4: Install Frontend Dependencies
- [ ] Navigate: `cd ..\frontend`
- [ ] Run: `npm install --legacy-peer-deps`
- [ ] Wait for completion

---

## ✅ Every Time You Want to Run the App

### Option A: Quick Start (Recommended)
- [ ] Navigate to: `c:\Users\Admin\Downloads\GenAiTestFlow\app-main\`
- [ ] Double-click: `start-app.bat`
- [ ] Wait for browser to open
- [ ] Login with:
  - Email: `admin@testflow.com`
  - Password: `admin123`

### Option B: PowerShell Script
- [ ] Open PowerShell
- [ ] Run: `powershell -ExecutionPolicy Bypass -File "c:\Users\Admin\Downloads\GenAiTestFlow\app-main\start-app.ps1"`
- [ ] Wait for browser to open
- [ ] Login

### Option C: Manual (Two Terminals)
**Terminal 1:**
- [ ] `cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend`
- [ ] `python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000`

**Terminal 2:**
- [ ] `cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\frontend`
- [ ] `npm start`

- [ ] Open browser: http://localhost:3000
- [ ] Login

---

## ✅ Verify Everything is Working

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can navigate to http://localhost:8000/docs (API Docs)
- [ ] Login successful with provided credentials
- [ ] Can create a new test
- [ ] Can run a test (browser opens)
- [ ] Test results are saved

---

## ✅ Daily Checks Before Running

- [ ] Internet connection is active
- [ ] MongoDB Atlas cluster is running
- [ ] No other services using ports 3000 or 8000
- [ ] `.env` file exists and is properly configured

---

## 🛑 Stopping the Application

- [ ] Close all terminal windows
- [ ] OR press Ctrl+C in each terminal
- [ ] OR close the browser (doesn't stop servers)

---

## 📞 Troubleshooting Checklist

| Issue | Check |
|-------|-------|
| Backend won't start | Port 8000 is available? `.env` file exists? |
| Frontend won't start | Port 3000 is available? npm installed? |
| Can't login | Email/password correct? DB connected? |
| Tests won't run | Playwright installed? Browser launching? |
| No API response | Backend running? CORS configured? |
| MongoDB error | Connection string correct? IP whitelisted? |

---

## 📝 Important Paths

```
Project Root: c:\Users\Admin\Downloads\GenAiTestFlow\app-main\
Backend:      c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend\
Frontend:     c:\Users\Admin\Downloads\GenAiTestFlow\app-main\frontend\
Config File:  c:\Users\Admin\Downloads\GenAiTestFlow\app-main\.env
Database:     c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend\tests.db
```

---

## 🎯 URLs Reference

```
Application:  http://localhost:3000
API Docs:     http://localhost:8000/docs
Backend API:  http://localhost:8000/api
Health Check: http://localhost:8000
```

---

## 👤 Default Credentials

```
Email:    admin@testflow.com
Password: admin123
```

---

## 💡 Tips

1. **Keep startup scripts handy** - Place `start-app.bat` on desktop for easy access
2. **Leave servers running** - Keep both backend and frontend running while testing
3. **Check logs** - Terminal shows errors and important information
4. **Port conflicts** - If getting "port in use" error, close other applications
5. **Refresh browser** - If app seems frozen, press F5 to refresh

---

## ✨ Next Steps

- [ ] Complete initial setup
- [ ] Start the application using preferred method
- [ ] Login with provided credentials
- [ ] Explore the dashboard
- [ ] Create your first test
- [ ] Run the test and see it in action!

---

**You're all set! Happy Testing! 🚀**

For detailed information, see: `README_SETUP.md`
