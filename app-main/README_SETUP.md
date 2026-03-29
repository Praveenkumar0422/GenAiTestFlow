# TestFlow - Complete Setup & Running Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Database Setup](#database-setup)
4. [Installation](#installation)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Default Credentials](#default-credentials)

---

## Prerequisites

### Required Software
- **Python 3.11+** - https://www.python.org/downloads/
- **Node.js 18+** - https://nodejs.org/
- **MongoDB Atlas Account** - https://www.mongodb.com/cloud/atlas (Free tier available)

### Verify Installation
```powershell
python --version
node --version
npm --version
```

---

## Project Structure

```
app-main/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main application
│   ├── requirements.txt     # Python dependencies
│   └── tests.db            # SQLite database (created on first run)
├── frontend/               # React frontend
│   ├── src/
│   ├── package.json
│   └── public/
├── .env                    # Environment configuration
├── memory/                 # Application memory/logs
└── README_SETUP.md         # This file
```

---

## Database Setup

### Step 1: Create MongoDB Atlas Account
1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a new project
4. Create a free cluster (M0 Sandbox)

### Step 2: Create Database User
1. Go to "Database Access"
2. Click "+ Add New Database User"
3. Enter credentials:
   - Username: `admin`
   - Password: `password@123`
4. Set role to "Atlas Admin"
5. Click "Add User"

### Step 3: Configure Network Access
1. Go to "Network Access"
2. Click "+ Add IP Address"
3. Select "Allow access from anywhere"
4. Confirm

### Step 4: Get Connection String
1. Go to "Databases"
2. Click "Connect" on your cluster
3. Choose "Drivers" → "Python" → "3.12 or later"
4. Copy the connection string
5. Format: `mongodb+srv://admin:password@123@cluster0.xxxxx.mongodb.net/testflow_db?retryWrites=true&w=majority`

---

## Installation

### Step 1: Clone/Navigate to Project
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main
```

### Step 2: Create .env File
Create `.env` file in `app-main/` directory with:

```env
MONGO_URL=mongodb+srv://admin:password@123@cluster0.bgqoq2t.mongodb.net/testflow_db?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=testflow_db
JWT_SECRET=your_secret_jwt_key_change_this_in_production
EMERGENT_LLM_KEY=your_emergent_llm_key_here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_EMAIL=admin@testflow.com
ADMIN_PASSWORD=admin123
```

### Step 3: Install Backend Dependencies
```powershell
cd backend
python -m pip install -r requirements.txt
python -m playwright install
cd ..
```

### Step 4: Install Frontend Dependencies
```powershell
cd frontend
npm install --legacy-peer-deps
cd ..
```

---

## Running the Application

### Option 1: Run Using PowerShell Script (Recommended)

#### A. Create Auto-Start Script

File: `start-app.ps1`

```powershell
# Define paths
$projectRoot = "c:\Users\Admin\Downloads\GenAiTestFlow\app-main"

Write-Host "Starting TestFlow Application..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Start Backend Server
Write-Host "Starting Backend Server on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm start"

# Wait for frontend to start
Start-Sleep -Seconds 5

# Open browser
Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "================================" -ForegroundColor Green
Write-Host "TestFlow Application Started!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
```

#### B. Run the Script
```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\Admin\Downloads\GenAiTestFlow\app-main\start-app.ps1"
```

---

### Option 2: Manual - Terminal 1 (Backend)

```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['...']
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

---

### Option 3: Manual - Terminal 2 (Frontend)

```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view frontend in the browser.
Local: http://localhost:3000
```

---

## 🌐 Access the Application

1. **Open Browser**: http://localhost:3000
2. **Login with**:
   - Email: `admin@testflow.com`
   - Password: `admin123`
3. **Start creating tests!** ✨

---

## 📚 URLs Reference

| Purpose | URL |
|---------|-----|
| **Main Application** | http://localhost:3000 |
| **API Documentation** | http://localhost:8000/docs |
| **Backend Health Check** | http://localhost:8000 |
| **API Base URL** | http://localhost:8000/api |

---

## Database & Collections

### MongoDB Collections
- **testflow_db** (database)
  - **users** - User accounts and authentication

### SQLite Tables (tests.db)
- **tests** - Test definitions
- **test_suites** - Test grouping
- **test_results** - Execution results

---

## Troubleshooting

### ❌ Backend won't start

**Error: Port 8000 already in use**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F
```

**Error: MongoDB connection failed**
- Check connection string in `.env`
- Verify username/password are correct
- Ensure IP is whitelisted in MongoDB Atlas
- Check internet connectivity

---

### ❌ Frontend won't start

**Error: Module not found**
```powershell
cd frontend
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

**Error: Port 3000 already in use**
```powershell
# Kill Node process
taskkill /F /IM node.exe
```

---

### ❌ Tests not running

**Error: Playwright browsers not found**
```powershell
python -m playwright install
```

---

## 🛑 Stopping the Application

Press **Ctrl + C** in each terminal window, or:

```powershell
# Stop all Node processes
taskkill /F /IM node.exe

# Stop all Python processes
taskkill /F /IM python.exe /T
```

---

## 🔄 Development Workflow

### Backend Development
- Edit files in `backend/`
- Auto-reload is enabled (just save)
- Restart server to load changes to `.env`

### Frontend Development
- Edit files in `frontend/src/`
- Browser auto-refreshes on save
- Check browser console (F12) for errors

---

## 📝 Default Credentials

| Field | Value |
|-------|-------|
| **Email** | admin@testflow.com |
| **Password** | admin123 |

---

## 🔐 Environment Variables

All environment variables are stored in `.env` file:

```env
# Database Connection
MONGO_URL=<your_mongodb_connection_string>
DB_NAME=testflow_db

# Security
JWT_SECRET=your_secret_key
EMERGENT_LLM_KEY=your_emergent_key

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Admin User
ADMIN_EMAIL=admin@testflow.com
ADMIN_PASSWORD=admin123
```

---

## 📊 Application Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (React - Port 3000)            │
│  - Dashboard, Tests, Results, Settings          │
└────────────────────┬────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────┐
│      Backend (FastAPI - Port 8000)              │
│  - Auth APIs, Test APIs, Execution Engine       │
└────────────────┬───────────────────────┬────────┘
                 │                       │
        ┌────────▼────────┐   ┌──────────▼────────┐
        │  MongoDB Atlas  │   │   SQLite (Local)  │
        │  (Cloud)        │   │   (tests.db)      │
        │  - Users        │   │   - Tests         │
        │                 │   │   - Results       │
        └─────────────────┘   └───────────────────┘
```

---

## 🎯 Next Steps

1. ✅ Start the application
2. ✅ Login with default credentials
3. ✅ Create a test case
4. ✅ Run the test and see browser automation in action!

---

## 📞 Support

For issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Check terminal output for error messages
3. Review `.env` file configuration
4. Check MongoDB Atlas account status

---

**Happy Testing! 🚀**
