import requests
import sys
import json
from datetime import datetime

class TestFlowAPITester:
    def __init__(self, base_url="https://testflow-ui-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔐 Testing Authentication Flow...")
        
        # Test login with admin credentials
        login_data = {
            "email": "admin@testflow.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            if response.status_code == 200:
                self.log_test("Admin Login", True)
                
                # Test get current user
                me_response = self.session.get(f"{self.base_url}/api/auth/me")
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    if user_data.get("email") == "admin@testflow.com":
                        self.log_test("Get Current User", True)
                    else:
                        self.log_test("Get Current User", False, "Wrong user data returned")
                else:
                    self.log_test("Get Current User", False, f"Status: {me_response.status_code}")
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
            
        # Test logout
        try:
            logout_response = self.session.post(f"{self.base_url}/api/auth/logout")
            if logout_response.status_code == 200:
                self.log_test("Logout", True)
            else:
                self.log_test("Logout", False, f"Status: {logout_response.status_code}")
        except Exception as e:
            self.log_test("Logout", False, f"Exception: {str(e)}")
            
        # Re-login for subsequent tests
        self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing Dashboard Stats...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ['total_tests', 'total_suites', 'total_runs', 'pass_rate', 'recent_results']
                if all(field in stats for field in required_fields):
                    self.log_test("Dashboard Stats", True)
                else:
                    self.log_test("Dashboard Stats", False, "Missing required fields")
            else:
                self.log_test("Dashboard Stats", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Exception: {str(e)}")

    def test_test_suites_crud(self):
        """Test test suites CRUD operations"""
        print("\n📁 Testing Test Suites CRUD...")
        
        suite_id = None
        
        # Create test suite
        try:
            suite_data = {
                "name": "Test Suite API Test",
                "description": "Created by API test"
            }
            response = self.session.post(f"{self.base_url}/api/test-suites", json=suite_data)
            if response.status_code == 200:
                suite = response.json()
                suite_id = suite.get("id")
                self.log_test("Create Test Suite", True)
            else:
                self.log_test("Create Test Suite", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_test("Create Test Suite", False, f"Exception: {str(e)}")
            return
            
        # Get test suites
        try:
            response = self.session.get(f"{self.base_url}/api/test-suites")
            if response.status_code == 200:
                suites = response.json()
                if isinstance(suites, list):
                    self.log_test("Get Test Suites", True)
                else:
                    self.log_test("Get Test Suites", False, "Response not a list")
            else:
                self.log_test("Get Test Suites", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Test Suites", False, f"Exception: {str(e)}")
            
        # Delete test suite
        if suite_id:
            try:
                response = self.session.delete(f"{self.base_url}/api/test-suites/{suite_id}")
                if response.status_code == 200:
                    self.log_test("Delete Test Suite", True)
                else:
                    self.log_test("Delete Test Suite", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Delete Test Suite", False, f"Exception: {str(e)}")

    def test_tests_crud(self):
        """Test tests CRUD operations"""
        print("\n🧪 Testing Tests CRUD...")
        
        test_id = None
        
        # Create test
        try:
            test_data = {
                "name": "API Test Case",
                "description": "Created by API test",
                "steps": [
                    {
                        "type": "navigate",
                        "url": "https://example.com",
                        "description": "Navigate to example.com"
                    },
                    {
                        "type": "click",
                        "selector": "#button",
                        "description": "Click button"
                    }
                ],
                "tags": ["api-test"],
                "browser": "chromium"
            }
            response = self.session.post(f"{self.base_url}/api/tests", json=test_data)
            if response.status_code == 200:
                test = response.json()
                test_id = test.get("id")
                self.log_test("Create Test", True)
            else:
                self.log_test("Create Test", False, f"Status: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            self.log_test("Create Test", False, f"Exception: {str(e)}")
            return
            
        # Get tests
        try:
            response = self.session.get(f"{self.base_url}/api/tests")
            if response.status_code == 200:
                tests = response.json()
                if isinstance(tests, list):
                    self.log_test("Get Tests", True)
                else:
                    self.log_test("Get Tests", False, "Response not a list")
            else:
                self.log_test("Get Tests", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Tests", False, f"Exception: {str(e)}")
            
        # Get single test
        if test_id:
            try:
                response = self.session.get(f"{self.base_url}/api/tests/{test_id}")
                if response.status_code == 200:
                    test = response.json()
                    if test.get("name") == "API Test Case":
                        self.log_test("Get Single Test", True)
                    else:
                        self.log_test("Get Single Test", False, "Wrong test data")
                else:
                    self.log_test("Get Single Test", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Get Single Test", False, f"Exception: {str(e)}")
                
        # Update test
        if test_id:
            try:
                update_data = {
                    "name": "Updated API Test Case",
                    "description": "Updated by API test"
                }
                response = self.session.put(f"{self.base_url}/api/tests/{test_id}", json=update_data)
                if response.status_code == 200:
                    self.log_test("Update Test", True)
                else:
                    self.log_test("Update Test", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Update Test", False, f"Exception: {str(e)}")
                
        # Run test (this will create a result)
        if test_id:
            try:
                response = self.session.post(f"{self.base_url}/api/tests/{test_id}/run")
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "running":
                        self.log_test("Run Test", True)
                        # Store result_id for results testing
                        self.result_id = result.get("result_id")
                    else:
                        self.log_test("Run Test", False, "Wrong status returned")
                else:
                    self.log_test("Run Test", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Run Test", False, f"Exception: {str(e)}")
                
        # Delete test
        if test_id:
            try:
                response = self.session.delete(f"{self.base_url}/api/tests/{test_id}")
                if response.status_code == 200:
                    self.log_test("Delete Test", True)
                else:
                    self.log_test("Delete Test", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Delete Test", False, f"Exception: {str(e)}")

    def test_results_endpoints(self):
        """Test results endpoints"""
        print("\n📈 Testing Results...")
        
        # Get results
        try:
            response = self.session.get(f"{self.base_url}/api/results")
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    self.log_test("Get Results", True)
                else:
                    self.log_test("Get Results", False, "Response not a list")
            else:
                self.log_test("Get Results", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Results", False, f"Exception: {str(e)}")
            
        # Get single result if we have one
        if hasattr(self, 'result_id') and self.result_id:
            try:
                response = self.session.get(f"{self.base_url}/api/results/{self.result_id}")
                if response.status_code == 200:
                    self.log_test("Get Single Result", True)
                else:
                    self.log_test("Get Single Result", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Get Single Result", False, f"Exception: {str(e)}")

    def test_ai_generation(self):
        """Test AI generation endpoint"""
        print("\n🤖 Testing AI Generation...")
        
        try:
            ai_data = {
                "prompt": "Navigate to https://example.com and click the login button"
            }
            response = self.session.post(f"{self.base_url}/api/ai/generate", json=ai_data)
            if response.status_code == 200:
                result = response.json()
                if "steps" in result or "playwright_code" in result:
                    self.log_test("AI Generation", True)
                else:
                    self.log_test("AI Generation", False, "Missing expected fields in response")
            else:
                self.log_test("AI Generation", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("AI Generation", False, f"Exception: {str(e)}")

    def test_integrations(self):
        """Test integrations endpoints"""
        print("\n🔌 Testing Integrations...")
        
        # Get integrations
        try:
            response = self.session.get(f"{self.base_url}/api/integrations")
            if response.status_code == 200:
                integrations = response.json()
                if isinstance(integrations, list):
                    self.log_test("Get Integrations", True)
                else:
                    self.log_test("Get Integrations", False, "Response not a list")
            else:
                self.log_test("Get Integrations", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Integrations", False, f"Exception: {str(e)}")
            
        # Update integration
        try:
            integration_data = {
                "type": "github",
                "enabled": True,
                "config": {"token": "test-token", "repo": "test/repo"}
            }
            response = self.session.put(f"{self.base_url}/api/integrations/github", json=integration_data)
            if response.status_code == 200:
                self.log_test("Update Integration", True)
            else:
                self.log_test("Update Integration", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Update Integration", False, f"Exception: {str(e)}")

    def test_settings(self):
        """Test settings endpoints"""
        print("\n⚙️ Testing Settings...")
        
        # Get settings
        try:
            response = self.session.get(f"{self.base_url}/api/settings")
            if response.status_code == 200:
                settings = response.json()
                if "general" in settings and "notifications" in settings:
                    self.log_test("Get Settings", True)
                else:
                    self.log_test("Get Settings", False, "Missing expected fields")
            else:
                self.log_test("Get Settings", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Settings", False, f"Exception: {str(e)}")
            
        # Update settings
        try:
            settings_data = {
                "general": {
                    "default_browser": "firefox",
                    "timeout": 60000
                }
            }
            response = self.session.put(f"{self.base_url}/api/settings", json=settings_data)
            if response.status_code == 200:
                self.log_test("Update Settings", True)
            else:
                self.log_test("Update Settings", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Update Settings", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting TestFlow API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_flow():
            print("❌ Authentication failed, stopping tests")
            return False
            
        # Run all other tests
        self.test_dashboard_stats()
        self.test_test_suites_crud()
        self.test_tests_crud()
        self.test_results_endpoints()
        self.test_ai_generation()
        self.test_integrations()
        self.test_settings()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TestFlowAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())