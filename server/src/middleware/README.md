# middleware/ -- API Security Layer

Fail-closed API key authentication, CORS, Content Security Policy, and
rate limiting. All state-mutating and data-reading routes require a valid
`x-api-key` header unless explicitly exempted.

## Key Files

### api-key-auth.ts
- `registerApiKeyAuth(app, apiKey)` -- Fastify `onRequest` hook
- Fail-closed: every route requires `x-api-key` except a small explicit
  allowlist (health, favicon, static assets)
- Timing-safe comparison via `crypto.timingSafeEqual` to prevent
  side-channel leaks

### CORS, Helmet, Rate Limiting
Configured in `server.ts` (not separate middleware files); tests live here:

- `cors.test.ts` -- verifies origin allowlist (default localhost, custom
  via `corsOrigin` config)
- `helmet.test.ts` -- validates CSP and security headers
- `rate-limit.test.ts` -- confirms per-IP throttling behavior

## Connections

- **Registered by**: `server.ts` during Fastify app setup
- **Config source**: `config/server-config.ts` provides `apiKey` and
  `corsOrigin` values
- **Downstream**: all route handlers rely on the auth hook running first;
  public routes bypass it via `isPublicRoute()`
