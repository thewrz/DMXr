# soundswitch/ -- SoundSwitch Fixture Library Client

Read-only client for the SoundSwitch local SQLite database, providing an
alternative fixture library source alongside the Open Fixture Library.

## What It Does

- Queries the SoundSwitch SQLite database for manufacturers, fixtures, modes,
  and channel attributes
- Maps SoundSwitch attribute type codes to DMXr channel types (`mapSsType`)
- Converts SoundSwitch modes into `FixtureChannel[]` arrays compatible with the
  fixture store, including correct default values via `fixture-capabilities`
- Classifies fixtures into categories (Moving Head, Scanner, Color Changer, etc.)
  based on their attribute types
- Auto-discovers the database file across Windows, macOS, and Linux paths

## Key Files

| File | Purpose |
|------|---------|
| `ss-client.ts` | SQLite client (better-sqlite3), search, channel mapping |
| `ss-db-finder.ts` | Platform-aware auto-discovery of the SoundSwitch .db file |
| `classify-fixture.ts` | Categorizes fixtures by their attribute type codes |

## Connections

- **fixtures/fixture-capabilities.ts** -- reuses `analyzeFixture` and
  `defaultValueForChannel` for strobe-aware default values
- **routes/** -- SoundSwitch browse/search/import endpoints consume `SsClient`
- **config/settings-store.ts** -- stores the configured database path
- **libraries/** -- SoundSwitch acts as a library source alongside OFL
