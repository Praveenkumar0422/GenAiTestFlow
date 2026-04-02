# MongoDB Setup Guide

## Current Configuration

**Location:** `app-main/.env`

```
MONGO_URL=mongodb+srv://admin:password%40123@cluster0.bgqoq2t.mongodb.net/testflow_db?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=testflow_db
ADMIN_EMAIL=admin@testflow.com
ADMIN_PASSWORD=admin123
```

## Issue

MongoDB connections are failing with SSL/TLS handshake errors:
```
SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR]
```

**Result:** Login fails because database queries can't execute.

## Solutions

### Option 1: Local MongoDB (Best for Development)

1. **Install MongoDB Community:**
   - Download: https://www.mongodb.com/try/download/community
   - Run installer and select "Install MongoDB as a Service"

2. **Start MongoDB:**
   ```powershell
   # Windows - MongoDB should start automatically
   # Or manually:
   net start MongoDB
   ```

3. **Update `.env` file:**
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=testflow_db
   ```

4. **Restart backend task:** `🔧 Start Backend`

5. **Test login:**
   - Email: `admin@testflow.com`
   - Password: `admin123`

### Option 2: Fix MongoDB Atlas Connection

1. **Check your IP whitelist:**
   - Go to: MongoDB Atlas → Network Access
   - Verify your machine's IP is allowed (0.0.0.0/0 allows all)

2. **Update `.env` with SSL disabled (temporary):**
   ```
   MONGO_URL=mongodb+srv://admin:password%40123@cluster0.bgqoq2t.mongodb.net/testflow_db?retryWrites=true&w=majority&appName=Cluster0&tls=false
   ```

3. **Restart backend and test**

### Option 3: Use Test Database

If MongoDB remains unavailable, edit the startup handler in `server.py` to skip admin user creation. The app will function with SQLite for test data but won't support user authentication.

## Backend Code Reference

**File:** `app-main/backend/server.py`

**MongoDB Connection (Lines 36-45):**
```python
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000
)
db = client[os.environ['DB_NAME']]
```

**Login Endpoint (Line 264):**
- Route: `POST /api/auth/login`
- Queries: `db.users.find_one({"email": email})`
- Returns: User data + JWT tokens

## Verify Connection

Run this in terminal to test MongoDB:
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main\backend
python -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; from dotenv import load_dotenv; load_dotenv('../.env'); client = AsyncIOMotorClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=5000); print('Connected!' if client else 'Failed')"
```
