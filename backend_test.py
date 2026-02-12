#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SteamLibraryAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, check_response=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            # Print response for debugging
            print(f"   Status: {response.status_code} (expected {expected_status})")
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                
                # Additional response checks
                if check_response and response.status_code == expected_status:
                    try:
                        response_data = response.json()
                        if not check_response(response_data):
                            success = False
                            self.tests_passed -= 1
                            print(f"❌ Response validation failed")
                            self.failed_tests.append(f"{name} - Response validation failed")
                    except json.JSONDecodeError:
                        print(f"⚠️  Warning: Could not decode JSON response")
                
                return success, response.json() if response.text and response.status_code != 204 else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text}")
                self.failed_tests.append(f"{name} - Status {response.status_code} (expected {expected_status})")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name} - Exception: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        def check_health(data):
            return data.get('status') == 'ok' and 'steam_key_configured' in data
            
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200,
            check_response=check_health
        )
        return success

    def test_categories_endpoint(self):
        """Test categories endpoint - should return 30 categories"""
        def check_categories(data):
            expected_categories = [
                "Action", "Adventure", "RPG", "Strategy", "Simulation",
                "Sports", "Racing", "Puzzle", "Horror", "Shooter",
                "Platformer", "Fighting", "Survival", "Open World", "Indie",
                "Multiplayer", "Co-op", "MMO", "Story Rich", "Sandbox",
                "Roguelike", "Tower Defense", "City Builder", "Card Game", "Visual Novel",
                "Battle Royale", "Stealth", "Rhythm", "Casual", "Arcade"
            ]
            return len(data) == 30 and all(cat in data for cat in expected_categories)
            
        success, response = self.run_test(
            "Get Categories (30 categories)",
            "GET",
            "categories",
            200,
            check_response=check_categories
        )
        return success

    def test_steam_search(self):
        """Test Steam search functionality"""
        def check_search_results(data):
            return 'items' in data and isinstance(data['items'], list)
            
        success, response = self.run_test(
            "Steam Search - Portal",
            "GET",
            "steam/search",
            200,
            params={"term": "portal"},
            check_response=check_search_results
        )
        return success

    def test_steam_app_details(self):
        """Test Steam app details for Portal 2 (app ID 620)"""
        def check_app_details(data):
            # Check if we get basic game details
            required_fields = ['name', 'steam_appid']
            return all(field in data for field in required_fields)
            
        success, response = self.run_test(
            "Steam App Details - Portal 2 (ID: 620)",
            "GET",
            "steam/app/620",
            200,
            check_response=check_app_details
        )
        return success

    def test_auth_endpoints_without_login(self):
        """Test authenticated endpoints without login - should return 401"""
        endpoints = [
            ("Get User Games", "GET", "games", 401, None),
            ("Add Game", "POST", "games", 401, {"app_id": 620, "name": "Portal 2"}),
            ("Get User Profile", "GET", "auth/me", 401, None),
            ("Sync Wishlist", "POST", "steam/sync-wishlist", 401, None)
        ]
        
        all_success = True
        for test_name, method, endpoint, expected_status, data in endpoints:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, data)
            if not success:
                all_success = False
        
        return all_success

    def test_user_search(self):
        """Test user search endpoint (public endpoint)"""
        def check_user_search(data):
            return isinstance(data, list)  # Should return an array (empty or with users)
            
        success, response = self.run_test(
            "User Search API",
            "GET", 
            "users/search",
            200,
            params={"q": "test"},
            check_response=check_user_search
        )
        return success

    def test_steam_login_redirect(self):
        """Test Steam login redirect"""
        self.tests_run += 1
        try:
            url = f"{self.api_url}/auth/steam/login"
            response = requests.get(url, allow_redirects=False, timeout=10)
            
            print(f"\n🔍 Testing Steam Login Redirect...")
            print(f"   URL: {url}")
            print(f"   Status: {response.status_code}")
            
            # Accept either 307 redirect or 302 redirect
            if response.status_code in [302, 307]:
                self.tests_passed += 1
                print("✅ Passed - Steam login redirect working")
                return True
            else:
                print(f"❌ Failed - Expected redirect (302/307), got {response.status_code}")
                self.failed_tests.append(f"Steam Login Redirect - Status {response.status_code} (expected 302/307)")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"Steam Login Redirect - Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Nebula Library Backend API Tests")
        print("=" * 50)
        
        # Test public endpoints
        self.test_health_endpoint()
        self.test_categories_endpoint()
        self.test_steam_search()
        self.test_steam_app_details()
        self.test_user_search()
        
        # Test authentication requirements
        self.test_auth_endpoints_without_login()
        
        # Test Steam login redirect
        self.test_steam_login_redirect()
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        else:
            print("\n✅ All tests passed!")
        
        print(f"\n🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SteamLibraryAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())