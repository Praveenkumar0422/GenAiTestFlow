#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "app-main" / "backend"))

from dotenv import load_dotenv
import os

# Load .env
env_path = Path(__file__).parent / "app-main" / ".env"
load_dotenv(env_path)

# Check key
key = os.environ.get("EMERGENT_LLM_KEY", "")
print(f"✓ EMERGENT_LLM_KEY loaded: {key[:20]}..." if key else "✗ EMERGENT_LLM_KEY NOT FOUND")

# Test import
try:
    from openai import AsyncOpenAI
    print("✓ AsyncOpenAI imported successfully")
except Exception as e:
    print(f"✗ Failed to import AsyncOpenAI: {e}")
    sys.exit(1)

# Test API call
async def test_api():
    try:
        client = AsyncOpenAI(api_key=key)
        print("✓ OpenAI client created")
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'AI is working!' in JSON format"}
            ],
            max_tokens=100
        )
        
        result = response.choices[0].message.content
        print(f"✓ API Response: {result}")
        return True
        
    except Exception as e:
        print(f"✗ API Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_api())
    sys.exit(0 if success else 1)
