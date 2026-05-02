# logging/ -- Pipeline Logger & Log Buffer

## pipeline-logger.ts

Verbose DMX pipeline tracing for debugging channel mapping, color processing,
and DMX output. Separate from Fastify's logger since pipeline events fire at
high frequency on the UDP hot path.

### Log Levels

`error` < `warn` < `info` < `debug` < `verbose`

Set via `PIPELINE_LOG` env var (defaults to `"verbose"`).

### Key Exports

- `pipeLog(level, msg)` -- writes `[PIPE:TAG] msg` to stdout if level is enabled
- `shouldSample(key, intervalMs=5000)` -- rate-limited logging for hot paths
- `resetSample(key)` / `resetAllSamples()` -- force next log to fire
- `setPipelineLogLevel(level)` / `getPipelineLogLevel()`
- `parsePipelineLogLevel(raw)` -- safely parses env var string

## log-buffer.ts

Ring buffer for structured log entries with filtering and pub-sub for SSE streaming.

### Key Types

- `LogEntry { timestamp, level, source, message, details? }`
- `LogLevel`: `error` | `warn` | `info` | `debug`
- `LogSource`: `connection` | `pipeline` | `server` | `api`
- `LogBufferFilters { level?, source?, since?, limit? }`

### Key Exports

- `createLogBuffer(options?)` -- creates a `LogBuffer` instance (default 1000 entries)
- `LogBuffer.push(entry)` -- appends entry, evicts oldest if full, notifies subscribers
- `LogBuffer.getEntries(filters?)` -- query by level threshold, source, timestamp, limit
- `LogBuffer.subscribe(cb)` -- returns unsubscribe function; used by SSE routes
- `LogBuffer.clear()` -- empties all entries

### Usage

The log buffer collects events from multiple sources (connection state changes,
API requests, pipeline diagnostics) and streams them to the web UI via SSE.
Level filtering uses ranked comparison so requesting `warn` returns both
`warn` and `error` entries.
