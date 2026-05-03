# fixtures/ -- Fixture Store, Color Pipeline & Movement

## Stores
- `fixture-store.ts` -- CRUD for `FixtureConfig[]`, persisted to `./config/fixtures.json`
- `group-store.ts` -- fixture groups with membership tracking, persisted to `./config/groups.json`; supports add/update/remove groups, query groups by fixture ID, cascade-remove fixture from all groups
- `user-fixture-store.ts` -- user-created fixture templates (custom definitions)
- All stores use the `saveChain` pattern (see config/README) with 250ms debounced saves

## Color Pipeline (mapColor)

`channel-mapper.ts` runs a pipeline of stages in sequence:

```
whiteGateStage -> brightnessScaleStage -> calibrationStage -> whiteExtractionStage -> colorMappingStage
```

Each stage is a pure function `(PipelineContext) -> PipelineContext` (immutable pattern).

- **whiteGateStage** -- zeroes all channels unless input is near-white (basic strobe fixtures)
- **brightnessScaleStage** -- scales RGB by brightness when no dimmer channel exists
- **calibrationStage** (`calibration-stage.ts`) -- applies per-fixture gain/offset color calibration per RGB channel; `colorCalibration { gain: {r,g,b}, offset: {r,g,b} }` on fixture config
- **whiteExtractionStage** -- extracts common minimum from RGB into white channel (RGBW)
- **colorMappingStage** -- maps channels by type (ColorIntensity, Intensity, Strobe, Pan/Tilt)

## Channel Remap
- `channel-remap.ts` -- pure address-translation layer for fixtures with swapped channels
- `resolveAddress(fixture, logicalOffset)` -> absolute DMX address with remap applied
- Integrated into both color pipeline (`channel-mapper.ts`) and override service

## Overrides
- `fixture-override-service.ts` -- `computeOverrideChannels()` computes DMX values for manual overrides
- Motor-safe clamping via `motor-guard.ts` applied to Pan/Tilt/Focus/Zoom channels
- Disabled motor overrides revert to safe center position; non-motor channels revert to `defaultValue`
- Uses `resolveAddress()` for remap-aware DMX addressing

## Movement Engine
- `movement-interpolator.ts` -- `MovementEngine` class manages pan/tilt state per fixture
- 16-bit internal math, smoothing curves (linear, ease-in-out, s-curve via smoothstep)
- `movement-tick.ts` -- 25ms tick handler converts engine output to DMX channel writes
- `movement-types.ts` -- `MovementConfig`, `MovementTarget`, `MovementState`, `PanTiltOutput`

## Other Files
- `motor-guard.ts` -- clamps motor channels to safe range (avoids mechanical extremes)
- `fixture-capabilities.ts` -- `analyzeFixture()` derives capabilities from channel definitions
- `fixture-validator.ts` -- validates fixture add/update requests
- `color-pipeline.ts` -- `processColorBatch()` batch-processes color entries for all fixtures
- `builtin-templates.ts` -- hardcoded generic fixture templates (RGB PAR, dimmer, etc.)
- `user-fixture-validator.ts` -- validates user-created fixture template definitions
- `user-fixture-types.ts` -- TypeScript types for user fixture templates
