"""
Iteration 6 Backend API Tests - Steam Game Library App
Tests for: Rules, Discover Trending, Moderation Log, Appeals, Collection Pictures, Profile steam_id fallback
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://collection-curator-1.preview.emergentagent.com"


class TestRulesEndpoint:
    """Test /api/rules endpoint"""
    
    def test_get_rules_returns_10_rules(self):
        """GET /api/rules should return exactly 10 community guidelines"""
        response = requests.get(f"{BASE_URL}/api/rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "rules" in data, "Response should contain 'rules' key"
        rules = data["rules"]
        assert len(rules) == 10, f"Expected 10 rules, got {len(rules)}"
        
        # Validate each rule has required fields
        for i, rule in enumerate(rules):
            assert "title" in rule, f"Rule {i} missing 'title'"
            assert "description" in rule, f"Rule {i} missing 'description'"
            assert len(rule["title"]) > 0, f"Rule {i} has empty title"
            assert len(rule["description"]) > 0, f"Rule {i} has empty description"
        
        # Check specific rule titles
        titles = [r["title"] for r in rules]
        expected_titles = [
            "Respect Other Users", "No NSFW Content", "No Spam", "No Impersonation",
            "Keep It Legal", "Honest Collections", "Profile Guidelines", "Report Issues",
            "Ban Appeals", "Staff Decisions Are Final"
        ]
        for expected in expected_titles:
            assert expected in titles, f"Missing rule: {expected}"


class TestDiscoverTrending:
    """Test /api/discover/trending endpoint"""
    
    def test_discover_trending_returns_array(self):
        """GET /api/discover/trending should return array of trending games"""
        response = requests.get(f"{BASE_URL}/api/discover/trending", timeout=20)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least one trending game"
        
    def test_trending_game_structure(self):
        """Each trending game should have app_id, name, header_image"""
        response = requests.get(f"{BASE_URL}/api/discover/trending", timeout=20)
        assert response.status_code == 200
        data = response.json()
        
        # Check first game has required fields
        if len(data) > 0:
            game = data[0]
            assert "app_id" in game, "Game should have 'app_id'"
            assert "name" in game, "Game should have 'name'"
            assert "header_image" in game, "Game should have 'header_image'"
            assert isinstance(game["app_id"], int), "app_id should be integer"
            assert len(game["name"]) > 0, "name should not be empty"


class TestModerationLog:
    """Test /api/modlog endpoint"""
    
    def test_modlog_requires_auth(self):
        """GET /api/modlog should require authentication"""
        response = requests.get(f"{BASE_URL}/api/modlog")
        assert response.status_code == 403, f"Expected 403 for unauthenticated request, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert "Staff" in data["error"] or "access" in data["error"]
    
    def test_modlog_requires_staff_with_invalid_token(self):
        """GET /api/modlog should return 403 for non-staff users"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get(f"{BASE_URL}/api/modlog", headers=headers)
        assert response.status_code == 403, f"Expected 403 with invalid token, got {response.status_code}"


class TestAppealsEndpoint:
    """Test /api/appeals endpoints"""
    
    def test_appeals_create_requires_auth(self):
        """POST /api/appeals should require authentication"""
        response = requests.post(f"{BASE_URL}/api/appeals", json={"reason": "Test appeal"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert "authenticated" in data["error"].lower()
    
    def test_appeals_my_requires_auth(self):
        """GET /api/appeals/my should require authentication"""
        response = requests.get(f"{BASE_URL}/api/appeals/my")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_appeals_all_requires_staff(self):
        """GET /api/appeals/all should require staff authentication"""
        response = requests.get(f"{BASE_URL}/api/appeals/all")
        assert response.status_code == 403, f"Expected 403 for non-staff, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert "Staff" in data["error"]
    
    def test_appeals_review_requires_staff(self):
        """POST /api/appeals/{id}/review should require staff authentication"""
        response = requests.post(f"{BASE_URL}/api/appeals/fake-id/review?action=approve")
        assert response.status_code == 403, f"Expected 403 for non-staff, got {response.status_code}"


class TestCollectionPicture:
    """Test /api/collections/{id}/picture endpoint"""
    
    def test_collection_picture_requires_auth(self):
        """POST /api/collections/{id}/picture should require authentication"""
        response = requests.post(f"{BASE_URL}/api/collections/fake-id/picture")
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
    
    def test_collection_picture_validates_file_type(self):
        """Upload should validate file types (JPEG, PNG, WebP)"""
        # Without proper auth, we can only verify endpoint exists
        # The actual upload test would require authenticated session
        response = requests.post(
            f"{BASE_URL}/api/collections/fake-id/picture",
            headers={"Authorization": "Bearer invalid-token"},
            files={"file": ("test.txt", b"test content", "text/plain")}
        )
        # Should return auth error before file validation
        assert response.status_code in [401, 403, 400], f"Expected auth or validation error, got {response.status_code}"


class TestProfileSteamIdFallback:
    """Test /api/profile/{user_id} with steam_id fallback"""
    
    def test_profile_by_nonexistent_user(self):
        """GET /api/profile/{user_id} should return 404 for nonexistent user"""
        response = requests.get(f"{BASE_URL}/api/profile/nonexistent-user-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert "not found" in data["error"].lower()
    
    def test_profile_endpoint_exists(self):
        """GET /api/profile/{user_id} endpoint should exist"""
        # Test with a valid format UUID that doesn't exist
        response = requests.get(f"{BASE_URL}/api/profile/00000000-0000-0000-0000-000000000000")
        # Should return 404 (not found) rather than 500 or other errors
        assert response.status_code == 404, f"Expected 404 for nonexistent profile, got {response.status_code}"


class TestGamesFromUrl:
    """Test /api/games/from-url endpoint for drag & drop support"""
    
    def test_games_from_url_requires_auth(self):
        """POST /api/games/from-url should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/games/from-url",
            json={"url": "https://store.steampowered.com/app/730"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestExistingEndpoints:
    """Verify existing endpoints still work"""
    
    def test_health_endpoint(self):
        """GET /api/health should return ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "steam_key_configured" in data
    
    def test_categories_endpoint(self):
        """GET /api/categories should return list of categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 30
    
    def test_discover_collections_public(self):
        """GET /api/discover/collections should be public"""
        response = requests.get(f"{BASE_URL}/api/discover/collections")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_discover_users_public(self):
        """GET /api/discover/users should be public"""
        response = requests.get(f"{BASE_URL}/api/discover/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
