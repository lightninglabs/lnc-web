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

`LNC` (lib/lnc.ts) is the main public class. It delegates to:

- **WasmManager** (lib/wasmManager.ts) — WASM binary lifecycle, connection management, RPC proxying via `wasmClientInvokeRPC`.
- **CredentialOrchestrator** (lib/credentialOrchestrator.ts) — Routes to the correct credential store based on config.

**Credential store selection:** If `enableSessions || allowPasskeys` → `UnifiedCredentialStore` (strategy-based: password/passkey/session). Otherwise → `LncCredentialStore` (legacy, CryptoJS AES). If a custom `credentialStore` is provided in config, it's used directly.

**RPC flow:** Typed API call → `createRpc.ts` Proxy → `wasmClientInvokeRPC` → WASM → response parsed from JSON → `snakeKeysToCamel` conversion → returned to caller.

## Key Files (read in this order)

| File | Purpose |
|------|---------|
| lib/types/lnc.ts | All public interfaces (`LncConfig`, `CredentialStore`, `UnlockOptions`, etc.) |
| lib/lnc.ts | Main `LNC` class — the public API surface |
| lib/credentialOrchestrator.ts | Credential store routing and auth orchestration |
| lib/wasmManager.ts | WASM binary loading, connection lifecycle, RPC bridge |
| lib/stores/unifiedCredentialStore.ts | Modern auth (password + passkey + session strategies) |
| lib/util/credentialStore.ts | Legacy auth (CryptoJS password encryption) |
| lib/api/createRpc.ts | Proxy-based RPC function creation |
| lib/index.ts | Entry point — loads wasm_exec.js, re-exports everything |

**Files that change together:**
- `lib/lnc.ts` + `lib/types/lnc.ts` — feature additions need both
- `lib/credentialOrchestrator.ts` + credential stores — auth flow changes
- Source file + colocated `.test.ts` — always add/update tests with changes

## Code Conventions

**Formatting:** Single quotes, no trailing commas, 2-space indent, semicolons, 80-char width.

**Patterns:**
- Class-based with explicit interfaces. Default export for main classes, named exports for utilities.
- Strategy pattern for authentication (`AuthStrategy` interface).
- Error handling: `try/catch` with `log.error('[ClassName] message:', error)`. Return `boolean` for unlock/validation flows, `throw` for critical failures.
- Async/await everywhere. No `.then()` chains.
- Logging with context prefix: `log.info('[ClassName] message')`. Loggers: `log`, `grpcLog`, `wasmLog`, `actionLog`.
- Private fields use underscore prefix (`_namespace`, `_wasmClientCode`).

**Exports in lib/index.ts:**
- `export default LNC` — the main class
- `export { CredentialOrchestrator, WasmManager }` — named exports for advanced use
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
- No migration path between legacy `LncCredentialStore` and `UnifiedCredentialStore`. Switching store types requires re-pairing.
- Legacy store: setting `password` triggers immediate encrypt/decrypt and then **wipes in-memory plaintext** via `clear(true)`. After setting password, credential getters return empty strings until decryption.
- Orchestrator uses `instanceof UnifiedCredentialStore` checks (3 places). Custom stores that don't extend it may break.
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
