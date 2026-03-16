# Code Quality Checklist

A checklist from a **code point of view**: refactoring, structure, consistency, types, tests, and technical debt. Use alongside [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) for production readiness.

---

## 1. Refactoring & Duplication

### 1.1 DRY (Don't Repeat Yourself)
- [x] **No copy-paste blocks** – Repeated logic extracted to shared functions, hooks, or utilities (`lib/form-utils.ts`: `getFormString`, `getFormNumberOrNull`, etc.; `normalizeListResponse` in utils)
- [x] **Shared constants** – Magic numbers and repeated strings in constants or config (`constants/api-paths.ts`, notification limits in `types/notifications.ts`)
- [x] **Reusable components** – Similar UI patterns turned into components with props (not duplicated JSX)
- [x] **Single source of truth** – One place for API URLs, route paths, and feature flags (`constants/api-paths.ts`, `constants/routes.ts`, `lib/config.ts`)
- [x] **Backend: shared serializers/validators** – Common validation and serialization logic in shared modules (`core.serializers.NameOnlyModelSerializer` for Department/Category)

### 1.2 Dead Code
- [x] **No unused exports** – All exported functions/components/types are used (or intentionally public API); not fully audited
- [x] **No commented-out blocks** – Removed or replaced with short TODO refs (dashboard-content, AssetManage, test_settings, api-client.test, form-submission.test, useFormActions.test)
- [x] **No unused imports** – ESLint passes; unused imports cleaned by linter
- [x] **No unused variables/parameters** – Unused params use `_` prefix (e.g. `_e` in catch); no silencing without reason
- [x] **No unreachable code** – Spot-check: no code after early returns in edited files

### 1.3 Complexity & Size
- [x] **Functions stay focused** – API and fetch logic extracted from data-circuits page to `lib/data-circuits-api.ts` and `hooks/useDataCircuits.ts`
- [ ] **Reasonable function length** – No multi-hundred-line functions; split into smaller units (ESLint warns; some long forms remain)
- [ ] **Reasonable file length** – Large files (e.g. >300–400 lines) split into smaller modules; see *Complexity & size audit* below
- [x] **Cyclomatic complexity** – ESLint `complexity` rule (max 15) enabled in frontend; Flake8 `--max-complexity=10` in backend CI
- [x] **Component size** – Logic in hooks where refactored (e.g. data-circuits: `useDataCircuits`); presentation in page/component

### 1.4 Naming & Clarity
- [x] **Descriptive names** – Variables, functions, and types named by intent (e.g. `getUserById`, not `getData`)
- [x] **Consistent naming** – Same concept named the same way (e.g. `userId` vs `user_id` per project convention)
- [x] **No abbreviations unless standard** – Prefer `configuration` over `config` only where it’s a well-known abbrev (e.g. `config`, `props`, `id`)
- [x] **Boolean naming** – `isLoading`, `hasError`, `canEdit`-style prefixes
- [x] **Files/folders match content** – File and folder names reflect what’s inside

**Complexity & size audit (frontend, non-test)**  
Files over ~400 lines that are candidates for further split (refactor in progress or planned):

| File | Lines | Action |
|------|-------|--------|
| `app/(app)/telecom-management/data-circuits/page.tsx` | ~970 | ✅ API + hook extracted (`lib/data-circuits-api.ts`, `hooks/useDataCircuits.ts`); forms still inline – extract `DataCircuitAddForm` / `DataCircuitEditRow` next (now split into dedicated components). |
| `app/(app)/telecom-management/page.tsx` | 541 → small | ✅ Split into thin route-level container using `TelecomOverview`, `TelecomServicesOverview`, and `useTelecomOverview`. |
| `components/apps/ipam/ip-search-enhanced.tsx` | 562 | Extract search state hook and result subcomponents |
| `components/apps/ipam/subnet-threshold-dashboard.tsx` | 640 | Split into smaller dashboard widgets |
| `app/(app)/settings/carrier-contacts/page.tsx` | 684 | Extract table + form components |
| `components/layout/sectional-navigation.tsx` | 490 | Consider splitting by section (IPAM, Settings, etc.) |
| `components/apps/ipam/ipam-header.tsx` | 450 | Extract nav groups or shared header parts |

ESLint: `complexity` (max 15) and `max-lines` (450, skip blank/comment) enabled; reduce warnings over time.

---

## 2. Structure & Organization

### 2.1 Layered Architecture
- [x] **Clear layers** – UI → API client → backend API → services → models; no UI logic in API layer
- [ ] **No circular dependencies** – Modules don’t import each other in a cycle (use dependency inversion or shared types)
- [x] **Backend: views thin** – Views orchestrate; business logic in services or model methods
- [x] **Frontend: containers vs presentational** – Data fetching in pages/hooks; presentational components receive props

### 2.2 File & Folder Structure
- [x] **Consistent structure** – Same app/feature uses same pattern (e.g. `components/`, `hooks/`, `lib/`)
- [ ] **Colocation** – Related files grouped (e.g. component + styles + tests nearby)
- [ ] **Barrel exports** – Index files where they simplify imports; avoid deep barrel chains
- [x] **Backend: app-per-domain** – Django apps by domain (users, assets, ipam); no giant “utils” dump
- [ ] **Frontend: feature or type folders** – Clear split (e.g. by route, feature, or component type)

### 2.3 Dependencies & Coupling
- [x] **Explicit dependencies** – No hidden globals or implicit imports
- [ ] **Loose coupling** – Components/modules depend on interfaces or props, not concrete implementations
- [x] **Shared types in one place** – API contracts and shared DTOs in a dedicated types/schemas layer
- [x] **No “god” objects** – No single module that everything imports from (except intentional public API)

---

## 3. Type Safety & Contracts

### 3.1 TypeScript (Frontend)
- [x] **Strict mode** – `strict: true` (or equivalent) in tsconfig
- [ ] **Avoid `any`** – Use `unknown` and type guards, or proper types; no `any` in public APIs
- [ ] **Explicit return types** – For public functions and API boundaries (helps catch drift)
- [ ] **No type assertions without justification** – Prefer correct typing; if `as` is used, add a short comment
- [x] **API response types** – All API responses typed (generated or hand-written); no untyped `response.data`
- [x] **Props interfaces** – All component props defined in an interface/type

### 3.2 Python (Backend)
- [x] **Type hints on public APIs** – Function parameters and return types for views, services, and serializers
- [x] **Consistent use of typing** – `Optional`, `List`, `Dict` (or `list`, `dict` in 3.9+) where it helps
- [x] **No bare `*args`/`**kwargs` without docs** – Document or type when used in public APIs
- [x] **Serializers as contracts** – Request/response shapes defined by serializers; validated at boundaries

### 3.3 API Contract
- [x] **Backend and frontend types in sync** – Frontend types generated from backend Swagger/OpenAPI schema (`/swagger.json` converted to OpenAPI 3) via `npm run generate:api-types`; manual types live in `types/` alongside generated ones
- [x] **Validation at boundaries** – Backend validates all inputs; frontend validates before submit where useful
- [x] **Error response shape** – Consistent error JSON (e.g. `detail`, `field_errors`); frontend parses one format

---

## 4. Testing (Code Perspective)

### 4.1 Coverage & Scope
- [x] **Critical paths tested** – Auth, checkout, or domain-critical flows have tests
- [ ] **Coverage thresholds** – Enforced in CI (e.g. ≥60% lines/branches); no large untested areas
- [x] **Tests next to code or in test dir** – Consistent test location (`__tests__`, `tests/`, or colocated)
- [ ] **No skipped tests without reason** – `.only`/`.skip` only temporarily; ticket or comment if permanent

- [x] **Tests are deterministic** – No flaky tests; no reliance on order, time, or random data without seeding
- [x] **Arrange–Act–Assert** – Clear structure; one logical assertion per test where possible
- [x] **Meaningful names** – Test names describe scenario and expectation (e.g. `returns 401 when token expired`)
- [x] **No logic in tests** – Tests are simple; no complex conditionals or loops that need their own tests
- [x] **Mocks/fixtures** – Shared fixtures and factories; minimal duplication in test setup
- [x] **Backend: DB isolation** – Tests don’t depend on shared DB state; use transactions or in-memory DB

### 4.3 Test Maintenance
- [ ] **Tests updated with refactors** – Renames and behavior changes reflected in tests
- [ ] **No commented-out tests** – Remove or fix; avoid disabling without a ticket
- [ ] **Fast unit tests** – Unit tests don’t hit DB/network unless needed; slow tests marked and optional in CI

---

## 5. Error Handling & Resilience (Code)

### 5.1 Explicit Error Handling
- [x] **No silent catches** – Every `catch` does something (log, rethrow, return fallback); no empty `catch {}`
- [x] **Typed errors where possible** – Use custom error classes or discriminated unions for error handling
- [x] **User-facing messages** – User sees a clear message; technical details only in logs
- [x] **Backend: exception handling** – Views or middleware catch and return consistent error JSON; no 500 with stack trace to client

### 5.2 Boundaries
- [x] **API client handles errors** – Network and API errors caught and normalized (e.g. to a common error type)
- [ ] **Loading and error state** – Async flows set loading/error state; UI shows them (no perpetual loading)
- [x] **Error boundaries (React)** – Error boundaries at route or section level with fallback UI

---

## 6. Documentation & Comments

**Policy:** See [CONTRIBUTING.md](./CONTRIBUTING.md) “Documentation & Comments (Code Quality §6)” for public API docs, TODOs, and deprecations.

### 6.1 In-Code Documentation
- [x] **Public API documented** – Docstrings (Python) and JSDoc (TS) on modules and public functions; see CONTRIBUTING and lib/error-handler, lib/api-client/base
- [x] **Non-obvious logic explained** – “Why” comments for business rules or workarounds; CONTRIBUTING encourages this
- [x] **TODOs tracked** – [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) §8.1; new TODOs added there or ticket ref
- [x] **Deprecations marked** – `@deprecated` (JSDoc) or docstring with migration path; CONTRIBUTING documents policy

### 6.2 Code as Documentation
- [x] **Self-explanatory code** – Names and structure; comments supplement (CONTRIBUTING)
- [x] **No misleading comments** – Update or remove when code changes; part of review
- [x] **README/contributing** – README links to CONTRIBUTING, DEVELOPMENT, TESTING; CONTRIBUTING has run, test, lint and “Single command to check”

---

## 7. Formatting, Linting & Tooling

**Commands:** Backend: `black . && isort . && flake8 .`; Frontend: `npm run lint`, `npm run check` (lint + tsc), `npm test`. See [CONTRIBUTING.md](./CONTRIBUTING.md) “Single command to check”.

### 7.1 Consistency
- [x] **Formatter in use** – Black (backend, pyproject.toml); ESLint with fix (frontend); config in repo
- [x] **Linter in CI** – ESLint (frontend), Black/isort/Flake8 (backend) in .github/workflows/ci-cd.yml
- [x] **Import order** – isort (backend); ESLint import plugin (frontend)
- [x] **Line length** – 100 in Black/pyproject and Flake8; frontend consistent

### 7.2 Automation
- [x] **Pre-commit or CI** – CI runs format/lint and tests on push/PR
- [x] **Single command to check** – Backend and frontend commands in CONTRIBUTING; frontend `npm run check` = lint + tsc
- [x] **Type checking in CI** – Frontend: `npx tsc --noEmit` in CI; backend: no mypy (optional per summary)

---

## 8. Technical Debt & Hygiene

**Tracking:** See [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) for TODOs, known shortcuts, and commented-out code. Keep it updated when adding or resolving debt.

### 8.1 Debt Visibility
- [x] **TODOs/FIXMEs tracked** – Listed in [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) §8.1; add new TODOs there or link to a ticket
- [x] **Known shortcuts documented** – [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) “Known shortcuts” table; mitigation/ticket per shortcut
- [x] **No commented-out code blocks** – Removed or replaced with one-line ref; test placeholders documented in TECHNICAL_DEBT
- [x] **Deprecated code removed or scheduled** – `@deprecated` and fallback in code (e.g. `deprecationData`); removal when API stable

### 8.2 Dependency Hygiene
- [ ] **No unused dependencies** – Audit with depcheck (frontend) / pip-check (backend); remove or document
- [x] **Pinned/recorded versions** – Lockfiles committed; CI uses same versions as local
- [ ] **Outdated deps reviewed** – Run `npm outdated` / `pip list --outdated` periodically; track in backlog
- [x] **No duplicate dependencies** – Single version per package in package.json / requirements

### 8.3 Backend-Specific
- [x] **Migrations linear** – No unnecessary merge migrations; squashing policy if many migrations
- [x] **No raw SQL without review** – Raw SQL only in migrations where needed; documented in TECHNICAL_DEBT
- [ ] **Queries efficient** – `select_related`/`prefetch_related` used; add targeted N+1 checks for high-traffic endpoints
- [ ] **Admin/model registration** – Admin classes for models that need back-office access

### 8.4 Frontend-Specific
- [x] **No `console.log` in production path** – ESLint `no-console` (allow warn/error); `logError()` dev-only; production errors via reportError/Sentry (TECHNICAL_DEBT)
- [x] **Keys on lists** – Stable `key` used; index as key only where list is static
- [x] **Controlled inputs** – react-hook-form and controlled components used consistently
- [ ] **No inline object/array creation in render** – Avoid `style={{ }}`/`props={{ }}` in hot lists; refactor where it hurts performance

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
| Functions stay focused | ✅ | API/hook extraction done for data-circuits; pattern for other large pages. |
| Reasonable function/file length | ⚠ | ESLint `max-lines` (450) warns; several large files remain (see §1.3 audit), but `app/(app)/telecom-management/page.tsx` has been split into smaller pieces. |
| Cyclomatic complexity | ✅ | ESLint `complexity` (max 15) in frontend; Flake8 `--max-complexity=10` in backend CI. |
| Descriptive names | ✅ | Naming is generally clear and consistent. |
| Consistent naming | ✅ | Conventions in `docs/CODING_STANDARDS.md`. |
| Boolean naming | ✅ | `isLoading`, `hasError`-style used. |

## 2. Structure & Organization

| Item | Status | Notes |
|------|--------|--------|
| Clear layers | ✅ | Frontend: app → components → hooks/lib (see `docs/CODING_STANDARDS.md` layering section); backend: views → serializers → models/services. |
| No circular dependencies | ⚠ | Not audited with a tool; structure suggests few. |
| Backend: views thin | ✅ | Services used (e.g. ipam services, notifications); views delegate (see IPAM DHCP and subnet threshold viewsets). |
| Frontend: containers vs presentational | ✅ | Pages route/orchestrate; hooks own data/state (e.g. `useDataCircuits`, `useTelecomOverview`, `useIpSearchEnhanced`, `useSubnetThresholdDashboard`); components receive props. |
| Consistent structure | ✅ | App router `(app)/(auth)` segments; backend apps by domain; frontend split into `components/apps`, `hooks`, `lib`, `types`. |
| Colocation | ⚠ | Tests in `tests/`; many features colocate components/hooks/lib (e.g. IPAM `subnet-threshold-dashboard` + `useSubnetThresholdDashboard` + `SubnetThresholdTable`), but not consistently across all legacy areas. |
| Barrel exports | ⚠ | Barrel indexes (e.g. feature `index.ts` files) used in several areas per `docs/CODING_STANDARDS.md`, but not systematically across the whole frontend. |
| Backend: app-per-domain | ✅ | Django apps organized by domain (users, assets, ipam, etc.) as shown in backend `apps/` layout. |
| Frontend: feature or type folders | ⚠ | Newer features follow `app/(app)/feature`, `components/apps/feature`, `hooks/feature`, `types/feature.ts`; some older code is still more ad hoc. |
| Explicit dependencies | ✅ | Imports and configuration are explicit; no reliance on global mutable state beyond well-defined settings/env. |
| Loose coupling | ⚠ | Layers and hooks help keep concerns separated (e.g. IPAM dashboards depend on hooks and API clients, not backend services directly), but some components and views still know about multiple layers or concrete implementations. |
| Shared types in one place | ✅ | Frontend uses `types/` modules; backend contracts defined via DRF serializers and shared DTOs per coding standards. |
| No “god” objects | ✅ | No single catch-all `utils` or monolithic service; responsibilities split across feature modules, services, and helpers, with only intentional central configuration modules. |

## 3. Type Safety & Contracts

| Item | Status | Notes |
|------|--------|--------|
| TypeScript strict mode | ✅ | Standards require strict; tsconfig should reflect. |
| Avoid `any` | ⚠ | Some `any` in tests and a few app files; standards say avoid. |
| Explicit return types (public APIs) | ⚠ | Not consistently enforced. |
| API response types | ✅ | Typed API client; response types used. |
| Props interfaces | ✅ | Components use interfaces for props. |
| Python type hints | ⚠ | Used in places; not everywhere on public APIs. |
| Backend and frontend types in sync | ✅ | Backend exposes Swagger/OpenAPI schema at `/swagger.json`; frontend has `npm run generate:api-types` (uses `swagger2openapi` + `openapi-typescript`) to generate types into `src/frontend/types/openapi.d.ts` and keep contracts in sync. |
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
| Public API documented | ✅ | CONTRIBUTING §6 policy; JSDoc on lib/error-handler, lib/api-client/base; docstrings in backend. |
| Non-obvious logic explained | ✅ | CONTRIBUTING encourages “why” comments; applied in key areas. |
| TODOs tracked | ✅ | TECHNICAL_DEBT.md §8.1; CONTRIBUTING says add new TODOs there or ticket. |
| Deprecations marked | ✅ | CONTRIBUTING policy: @deprecated + migration path; e.g. deprecationData in asset-detail. |
| README/contributing | ✅ | README, CONTRIBUTING (run/test/lint, single command to check), DEVELOPMENT.md, TESTING.md. |

## 7. Formatting, Linting & Tooling

| Item | Status | Notes |
|------|--------|--------|
| Formatter | ✅ | Black (backend); ESLint --fix / npm run format (frontend). |
| Linter in CI | ✅ | ESLint (frontend); Black, isort, Flake8 (backend) in ci-cd.yml. |
| Import order | ✅ | isort (backend); ESLint (frontend). |
| Line length | ✅ | 100 in Black/pyproject and Flake8; frontend consistent. |
| Pre-commit or CI | ✅ | CI runs format check, lint, and tests. |
| Type checking in CI | ✅ | Frontend: `npx tsc --noEmit` in CI; npm run check = lint + tsc. |

## 8. Technical Debt & Hygiene

| Item | Status | Notes |
|------|--------|--------|
| TODOs/FIXMEs tracked | ✅ | [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) §8.1; resolved items marked ✅; remaining TODOs (e.g. form-submission, asset-workflow tests) listed. |
| Known shortcuts documented | ✅ | TECHNICAL_DEBT.md “Known shortcuts” table with mitigation/ticket. |
| No commented-out code blocks | ✅ | Removed or one-line ref; test placeholders in TECHNICAL_DEBT. |
| Unused dependencies | ⚠ | Not audited; add depcheck/pip-check to backlog. |
| Pinned/recorded versions | ✅ | requirements.txt, package-lock.json. |
| Migrations linear | ✅ | Django migrations; no merge issues noted. |
| Raw SQL | ✅ | Only in migrations; documented in TECHNICAL_DEBT. |
| N+1 / query efficiency | ⚠ | select_related/prefetch_related used; targeted audit for high-traffic endpoints. |
| No console.log in prod | ✅ | ESLint no-console; logError dev-only; reportError/Sentry for prod (TECHNICAL_DEBT). |
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

9. **Break up very large files** – Identify 400+ line files and split into smaller modules (see §1.3 audit table); data-circuits API/hook extracted.
10. **API type generation** – Consider OpenAPI → TypeScript types so frontend stays in sync with backend.
11. **Cyclomatic complexity** – ✅ ESLint `complexity` (max 15) and `max-lines` (450) enabled; fix warnings incrementally.
12. **Console in production** – Ensure no `console.log`/`console.error` in production code paths, or route through a logger that no-ops in prod.

Use this checklist during refactors and code reviews; update the comparison as the codebase changes.
