# TestFlow Architecture & How It Works

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                  (React Frontend - Port 3000)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend                           │
│                  (Python - Port 8000)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Routes  │  │ Test Routes  │  │ AI Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
         ┌──────────────┬────────────────┬──────────┐
         │              │                │          │
    ┌────▼───┐   ┌──────▼──────┐   ┌───▼──┐   ┌──▼────┐
    │MongoDB │   │  SQLite DB  │   │OpenAI│   │Browser│
    │(Users) │   │ (Tests)     │   │API   │   │Ctrl   │
    └────────┘   └─────────────┘   └──────┘   └───────┘
```

---

## 📋 Part 1: AUTHENTICATION (Login/Register)

### How Login Works:

```
1. User enters email & password in React app
   ↓
2. Frontend sends POST /api/auth/login
   { "email": "admin@testflow.com", "password": "admin123" }
   ↓
3. Backend receives login request
   ↓
4. Backend looks up user in MongoDB by email
   ↓
5. Backend verifies password:
   - Gets hashed password from database
   - Uses bcrypt.checkpw() to verify
   - If match: authentication successful
   - If no match: returns 401 "Invalid credentials"
   ↓
6. If successful, create JWT tokens:
   - Access Token (expires in 60 minutes)
   - Refresh Token (expires in 7 days)
   ↓
7. Send tokens as HTTP cookies back to frontend
   ↓
8. Frontend stores cookies and redirects to dashboard
```

### Password Security:

```
Registration:
  Plain Password: "admin123"
        ↓
  bcrypt.gensalt() → generates random salt
        ↓
  bcrypt.hashpw("admin123", salt) → creates hash
        ↓
  Stored in DB: $2b$12$Ftrgb3p7QhTRT8b57y7H6OJ...

Login:
  User enters: "admin123"
        ↓
  bcrypt.checkpw("admin123", stored_hash) → True/False
        ↓
  Allow/Deny access
```

---

## 🧪 Part 2: TEST CREATION & MANAGEMENT

### Data Flow:

```
CREATE TEST
1. User clicks "Create New Test" in React
   ↓
2. Frontend opens test editor with empty steps array
   ↓
3. User enters test details:
   - Name: "Facebook Login Test"
   - Steps: [
       { type: "navigate", url: "https://facebook.com" },
       { type: "click", selector: "input[name='email']" },
       { type: "type", selector: "input[name='email']", value: "user@email.com" },
       { type: "click", selector: "input[name='pass']" },
       { type: "type", selector: "input[name='pass']", value: "password123" },
       { type: "click", selector: "button[name='login']" }
     ]
   ↓
4. Frontend sends POST /api/tests/create
   ↓
5. Backend in server.py:
   - Verifies user is authenticated (JWT token)
   - Creates SQLite table if not exists
   - Inserts test into database with user_id
   - Returns test ID to frontend
   ↓
6. Test stored in SQLite:
   tests table:
   ├─ id: unique test ID
   ├─ user_id: who owns this test
   ├─ name: "Facebook Login Test"
   ├─ steps: JSON array of steps
   ├─ status: "created" | "running" | "passed" | "failed"
   ├─ created_at: timestamp
   └─ results: execution results JSON
```

### List Tests:

```
GET /api/tests
  ↓
Backend queries:
  SELECT * FROM tests WHERE user_id = ?
  ↓
Returns all tests for logged-in user
```

---

## 🤖 Part 3: AI TEST GENERATION

### Fallback AI Generator (No OpenAI Quota):

```
User enters prompt:
"Navigate to https://www.facebook.com/ and enter username and password"
  ↓
POST /api/ai/generate
{
  "prompt": "Navigate to https://www.facebook.com/ and enter username and password",
  "context": ""
}
  ↓
Server calls generate_fallback_test():
  │
  ├─ Extract URL using regex: https://www.facebook.com
  │
  ├─ Detect keywords: "login" OR "username" OR "password"
  │
  ├─ Generate Playwright Test Code:
  │
  └─ Returns:
     {
       "steps": [
         { type: "navigate", url: "https://www.facebook.com" },
         { type: "click", selector: "input[type='email'], input[name='email']" },
         { type: "type", value: "your_email@example.com" },
         { type: "click", selector: "input[type='password']" },
         { type: "type", value: "your_password" },
         { type: "click", selector: "button[type='submit']" }
       ],
       "playwright_code": "import { test, expect } from '@playwright/test';\n\ntest('Generated Test', async ({ page }) => {\n  ...\n})"
     }
```

### Code Generation Logic:

```python
def generate_fallback_test(prompt: str):
    # 1. Extract URL using regex
    url_match = re.search(r'https?://[^\s]+', prompt)
    url = url_match.group(0) if url_match else "https://example.com"
    
    # 2. Start Playwright test template
    code = "import { test, expect } from '@playwright/test';\n"
    code += "test('Generated Test', async ({ page }) => {\n"
    
    # 3. Add navigate step
    code += f"  await page.goto('{url}');\n"
    
    # 4. Detect action type and add steps
    if "login" in prompt or "password" in prompt:
        # Add login steps with multiple selector patterns
        code += """
  try {
    await page.fill('input[type="email"]', 'your_email@example.com');
  } catch (e) {
    console.log('Email field not found');
  }
  try {
    await page.fill('input[type="password"]', 'your_password');
  } catch (e) {
    console.log('Password field not found');
  }
  await page.click('button[type="submit"]');
        """
    
    # 5. Add assertion
    code += "  await expect(page).toHaveURL(/.*/);\\n})"
    
    return code
```

---

## ▶️ Part 4: TEST EXECUTION

### How Tests Run:

```
1. User clicks "Run Test" in frontend
   ↓
2. Frontend sends POST /api/tests/{test_id}/run
   ↓
3. Backend receives request:
   - Gets test from database
   - Extracts steps array
   - Runs in background (BackgroundTasks)
   ↓
4. Backend converts steps to Playwright script:
   
   Test Steps:
   [
     { type: "navigate", url: "https://facebook.com" },
     { type: "click", selector: "button" }
   ]
        ↓
   Generates Python code:
   ```python
   from playwright.async_api import async_playwright
   
   async def run_test():
       async with async_playwright() as p:
           browser = await p.chromium.launch(headless=False)
           page = await browser.new_page()
           
           # Step 1
           await page.goto('https://facebook.com')
           
           # Step 2
           await page.click('button')
           
           await browser.close()
   ```
   ↓
5. Backend executes the script:
   - Launches Playwright browser
   - Runs each step
   - Captures results and screenshots
   - Records pass/fail status
   ↓
6. Frontend updates with results:
   - Shows step-by-step execution
   - Displays screenshots
   - Shows pass/fail status
   - Shows execution time
```

---

## 💾 Part 5: DATABASE STORAGE

### MongoDB (User Data):

```
Database: testflow_db
Collection: users

Document:
{
  "_id": ObjectId("..."),
  "email": "admin@testflow.com",
  "password_hash": "$2b$12$Ftrgb3p7QhRT8b57y7H6OJ...",
  "name": "Admin",
  "role": "admin",
  "created_at": "2026-03-30T00:00:00+00:00"
}
```

### SQLite (Test Data):

```
Local File: backend/tests.db

Tables:
├─ test_suites
│  ├─ id (PRIMARY KEY)
│  ├─ user_id (who owns it)
│  ├─ name
│  ├─ description
│  └─ created_at
│
├─ tests
│  ├─ id (PRIMARY KEY)
│  ├─ user_id
│  ├─ suite_id (optional)
│  ├─ name
│  ├─ description
│  ├─ steps (JSON array)
│  ├─ status (created|running|passed|failed)
│  ├─ browser (chromium|firefox|webkit)
│  └─ created_at
│
└─ test_results
   ├─ id (PRIMARY KEY)
   ├─ test_id (which test was run)
   ├─ user_id
   ├─ status (passed|failed)
   ├─ duration (milliseconds)
   ├─ step_results (JSON array of step results)
   ├─ screenshots (file paths)
   └─ executed_at
```

---

## 🔐 Part 6: SECURITY

### JWT Token Flow:

```
Login:
  Backend creates token:
  {
    "sub": "user_id_123",
    "email": "admin@testflow.com",
    "exp": <60 minutes from now>,
    "iat": <current time>
  }
  Encoded with secret key: HMAC-SHA256

Frontend stores:
  Authorization: Bearer eyJhbGc...

For Protected APIs:
  GET /api/tests
  Header: Authorization: Bearer eyJhbGc...
        ↓
  Backend verifies:
  - Decode token with secret key
  - Check signature (hasn't been tampered)
  - Check expiration time
  - Extract user_id and email
        ↓
  If valid: allow request
  If invalid: return 401 Unauthorized
```

### CORS (Cross-Origin):

```
Frontend runs on: http://localhost:3000
Backend runs on: http://localhost:8000
Different origin → Browser blocks by default

Solution: CORS Middleware in FastAPI
  
  AllowedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]
  
  AllowedMethods: ["GET", "POST", "PUT", "DELETE"]
  AllowedHeaders: ["*"]
  AllowCredentials: True
  
Now frontend can make requests to backend ✓
```

---

## 🔄 Part 7: KEY API ENDPOINTS

### Authentication:
```
POST   /api/auth/register    → Create new account
POST   /api/auth/login       → Login & get tokens
POST   /api/auth/logout      → Clear cookies
GET    /api/auth/me          → Get current user
```

### Tests:
```
GET    /api/tests            → List all tests for user
POST   /api/tests/create     → Create new test
GET    /api/tests/{id}       → Get test details
PUT    /api/tests/{id}       → Update test
DELETE /api/tests/{id}       → Delete test
POST   /api/tests/{id}/run   → Execute test
```

### AI:
```
POST   /api/ai/generate      → Generate test code from prompt
POST   /api/ai/suggest       → Get suggestions for improvements
```

### Results:
```
GET    /api/results          → Get test execution results
GET    /api/results/{id}     → Get specific result details
```

---

## 📱 Part 8: REQUEST-RESPONSE CYCLE

### Complete Example: Running a Test

```
1. FRONTEND (React)
   User clicks "Run Test"
   ↓
2. HTTP REQUEST
   POST /api/tests/test123/run
   Headers: Authorization: Bearer [token]
   Body: {}
   ↓
3. BACKEND (FastAPI)
   
   @app.post("/tests/{test_id}/run")
   async def run_test(test_id: str, user: dict = Depends(get_current_user)):
       # Get test from SQLite
       test = query_test(test_id, user["id"])
       
       # Background execution
       background_tasks.add_task(
           execute_playwright_script,
           test["steps"],
           test_id,
           user["id"]
       )
       
       return {"status": "running", "test_id": test_id}
   ↓
4. BACKGROUND TASK
   - Generate Playwright code
   - Launch browser (visible)
   - Execute steps
   - Capture screenshots
   - Save results to database
   ↓
5. HTTP RESPONSE (to Frontend)
   {
     "status": "running",
     "test_id": "test123"
   }
   ↓
6. FRONTEND (React)
   - Response received
   - Shows "Test is running..."
   - Polls /api/results/test123 periodically
   - Updates UI with latest results
```

---

## 🛠️ Part 9: ENVIRONMENT SETUP

### .env File Configuration:

```env
# MongoDB Connection
MONGO_URL=mongodb+srv://admin:password%40123@cluster0.bgqoq2t.mongodb.net/testflow_db?retryWrites=true&w=majority
DB_NAME=testflow_db

# Security
JWT_SECRET=your_secret_jwt_key_change_this_in_production

# OpenAI (Optional, uses fallback if quota exceeded)
EMERGENT_LLM_KEY=sk-proj-xxxxx...

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Default Admin Account (created on startup)
ADMIN_EMAIL=admin@testflow.com
ADMIN_PASSWORD=admin123
```

### Startup Sequence:

```
1. Backend starts (python -m uvicorn server:app)
2. Loads .env file
3. Connects to MongoDB
4. Creates SQLite database and tables
5. Checks if admin user exists
6. If not, creates: admin@testflow.com / admin123
7. Starts API server on localhost:8000
8. Ready for requests!

Frontend starts (npm start)
9. Compiles React app
10. Starts dev server on localhost:3000
11. Opens browser to http://localhost:3000
12. Users can now login and use app!
```

---

## 📊 Part 10: DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (React - Port 3000)                                     │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │Login Page│  │Dashboard │  │Test Edit │  │Results   │         │
│ └─────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬────┘         │
└───────┼─────────────┼─────────────┼─────────────┼────────────────┘
        │ HTTP        │ HTTP        │ HTTP        │ HTTP
        │ POST        │ GET         │ POST/PUT    │ GET
        │ /login      │ /tests      │ /tests/{id} │ /results
        ↓             ↓             ↓             ↓
┌───────────────────────────────────────────────────────────────┐
│ FastAPI Backend (Port 8000)                                   │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Middleware: JWT Verification, CORS                      │  │
│ └─────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Route Handlers:                                          │ │
│ │ • auth_router.py → verify password, issue JWT tokens    │ │
│ │ • tests_router.py → CRUD operations on tests            │ │
│ │ • ai_router.py → generate/suggest tests                 │ │
│ │ • exec_router.py → run tests with Playwright            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                           ↓                                   │
│ ┌──────────┬──────────────┬──────────┬──────────────────────┐ │
│ │ MongoDB  │ SQLite Local │ OpenAI   │ Playwright Browser   │ │
│ │ (Users)  │ (Tests)      │ API      │ (Test Execution)    │ │
│ └──────────┴──────────────┴──────────┴──────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK SUMMARY

1. **User logs in** → Password hashed with bcrypt, verified against database
2. **JWT token issued** → Used for all subsequent requests
3. **User creates test** → Steps stored in SQLite database
4. **User clicks AI Generate** → Fallback generator creates Playwright code
5. **User runs test** → Playwright browser launches, executes steps, records results
6. **Results saved** → Screenshots and test results stored in database
7. **User sees results** → Frontend displays pass/fail with timestamps

All communication is **REST API** between frontend and backend, with **JWT security** protecting user data!

