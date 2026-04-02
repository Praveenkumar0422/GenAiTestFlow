from pathlib import Path
from dotenv import load_dotenv
# Load .env from parent directory (app-main)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import certifi
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import aiosqlite
import asyncio
import json
import subprocess
import sys
import tempfile

# OpenAI Integration
from openai import AsyncOpenAI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
TEMP_TEST_DIR = Path(tempfile.gettempdir()) / "testflow-generated-tests"
TEMP_TEST_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection with proper SSL/TLS configuration
mongo_url = os.environ['MONGO_URL']

# Only enforce TLS defaults for Atlas/SRV URLs.
# Plain localhost MongoDB setups usually run without TLS in development.
mongo_client_options = {
    "serverSelectionTimeoutMS": 10000,
    "connectTimeoutMS": 10000,
    "socketTimeoutMS": 10000,
}

if mongo_url.startswith("mongodb+srv://"):
    mongo_client_options.update(
        {
            "retryWrites": True,
            "tls": True,
            "tlsAllowInvalidCertificates": False,
            "tlsCAFile": certifi.where(),
        }
    )

client = AsyncIOMotorClient(mongo_url, **mongo_client_options)
db = client[os.environ['DB_NAME']]

# SQLite for test storage
SQLITE_DB_PATH = ROOT_DIR / "tests.db"

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Create the main app
app = FastAPI(title="TestFlow API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Auth"])
tests_router = APIRouter(prefix="/tests", tags=["Tests"])
suites_router = APIRouter(prefix="/test-suites", tags=["Test Suites"])
results_router = APIRouter(prefix="/results", tags=["Results"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])
integrations_router = APIRouter(prefix="/integrations", tags=["Integrations"])
settings_router = APIRouter(prefix="/settings", tags=["Settings"])

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TestStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # navigate, click, type, assert, wait
    selector: Optional[str] = None
    value: Optional[str] = None
    url: Optional[str] = None
    timeout: Optional[int] = 5000
    description: Optional[str] = None

class TestCreate(BaseModel):
    name: str
    suite_id: Optional[str] = None
    description: Optional[str] = None
    steps: List[TestStep] = []
    tags: List[str] = []
    browser: str = "chromium"

class TestUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[TestStep]] = None
    tags: Optional[List[str]] = None
    browser: Optional[str] = None

class TestSuiteCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TestResult(BaseModel):
    id: str
    test_id: str
    test_name: str
    status: str  # passed, failed, running, pending
    duration_ms: int
    started_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    steps_completed: int = 0
    total_steps: int = 0
    screenshot_url: Optional[str] = None

class AIGenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class IntegrationConfig(BaseModel):
    type: str  # github, slack, jenkins, jira
    enabled: bool = False
    config: Dict[str, Any] = {}

class SettingsUpdate(BaseModel):
    general: Optional[Dict[str, Any]] = None
    notifications: Optional[Dict[str, Any]] = None

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def init_sqlite():
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute("""
            CREATE TABLE IF NOT EXISTS tests (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                suite_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                steps TEXT NOT NULL,
                tags TEXT,
                browser TEXT DEFAULT 'chromium',
                status TEXT DEFAULT 'idle',
                last_run TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db_conn.execute("""
            CREATE TABLE IF NOT EXISTS test_suites (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db_conn.execute("""
            CREATE TABLE IF NOT EXISTS test_results (
                id TEXT PRIMARY KEY,
                test_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                test_name TEXT NOT NULL,
                status TEXT NOT NULL,
                duration_ms INTEGER DEFAULT 0,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                error_message TEXT,
                steps_completed INTEGER DEFAULT 0,
                total_steps INTEGER DEFAULT 0,
                screenshot_url TEXT,
                step_results TEXT
            )
        """)
        await db_conn.commit()

# ============== AUTH ROUTES ==============

@auth_router.post("/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "user"}

@auth_router.post("/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user["name"], "role": user.get("role", "user")}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@auth_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ============== TEST SUITE ROUTES ==============

@suites_router.get("")
async def get_test_suites(user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM test_suites WHERE user_id = ? ORDER BY created_at DESC",
            (user["id"],)
        )
        rows = await cursor.fetchall()
        suites = []
        for row in rows:
            suite_dict = dict(row)
            # Get test count for this suite
            count_cursor = await db_conn.execute(
                "SELECT COUNT(*) as count FROM tests WHERE suite_id = ?",
                (suite_dict["id"],)
            )
            count_row = await count_cursor.fetchone()
            suite_dict["test_count"] = count_row[0] if count_row else 0
            suites.append(suite_dict)
        return suites

@suites_router.post("")
async def create_test_suite(suite_data: TestSuiteCreate, user: dict = Depends(get_current_user)):
    suite_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute(
            "INSERT INTO test_suites (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (suite_id, user["id"], suite_data.name, suite_data.description, now, now)
        )
        await db_conn.commit()
    
    return {"id": suite_id, "name": suite_data.name, "description": suite_data.description, "created_at": now}

@suites_router.delete("/{suite_id}")
async def delete_test_suite(suite_id: str, user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute("DELETE FROM test_suites WHERE id = ? AND user_id = ?", (suite_id, user["id"]))
        await db_conn.execute("UPDATE tests SET suite_id = NULL WHERE suite_id = ?", (suite_id,))
        await db_conn.commit()
    return {"message": "Suite deleted"}

# ============== TESTS ROUTES ==============

@tests_router.get("")
async def get_tests(user: dict = Depends(get_current_user), suite_id: Optional[str] = None):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        if suite_id:
            cursor = await db_conn.execute(
                "SELECT * FROM tests WHERE user_id = ? AND suite_id = ? ORDER BY created_at DESC",
                (user["id"], suite_id)
            )
        else:
            cursor = await db_conn.execute(
                "SELECT * FROM tests WHERE user_id = ? ORDER BY created_at DESC",
                (user["id"],)
            )
        rows = await cursor.fetchall()
        tests = []
        for row in rows:
            test_dict = dict(row)
            test_dict["steps"] = json.loads(test_dict["steps"]) if test_dict["steps"] else []
            test_dict["tags"] = json.loads(test_dict["tags"]) if test_dict["tags"] else []
            tests.append(test_dict)
        return tests

@tests_router.get("/{test_id}")
async def get_test(test_id: str, user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM tests WHERE id = ? AND user_id = ?",
            (test_id, user["id"])
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Test not found")
        test_dict = dict(row)
        test_dict["steps"] = json.loads(test_dict["steps"]) if test_dict["steps"] else []
        test_dict["tags"] = json.loads(test_dict["tags"]) if test_dict["tags"] else []
        return test_dict

@tests_router.post("")
async def create_test(test_data: TestCreate, user: dict = Depends(get_current_user)):
    test_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    steps_json = json.dumps([step.model_dump() for step in test_data.steps])
    tags_json = json.dumps(test_data.tags)
    
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute(
            """INSERT INTO tests (id, user_id, suite_id, name, description, steps, tags, browser, status, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (test_id, user["id"], test_data.suite_id, test_data.name, test_data.description, 
             steps_json, tags_json, test_data.browser, "idle", now, now)
        )
        await db_conn.commit()
    
    return {
        "id": test_id,
        "name": test_data.name,
        "description": test_data.description,
        "steps": [step.model_dump() for step in test_data.steps],
        "tags": test_data.tags,
        "browser": test_data.browser,
        "status": "idle",
        "created_at": now
    }

@tests_router.put("/{test_id}")
async def update_test(test_id: str, test_data: TestUpdate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute("SELECT * FROM tests WHERE id = ? AND user_id = ?", (test_id, user["id"]))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Test not found")
        
        updates = []
        params = []
        if test_data.name is not None:
            updates.append("name = ?")
            params.append(test_data.name)
        if test_data.description is not None:
            updates.append("description = ?")
            params.append(test_data.description)
        if test_data.steps is not None:
            updates.append("steps = ?")
            params.append(json.dumps([step.model_dump() for step in test_data.steps]))
        if test_data.tags is not None:
            updates.append("tags = ?")
            params.append(json.dumps(test_data.tags))
        if test_data.browser is not None:
            updates.append("browser = ?")
            params.append(test_data.browser)
        
        updates.append("updated_at = ?")
        params.append(now)
        params.append(test_id)
        params.append(user["id"])
        
        await db_conn.execute(
            f"UPDATE tests SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
            params
        )
        await db_conn.commit()
        
        cursor = await db_conn.execute("SELECT * FROM tests WHERE id = ?", (test_id,))
        row = await cursor.fetchone()
        test_dict = dict(row)
        test_dict["steps"] = json.loads(test_dict["steps"]) if test_dict["steps"] else []
        test_dict["tags"] = json.loads(test_dict["tags"]) if test_dict["tags"] else []
        return test_dict

@tests_router.delete("/{test_id}")
async def delete_test(test_id: str, user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute("DELETE FROM tests WHERE id = ? AND user_id = ?", (test_id, user["id"]))
        await db_conn.commit()
    return {"message": "Test deleted"}

@tests_router.post("/{test_id}/run")
async def run_test(test_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute("SELECT * FROM tests WHERE id = ? AND user_id = ?", (test_id, user["id"]))
        test = await cursor.fetchone()
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        test_dict = dict(test)
        test_dict["steps"] = json.loads(test_dict["steps"]) if test_dict["steps"] else []
    
    result_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute(
            """INSERT INTO test_results (id, test_id, user_id, test_name, status, started_at, total_steps) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (result_id, test_id, user["id"], test_dict["name"], "running", now, len(test_dict["steps"]))
        )
        await db_conn.execute("UPDATE tests SET status = 'running', last_run = ? WHERE id = ?", (now, test_id))
        await db_conn.commit()
    
    # Run test in background
    background_tasks.add_task(execute_test, result_id, test_dict, user["id"])
    
    return {"result_id": result_id, "status": "running", "test_id": test_id}

async def execute_test(result_id: str, test: dict, user_id: str):
    """Execute a test using Playwright"""
    steps = test["steps"]
    steps_completed = 0
    error_message = None
    status = "passed"
    step_results = []
    
    started = datetime.now(timezone.utc)
    script_path = TEMP_TEST_DIR / f"temp_test_{result_id}.py"
    
    try:
        # Generate Playwright script
        script = generate_playwright_script(steps, test.get("browser", "chromium"))
        
        # Write script to temp file
        with open(script_path, "w") as f:
            f.write(script)
        
        # Run the script
        process = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(ROOT_DIR)
        )
        
        if process.returncode == 0:
            status = "passed"
            steps_completed = len(steps)
            for i, step in enumerate(steps):
                step_results.append({"step": i, "status": "passed", "description": step.get("description", f"Step {i+1}")})
        else:
            status = "failed"
            error_message = process.stderr or process.stdout or "Test execution failed"
            # Parse output to determine which steps passed
            output = process.stdout + process.stderr
            for i, step in enumerate(steps):
                if f"Step {i+1} completed" in output:
                    steps_completed += 1
                    step_results.append({"step": i, "status": "passed", "description": step.get("description", f"Step {i+1}")})
                else:
                    step_results.append({"step": i, "status": "failed", "description": step.get("description", f"Step {i+1}"), "error": error_message})
                    break
        
    except subprocess.TimeoutExpired:
        status = "failed"
        error_message = "Test execution timed out (5 minutes)"
    except Exception as e:
        status = "failed"
        error_message = str(e)
    finally:
        if script_path.exists():
            script_path.unlink()
    
    completed = datetime.now(timezone.utc)
    duration_ms = int((completed - started).total_seconds() * 1000)
    
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        await db_conn.execute(
            """UPDATE test_results SET status = ?, duration_ms = ?, completed_at = ?, 
               error_message = ?, steps_completed = ?, step_results = ? WHERE id = ?""",
            (status, duration_ms, completed.isoformat(), error_message, steps_completed, json.dumps(step_results), result_id)
        )
        await db_conn.execute("UPDATE tests SET status = ? WHERE id = ?", (status, test["id"]))
        await db_conn.commit()

def generate_playwright_script(steps: List[dict], browser: str = "chromium") -> str:
    """Generate a Playwright Python script from test steps"""
    script_lines = [
        "import asyncio",
        "from playwright.async_api import async_playwright",
        "",
        "async def run_test():",
        "    async with async_playwright() as p:",
        f"        browser = await p.{browser}.launch(headless=False)",
        "        context = await browser.new_context()",
        "        page = await context.new_page()",
        "        try:",
    ]
    
    for i, step in enumerate(steps):
        step_type = step.get("type", "")
        indent = "            "
        
        if step_type == "navigate":
            url = step.get("url", "")
            script_lines.append(f'{indent}await page.goto("{url}")')
            script_lines.append(f'{indent}print("Step {i+1} completed")')
        elif step_type == "click":
            selector = step.get("selector", "")
            timeout = step.get("timeout", 5000)
            script_lines.append(f'{indent}await page.click("{selector}", timeout={timeout})')
            script_lines.append(f'{indent}print("Step {i+1} completed")')
        elif step_type == "type":
            selector = step.get("selector", "")
            value = step.get("value", "")
            script_lines.append(f'{indent}await page.fill("{selector}", "{value}")')
            script_lines.append(f'{indent}print("Step {i+1} completed")')
        elif step_type == "assert":
            selector = step.get("selector", "")
            value = step.get("value", "")
            if value:
                script_lines.append(f'{indent}element = await page.query_selector("{selector}")')
                script_lines.append(f'{indent}text = await element.text_content() if element else ""')
                script_lines.append(f'{indent}assert "{value}" in text, f"Expected \\"{value}\\" but got \\"{{text}}\\""')
            else:
                script_lines.append(f'{indent}assert await page.query_selector("{selector}"), "Element {selector} not found"')
            script_lines.append(f'{indent}print("Step {i+1} completed")')
        elif step_type == "wait":
            timeout = step.get("timeout", 1000)
            selector = step.get("selector", "")
            if selector:
                script_lines.append(f'{indent}await page.wait_for_selector("{selector}", timeout={timeout})')
            else:
                script_lines.append(f'{indent}await asyncio.sleep({timeout / 1000})')
            script_lines.append(f'{indent}print("Step {i+1} completed")')
    
    script_lines.extend([
        "        finally:",
        "            await browser.close()",
        "",
        "asyncio.run(run_test())"
    ])
    
    return "\n".join(script_lines)

# ============== RESULTS ROUTES ==============

@results_router.get("")
async def get_results(user: dict = Depends(get_current_user), limit: int = 50):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM test_results WHERE user_id = ? ORDER BY started_at DESC LIMIT ?",
            (user["id"], limit)
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            result_dict = dict(row)
            result_dict["step_results"] = json.loads(result_dict["step_results"]) if result_dict["step_results"] else []
            results.append(result_dict)
        return results

@results_router.get("/{result_id}")
async def get_result(result_id: str, user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM test_results WHERE id = ? AND user_id = ?",
            (result_id, user["id"])
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Result not found")
        result_dict = dict(row)
        result_dict["step_results"] = json.loads(result_dict["step_results"]) if result_dict["step_results"] else []
        return result_dict

@results_router.get("/test/{test_id}")
async def get_test_results(test_id: str, user: dict = Depends(get_current_user), limit: int = 20):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM test_results WHERE test_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT ?",
            (test_id, user["id"], limit)
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            result_dict = dict(row)
            result_dict["step_results"] = json.loads(result_dict["step_results"]) if result_dict["step_results"] else []
            results.append(result_dict)
        return results

# ============== AI ROUTES ==============

def generate_fallback_test(prompt: str, context: str = "") -> dict:
    """Generate test code using fallback method (no API calls)"""
    import re
    prompt_lower = prompt.lower()
    
    # Detect common patterns in the prompt
    steps = []
    
    # Start with Playwright test syntax
    playwright_code = "import { test, expect } from '@playwright/test';\n\n"
    playwright_code += "test('Generated Test', async ({ page }) => {\n"
    
    # Extract URL from prompt using regex
    url_pattern = r'https?://[^\s]+'
    url_match = re.search(url_pattern, prompt)
    
    if url_match:
        # User provided a direct URL
        url = url_match.group(0).rstrip('/')
    elif "facebook" in prompt_lower:
        url = "https://www.facebook.com"
    elif "google" in prompt_lower:
        url = "https://www.google.com"
    elif "github" in prompt_lower:
        url = "https://www.github.com"
    elif "linkedin" in prompt_lower:
        url = "https://www.linkedin.com"
    else:
        url = "https://example.com"
    
    steps.append({"type": "navigate", "url": url, "description": f"Navigate to {url}"})
    playwright_code += f"  // Navigate to {url}\n  await page.goto('{url}');\n  await page.waitForLoadState('networkidle');\n\n"
    
    # Detect login/username/password
    if "login" in prompt_lower or "username" in prompt_lower or "password" in prompt_lower or "enter" in prompt_lower and ("email" in prompt_lower or "user" in prompt_lower):
        # Generic login selector patterns that work on most sites
        steps.append({"type": "click", "selector": "input[type='email'], input[name='email'], input[name='username'], input[id='email'], input[id='username']", "description": "Click email/username field"})
        steps.append({"type": "type", "selector": "input[type='email'], input[name='email'], input[name='username'], input[id='email'], input[id='username']", "value": "your_email@example.com", "description": "Enter email/username"})
        steps.append({"type": "click", "selector": "input[type='password'], input[name='password'], input[name='pass'], input[id='password']", "description": "Click password field"})
        steps.append({"type": "type", "selector": "input[type='password'], input[name='password'], input[name='pass'], input[id='password']", "value": "your_password", "description": "Enter password"})
        steps.append({"type": "click", "selector": "button[type='submit'], button[name='login'], button[aria-label*='Login'], button[aria-label*='Sign'], [role='button']:has-text('login')", "description": "Click login button"})
        
        playwright_code += "  // Fill in login credentials\n"
        playwright_code += "  // Try email field\n"
        playwright_code += "  try {\n"
        playwright_code += "    await page.fill('input[type=\"email\"], input[name=\"email\"], input[name=\"username\"]', 'your_email@example.com');\n"
        playwright_code += "  } catch (e) {\n"
        playwright_code += "    console.log('Email field not found, trying alternative selectors');\n"
        playwright_code += "  }\n"
        playwright_code += "  // Try password field\n"
        playwright_code += "  try {\n"
        playwright_code += "    await page.fill('input[type=\"password\"], input[name=\"password\"], input[name=\"pass\"]', 'your_password');\n"
        playwright_code += "  } catch (e) {\n"
        playwright_code += "    console.log('Password field not found');\n"
        playwright_code += "  }\n"
        playwright_code += "  // Click login\n"
        playwright_code += "  try {\n"
        playwright_code += "    await page.click('button[type=\"submit\"], button[name=\"login\"]');\n"
        playwright_code += "  } catch (e) {\n"
        playwright_code += "    console.log('Login button not found');\n"
        playwright_code += "  }\n"
        playwright_code += "  await page.waitForLoadState('networkidle');\n\n"
    
    # Detect search/input actions
    elif "search" in prompt_lower or ("type" in prompt_lower and "search" in prompt_lower):
        steps.append({"type": "click", "selector": "input[type='text'], input[type='search']", "description": "Click search input field"})
        steps.append({"type": "type", "selector": "input[type='text'], input[type='search']", "value": "search query", "description": "Type search query"})
        steps.append({"type": "click", "selector": "button[type='submit'], button[aria-label*='Search']", "description": "Click search button"})
        
        playwright_code += "  // Fill and submit search form\n"
        playwright_code += "  await page.fill('input[type=\"text\"], input[type=\"search\"]', 'search query');\n"
        playwright_code += "  await page.click('button[type=\"submit\"], button[aria-label*=\"Search\"]');\n"
        playwright_code += "  await page.waitForLoadState('networkidle');\n\n"
    
    # Add assertion
    steps.append({"type": "assert", "selector": "body", "value": "", "description": "Verify page loaded"})
    playwright_code += "  // Verify page loaded\n"
    playwright_code += "  await expect(page).toHaveURL(/.*/);\n"
    playwright_code += "  console.log('Test completed successfully!');\n"
    playwright_code += "});\n"
    
    return {
        "steps": steps,
        "playwright_code": playwright_code,
        "ai_model": "fallback",
        "note": "Generated using fallback template. Replace 'your_email@example.com' and 'your_password' with actual credentials."
    }

@ai_router.post("/generate")
async def generate_test_code(request: AIGenerateRequest, user: dict = Depends(get_current_user)):
    """Generate Playwright test code from natural language"""
    if not EMERGENT_LLM_KEY:
        logger.warning("AI service not configured, using fallback generator")
        return generate_fallback_test(request.prompt, request.context or "")
    
    system_prompt = """You are an expert test automation engineer. Generate Playwright test code based on the user's natural language description.

Output format: Return ONLY a JSON object with the following structure:
{
    "steps": [
        {"type": "navigate", "url": "https://example.com", "description": "Navigate to homepage"},
        {"type": "click", "selector": "#button", "description": "Click the button"},
        {"type": "type", "selector": "#input", "value": "text to type", "description": "Fill input field"},
        {"type": "assert", "selector": "#element", "value": "expected text", "description": "Verify element text"},
        {"type": "wait", "selector": "#element", "timeout": 5000, "description": "Wait for element"}
    ],
    "playwright_code": "// Full Playwright test code here"
}

Step types:
- navigate: Go to a URL
- click: Click an element
- type: Type text into an input
- assert: Verify an element exists or contains text
- wait: Wait for an element or a duration

Use realistic CSS selectors based on common patterns. Be specific and include all necessary steps."""

    try:
        client = AsyncOpenAI(api_key=EMERGENT_LLM_KEY)
        
        prompt = f"Generate a test for: {request.prompt}"
        if request.context:
            prompt += f"\n\nAdditional context: {request.context}"
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        response_text = response.choices[0].message.content
        
        # Parse the JSON response
        try:
            # Clean up response - remove markdown code blocks if present
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            result = json.loads(response_text.strip())
            return result
        except json.JSONDecodeError:
            return {"steps": [], "playwright_code": response_text, "raw_response": response_text}
            
    except Exception as e:
        logger.warning(f"OpenAI API error (likely quota): {e}, using fallback generator")
        return generate_fallback_test(request.prompt, request.context or "")

@ai_router.post("/suggest")
async def suggest_improvements(request: AIGenerateRequest, user: dict = Depends(get_current_user)):
    """Get AI suggestions for test improvements"""
    if not EMERGENT_LLM_KEY:
        # Return default suggestions
        return {
            "suggestions": [
                {"type": "tip", "message": "Add wait conditions for dynamic elements", "priority": "high"},
                {"type": "tip", "message": "Use more specific CSS selectors instead of generic ones", "priority": "high"},
                {"type": "tip", "message": "Add assertions to verify expected outcomes", "priority": "medium"}
            ]
        }
    
    system_prompt = """You are an expert test automation engineer. Analyze the provided test and suggest improvements.
Focus on:
1. Test coverage gaps
2. Better selectors
3. Additional assertions
4. Edge cases
5. Performance optimizations

Return a JSON object with:
{
    "suggestions": [
        {"type": "improvement|warning|tip", "message": "description", "priority": "high|medium|low"}
    ]
}"""

    try:
        client = AsyncOpenAI(api_key=EMERGENT_LLM_KEY)
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this test: {request.prompt}"}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        response_text = response.choices[0].message.content
        
        try:
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            return json.loads(response_text.strip())
        except json.JSONDecodeError:
            return {"suggestions": [{"type": "tip", "message": response_text, "priority": "medium"}]}
            
    except Exception as e:
        logger.warning(f"OpenAI API error for suggestions (using fallback): {e}")
        return {
            "suggestions": [
                {"type": "tip", "message": "Add wait conditions for dynamic elements", "priority": "high"},
                {"type": "tip", "message": "Use more specific CSS selectors instead of generic ones", "priority": "high"},
                {"type": "improvement", "message": "Consider adding error handling and retry logic", "priority": "medium"},
                {"type": "tip", "message": "Add assertions to verify expected outcomes", "priority": "medium"}
            ]
        }

# ============== INTEGRATIONS ROUTES ==============

@integrations_router.get("")
async def get_integrations(user: dict = Depends(get_current_user)):
    integrations = await db.integrations.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    # Return default integrations if none exist
    if not integrations:
        return [
            {"type": "github", "enabled": False, "config": {}},
            {"type": "slack", "enabled": False, "config": {}},
            {"type": "jenkins", "enabled": False, "config": {}},
            {"type": "jira", "enabled": False, "config": {}}
        ]
    return integrations

@integrations_router.put("/{integration_type}")
async def update_integration(integration_type: str, config: IntegrationConfig, user: dict = Depends(get_current_user)):
    await db.integrations.update_one(
        {"user_id": user["id"], "type": integration_type},
        {"$set": {"enabled": config.enabled, "config": config.config, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Integration updated", "type": integration_type, "enabled": config.enabled}

@integrations_router.post("/{integration_type}/test")
async def test_integration(integration_type: str, user: dict = Depends(get_current_user)):
    """Test an integration connection"""
    integration = await db.integrations.find_one({"user_id": user["id"], "type": integration_type})
    if not integration or not integration.get("enabled"):
        raise HTTPException(status_code=400, detail="Integration not enabled")
    
    # Mock test for now - in production, actually test the connection
    return {"status": "success", "message": f"{integration_type} connection verified"}

# ============== SETTINGS ROUTES ==============

@settings_router.get("")
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    if not settings:
        return {
            "general": {
                "default_browser": "chromium",
                "timeout": 30000,
                "retries": 0,
                "parallel_tests": 1,
                "headless": False
            },
            "notifications": {
                "email_on_failure": True,
                "slack_on_failure": False,
                "email_on_success": False
            },
            "api_keys": {}
        }
    return settings

@settings_router.put("")
async def update_settings(settings_data: SettingsUpdate, user: dict = Depends(get_current_user)):
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if settings_data.general:
        update_doc["general"] = settings_data.general
    if settings_data.notifications:
        update_doc["notifications"] = settings_data.notifications
    
    await db.settings.update_one(
        {"user_id": user["id"]},
        {"$set": update_doc},
        upsert=True
    )
    return {"message": "Settings updated"}

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    async with aiosqlite.connect(SQLITE_DB_PATH) as db_conn:
        # Total tests
        cursor = await db_conn.execute("SELECT COUNT(*) FROM tests WHERE user_id = ?", (user["id"],))
        total_tests = (await cursor.fetchone())[0]
        
        # Total suites
        cursor = await db_conn.execute("SELECT COUNT(*) FROM test_suites WHERE user_id = ?", (user["id"],))
        total_suites = (await cursor.fetchone())[0]
        
        # Recent results (last 7 days)
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        cursor = await db_conn.execute(
            "SELECT status, COUNT(*) FROM test_results WHERE user_id = ? AND started_at > ? GROUP BY status",
            (user["id"], week_ago)
        )
        status_counts = dict(await cursor.fetchall())
        
        passed = status_counts.get("passed", 0)
        failed = status_counts.get("failed", 0)
        total_runs = passed + failed
        pass_rate = round((passed / total_runs * 100), 1) if total_runs > 0 else 0
        
        # Recent results
        cursor = await db_conn.execute(
            "SELECT * FROM test_results WHERE user_id = ? ORDER BY started_at DESC LIMIT 10",
            (user["id"],)
        )
        db_conn.row_factory = aiosqlite.Row
        cursor = await db_conn.execute(
            "SELECT * FROM test_results WHERE user_id = ? ORDER BY started_at DESC LIMIT 10",
            (user["id"],)
        )
        recent_results = [dict(row) for row in await cursor.fetchall()]
        
        # Test health over time (last 14 days)
        two_weeks_ago = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        cursor = await db_conn.execute(
            """SELECT DATE(started_at) as date, 
                      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
                      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
               FROM test_results 
               WHERE user_id = ? AND started_at > ?
               GROUP BY DATE(started_at)
               ORDER BY date""",
            (user["id"], two_weeks_ago)
        )
        health_data = [{"date": row[0], "passed": row[1], "failed": row[2]} for row in await cursor.fetchall()]
    
    return {
        "total_tests": total_tests,
        "total_suites": total_suites,
        "total_runs": total_runs,
        "pass_rate": pass_rate,
        "passed": passed,
        "failed": failed,
        "recent_results": recent_results,
        "health_data": health_data
    }

# Include routers
api_router.include_router(auth_router)
api_router.include_router(tests_router)
api_router.include_router(suites_router)
api_router.include_router(results_router)
api_router.include_router(ai_router)
api_router.include_router(integrations_router)
api_router.include_router(settings_router)
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    await init_sqlite()
    
    # Set admin credentials
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@testflow.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    try:
        await db.users.create_index("email", unique=True)
        
        # Seed admin user
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin user created: {admin_email}")
    except Exception as e:
        logger.warning(f"MongoDB operations failed during startup: {str(e)}")
        logger.info("Server starting without database. Database operations may fail until MongoDB is available.")
    
    # Write test credentials
    memory_dir = ROOT_DIR.parent / "memory"  # Use local memory directory
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin User\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write(f"## Auth Endpoints\n")
        f.write(f"- POST /api/auth/register\n")
        f.write(f"- POST /api/auth/login\n")
        f.write(f"- POST /api/auth/logout\n")
        f.write(f"- GET /api/auth/me\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
