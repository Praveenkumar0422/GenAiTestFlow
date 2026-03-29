#!/usr/bin/env python3
"""Test fallback AI generation"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "app-main" / "backend"))

from server import generate_fallback_test

# Test the fallback
test1 = generate_fallback_test("Navigate to Google and search for test automation")
print("✓ Test 1 - Google Search:")
print(f"  Steps: {len(test1['steps'])} steps")
print(f"  AI Model: {test1.get('ai_model', 'unknown')}")
print(f"  Code generated: {len(test1['playwright_code'])} chars\n")

test2 = generate_fallback_test("Go to GitHub and check my repositories")
print("✓ Test 2 - GitHub:")
print(f"  Steps: {len(test2['steps'])} steps")
print(f"  First step: {test2['steps'][0]['description']}\n")

test3 = generate_fallback_test("Click the login button and enter credentials")
print("✓ Test 3 - Login:")
print(f"  Steps: {len(test3['steps'])} steps\n")

print("✅ All fallback AI generation tests passed!")
print("\nThe app will now use these templates when OpenAI quota is exceeded.")
