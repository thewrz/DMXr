# metrics/ -- Pipeline Latency Tracking

Measures end-to-end performance of the color data pipeline using rolling
circular buffers. Each pipeline segment is tracked independently so
bottlenecks are visible at a glance.

## Tracked Segments

| Segment | What it measures |
|---------|-----------------|
| `network` | UDP packet receive latency |
| `colorMap` | Fixture color-mapping duration |
| `dmxSend` | Hardware DMX write duration |
| `totalProcessing` | Full packet-to-DMX wall time |

Each segment reports min, avg, p95, p99, and sample count over a rolling
window (default 1000 samples). Packets-per-second is computed from a
sliding 1-second window.

## Key Files

### latency-tracker.ts
- `createLatencyTracker(bufferSize?)` -- factory returning a `LatencyTracker`
- `record*()` methods called by UDP color server and DMX setup bootstrap
- `getMetrics()` returns a snapshot of all segments plus packets/sec
- Circular buffer uses `Float64Array` for zero-allocation steady state

## Connections

- **Producers**: `udp-color-server.ts` records network and colorMap timings;
  `dmx-setup.ts` / `multi-universe-setup.ts` record dmxSend timings
- **Consumer**: `routes/metrics.ts` exposes `GET /metrics` (JSON) and
  `GET /metrics/prometheus` (Prometheus-style) using `getMetrics()`
- **Web UI**: `public/js/settings.js` polls `/metrics` for the dashboard
