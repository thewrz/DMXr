# ui/ -- Frontend Utility Helpers

Server-side utilities that support the web UI and fixture data interchange.
These are pure functions with no Fastify or DMX dependencies.

## Key Files

| File | Purpose |
|------|---------|
| `channel-label.ts` | Abbreviates fixture names for compact DMX grid labels |
| `ofl-convert.ts` | Bidirectional conversion between OFL and DMXr fixture formats |
| `css-parser.ts` | Extracts CSS custom properties and selectors from stylesheets |

## What It Does

- **channel-label**: Strips noise words (led, stage, light, par, etc.) and
  produces 1-3 character abbreviations for fixture grid cells
- **ofl-convert**: Maps OFL channel types, categories, and capabilities to
  DMXr equivalents and back; builds OFL-schema-compliant export JSON from
  DMXr fixture definitions
- **css-parser**: Reads `public/css/style.css`, extracts `:root` variables
  and arbitrary property values; used by theme tests to enforce design tokens

## Connections

- **routes/** -- fixture import/export endpoints use `ofl-convert` functions
- **public/js/** -- browser-side OFL logic mirrors `ofl-convert` mappings
- **css-theme.test.ts** -- validates the SignalRGB-inspired color palette
  and layout constants via `css-parser`
