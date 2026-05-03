# signalrgb/ -- SignalRGB Component Generation

Generates SignalRGB-compatible component JSON files so DMX fixtures
appear as first-class devices in the SignalRGB layout editor.

## Key Files

### component-writer.ts

- `buildComponent(fixture)` -- creates a `SignalRgbComponent` object with
  brand "DMXr", display name including DMX address, and a 1x1 LED grid
- `writeComponentFile(fixture, dir?)` -- writes a single component JSON
  to the SignalRGB Components directory
- `syncAllComponents(fixtures, dir?)` -- writes component files for every
  configured fixture
- `getComponentsDir()` -- resolves the output path; respects
  `SIGNALRGB_COMPONENTS_DIR` env var for Windows service compatibility
  (where `homedir()` returns the SYSTEM profile)

## Connections

- **Called by**: `routes/signalrgb.ts` exposes `POST /signalrgb/sync`
  (bulk write) and `GET /signalrgb/component/:id` (single preview)
- **Input**: `FixtureConfig` from `types/protocol.ts`, sourced from the
  fixture store
- **Output**: JSON files written to
  `~/Documents/WhirlwindFX/Components/DMXr_<name>.json`
- **Plugin side**: `DMXr.js` at repo root uses these components to create
  canvas tiles via CompGen
