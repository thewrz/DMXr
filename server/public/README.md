# public/ -- Web UI (Alpine.js)

## Architecture

Single-page application built with Alpine.js (no build step). The UI is the
DMXr Fixture Manager accessed at `http://localhost:8080`.

## Script Load Order (index.html)

1. `alpine.min.js` (deferred) -- Alpine.js framework
2. Utility scripts loaded first: `channel-label.js`, `drag-drop.js`
3. Feature mixins (load order matters for aggregators):
   `motor-guard.js`, `fixture-reset.js`, `color-calibration.js`,
   `fixture-crud.js`, `fixture-controls.js`, `fixture-manager.js`,
   `library-browser.js`, `search.js`, `settings.js`, `latency.js`,
   `setup-wizard.js`, `ofl-export.js`, `custom-fixture.js`,
   `fixture-icons.js`, `dmx-monitor.js`, `batch.js`, `config.js`,
   `color-swatch.js`, `channel-remap.js`, `groups.js`, `connection-log.js`,
   `log-panel.js`, `selection-core.js`, `selection-actions.js`, `selection.js`,
   `movement.js`, `onboarding.js`, `action-feedback.js`
4. `app.js` -- main entry, loaded last

## Mixin Pattern (app.js)

Each feature JS file exports a factory function (e.g., `dmxrSettings()`) that
returns an object with data properties and methods. `app.js` defines `dmxrApp()`
which creates the base app object, then merges all mixins using
`Object.defineProperties` to preserve getters. Some mixins are aggregators:
- `fixture-manager.js` merges `fixture-crud.js` + `fixture-controls.js`
- `selection.js` merges `selection-core.js` + `selection-actions.js`

The `<body>` tag uses `x-data="dmxrApp()"` and `x-init="init()"` to bootstrap.

## CSS Organization

Feature-scoped CSS files split from a single `style.css`:
- `style.css` -- base layout, header, sidebar, fixture cards, modals
- `settings.css`, `latency.css`, `custom-fixture.css`, `monitor.css`,
  `channel-remap.css`, `groups.css`, `log-panel.css`, `extras.css`

## Static Assets

- `images/` -- SVG logos, favicon (ICO + SVG)
