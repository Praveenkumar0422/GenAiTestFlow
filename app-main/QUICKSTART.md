# TestFlow - Quick Start

## 🚀 Fastest Way to Start

### Windows Users (Easiest)

**Option 1: Double-click the batch file**
```
start-app.bat
```
This will automatically start both backend and frontend servers and open your browser.

**Option 2: Use PowerShell**
```powershell
powershell -ExecutionPolicy Bypass -File "start-app.ps1"
```

---

## 📁 Startup Files Included

| File | Purpose | How to Run |
|------|---------|-----------|
| `start-app.ps1` | Start both backend & frontend | `powershell -ExecutionPolicy Bypass -File "start-app.ps1"` |
| `start-app.bat` | Start both backend & frontend | Double-click in File Explorer |
| `start-backend.ps1` | Start backend only | `powershell -ExecutionPolicy Bypass -File "start-backend.ps1"` |
| `start-frontend.ps1` | Start frontend only | `powershell -ExecutionPolicy Bypass -File "start-frontend.ps1"` |
| `README_SETUP.md` | Complete setup guide | Read in any text editor |

---

## ⚙️ Setup Before First Run

### 1. Update .env File
Edit `.env` in `app-main/` folder:

```env
MONGO_URL=mongodb+srv://admin:password@123@cluster0.bgqoq2t.mongodb.net/testflow_db?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=testflow_db
JWT_SECRET=your_secret_jwt_key_change_this_in_production
EMERGENT_LLM_KEY=your_emergent_llm_key_here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_EMAIL=admin@testflow.com
ADMIN_PASSWORD=admin123
```

### 2. Install Dependencies (One-time)
```powershell
# Backend
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend
python -m pip install -r requirements.txt
python -m playwright install

# Frontend
cd ..\frontend
npm install --legacy-peer-deps
```

---

## ▶️ Running the Application

### Method 1: Batch File (Recommended for Windows)
1. Navigate to: `c:\Users\Admin\Downloads\GenAiTestFlow\app-main\`
2. Double-click: `start-app.bat`
3. Wait 10 seconds
4. Browser opens automatically

---

### Method 2: PowerShell Script
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main
powershell -ExecutionPolicy Bypass -File "start-app.ps1"
```

---

### Method 3: Manual (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\frontend
npm start
```

Then open: http://localhost:3000

---

## 🌐 Access the Application

| What | URL |
|------|-----|
| **Main App** | http://localhost:3000 |
| **API Documentation** | http://localhost:8000/docs |
| **Backend** | http://localhost:8000 |

---

## 🔐 Login Credentials

```
Email:    admin@testflow.com
Password: admin123
```

---

## ⚕️ Health Check

### Is backend running?
Visit: http://localhost:8000/docs

### Is frontend running?
Visit: http://localhost:3000

### Is database connected?
Login with credentials. If successful, DB is connected.

---

## 🛑 Stop the Application

Press **Ctrl + C** in each terminal window.

Or if you started with batch/script:
- Close all command windows that appeared

---

## ❌ Common Issues

### "Port already in use"
```powershell
# Kill Node
taskkill /F /IM node.exe

# Kill Python
taskkill /F /IM python.exe /T
```

### "Module not found" (Frontend)
```powershell
cd frontend
npm install --legacy-peer-deps
npm start
```

### "Database connection failed"
- Check MongoDB connection in `.env`
- Verify credentials are correct
- Ensure IP is whitelisted in MongoDB Atlas

### "Tests won't run"
```powershell
python -m playwright install
```

---

## 📚 For More Details

See: `README_SETUP.md` for complete documentation

---

**Happy Testing! 🚀**
