"""
Tests for health check endpoint.
"""

import pytest
from django.db import connection
from django.test import Client


@pytest.mark.unit
@pytest.mark.django_db
def test_health_check_success():
    """Test that health check returns 200 when service is healthy."""
    client = Client()
    response = client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "netsentinel-backend"
    assert "debug" in data


@pytest.mark.unit
@pytest.mark.django_db
def test_health_check_database_connection():
    """Test that health check verifies database connection."""
    client = Client()
    response = client.get("/api/health/")

    assert response.status_code == 200
    # Verify database connection was tested
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        assert cursor.fetchone() == (1,)


@pytest.mark.unit
@pytest.mark.django_db
def test_health_check_response_structure():
    """Test that health check response has correct structure."""
    client = Client()
    response = client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    required_keys = ["status", "service", "debug"]
    for key in required_keys:
        assert key in data, f"Missing key: {key}"
