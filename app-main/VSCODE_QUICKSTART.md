# 🎯 Quick Start from VS Code

## ⚡ Fastest Way (30 seconds)

### Step 1: Open Project in VS Code
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main
code .
```

### Step 2: Open Terminal
Press: **Ctrl + `**

### Step 3: Start All
```powershell
npm run dev
```

Or run from the task:
1. Press **Ctrl + Shift + P**
2. Type: `Tasks: Run Task`
3. Select: `🚀 Start All Servers`

---

## 🎮 Three Quick Methods

### Method A: Split Terminals (Recommended)

1. Press **Ctrl + `** to open terminal
2. Press **Ctrl + Shift + `** to open second terminal
3. Click split icon on terminal

**Terminal 1:**
```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2:**
```powershell
cd frontend
npm start
```

✅ Done! Application runs at http://localhost:3000

---

### Method B: VS Code Tasks

1. Press **Ctrl + Shift + P**
2. Search: `Tasks: Run Task`
3. Select: `🚀 Start All Servers`
4. Wait 10 seconds
5. App loads at http://localhost:3000

---

### Method C: Debug Mode

1. Press **F5** or **Ctrl + Shift + D**
2. Select: `Python: FastAPI Backend`
3. Click green play button
4. In new terminal: `cd frontend && npm start`

---

## 🔗 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Terminal | **Ctrl + `** |
| New Terminal | **Ctrl + Shift + `** |
| Run Task | **Ctrl + Shift + P** → "Tasks: Run Task" |
| Stop/Close | **Ctrl + C** in terminal |
| Debug | **F5** |

---

## 📍 Access Points

| Where | URL |
|-------|-----|
| App | http://localhost:3000 |
| API | http://localhost:8000 |
| Docs | http://localhost:8000/docs |

---

## 👤 Login

```
Email:    admin@testflow.com
Password: admin123
```

---

## ⚙️ Pre-Setup (One-time)

Make sure these are installed:
```powershell
# Backend
cd backend
python -m pip install -r requirements.txt
python -m playwright install

# Frontend
cd ..\frontend
npm install --legacy-peer-deps
```

---

## 🛑 Stop Everything

Press **Ctrl + C** in each terminal, or:
```powershell
# Kill all
taskkill /F /IM node.exe
taskkill /F /IM python.exe /T
```

---

## 📚 Full Guide

See: `VSCODE_GUIDE.md` for complete documentation

---

**That's it! Happy coding! 🚀**
