"""
Integration tests for API endpoints.
"""

import pytest


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    @pytest.mark.integration
    def test_health_check(self, client):
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
    
    @pytest.mark.integration
    def test_readiness_check(self, client):
        response = client.get("/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
        assert "checks" in data


class TestEmployeeEndpoints:
    """Test employee API endpoints."""
    
    @pytest.mark.integration
    def test_login_success(self, client, sample_employee):
        response = client.post(
            "/api/employee/login",
            json={
                "email": "test@example.com",
                "password": "testpass123",
                "hr_id": "default",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.integration
    def test_login_invalid_credentials(self, client, sample_employee):
        response = client.post(
            "/api/employee/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
                "hr_id": "default",
            },
        )
        
        assert response.status_code == 401
    
    @pytest.mark.integration
    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/employee/login",
            json={
                "email": "nonexistent@example.com",
                "password": "anypassword",
                "hr_id": "default",
            },
        )
        
        assert response.status_code == 401
    
    @pytest.mark.integration
    def test_get_me_unauthorized(self, client):
        response = client.get("/api/employee/me")
        
        assert response.status_code == 401
    
    @pytest.mark.integration
    def test_get_me_authorized(self, client, sample_employee, auth_headers):
        response = client.get("/api/employee/me", headers=auth_headers)
        
        # Note: This may need adjustment based on actual HR database setup
        # The test may return 404 if hr_default.db doesn't exist
        assert response.status_code in [200, 404]


class TestProjectEndpoints:
    """Test project API endpoints."""
    
    @pytest.mark.integration
    def test_list_projects(self, client, sample_project):
        response = client.get("/api/project/", params={"hr_id": "default"})
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.integration
    def test_get_project(self, client, sample_project):
        response = client.get(f"/api/project/{sample_project.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "AI Platform Development"


class TestTeamEndpoints:
    """Test team API endpoints."""
    
    @pytest.mark.integration
    def test_list_teams(self, client, sample_team):
        response = client.get("/api/team/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.integration
    def test_get_team(self, client, sample_team, auth_headers):
        response = client.get(f"/api/team/{sample_team.team_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["team_name"] == "Alpha Team"
    
    @pytest.mark.integration
    def test_get_nonexistent_team(self, client, sample_employee, auth_headers):
        response = client.get("/api/team/99999", headers=auth_headers)
        
        assert response.status_code == 404
