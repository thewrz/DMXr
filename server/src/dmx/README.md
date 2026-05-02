# dmx/ -- DMX Output Pipeline

## Data Flow

```
Color data (UDP/HTTP)
  -> DmxDispatcher                           route to correct universe
  -> MultiUniverseCoordinator                fan-out to per-universe managers
  -> UniverseManager.applyFixtureUpdate()    validate + clamp + write to driver
  -> DmxMonitor                              poll snapshots for SSE streaming
```

## Key Files

### universe-manager.ts
- Core DMX write interface: `applyFixtureUpdate`, `blackout`, `whiteout`, `resumeNormal`
- Tracks active channels, control mode (normal/blackout/whiteout)
- Motor safe positions restored during blackout/whiteout; channel locking for flash effects
- `DmxWriteResult { ok, error? }` propagated to API responses via `withDmxStatus`

### dmx-dispatcher.ts
- Unified facade hiding coordinator-vs-single-manager branching
- Optionally delegates to coordinator for universe-scoped operations

### multi-universe-coordinator.ts
- Delegates to per-universe managers via `ManagerProvider`
- Per-universe `blackout`/`whiteout`/`resumeNormal` and global `*All` variants
- Per-universe channel locking, safe position registration, and raw updates

### driver-factory.ts
- Creates dmx-ts driver instances for five driver types:
  - `enttec-usb-dmx-pro` / `enttec-open-usb-dmx` -- serial USB output
  - `artnet` -- UDP unicast/broadcast (Art-Net protocol)
  - `sacn` -- multicast UDP (E1.31 / sACN protocol)
  - `null` -- no-op for testing
- Lazy-imports drivers to avoid unused native serial bindings
- Serial drivers: `flushAndClose` for guaranteed final frame delivery
- Network drivers (ArtNet/sACN): connectionless, no `onDisconnect`

### Other Files
- `resilient-connection.ts` -- auto-reconnect with exponential backoff, replays snapshot
- `dmx-monitor.ts` -- polls snapshots at ~15fps for SSE; auto-starts/stops per subscriber count
- `connection-log.ts` -- ring buffer of `ConnectionEvent` records for diagnostics
- `connection-state.ts` -- `ConnectionState` type and `ConnectionEvent` interface
- `connection-pool.ts` -- manages connections for multi-universe setups
- `universe-registry.ts` -- persists universe configs to JSON with saveChain
- `serial-port-scanner.ts` -- auto-detects ENTTEC USB Pro via serial enumeration
- `error-messages.ts` -- user-friendly DMX error translation
