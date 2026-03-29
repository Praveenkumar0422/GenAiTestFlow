#!/usr/bin/env python3
"""Reset admin user password"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "app-main" / "backend"))

from dotenv import load_dotenv
import os
import bcrypt

# Load .env
env_path = Path(__file__).parent / "app-main" / ".env"
load_dotenv(env_path)

from motor.motor_asyncio import AsyncIOMotorClient

async def reset_admin():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@testflow.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Hash the password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(admin_password.encode("utf-8"), salt).decode("utf-8")
    
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print(f"Hash: {password_hash[:30]}...")
    
    # Delete existing admin user
    result = await db.users.delete_one({"email": admin_email})
    print(f"Deleted existing admin user: {result.deleted_count}")
    
    # Insert new admin user
    result = await db.users.insert_one({
        "email": admin_email,
        "password_hash": password_hash,
        "name": "Admin",
        "role": "admin",
        "created_at": "2026-03-30T00:00:00+00:00"
    })
    print(f"✅ Admin user reset successfully!")
    print(f"User ID: {result.inserted_id}")
    
    # Verify
    user = await db.users.find_one({"email": admin_email})
    if user:
        print(f"✅ User verified in database")
        # Test password verification
        is_valid = bcrypt.checkpw(admin_password.encode("utf-8"), user["password_hash"].encode("utf-8"))
        print(f"✅ Password verification: {'PASS' if is_valid else 'FAIL'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())
