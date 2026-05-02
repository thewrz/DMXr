# routes/ -- Fastify REST API

## API Surface

| Route file | Prefix | Purpose |
|------------|--------|---------|
| `health.ts` | GET /health | Server status, DMX state, universe info |
| `update.ts` | POST /update | Direct DMX channel updates |
| `fixtures.ts` | /fixtures | CRUD for fixture configurations |
| `fixture-batch.ts` | /fixtures/batch | Batch add/remove fixtures |
| `fixture-colors.ts` | /fixtures/:id/colors | Current RGB extraction from DMX snapshot |
| `fixture-reset.ts` | /fixtures/:id/reset, reset-info | Trigger reset channel (auto-detect or configured) |
| `fixture-test.ts` | /fixtures/:id/test | Flash, flash-hold/release, identify actions |
| `control.ts` | /control | Blackout, whiteout, resume, flash, channel overrides |
| `control-modes.ts` | /control/blackout, /control/whiteout | Universe-scoped blackout/whiteout (with universeId) |
| `debug.ts` | /debug/fixture/:id | Diagnostic dump: DMX snapshot, overrides, capabilities |
| `logs.ts` | /api/logs | Log buffer query, clear, SSE stream (/api/logs/stream) |
| `ofl.ts` | /ofl | OFL manufacturer/fixture/mode browsing |
| `ofl-cache.ts` | /ofl/cache | Disk cache stats and management |
| `libraries.ts` | /libraries | Library provider listing and browsing |
| `search.ts` | /search | Unified fixture search across all providers |
| `settings.ts` | /settings | Server settings CRUD |
| `config.ts` | /config | Combined fixture + settings export/import |
| `signalrgb.ts` | /signalrgb | SignalRGB component JSON generation |
| `user-fixtures.ts` | /user-fixtures | Custom fixture template CRUD |
| `universes.ts` | /universes | Multi-universe configuration |
| `monitor.ts` | /monitor | SSE streaming of DMX channel data |
| `metrics.ts` | /metrics, /metrics/prometheus | Latency stats + Prometheus text format |
| `remap-presets.ts` | /remap-presets | Channel remap preset CRUD |
| `groups.ts` | /groups | Fixture group CRUD |
| `group-control.ts` | /groups/:id/{blackout,whiteout,flash,resume} | Group-level control with timed flash |
| `diagnostics.ts` | /diagnostics | Connection event log |
| `movement.ts` | /movement | Pan/tilt movement targets |

## Patterns

### Schema Validation
`schemas/fixture-schemas.ts` exports Fastify JSON Schema objects used as `schema.body`
and `schema.response` in route definitions. Fastify validates and serializes automatically.

### Response Helpers (`response-helpers.ts`)
- `successResponse(data)` -> `{ success: true, ...data }`
- `errorResponse(error, hint?)` -> `{ success: false, error, hint? }`
- `withDmxStatus(data, dmxResult?)` -> attaches `dmxStatus: "ok"|"error"` from `DmxWriteResult`

### Timer Management
Routes with timed effects (flash, reset hold) store timers in a `Map<string, Timeout>`.
These maps are collected in `server.ts` and cleared during shutdown.
