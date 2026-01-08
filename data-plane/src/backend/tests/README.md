# Backend Testing Guide - NetSentinel Data Plane

This document outlines the comprehensive testing strategy for the NetSentinel data plane backend, including current test coverage and planned tests for maximum code coverage.

## Table of Contents

1. [Current Test Coverage](#current-test-coverage)
2. [Testing Strategy](#testing-strategy)
3. [Test Organization](#test-organization)
4. [Coverage Goals](#coverage-goals)
5. [Planned Tests](#planned-tests)
6. [Running Tests](#running-tests)
7. [Writing New Tests](#writing-new-tests)

---

## Current Test Coverage

### ✅ Implemented Tests

#### Core Tests
- **`test_health.py`** - Health check endpoint tests
  - ✅ Health check success
  - ✅ Database connection verification
  - ✅ Response structure validation

#### Users App Tests
- **`test_user_model.py`** - User model and permission tests
  - ✅ User creation
  - ✅ User string representation
  - ✅ User name methods (get_full_name, get_short_name)
  - ✅ Superuser permissions
  - ✅ Direct app permissions
  - ✅ Group-based app permissions
  - ✅ Permission checking methods (has_app_permission, has_any_app_permission, has_all_app_permissions)
  - ✅ AppPermission model tests
  - ✅ AppPermissionGroup model tests

- **`test_user_views.py`** - User API endpoint tests
  - ✅ API info endpoint (public access)
  - ✅ User stats endpoint (authentication & authorization)
  - ✅ Group ViewSet (CRUD operations, permissions)
  - ✅ Permission ViewSet (list operations, permissions)

---

## Testing Strategy

### Test Types

1. **Unit Tests** (`@pytest.mark.unit`)
   - Test individual components in isolation
   - Fast execution, no database required
   - Test model methods, utility functions, validators

2. **Integration Tests** (`@pytest.mark.integration`)
   - Test component interactions
   - May require database
   - Test model relationships, signals, middleware

3. **API Tests** (`@pytest.mark.api`)
   - Test API endpoints
   - Full request/response cycle
   - Test authentication, authorization, serialization

4. **Slow Tests** (`@pytest.mark.slow`)
   - Tests that take longer to execute
   - Can be skipped during quick test runs

### Coverage Targets

- **Models**: 95%+ coverage
- **Views/ViewSets**: 90%+ coverage
- **Serializers**: 90%+ coverage
- **URLs/Routers**: 100% coverage
- **Utilities/Helpers**: 95%+ coverage

---

## Test Organization

### Directory Structure

```
tests/
├── __init__.py
├── README.md
├── test_health.py                    # ✅ Core health checks
├── test_user_model.py                # ✅ User model tests
├── test_user_views.py                # ✅ User API tests
├── test_user_serializers.py          # ✅ User serializer tests
├── test_infrastructure_models.py     # ✅ Infrastructure model tests
├── test_infrastructure_views.py      # ✅ Infrastructure API tests
├── test_infrastructure_serializers.py # ✅ Infrastructure serializer tests
├── test_assets_models.py             # ✅ Asset model tests
├── test_assets_views.py               # ✅ Asset API tests
├── test_assets_serializers.py         # ✅ Asset serializer tests
├── test_authentication.py             # ✅ JWT authentication tests
├── test_permissions.py                # ✅ Permission system tests
├── test_urls.py                       # ✅ URL routing tests
└── conftest.py                        # ✅ Shared fixtures
```

**Legend:**
- ✅ = Implemented
- ⏳ = Planned/To be implemented

---

## Coverage Goals

### Overall Coverage Target: **90%+**

### By Component Type

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Models | 95% | High |
| ViewSets/Views | 90% | High |
| Serializers | 90% | High |
| URLs/Routers | 100% | Medium |
| Middleware | 80% | Medium |
| Utilities | 95% | Low |

---

## Planned Tests

### 1. Users App Tests

#### Models (`test_user_model.py`) - ✅ Partially Complete
- ✅ User model basic operations
- ✅ AppPermission model
- ✅ AppPermissionGroup model
- ⏳ User model edge cases (email uniqueness, password validation)
- ⏳ User model relationships
- ⏳ User model custom methods edge cases

#### Views (`test_user_views.py`) - ✅ Partially Complete
- ✅ API info endpoint
- ✅ User stats endpoint
- ✅ Group ViewSet CRUD
- ✅ Permission ViewSet list
- ⏳ Djoser endpoints (registration, login, password reset)
- ⏳ JWT token endpoints (create, refresh, verify)
- ⏳ User profile endpoints
- ⏳ Error handling tests (400, 401, 403, 404, 500)
- ⏳ Pagination tests
- ⏳ Filtering and search tests

#### Serializers (`test_user_serializers.py`) - ✅ Completed
- ✅ UserSerializer validation
- ✅ UserCreateSerializer password matching
- ✅ GroupSerializer permissions handling
- ✅ AppPermissionSerializer validation
- ✅ Serializer field validation
- ✅ Nested serializer tests
- ✅ GroupWithAppPermissionsSerializer (create/update with app permissions)

---

### 2. Infrastructure App Tests

#### Models (`test_infrastructure_models.py`) - ✅ Completed
- ✅ Location model
  - Creation, update, deletion
  - String representation
  - Relationships (circuits, assets, contacts)
  - Field validations
  - Meta options (ordering, indexes)

- ✅ Circuit model
  - Creation with location
  - Speed validation (MinValueValidator)
  - String representation
  - Relationships (location, points_of_contact)
  - Meta options

- ✅ PointOfContact model
  - Creation with circuit
  - Contact type choices validation
  - Unique together constraint (circuit, contact_type)
  - String representation

- ✅ Department model
  - Unique name constraint
  - String representation
  - Relationships (assets)

- ✅ Category model
  - Unique name constraint
  - String representation

- ✅ Contact model
  - Creation and validation
  - String representation
  - Field validations

- ✅ CarrierContact model
  - Creation with location
  - Relationships
  - String representation

- ✅ UtilityContact model
  - Creation with location
  - Utility type choices
  - String representation

#### Views (`test_infrastructure_views.py`) - ✅ Completed
- ✅ LocationViewSet
  - List, create, retrieve, update, delete
  - Custom action: `circuits` (GET /locations/{id}/circuits/)
  - Authentication requirements
  - Permission checks
  - Filtering and search
  - Pagination

- ✅ CircuitViewSet
  - Full CRUD operations
  - Custom action: `contacts` (GET /circuits/{id}/contacts/)
  - Location relationship validation
  - Speed validation
  - Filtering by location

- ✅ PointOfContactViewSet
  - Full CRUD operations
  - Circuit relationship validation
  - Unique constraint handling
  - Contact type validation

- ✅ DepartmentViewSet
  - Full CRUD operations
  - Unique name validation
  - Relationships

- ✅ CategoryViewSet
  - Full CRUD operations
  - Unique name validation

- ✅ ContactViewSet
  - Full CRUD operations
  - Field validations

- ✅ CarrierContactViewSet
  - Full CRUD operations
  - Location relationship

- ✅ UtilityContactViewSet
  - Full CRUD operations
  - Location relationship
  - Utility type validation

#### Serializers (`test_infrastructure_serializers.py`) - ✅ Completed
- ✅ LocationSerializer
  - Field validation
  - Nested relationships
  - Read/write operations

- ✅ CircuitSerializer
  - Location relationship
  - Speed validation
  - Nested serialization

- ✅ PointOfContactSerializer
  - Circuit relationship
  - Contact type validation

- ✅ All other infrastructure serializers
  - Field validations
  - Relationship handling
  - Read/write operations
  - DepartmentSerializer, CategorySerializer, ContactSerializer
  - CarrierContactSerializer, UtilityContactSerializer

---

### 3. Assets App Tests

#### Models (`test_assets_models.py`) - ✅ Completed
- ✅ AssetTag model
  - Unique name constraint
  - Color validation (hex format)
  - String representation

- ✅ CustomLifecycle model
  - Creation and validation
  - String representation

- ✅ Vendor model
  - Unique name constraint
  - URL validation
  - String representation

- ✅ TechSpecs model
  - Unique name constraint
  - String representation

- ✅ AssetCategory model
  - Unique name constraint
  - TechSpecs relationship
  - String representation

- ✅ Asset model (High Priority)
  - Creation with all fields
  - Status choices validation
  - Impact validation (1-3 range)
  - Purchase price validation (MinValueValidator)
  - Relationships (category, vendor, location, assigned_to, used_by, managed_by)
  - Many-to-many relationships (tags, departments)
  - Custom methods (get_asset_type, get_attachments)
  - String representation

- ✅ ComputerDetails model
  - Asset relationship
  - Field validations
  - String representation

- ✅ NetworkDetails model
  - Asset relationship
  - Field validations
  - String representation

- ✅ AssetAttachment model
  - Asset relationship
  - uploaded_by relationship
  - String representation

- ✅ AssetRelation model
  - Asset relationships (bidirectional)
  - Unique together constraint
  - String representation

- ✅ CalendarAlert model
  - Asset relationship
  - Date validation
  - assigned_to relationship
  - String representation

#### Views (`test_assets_views.py`) - ✅ Completed
- ✅ AssetTagViewSet
  - Full CRUD operations
  - Authentication requirements

- ✅ VendorViewSet
  - Full CRUD operations
  - Unique name validation

- ✅ AssetCategoryViewSet
  - Full CRUD operations
  - Custom action: `assets` (GET /categories/{id}/assets/)
  - TechSpecs relationship

- ✅ AssetViewSet (High Priority - Complex)
  - Full CRUD operations
  - Dynamic serializer selection (read vs write)
  - Query filtering (category, status, vendor, location, search)
  - Custom actions:
    - `attachments` (GET /assets/{id}/attachments/)
    - `related_assets` (GET /assets/{id}/related_assets/)
    - `add_related_asset` (POST /assets/{id}/add_related_asset/)
    - `remove_related_asset` (DELETE /assets/{id}/remove_related_asset/)
    - `stats` (GET /assets/stats/)
  - Search functionality
  - Error handling

- ✅ AssetAttachmentViewSet
  - Full CRUD operations
  - Auto-set uploaded_by
  - Asset relationship

- ✅ ComputerDetailsViewSet
  - Read-only operations
  - Asset relationship

- ✅ AssetImageViewSet
  - Nested routing under assets
  - Asset relationship

- ✅ CalendarAlertViewSet
  - Full CRUD operations
  - Nested routing under assets
  - Asset relationship
  - Date validation

#### Serializers (`test_assets_serializers.py`) - ✅ Completed
- ✅ AssetTagSerializer
- ✅ VendorSerializer
- ✅ TechSpecsSerializer
- ✅ AssetCategorySerializer
- ✅ AssetSerializer (High Priority - Complex)
  - Nested relationships
  - Field validations
  - Many-to-many handling

- ✅ AssetAttachmentSerializer
- ✅ AssetRelationSerializer
- ✅ ComputerDetailsSerializer
- ✅ CalendarAlertSerializer

---

### 4. Authentication & Authorization Tests

#### Authentication (`test_authentication.py`) - ✅ Completed
- ✅ JWT token creation
- ✅ JWT token refresh
- ✅ JWT token verification
- ✅ User registration (Djoser)
- ✅ User login
- ✅ Invalid credentials handling
- ✅ Authenticated requests with token
- ✅ User profile management (get/update/delete current user)

#### Permissions (`test_permissions.py`) - ✅ Completed
- ✅ AppPermission system
  - Direct permissions
  - Group-based permissions
  - Permission inheritance
  - Superuser permissions
- ✅ ViewSet permission classes
- ✅ Custom permission checks
- ✅ Permission denied responses
- ✅ Staff-only endpoints
- ✅ Superuser-only endpoints

---

### 5. URL Routing Tests

#### URLs (`test_urls.py`) - ✅ Completed
- ✅ Core URLs
  - Health check endpoint
  - API info endpoint
  - Swagger/ReDoc endpoints
- ✅ Users URLs
  - All user endpoints
  - Group endpoints
  - Permission endpoints
- ✅ Infrastructure URLs
  - All infrastructure endpoints
  - Nested routes
- ✅ Assets URLs
  - All asset endpoints
  - Nested routes (images, calendar-alerts, relations)
- ✅ Authentication URLs
  - Djoser endpoints
  - JWT endpoints
- ✅ URL parameter validation
- ✅ URL reverse resolution

---

### 6. Integration Tests

#### Cross-App Integration (`test_integration.py`) - ⏳ Not Started
- ⏳ Asset-Location relationships
- ⏳ Asset-User relationships
- ⏳ Circuit-Location relationships
- ⏳ User-Permission relationships
- ⏳ Asset-Category relationships
- ⏳ Complex queries across apps
- ⏳ Transaction handling
- ⏳ Cascade deletions
- ⏳ Signal handlers

---

### 7. Edge Cases & Error Handling

#### Error Scenarios - ⏳ Not Started
- ⏳ Invalid data formats
- ⏳ Missing required fields
- ⏳ Duplicate entries (unique constraints)
- ⏳ Foreign key violations
- ⏳ Permission denied scenarios
- ⏳ Authentication failures
- ⏳ Not found errors (404)
- ⏳ Validation errors (400)
- ⏳ Server errors (500)
- ⏳ Large payload handling
- ⏳ SQL injection attempts
- ⏳ XSS attempts

---

## Running Tests

### Basic Commands

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_user_model.py

# Run specific test class
pytest tests/test_user_views.py::TestUserStatsView

# Run specific test function
pytest tests/test_user_model.py::TestUserModel::test_user_creation

# Run tests by marker
pytest -m unit          # Only unit tests
pytest -m api          # Only API tests
pytest -m integration  # Only integration tests
pytest -m "not slow"   # Skip slow tests

# Run with verbose output
pytest -v

# Run with output capture disabled
pytest -s
```

### Coverage Reports

```powershell
# Generate HTML coverage report
pytest --cov=. --cov-report=html

# View coverage in terminal
pytest --cov=. --cov-report=term-missing

# Generate XML coverage report (for CI/CD)
pytest --cov=. --cov-report=xml
```

---

## Writing New Tests

### Test File Naming Convention

- Test files should start with `test_`
- Follow the pattern: `test_{app}_{component}.py`
- Examples:
  - `test_user_model.py`
  - `test_infrastructure_views.py`
  - `test_assets_serializers.py`

### Test Class Naming Convention

- Test classes should start with `Test`
- Follow the pattern: `Test{ComponentName}`
- Examples:
  - `TestUserModel`
  - `TestLocationViewSet`
  - `TestAssetSerializer`

### Test Function Naming Convention

- Test functions should start with `test_`
- Use descriptive names: `test_{what}_{expected_result}`
- Examples:
  - `test_user_creation_success`
  - `test_location_requires_authentication`
  - `test_asset_filter_by_category`

### Example Test Structure

```python
"""
Tests for Location model.
"""
import pytest
from infrastructure.models import Location


@pytest.mark.django_db
class TestLocationModel:
    """Test cases for Location model."""

    def test_location_creation(self):
        """Test that a location can be created with required fields."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        assert location.name == "Test Location"
        assert location.city == "Test City"

    def test_location_str_representation(self):
        """Test location string representation."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        assert str(location) == "Test Location - Test City"

    def test_location_optional_fields(self):
        """Test that optional fields can be omitted."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        assert location.address2 is None
        assert location.state is None
```

### Using Fixtures

```python
@pytest.mark.api
@pytest.mark.django_db
def test_location_list_requires_auth(api_client):
    """Test that listing locations requires authentication."""
    response = api_client.get("/api/v1/infrastructure/locations/")
    assert response.status_code == 401

@pytest.mark.api
@pytest.mark.django_db
def test_location_create_success(authenticated_api_client):
    """Test that authenticated user can create a location."""
    data = {
        "name": "New Location",
        "address1": "456 Oak Ave",
        "city": "New City",
    }
    response = authenticated_api_client.post(
        "/api/v1/infrastructure/locations/",
        data,
        format="json",
    )
    assert response.status_code == 201
    assert response.data["name"] == "New Location"
```

### Best Practices

1. **One assertion per test** (when possible) - makes failures clearer
2. **Use descriptive test names** - test name should explain what is being tested
3. **Test both success and failure cases** - happy path and error scenarios
4. **Use fixtures** - avoid code duplication, use `conftest.py` fixtures
5. **Test edge cases** - boundary conditions, empty values, null values
6. **Test relationships** - foreign keys, many-to-many, reverse relationships
7. **Test validations** - model validators, serializer validators
8. **Test permissions** - authentication, authorization, role-based access
9. **Keep tests independent** - each test should be able to run in isolation
10. **Use appropriate markers** - `@pytest.mark.unit`, `@pytest.mark.api`, etc.

---

## Test Coverage Tracking

### Current Coverage Status

Run coverage report to see current status:
```powershell
pytest --cov=. --cov-report=term-missing
```

### Coverage Goals by Priority

**Phase 1 (High Priority):**
- ✅ Users app models and views
- ⏳ Infrastructure app models and views
- ⏳ Assets app models and views

**Phase 2 (Medium Priority):**
- ⏳ All serializers
- ⏳ Authentication and authorization
- ⏳ URL routing

**Phase 3 (Lower Priority):**
- ⏳ Integration tests
- ⏳ Edge cases and error handling
- ⏳ Performance tests

---

## Continuous Integration

Tests should be run automatically in CI/CD pipeline:
- On every pull request
- Before merging to main branch
- Coverage reports should be generated and tracked
- Minimum coverage threshold: 80% (target: 90%+)

---

## Notes

- All tests use SQLite in-memory database (configured in `core/test_settings.py`)
- Tests are isolated and independent
- Use `factory-boy` for creating test data (when needed)
- Use `pytest-mock` for mocking external dependencies
- Keep tests fast - aim for < 1 second per test when possible

---

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass
3. Check coverage doesn't decrease
4. Update this README if adding new test files or categories

---

**Last Updated:** 2025-12-22
**Current Coverage:** ~75% (Major components covered)
**Target Coverage:** 90%+

## Test Coverage Summary

### ✅ Completed Test Suites

1. **Core Tests** - ✅ Complete
   - Health check endpoints

2. **Users App** - ✅ Complete
   - Models (User, AppPermission, AppPermissionGroup)
   - Views (API info, stats, groups, permissions)
   - Serializers (all user serializers)

3. **Infrastructure App** - ✅ Complete
   - Models (all 8 models)
   - Views (all 8 ViewSets with full CRUD)
   - Serializers (all infrastructure serializers)

4. **Assets App** - ✅ Complete
   - Models (core models: Asset, AssetTag, Vendor, Category, etc.)
   - Views (major ViewSets: Asset, AssetTag, Vendor, Category, etc.)
   - Serializers (core serializers)

5. **Authentication** - ✅ Complete
   - JWT token operations (create, refresh, verify)
   - Djoser user registration and management

6. **Permissions** - ✅ Complete
   - AppPermission system
   - ViewSet permission checks

7. **URL Routing** - ✅ Complete
   - Core URLs
   - App-specific URLs
   - Authentication URLs

### 📊 Coverage Statistics

- **Total Test Files:** 13
- **Test Classes:** 50+
- **Test Functions:** 300+
- **Models Covered:** 25+
- **ViewSets Covered:** 20+
- **Serializers Covered:** 25+

### 🎯 Remaining Work

While major components are covered, additional tests can be added for:
- More edge cases in asset models (DisplayDetails, PhoneDetails, PeripheralDetails)
- Additional asset ViewSets (DisplayDetailsViewSet, PhoneDetailsViewSet, etc.)
- More comprehensive serializer edge cases
- Integration tests for complex workflows
- Performance tests
