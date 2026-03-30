# Agent Instructions

<!-- THIS IS THE CANONICAL SOURCE for agent instructions across all harnesses. -->
<!-- Edit THIS file (.ai-docs/AGENTS.md), then run `yarn ai:sync` to regenerate CLAUDE.md and other outputs. -->
<!-- Do NOT edit CLAUDE.md directly — it will be overwritten on sync. -->

`@lightninglabs/lnc-web` is a TypeScript npm library that connects web browsers to Lightning Network nodes via LNC. It loads a Go WASM binary that communicates through an LNC mailbox proxy, providing typed RPC access to LND, Loop, Pool, Faraday, Taproot Assets, and Lightning Terminal.

## Commands

```bash
yarn build              # Production webpack build → dist/index.js (UMD)
yarn dev                # Webpack watch mode
yarn test               # Run all tests (vitest)
yarn test -- --grep "pattern"  # Run specific tests
yarn test:watch         # Watch mode
yarn test:coverage      # Coverage report
yarn lint               # ESLint (flat config)
yarn typecheck          # Type-check only (tsconfig.typecheck.json)
yarn prettier           # Check formatting
yarn prettier-write     # Fix formatting
```

**Pre-push:** `yarn typecheck && yarn lint && yarn test && yarn build`

## Architecture

Two public entrypoints:

- **LightningNodeConnect** (lib/lightningNodeConnect.ts) — Modern entrypoint supporting password, passkey, and session-based authentication. Credential lifecycle is managed internally through the auth stack (`AuthenticationCoordinator`, `StrategyManager`, `SessionCoordinator`). Does not expose a public `CredentialStore`.
- **LNC** (lib/lnc.ts) — Legacy password-only facade. Manages its own credential lifecycle via `CredentialStore`, with post-connect cleanup handled in `LNC.connect()`.

Both delegate to:

- **WasmManager** (lib/wasmManager.ts) — WASM binary lifecycle, connection management, RPC proxying via `wasmClientInvokeRPC`. Accepts `ConnectionParams` and `ConnectionCallbacks` (no mutable `CredentialProvider`).

**Auth stack (modern entrypoint):** `StrategyManager` selects the correct `AuthStrategy` (password/passkey/session) based on unlock options. `AuthenticationCoordinator` orchestrates unlock and credential caching. `SessionCoordinator` manages session creation and auto-restore.

**RPC flow:** Typed API call → `createRpc.ts` Proxy → `wasmClientInvokeRPC` → WASM → response parsed from JSON → `snakeKeysToCamel` conversion → returned to caller.

## Key Files (read in this order)

| File | Purpose |
|------|---------|
| lib/lightningNodeConnect.ts | Modern `LightningNodeConnect` class — password/passkey/session auth |
| lib/types/lightningNodeConnect.ts | Types for the modern entrypoint (`LightningNodeConnectConfig`, `UnlockOptions`, etc.) |
| lib/types/baseConnection.ts | Shared connection fields between legacy and modern entrypoints |
| lib/lnc.ts | Legacy `LNC` class — password-only facade |
| lib/types/lnc.ts | Legacy public interfaces (`LncConfig`, `CredentialStore`) |
| lib/wasmManager.ts | WASM binary loading, connection lifecycle, RPC bridge |
| lib/stores/authenticationCoordinator.ts | Unlock orchestration and credential caching |
| lib/stores/strategyManager.ts | Auth strategy selection (password/passkey/session) |
| lib/stores/sessionCoordinator.ts | Session creation, refresh, and auto-restore |
| lib/util/credentialStore.ts | Legacy auth (CryptoJS password encryption) |
| lib/api/createRpc.ts | Proxy-based RPC function creation |
| lib/index.ts | Entry point — loads wasm_exec.js, re-exports everything |

**Files that change together:**
- `lib/lightningNodeConnect.ts` + `lib/types/lightningNodeConnect.ts` — modern entrypoint changes
- `lib/lnc.ts` + `lib/types/lnc.ts` — legacy entrypoint changes
- `lib/stores/authenticationCoordinator.ts` + strategy files — auth flow changes
- Source file + colocated `.test.ts` — always add/update tests with changes

## Code Conventions

**Formatting:** Single quotes, no trailing commas, 2-space indent, semicolons, 80-char width.

**Patterns:**
- Class-based with explicit interfaces. Default export for main classes, named exports for utilities.
- Strategy pattern for authentication (`AuthStrategy` interface).
- Error handling: `try/catch` with `log.error('message:', error)`. Return `boolean` for unlock/validation flows, `throw` for critical failures.
- Async/await everywhere. No `.then()` chains.
- Scoped logging via `createLogger`: `import { createLogger } from '../util/log'; const log = createLogger('ClassName');`. Remaining singletons: `log` (main), `wasmLog` (wasm).
- Private fields use underscore prefix (`_namespace`, `_wasmClientCode`).

**Exports in lib/index.ts:**
- `export default LNC` — the legacy entrypoint
- `export { LightningNodeConnect, WasmManager }` — modern entrypoint and advanced use
- `export type { LncConfig, CredentialStore }` — legacy types
- `export type { LightningNodeConnectConfig, SessionConfig, UnlockMethod, ... }` — modern types
- `export * from '@lightninglabs/lnc-core'` — full re-export of typed APIs

## Testing

Vitest with globals enabled (no imports needed for `describe`/`it`/`expect`). Setup in `test/setup.ts` mocks localStorage, sessionStorage, WebAssembly, crypto, and Go constructor. Use `createMockSetup()` from `test/utils/mock-factory` for test environment setup and `testData` from `test/utils/test-helpers` for common values. WASM binary is never loaded in tests — only JS wrapper logic is tested. `any` is allowed in test files.

## Coverage

**Target: 100%.** Run `yarn test:coverage` before submitting. Every branch, error path, and boundary condition must be tested. No `/* v8 ignore */` without a comment justifying why the line is untestable.

## Gotchas

**WASM & Connection:**
- WASM callbacks (`onLocalPrivCreate`, `onRemoteKeyReceive`, `onAuthData`) set credentials asynchronously. Do not assume credentials are available immediately after `run()`.
- Connection timeout is hardcoded: 20 attempts x 500ms = 10 seconds. Not configurable.
- Errors from WASM are plain strings, not JSON. The RPC layer tries `JSON.parse()`, and on failure wraps the raw string in an `Error`.
- `unload` event listener for disconnect is only added after successful connection. Partial connection failures may leave dangling state.

**Credential Stores:**
- The modern `LightningNodeConnect` entrypoint manages credentials internally — no public `CredentialStore` is exposed.
- The legacy `LNC` entrypoint uses `LncCredentialStore` (CryptoJS AES). Setting `password` triggers immediate encrypt/decrypt and then **wipes in-memory plaintext** via `clear(true)`. After setting password, credential getters return empty strings until decryption.
- No migration path between legacy and modern auth. Switching entrypoints requires re-pairing.
- `serverHost` from config is only set on first pairing. To switch servers, call `clear()` first.

**Config:**
- `namespace: ''` and `wasmClientCode: ''` fall back to defaults due to `||` operator (not `??`).
- Config merge is shallow (`Object.assign`). No deep merging of nested objects.

**Browser/Storage:**
- Session credentials are stored as **plaintext in sessionStorage** (by design, for passwordless auto-restore).
- All storage access is guarded by `typeof localStorage === 'undefined'` for SSR. Operations silently no-op if storage is unavailable.
- Passkey support requires the experimental WebAuthn PRF extension. Types are manually defined since PRF is not in standard TypeScript typings.
- `Buffer.from()` usage in passkey service works only because webpack provides `NodePolyfillPlugin`.

**Sessions:**
- `AuthenticationCoordinator` starts async `tryAutoRestore()` in its constructor (not awaited). Methods that need it call `waitForSessionRestoration()` internally.
- Session expiry is client-side only (`Date.now() > expiresAt`). Wrong client clocks cause premature or delayed expiry.

## Dependencies

- `@lightninglabs/lnc-core` — Typed API classes (LndApi, LoopApi, etc.), `snakeKeysToCamel`, `subscriptionMethods`. Re-exported entirely from this package. Breaking changes in lnc-core automatically break lnc-web.
- `crypto-js` — AES encryption. Pattern: always `JSON.stringify` before encrypt, `JSON.parse` after decrypt.
