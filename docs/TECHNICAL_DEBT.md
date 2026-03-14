# Technical Debt & Hygiene

Tracking document for technical debt items. Use with [CODE_QUALITY_CHECKLIST.md](./CODE_QUALITY_CHECKLIST.md) §8.

**How to use:** When adding a TODO/FIXME in code, add a corresponding row below (or link to a ticket). When resolving, mark ✅ and add a short note or ticket ID.

---

## 8.1 Debt Visibility

### TODOs / FIXMEs (by area)

| Location | Description | Ticket/Ref | Status |
|----------|-------------|------------|--------|
| `lib/error-handler.ts` | Integrate with error reporting (e.g. Sentry); send to service in production | — | ✅ Done (lib/error-reporter.ts + logError) |
| `components/feedback/error-boundary.tsx` | Integrate with error reporting service (Sentry, etc.) | — | ✅ Done (reportError in componentDidCatch) |
| `lib/auth.ts` | Consider env-based check instead of hardcoded `https` for production | — | ✅ Done (NEXTAUTH_USE_SECURE_COOKIES in config) |
| `components/edit-company.tsx` | Save company edits to backend | — | ✅ Done (settingsApiClient.updateCompany) |
| `components/apps/assets/constants/asset-detail.ts` | Replace with actual deprecation calculation logic | — | ✅ Done (getDeprecationData) |
| `components/apps/assets/utils/validation.ts` | Edge case: `12.34.56` should be false | — | ✅ Done (parts.length !== 2) |
| `components/apps/assets/shared/form/AssetFormContext.tsx` | Allow asset relations with every entity (relatedItems) | — | ✅ Done (RelatedItemEntity type) |
| `components/locations/locations-list.tsx` | Hardcoded Circuits – replace with real data when API ready | — | ✅ Done (location.circuits_count) |
| **Asset detail mapping** (multiple files) | Map `asset.category`→type, `created_at`→createdAt, `managed_by`→teammate, `location`→location; map fields for SystemDetailsSection, CostDepreciationSection, HistorySection | — | ✅ Done (asset-detail-mapper.ts) |
| `components/apps/assets/pages/detail/AssetDetailHeader.tsx` | Implement alerts dialog | — | ✅ Done (onAlertsClick prop) |
| `components/apps/assets/AssetDetail.tsx` | Update asset with cost depreciation data | — | ✅ Done (updateAsset in CostDepreciationDialog onSave) |
| **Backend** `assets/serializers.py` | Add more chunks per step (upload) | — | ✅ Done (AssetLocationUsage, AssetCostDepreciation, AssetWarrantyAcquisition) |
| **Tests (placeholders)** | Implement: `auth.test.ts`, `auth-provider.test.tsx`, `select.test.tsx`, `api-client.test.ts`, `form-submission.test.tsx`, `useFormActions.test.ts`, `asset-workflow.test.tsx` | — | ✅ Done (auth, auth-provider, api-client, useFormActions, select; form-submission and asset-workflow E2E remain placeholders) |
| `tests/integration/form-submission.test.tsx` | Implement form submission integration tests (test-utils, userEvent, api-mock-helpers, AssetForm) | — | Open |
| `tests/e2e/asset-workflow.test.tsx` | Implement E2E: asset create, edit, delete, search/filter | — | Open |

### Known shortcuts

| Shortcut | Reason | Mitigation / ticket |
|----------|--------|----------------------|
| `console.error` / `console.warn` in catch blocks | No app-wide logger yet; `logError()` in error-handler is dev-only | Prefer `logError()` from `lib/error-handler` where you have an `AppError`; add Sentry (or similar) and route errors there (see error-handler TODOs). ESLint allows `warn`/`error`; `console.log` is disallowed. |
| Locations list “Circuits” | Hardcoded for now | Replace when circuits API is available (see locations-list TODO). |
| Asset detail field mapping | Backend shape differs from UI types | Centralize mapping in one place when refactoring asset detail (see asset detail mapping TODO). |
| Some raw SQL in migrations | Django migrations sometimes need raw SQL for data backfills | Keep in migrations only; document in migration if non-trivial. Application code uses ORM. |
| Pytest coverage in CI | Coverage was commented out | Re-enable `--cov` in pytest.ini or workflow and set threshold (see CODE_QUALITY_CHECKLIST quick wins). |

### Commented-out code

- **Resolved:** Commented blocks removed from `select.test.tsx` and `asset-workflow.test.tsx`; placeholders reference this doc. No remaining multi-line commented-out code in test files.

---

## 8.2 Dependency hygiene

- **Lockfiles:** `package-lock.json` and backend lockfile/requirements are committed; CI uses same versions.
- **Audit:** Run `npm run audit` / `pip audit` (or equivalent) periodically; track “outdated deps” in backlog.
- **Unused deps:** Not fully audited; add to backlog (e.g. `depcheck` for frontend, `pip-check` or manual for backend).

---

## 8.3 Backend-specific

- **Migrations:** Linear; no unnecessary merge migrations.
- **Raw SQL:** Only in migrations where needed; application code uses ORM. Review and document non-trivial raw SQL.
- **N+1 / queries:** `select_related` / `prefetch_related` used in many places; not fully audited—add targeted checks for high-traffic endpoints.

---

## 8.4 Frontend-specific

- **Console:** No `console.log` in production path (ESLint: `no-console` with `allow: ['warn','error']`). `logError()` only logs in development; production errors sent via `reportError()` in `lib/error-reporter.ts` (Sentry when `NEXT_PUBLIC_SENTRY_DSN` is set).
- **Keys on lists:** Stable `key` used; index as key only where list is static.
- **Controlled inputs:** react-hook-form and controlled components used consistently.
- **Inline objects in render:** Avoid `style={{ }}` / `props={{ }}` creating new refs every render where it hurts performance (e.g. in hot lists).

---

## Changelog

- **2025-03** – §8 technical debt fix: CODE_QUALITY_CHECKLIST §8 updated with TECHNICAL_DEBT.md refs; checklist and comparison table marked done where satisfied; removed obsolete TODOs (CostDepreciationSection, SystemDetailsSection); cleaned commented-out code in select.test, asset-workflow.test; added form-submission and asset-workflow placeholders to TODOs; updated 8.4 Console note (reportError/Sentry).
- **2025-03** – Implemented technical debt items: Sentry integration (error-reporter.ts), auth useSecureCookies, edit-company save to backend, deprecation calculation, validation 12.34.56, relatedItems type, locations circuits_count, asset detail mapper, alerts dialog, cost depreciation update, backend chunk serializers, and test placeholders (auth, auth-provider, api-client, useFormActions).
- **2025-03** – Initial technical debt doc; TODOs and known shortcuts consolidated from codebase scan.
