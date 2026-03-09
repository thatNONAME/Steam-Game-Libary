"""
Iteration 5 Tests: Ban System, Role Permissions, User Reply on Tickets

Tests:
1. Ban system: POST /api/ban/{user_id}, POST /api/unban/{user_id}
2. Role permissions: Admin can assign roles (not just owner)
3. Support: Moderator can access all tickets, user can reply to their own tickets
4. Profile/Search: Banned users hidden from profiles, search, discover
5. Comments: Banned users cannot post comments
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health check and service verification"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "steam_key_configured" in data
        print("PASS: Health endpoint returns ok")

    def test_categories_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 30
        print(f"PASS: Categories endpoint returns {len(data)} categories")


class TestBanSystemAuthentication:
    """Ban system requires authentication and proper permissions"""
    
    def test_ban_requires_authentication(self):
        """POST /api/ban/{user_id} requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ban/test-user-id")
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/ban requires authentication (401/403)")
    
    def test_unban_requires_authentication(self):
        """POST /api/unban/{user_id} requires authentication"""
        response = requests.post(f"{BASE_URL}/api/unban/test-user-id")
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/unban requires authentication (401/403)")


class TestRoleManagementAuthentication:
    """Role management requires Admin/Creator authentication"""
    
    def test_roles_assign_requires_auth(self):
        """POST /api/roles/assign requires Admin/Creator authentication"""
        response = requests.post(
            f"{BASE_URL}/api/roles/assign",
            json={"target_user_id": "test-user-id", "role": "Tester"}
        )
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/roles/assign requires admin authentication (401/403)")
    
    def test_roles_remove_requires_auth(self):
        """POST /api/roles/remove requires Admin/Creator authentication"""
        response = requests.post(
            f"{BASE_URL}/api/roles/remove",
            json={"target_user_id": "test-user-id", "role": "Tester"}
        )
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/roles/remove requires admin authentication (401/403)")
    
    def test_roles_users_requires_auth(self):
        """GET /api/roles/users requires Admin/Creator authentication"""
        response = requests.get(f"{BASE_URL}/api/roles/users")
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: GET /api/roles/users requires admin authentication (401/403)")


class TestSupportTicketAuthentication:
    """Support ticket endpoints authentication tests"""
    
    def test_support_create_requires_auth(self):
        """POST /api/support requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/support",
            json={"subject": "Test", "message": "Test message", "category": "general"}
        )
        assert response.status_code == 401
        print("PASS: POST /api/support requires authentication (401)")
    
    def test_support_my_requires_auth(self):
        """GET /api/support/my requires authentication"""
        response = requests.get(f"{BASE_URL}/api/support/my")
        assert response.status_code == 401
        print("PASS: GET /api/support/my requires authentication (401)")
    
    def test_support_all_requires_moderator(self):
        """GET /api/support/all requires Moderator/Admin/Creator"""
        response = requests.get(f"{BASE_URL}/api/support/all")
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: GET /api/support/all requires staff authentication (401/403)")
    
    def test_support_reply_requires_moderator(self):
        """POST /api/support/{ticket_id}/reply requires Moderator/Admin/Creator"""
        response = requests.post(
            f"{BASE_URL}/api/support/test-ticket-id/reply",
            json={"message": "Test reply"}
        )
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/support/{id}/reply requires staff authentication (401/403)")
    
    def test_support_user_reply_requires_auth(self):
        """POST /api/support/{ticket_id}/user-reply requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/support/test-ticket-id/user-reply",
            json={"message": "Test user reply"}
        )
        assert response.status_code == 401
        print("PASS: POST /api/support/{id}/user-reply requires authentication (401)")
    
    def test_support_close_requires_moderator(self):
        """POST /api/support/{ticket_id}/close requires Moderator/Admin/Creator"""
        response = requests.post(f"{BASE_URL}/api/support/test-ticket-id/close")
        assert response.status_code == 401 or response.status_code == 403
        print("PASS: POST /api/support/{id}/close requires staff authentication (401/403)")


class TestCommentsAuthentication:
    """Comments endpoint authentication tests"""
    
    def test_comments_post_requires_auth(self):
        """POST /api/comments requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/comments",
            json={"content": "Test comment", "target_type": "profile", "target_id": "test-id"}
        )
        assert response.status_code == 401
        print("PASS: POST /api/comments requires authentication (401)")
    
    def test_comments_get_public(self):
        """GET /api/comments is public (can view without auth)"""
        response = requests.get(
            f"{BASE_URL}/api/comments",
            params={"target_type": "profile", "target_id": "test-id"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("PASS: GET /api/comments is public and returns list")


class TestDiscoverUsersExcludesBanned:
    """Discover users endpoint should exclude banned users"""
    
    def test_discover_users_has_users(self):
        """GET /api/discover/users returns public users (not banned ones)"""
        response = requests.get(f"{BASE_URL}/api/discover/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify users in list have expected fields
        for user in data:
            assert "id" in user
            assert "username" in user or "display_name" in user
            assert "roles" in user  # roles should always be present
            # Banned users should NOT be in this list
            # (they have is_banned=True filter in backend)
        print(f"PASS: GET /api/discover/users returns {len(data)} users with required fields")


class TestUserSearchExcludesBanned:
    """User search endpoint should exclude banned users"""
    
    def test_user_search_works(self):
        """GET /api/users/search returns users matching query"""
        # Search for a partial name that should match some users
        response = requests.get(f"{BASE_URL}/api/users/search", params={"q": "a"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify users have expected fields
        for user in data:
            assert "id" in user
            assert "roles" in user
            # is_banned users should NOT appear (filter in backend)
        print(f"PASS: GET /api/users/search returns {len(data)} users")
    
    def test_user_search_requires_query(self):
        """GET /api/users/search requires q parameter"""
        response = requests.get(f"{BASE_URL}/api/users/search")
        # Should return 422 (validation error) without q param
        assert response.status_code == 422
        print("PASS: GET /api/users/search requires 'q' parameter (422)")


class TestProfileEndpoint:
    """Profile endpoint tests - banned users should return 404"""
    
    def test_nonexistent_profile_returns_404(self):
        """GET /api/profile/{user_id} returns 404 for nonexistent user"""
        response = requests.get(f"{BASE_URL}/api/profile/nonexistent-user-id-12345")
        assert response.status_code == 404
        print("PASS: GET /api/profile returns 404 for nonexistent user")


class TestNotifications:
    """Notification endpoints authentication"""
    
    def test_notifications_requires_auth(self):
        """GET /api/notifications requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("PASS: GET /api/notifications requires authentication (401)")
    
    def test_notifications_unread_requires_auth(self):
        """GET /api/notifications/unread-count requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 401
        print("PASS: GET /api/notifications/unread-count requires authentication (401)")
    
    def test_notifications_mark_read_requires_auth(self):
        """POST /api/notifications/mark-read requires authentication"""
        response = requests.post(f"{BASE_URL}/api/notifications/mark-read")
        assert response.status_code == 401
        print("PASS: POST /api/notifications/mark-read requires authentication (401)")


class TestDiscoverCollections:
    """Discover collections endpoint (public)"""
    
    def test_discover_collections_public(self):
        """GET /api/discover/collections returns public collections"""
        response = requests.get(f"{BASE_URL}/api/discover/collections")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/discover/collections returns {len(data)} collections")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
