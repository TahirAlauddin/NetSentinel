# Code Quality Checklist

A checklist from a **code point of view**: refactoring, structure, consistency, types, tests, and technical debt. Use alongside [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) for production readiness.

---

## 1. Refactoring & Duplication

### 1.1 DRY (Don't Repeat Yourself)
- [x] **No copy-paste blocks** – Repeated logic extracted to shared functions, hooks, or utilities (`lib/form-utils.ts`: `getFormString`, `getFormNumberOrNull`, etc.; `normalizeListResponse` in utils)
- [x] **Shared constants** – Magic numbers and repeated strings in constants or config (`constants/api-paths.ts`, notification limits in `types/notifications.ts`)
- [ ] **Reusable components** – Similar UI patterns turned into components with props (not duplicated JSX)
- [x] **Single source of truth** – One place for API URLs, route paths, and feature flags (`constants/api-paths.ts`, `constants/routes.ts`, `lib/config.ts`)
- [x] **Backend: shared serializers/validators** – Common validation and serialization logic in shared modules (`core.serializers.NameOnlyModelSerializer` for Department/Category)

### 1.2 Dead Code
- [ ] **No unused exports** – All exported functions/components/types are used (or intentionally public API); not fully audited
- [x] **No commented-out blocks** – Removed or replaced with short TODO refs (dashboard-content, AssetManage, test_settings, api-client.test, form-submission.test, useFormActions.test)
- [x] **No unused imports** – ESLint passes; unused imports cleaned by linter
- [x] **No unused variables/parameters** – Unused params use `_` prefix (e.g. `_e` in catch); no silencing without reason
- [x] **No unreachable code** – Spot-check: no code after early returns in edited files

### 1.3 Complexity & Size
- [ ] **Functions stay focused** – Single responsibility; extract helpers when a function does multiple things
- [ ] **Reasonable function length** – No multi-hundred-line functions; split into smaller units
- [ ] **Reasonable file length** – Large files (e.g. >300–400 lines) split into smaller modules or sub-components
- [ ] **Cyclomatic complexity** – No deeply nested conditionals; early returns and small functions to keep complexity low
- [ ] **Component size** – React components not too large; logic in hooks, presentation in component

### 1.4 Naming & Clarity
- [ ] **Descriptive names** – Variables, functions, and types named by intent (e.g. `getUserById`, not `getData`)
- [ ] **Consistent naming** – Same concept named the same way (e.g. `userId` vs `user_id` per project convention)
- [ ] **No abbreviations unless standard** – Prefer `configuration` over `config` only where it’s a well-known abbrev (e.g. `config`, `props`, `id`)
- [ ] **Boolean naming** – `isLoading`, `hasError`, `canEdit`-style prefixes
- [ ] **Files/folders match content** – File and folder names reflect what’s inside

---

## 2. Structure & Organization

### 2.1 Layered Architecture
- [ ] **Clear layers** – UI → API client → backend API → services → models; no UI logic in API layer
- [ ] **No circular dependencies** – Modules don’t import each other in a cycle (use dependency inversion or shared types)
- [ ] **Backend: views thin** – Views orchestrate; business logic in services or model methods
- [ ] **Frontend: containers vs presentational** – Data fetching in pages/hooks; presentational components receive props

### 2.2 File & Folder Structure
- [ ] **Consistent structure** – Same app/feature uses same pattern (e.g. `components/`, `hooks/`, `lib/`)
- [ ] **Colocation** – Related files grouped (e.g. component + styles + tests nearby)
- [ ] **Barrel exports** – Index files where they simplify imports; avoid deep barrel chains
- [ ] **Backend: app-per-domain** – Django apps by domain (users, assets, ipam); no giant “utils” dump
- [ ] **Frontend: feature or type folders** – Clear split (e.g. by route, feature, or component type)

### 2.3 Dependencies & Coupling
- [ ] **Explicit dependencies** – No hidden globals or implicit imports
- [ ] **Loose coupling** – Components/modules depend on interfaces or props, not concrete implementations
- [ ] **Shared types in one place** – API contracts and shared DTOs in a dedicated types/schemas layer
- [ ] **No “god” objects** – No single module that everything imports from (except intentional public API)

---

## 3. Type Safety & Contracts

### 3.1 TypeScript (Frontend)
- [ ] **Strict mode** – `strict: true` (or equivalent) in tsconfig
- [ ] **Avoid `any`** – Use `unknown` and type guards, or proper types; no `any` in public APIs
- [ ] **Explicit return types** – For public functions and API boundaries (helps catch drift)
- [ ] **No type assertions without justification** – Prefer correct typing; if `as` is used, add a short comment
- [ ] **API response types** – All API responses typed (generated or hand-written); no untyped `response.data`
- [ ] **Props interfaces** – All component props defined in an interface/type

### 3.2 Python (Backend)
- [ ] **Type hints on public APIs** – Function parameters and return types for views, services, and serializers
- [ ] **Consistent use of typing** – `Optional`, `List`, `Dict` (or `list`, `dict` in 3.9+) where it helps
- [ ] **No bare `*args`/`**kwargs` without docs** – Document or type when used in public APIs
- [ ] **Serializers as contracts** – Request/response shapes defined by serializers; validated at boundaries

### 3.3 API Contract
- [ ] **Backend and frontend types in sync** – Frontend types match API (manual or OpenAPI-generated)
- [ ] **Validation at boundaries** – Backend validates all inputs; frontend validates before submit where useful
- [ ] **Error response shape** – Consistent error JSON (e.g. `detail`, `field_errors`); frontend parses one format

---

## 4. Testing (Code Perspective)

### 4.1 Coverage & Scope
- [ ] **Critical paths tested** – Auth, checkout, or domain-critical flows have tests
- [ ] **Coverage thresholds** – Enforced in CI (e.g. ≥60% lines/branches); no large untested areas
- [ ] **Tests next to code or in test dir** – Consistent test location (`__tests__`, `tests/`, or colocated)
- [ ] **No skipped tests without reason** – `.only`/`.skip` only temporarily; ticket or comment if permanent

### 4.2 Test Quality
- [ ] **Tests are deterministic** – No flaky tests; no reliance on order, time, or random data without seeding
- [ ] **Arrange–Act–Assert** – Clear structure; one logical assertion per test where possible
- [ ] **Meaningful names** – Test names describe scenario and expectation (e.g. `returns 401 when token expired`)
- [ ] **No logic in tests** – Tests are simple; no complex conditionals or loops that need their own tests
- [ ] **Mocks/fixtures** – Shared fixtures and factories; minimal duplication in test setup
- [ ] **Backend: DB isolation** – Tests don’t depend on shared DB state; use transactions or in-memory DB

### 4.3 Test Maintenance
- [ ] **Tests updated with refactors** – Renames and behavior changes reflected in tests
- [ ] **No commented-out tests** – Remove or fix; avoid disabling without a ticket
- [ ] **Fast unit tests** – Unit tests don’t hit DB/network unless needed; slow tests marked and optional in CI

---

## 5. Error Handling & Resilience (Code)

### 5.1 Explicit Error Handling
- [ ] **No silent catches** – Every `catch` does something (log, rethrow, return fallback); no empty `catch {}`
- [ ] **Typed errors where possible** – Use custom error classes or discriminated unions for error handling
- [ ] **User-facing messages** – User sees a clear message; technical details only in logs
- [ ] **Backend: exception handling** – Views or middleware catch and return consistent error JSON; no 500 with stack trace to client

### 5.2 Boundaries
- [ ] **API client handles errors** – Network and API errors caught and normalized (e.g. to a common error type)
- [ ] **Loading and error state** – Async flows set loading/error state; UI shows them (no perpetual loading)
- [ ] **Error boundaries (React)** – Error boundaries at route or section level with fallback UI

---

## 6. Documentation & Comments

### 6.1 In-Code Documentation
- [ ] **Public API documented** – Modules, classes, and public functions have docstrings (Python) or JSDoc (TS)
- [ ] **Non-obvious logic explained** – “Why” comments for business rules or workarounds; avoid stating the obvious
- [ ] **TODOs tracked** – TODOs reference a ticket or short description; no vague “fix later”
- [ ] **Deprecations marked** – Deprecated functions/APIs have `@deprecated` and migration path

### 6.2 Code as Documentation
- [ ] **Self-explanatory code** – Names and structure make behavior clear; comments supplement, not replace
- [ ] **No misleading comments** – Comments match current behavior; remove or update when code changes
- [ ] **README/contributing** – New contributors can run, test, and lint from docs

---

## 7. Formatting, Linting & Tooling

### 7.1 Consistency
- [ ] **Formatter in use** – Black (Python), Prettier (TS/JS), or project standard; config in repo
- [ ] **Linter in CI** – ESLint, Pylint/Ruff/Flake8 (or equivalent) run in CI; zero warnings or documented exceptions
- [ ] **Import order** – isort (Python) or ESLint import plugin; no noisy import diffs
- [ ] **Line length** – Consistent (e.g. 100 or 120); config in repo

### 7.2 Automation
- [ ] **Pre-commit or CI** – Format and lint run before or on commit/PR
- [ ] **Single command to check** – e.g. `npm run lint`, `make check`, or `tox` for “is the code clean?”
- [ ] **Type checking in CI** – `tsc --noEmit` (TS), mypy (Python) if adopted; no green CI with type errors

---

## 8. Technical Debt & Hygiene

### 8.1 Debt Visibility
- [ ] **TODOs/FIXMEs tracked** – List or tickets for each; no long-lived “fix later” without owner
- [ ] **Known shortcuts documented** – “Shortcut: X because of Y; ticket Z” so future refactors are safe
- [ ] **No commented-out code blocks** – Delete or replace with a one-line reference
- [ ] **Deprecated code removed or scheduled** – Deprecated paths have removal plan and timeline

### 8.2 Dependency Hygiene
- [ ] **No unused dependencies** – Removed from package.json / requirements.txt
- [ ] **Pinned/recorded versions** – Lockfiles committed; CI uses same versions as local
- [ ] **Outdated deps reviewed** – Regular updates; security and major upgrades planned
- [ ] **No duplicate dependencies** – Same package not listed twice under different names or versions

### 8.3 Backend-Specific
- [ ] **Migrations linear** – No unnecessary merge migrations; squashing policy if many migrations
- [ ] **No raw SQL without review** – Prefer ORM; document and test raw SQL
- [ ] **Queries efficient** – No N+1; use `select_related`/`prefetch_related` where appropriate
- [ ] **Admin/model registration** – Admin classes for models that need back-office access

### 8.4 Frontend-Specific
- [ ] **No `console.log` in production path** – Use logger or remove; no stray logs in prod bundle
- [ ] **Keys on lists** – Every list render has stable `key`; no index as key unless list is static
- [ ] **Controlled inputs** – Form inputs controlled or explicitly uncontrolled; no mixing without reason
- [ ] **No inline object/array creation in render** – Avoid `style={{ }}` or `props={{ }}` creating new refs every render where it hurts performance

---

# NetSentinel Code Quality Comparison

Assessment of the current NetSentinel codebase against this checklist. **✅ Done** | **⚠ Partial** | **❌ Missing** | **N/A** Not applicable.

## 1. Refactoring & Duplication

| Item | Status | Notes |
|------|--------|--------|
| No copy-paste blocks | ⚠ | Some repeated patterns; shared hooks and utils exist but not fully audited. |
| Shared constants | ✅ | Routes, API URLs, and many constants in `constants/` and backend. |
| Reusable components | ✅ | UI components in `components/ui/`; app-specific in `components/apps/`. |
| Single source of truth | ✅ | API base URL from env; routes in `constants/routes.ts`. |
| Backend shared serializers/validators | ✅ | Validators in `core.security`, app-level serializers. |
| No unused exports | ⚠ | Not enforced by tooling; manual cleanup. |
| No commented-out blocks | ⚠ | Some files have commented code; not systematically removed. |
| No unused imports | ✅ | ESLint; backend linters can catch. |
| Functions stay focused | ⚠ | Generally good; some long views or components. |
| Reasonable function/file length | ⚠ | A few large files (e.g. IPAM migrations, long components); no hard limit. |
| Cyclomatic complexity | ⚠ | Flake8 `--max-complexity=10` in CI; frontend not explicitly checked. |
| Descriptive names | ✅ | Naming is generally clear and consistent. |
| Consistent naming | ✅ | Conventions in `docs/CODING_STANDARDS.md`. |
| Boolean naming | ✅ | `isLoading`, `hasError`-style used. |

## 2. Structure & Organization

| Item | Status | Notes |
|------|--------|--------|
| Clear layers | ✅ | Frontend: app → components → lib; backend: views → serializers → models/services. |
| No circular dependencies | ⚠ | Not audited with a tool; structure suggests few. |
| Backend: views thin | ✅ | Services used (e.g. ipam services, notifications); views delegate. |
| Frontend: containers vs presentational | ✅ | Pages fetch; components receive props; hooks for logic. |
| Consistent structure | ✅ | App router; `(app)`, `(auth)`; backend apps by domain. |
| Colocation | ⚠ | Tests in `tests/`; some feature colocation. |
| Explicit dependencies | ✅ | Imports explicit; env for config. |
| Shared types in one place | ✅ | `types/` in frontend; serializers define backend contracts. |

## 3. Type Safety & Contracts

| Item | Status | Notes |
|------|--------|--------|
| TypeScript strict mode | ✅ | Standards require strict; tsconfig should reflect. |
| Avoid `any` | ⚠ | Some `any` in tests and a few app files; standards say avoid. |
| Explicit return types (public APIs) | ⚠ | Not consistently enforced. |
| API response types | ✅ | Typed API client; response types used. |
| Props interfaces | ✅ | Components use interfaces for props. |
| Python type hints | ⚠ | Used in places; not everywhere on public APIs. |
| Backend and frontend types in sync | ⚠ | Manual alignment; no OpenAPI→TS generation. |
| Validation at boundaries | ✅ | DRF serializers; frontend validation with Zod/react-hook-form. |
| Error response shape | ✅ | Centralized parsing in `error-handler.ts` and API client. |

## 4. Testing (Code Perspective)

| Item | Status | Notes |
|------|--------|--------|
| Critical paths tested | ✅ | Auth, assets, IPAM, contracts, notifications have tests. |
| Coverage thresholds | ⚠ | Jest has coverage; pytest coverage commented out in pytest.ini. |
| Tests next to code or in test dir | ✅ | Backend: `tests/`; frontend: `tests/` with structure. |
| No skipped tests without reason | ⚠ | Not audited. |
| Deterministic tests | ✅ | Test DB and fixtures; no obvious time/order dependence. |
| Arrange–Act–Assert | ✅ | Test structure is clear. |
| Meaningful names | ✅ | Descriptive test names. |
| Mocks/fixtures | ✅ | conftest.py; frontend mocks and test utils. |
| Backend: DB isolation | ✅ | test_settings; in-memory or test DB. |
| Fast unit tests | ✅ | Backend markers (unit vs integration); frontend unit vs integration. |

## 5. Error Handling (Code)

| Item | Status | Notes |
|------|--------|--------|
| No silent catches | ✅ | error-handler and ErrorBoundary; backend returns error responses. |
| Typed errors | ✅ | AppError, ErrorType; parsed API errors. |
| User-facing messages | ✅ | getUserFriendlyMessage and fallback UI. |
| Backend exception handling | ✅ | DRF and view-level handling. |
| API client handles errors | ✅ | Centralized handling in api-client and error-handler. |
| Loading and error state | ⚠ | Used in many places; not audited everywhere. |
| Error boundaries | ✅ | Root layout ErrorBoundary. |

## 6. Documentation & Comments

| Item | Status | Notes |
|------|--------|--------|
| Public API documented | ⚠ | Some JSDoc and docstrings; not complete everywhere. |
| Non-obvious logic explained | ⚠ | Mixed. |
| TODOs tracked | ⚠ | Several TODOs (e.g. Sentry in error-handler, ErrorBoundary); no ticket refs. |
| Deprecations marked | N/A | No formal deprecation policy in code yet. |
| README/contributing | ✅ | README, DEVELOPMENT.md, TESTING.md, AUTHENTICATION.md. |

## 7. Formatting, Linting & Tooling

| Item | Status | Notes |
|------|--------|--------|
| Formatter | ✅ | Black (backend), Prettier (frontend via ESLint). |
| Linter in CI | ✅ | ESLint (frontend); Black, isort, Flake8 (backend). |
| Import order | ✅ | isort (backend); ESLint (frontend). |
| Line length | ✅ | 100 in Black/pyproject; frontend consistent. |
| Pre-commit or CI | ✅ | CI runs lint and test. |
| Type checking in CI | ⚠ | Frontend: `npm run build`; backend: no mypy in CI. |

## 8. Technical Debt & Hygiene

| Item | Status | Notes |
|------|--------|--------|
| TODOs/FIXMEs tracked | ❌ | Multiple TODOs (Sentry, etc.) without tickets. |
| Known shortcuts documented | ⚠ | Some comments; no central “shortcuts” doc. |
| No commented-out code blocks | ⚠ | Some present; not systematically removed. |
| Unused dependencies | ⚠ | Not audited. |
| Pinned/recorded versions | ✅ | requirements.txt, package-lock.json. |
| Migrations linear | ✅ | Django migrations; no merge issues noted. |
| Raw SQL | ⚠ | Some raw SQL in migrations; ORM used in app code. |
| N+1 / query efficiency | ⚠ | select_related/prefetch_related used; not fully audited. |
| No console.log in prod | ⚠ | logError is dev-only; no global strip in build. |
| Keys on lists | ✅ | Keys used in lists. |
| Controlled inputs | ✅ | react-hook-form and controlled components. |

---

## Summary: Code Fixes to Prioritize

**Quick wins**

1. **Turn on pytest coverage in CI** – Uncomment `--cov` in pytest.ini or add in workflow; set a minimum threshold.
2. **Tame TODOs** – Add ticket IDs or short notes to TODOs (e.g. Sentry integration); track in backlog.
3. **Reduce `any`** – Replace `any` in frontend (especially outside tests) with proper types or `unknown`.
4. **Add mypy (optional)** – Run mypy in CI for critical backend modules to catch type drift.

**Short term**

5. **Document and remove commented-out code** – One pass to delete or replace with ticket references.
6. **Explicit return types** – Add return types to public API functions and key frontend modules.
7. **Backend type hints** – Add type hints to views, services, and serializers that are public API.
8. **Frontend global error page** – Add `error.tsx` (and optionally `global-error.tsx`) for route-level errors.

**Ongoing**

9. **Break up very large files** – Identify 400+ line files and split into smaller modules.
10. **API type generation** – Consider OpenAPI → TypeScript types so frontend stays in sync with backend.
11. **Cyclomatic complexity** – Add complexity checks for frontend (e.g. ESLint rule) if needed.
12. **Console in production** – Ensure no `console.log`/`console.error` in production code paths, or route through a logger that no-ops in prod.

Use this checklist during refactors and code reviews; update the comparison as the codebase changes.
