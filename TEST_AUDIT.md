# Test Suite Audit

**Date:** 2026-05-05  
**Framework:** Vitest 4.x  
**Test files:** 103 (main tier) + 6 UI + 1 contract  
**Tests:** 1675 passing, 11 skipped  
**Main suite wall time:** ~3.3s test execution, ~28s with import/transform

## Suite Map

| Tier | Config | Runner | Tests | CI? |
|------|--------|--------|-------|-----|
| Unit + HTTP integration | `vitest.config.ts` | `npm test` | 103 files, ~1675 tests | ✅ |
| UI/visual | `vitest.config.ui.ts` | `npm run test:ui` | 6 files | ❌ |
| Contract (live network) | `vitest.config.contract.ts` | `npm run test:contract` | 1 file | ❌ |
| E2E | `playwright.config` | `npm run test:e2e` | — | ❌ |

**CI job:** Single job runs `npm run test:coverage` (main tier only). No coverage gate — just reporting.

**Pyramid shape:** Mostly unit (pure function) + light HTTP integration (Fastify `app.inject()`). Good shape. The `app.inject()` tests hit real middleware, auth, CORS, and rate limiting — the right boundary. No mocks inside the server boundary. SSE tests drop to real HTTP (`http.get()` on `listen({ port: 0 })`).

---

## Anti-Patterns to Remove or Rewrite

### 1. Schema object inspection — `src/routes/schemas/fixture-schemas.test.ts` (entire file, 9 tests)

Tests assert on the raw JSON Schema data structure:
```
"requires name, mode, dmxStartAddress, channelCount, channels"
→ expect(addFixtureSchema.body.required).toEqual([...])

"dmxStartAddress has minimum 1"
→ expect(addFixtureSchema.body.properties.dmxStartAddress.minimum).toBe(1)
```

**Why this is wrong:** These tests assert that the schema _object_ has specific properties, not that Fastify _enforces_ those constraints. The actual validation behavior is already covered by `fixtures.test.ts` (`"returns 400 for missing required fields"`, `"returns 409 for overlapping addresses"`). The schema object tests will fail on any internal schema restructuring (renaming a key, switching to Zod, etc.) even when the HTTP behavior is unchanged.

**Action:** Delete the file entirely. No rewrite needed — the behavioral coverage already exists.

---

### 2. CSS design snapshot tests — `src/ui/css-theme.test.ts` (~20 of 29 tests)

Tests assert exact design token values:
```
"uses ultra-dark background" → expect(vars['bg']).toBe('#0f1119')
"uses teal accent"          → expect(vars['accent']).toBe('#00b8d4')
"btn has 4px radius"        → expect(extractPropertyValue(css, '.btn', 'border-radius')).toBe('4px')
"uses Segoe UI first"       → expect(fontFamily).toMatch(/^"Segoe UI"/)
"fixture-list has 0.75rem gap"
"main-content has 1.25rem padding"
"btn-primary has dark text on teal"
"sidebar-tabs has 1px border"
...
```

**Why this is wrong:** Every intentional design iteration (color tweak, spacing adjustment) will fail these tests even when nothing is broken. They pin _current values_, not _invariants_. They fail on pure refactors with no behavior change.

**Keep (real regression guards):**
- `"Decorative elements removed"` group — no `togglePulse` animation, no `brightness(1.4)`, no inset shadow. These guard against design regressions.
- `"Structural selectors preserved"` group — key CSS selectors exist. Guards against accidental deletion.
- `"uses top border instead of left border"` — specific layout choice with user-facing impact.

**Action:** Delete the 20 exact-value tests (Color palette, Fixture color palette, Spacing adjustments, Typography, Button text contrast, Border radius reduction, Border simplification). Keep the 9 structural/invariant tests.

---

### 3. Exported constant assertions — `src/fixtures/motor-guard.test.ts` (3 tests)

```
describe("MOTOR_CHANNEL_TYPES") { it("contains all 7 motor types") }
describe("DEFAULT_MOTOR_GUARD_BUFFER") { it("is 4") }
describe("SAFE_CENTER_POSITION") { it("is 128") }
```

**Why this is wrong:** `expect(DEFAULT_MOTOR_GUARD_BUFFER).toBe(4)` tests that a constant equals itself. If you intentionally change the buffer to 3, the test fails — but you already knew that, you changed it. These tests add zero protection.

**Action:** Delete the 3 constant-value `describe` blocks. The buffer value is exercised by `clampMotor` tests immediately below them.

---

### 4. Hardcoded template count — `src/fixtures/builtin-templates.test.ts` (1 test)

```
it("returns exactly 9 templates", () => {
  expect(templates).toHaveLength(9);
});
```

**Why this is wrong:** Adding a legitimate 10th template breaks this test even though the template passes all validation. The invariants that matter — uniqueness, valid schema, sequential offsets, correct color attributes — are already tested by the surrounding tests.

**Action:** Delete this one test. The count can be derived from "all template IDs are unique" + "every template passes validation."

---

### 5. Redundant test — `src/utils/format.test.ts` (1 test)

```
it("returns first 8 chars of a UUID", () => {
  expect(shortId("a1b2c3d4-e5f6-...")).toBe("a1b2c3d4");  ← same input
});

it("handles typical UUID", () => {
  expect(shortId("a1b2c3d4-e5f6-...")).toBe("a1b2c3d4");  ← identical invariant
  expect(result).toHaveLength(8);
});
```

Same function, same input, same assertion. The length assertion in the second test adds nothing (`"a1b2c3d4"` is obviously 8 chars and the first test already checked the exact value).

**Action:** Delete `"handles typical UUID"`.

---

### 6. Misleading test name — `src/bootstrap/dmx-setup.test.ts` (1 test)

```
it("pushes control_mode_changed on reconnect when blackout is active", async () => {
  ...
  // The mock manager has isBlackoutActive: () => false,
  // so no control_mode_changed is pushed. Let's just verify onStateChange works.
```

The test name says one thing, the body explicitly acknowledges it tests something else.

**Action:** Rename to `"onReconnect callback does not throw when blackout is inactive"` — which is what it actually verifies.

---

### 7. Fragmented single-function tests — `src/signalrgb/component-writer.test.ts` (8 tests)

`buildComponent` is tested with 8 separate `it()` blocks, each asserting one field of the return value:
```
it('Brand is always "DMXr"')
it('Type is always "DMX Fixture"')
it("LedCount is 1")
it("Width and Height are 1")
it("LedMapping is [0]")
it("LedCoordinates is [[0, 0]]")
it("LedNames has exactly 1 entry")
```

**Why this is wrong (mild):** Not dangerous, but 8 test setup/teardown cycles for one function is noise. Each failure requires looking at 7 other passing tests to understand context. A single test asserting the full shape fails with all context in one place.

**Action:** Consolidate into 1-2 `it()` blocks — one for the shape/metadata fields, one for the address-dependent fields.

---

### 8. Repeated setup across provider-existence tests — `src/bootstrap/library-setup.test.ts` (4 tests)

```
it("includes the OFL provider", () => {
  const { registry } = createLibraryStack(...);  // full setup
  expect(registry.getAll().some(p => p.id === "ofl")).toBe(true);
});
it("includes the builtin template provider", () => {
  const { registry } = createLibraryStack(...);  // full setup again
  expect(registry.getAll().some(p => p.id === "builtin")).toBe(true);
});
// ...two more times
```

**Action:** Merge into one test asserting all four providers are present. One `createLibraryStack()` call, four `expect` lines.

---

### 9. Real sleeps in unit tier — `src/bootstrap/shutdown.test.ts` (2 real sleeps)

```
await new Promise((r) => setTimeout(r, 100));  // line 51
await new Promise((r) => setTimeout(r, 50));   // line 333
```

Line 51 waits to verify an interval was cleared. This is timing-sensitive: on a very slow CI runner, the interval could fire in 100ms. `vi.useFakeTimers()` / `vi.advanceTimersByTime()` should be used instead.

Line 333 is in a SSE streaming test — may require a real timer but should be noted.

**Action:** Replace line-51 sleep with fake-timer `vi.advanceTimersByTime()` approach. Flag line 333 for human judgment.

---

### 10. Redundant state-specific tests — `src/dmx/connection-state.test.ts` (3 tests)

Tests 1–3 each verify one field of `createInitialStatus` for one state variant. Test 4 loops over all three states and verifies all fields. Tests 1–3 are a subset of test 4.

**Action:** Delete tests 1–3. Test 4 already covers every invariant they test.

---

### Needs Human Judgment

| File | Test | Issue |
|------|------|-------|
| `src/middleware/rate-limit.test.ts` | `"returns 429 when global limit exceeded"` | Fires 601 HTTP requests in-process. Tests `@fastify/rate-limit` behavior through config. Keep if config correctness matters; delete if the library is trusted. |
| `src/middleware/helmet.test.ts` | All 4 tests | Tests that helmet headers are present. These verify our plugin configuration, not helmet itself. Borderline third-party. |
| `src/mdns/advertiser.test.ts` | `"passes reuseAddr to Bonjour constructor"` | Tests constructor argument — implementation detail. But pins the bonjour integration contract. |
| `src/bootstrap/shutdown.test.ts` | `"clears movementInterval before calling blackout"` | Tests ordering via spy. Fragile. Worth keeping if order matters for hardware safety. |

---

## Gaps to Fill

### G1. Property-based tests for arithmetic modules

These modules have invariants that point tests can't exhaustively verify:

| Module | Invariant worth property-testing |
|--------|----------------------------------|
| `fixtures/motor-guard.ts` | `clampMotor(v)` always returns value in `[buffer, 255-buffer]` for any `v ∈ [0,255]` |
| `utils/cidr.ts` | Any IP in CIDR block matches; any IP outside doesn't; edge cases at boundary |
| `fixtures/pipeline-stages.ts` | Brightness-scaled output ≤ input for all `r,g,b ∈ [0,255]`, `brightness ∈ [0,1]` |
| `fixtures/movement-interpolator.ts` | After N ticks, position always converges to target; velocity stays ≤ maxVelocity |

`fast-check` is not yet in the project. Recommend adding it as a dev dependency.

### G2. UI tests not in CI

`src/ui-tests/*.ui.test.ts` (Playwright-based) are excluded from all CI jobs. UI regressions go completely undetected in CI. These should run in a separate slow job on PRs to main.

### G3. No regression pin for AUTH-C1

`src/middleware/api-key-auth.test.ts` has a comment referencing the AUTH-C1 bug (fail-open prefix allowlist). There's no commit SHA citation and no test that captures the exact pre-fix behavior as a regression guard. If the middleware is refactored, the specific bypass vector isn't documented as a test invariant.

### G4. Contract test exclusion from CI

`src/ofl/ofl.contract.test.ts` hits the live OFL API. It's rightly excluded from CI. But there's no scheduled run or cron job to detect OFL API schema drift. If OFL changes their API shape, the app will silently break at runtime.

---

## Proposed Refactor Plan

Ordered by confidence and impact. Each item is one commit.

| # | Action | Files | Rationale |
|---|--------|-------|-----------|
| 1 | **Delete** `src/routes/schemas/fixture-schemas.test.ts` | 1 file, 9 tests | Pure change detector; behavior covered by route tests |
| 2 | **Delete** 20 exact-value tests from `src/ui/css-theme.test.ts` | 1 file | Design snapshots masquerading as regression tests |
| 3 | **Delete** 3 constant-value tests from `src/fixtures/motor-guard.test.ts` | 1 file | Tautological; constants exercise themselves |
| 4 | **Delete** hardcoded template count from `src/fixtures/builtin-templates.test.ts` | 1 test | Change detector; other tests already validate correctness |
| 5 | **Delete** `"handles typical UUID"` from `src/utils/format.test.ts` | 1 test | Exact duplicate invariant of the preceding test |
| 6 | **Rename** misleading test in `src/bootstrap/dmx-setup.test.ts` | 1 test | Name says X, body tests Y |
| 7 | **Consolidate** `buildComponent` tests in `src/signalrgb/component-writer.test.ts` | 8 → 2 tests | Fragmented single-function coverage |
| 8 | **Consolidate** provider tests in `src/bootstrap/library-setup.test.ts` | 4 → 1 test | Repeated setup overhead |
| 9 | **Delete** tests 1–3 from `src/dmx/connection-state.test.ts` | 3 tests | Subset of test 4 |
| 10 | **Fix** real sleep in `src/bootstrap/shutdown.test.ts` line 51 | 1 test | Timing-sensitive; use `vi.advanceTimersByTime()` |
| 11 | **Add** `fast-check` property tests for `motor-guard.ts` | New tests | High-value arithmetic invariants |
| 12 | **Add** `fast-check` property tests for `cidr.ts` | New tests | Boundary behavior unreachable by point tests |
| 13 | **Add** `fast-check` property tests for `pipeline-stages.ts` | New tests | Color math monotonicity/boundedness |
| 14 | **Add** UI test job to `.github/workflows/ci.yml` | CI config | UI regressions currently invisible in CI |
| 15 | **Split** slow tests (SSE/streaming in `diagnostics.test.ts`) to separate CI job | CI config | Real sockets/timers belong in integration tier |

**Net test count change after items 1–10:** -39 tests (~2.3% of suite), zero regression risk, cleaner failure signal.

**Items 11–13** require `fast-check` (`npm install -D fast-check`). Pending your approval.

**Items 14–15** are CI config changes — pending your go/no-go on adding UI tests to CI (requires a running server for Playwright).
