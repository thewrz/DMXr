# ui-tests/ -- Web UI Integration Tests

Puppeteer-based integration tests that exercise the Alpine.js web UI against
a real Fastify server instance with mocked DMX hardware.

## Test Files

| File | Coverage Area |
|------|---------------|
| `fixture-crud.ui.test.ts` | Add, edit, delete fixtures via the UI |
| `multi-select.ui.test.ts` | Shift-click, select-all, bulk operations |
| `grid-rendering.ui.test.ts` | DMX grid layout, channel labels, color display |
| `error-states.ui.test.ts` | Error banners, offline indicators, validation |
| `settings-modal.ui.test.ts` | Settings dialog interactions |
| `responsive-layout.ui.test.ts` | Viewport breakpoints, mobile layout |

## Helpers

Located in `helpers/`:

| File | Purpose |
|------|---------|
| `server-harness.ts` | Spins up a Fastify instance with temp fixture/settings stores |
| `browser-harness.ts` | Launches and manages a headless Puppeteer browser |
| `alpine-helpers.ts` | Waits for Alpine.js state, reads fixture counts |
| `api-client.ts` | HTTP helper for test setup/teardown (add/delete fixtures) |
| `screenshot.ts` | Captures screenshots on test failure for debugging |

## How It Works

Each test suite starts a real server (mocked DMX universe, temp JSON files)
and opens a headless browser. Tests interact with the UI via Puppeteer
selectors and verify state through Alpine.js data bindings and DOM assertions.

## Running

```bash
cd server
npm test -- --grep "ui.test"
```
