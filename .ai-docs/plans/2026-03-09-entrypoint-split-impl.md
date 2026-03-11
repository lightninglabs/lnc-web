# LNC / LightningNodeConnect Entry Point Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore `LNC` to a legacy password-only facade and introduce `LightningNodeConnect` as the modern passkeys/sessions entrypoint without changing the package default export or adding a named `LNC` alias.

**Architecture:** Keep `WasmManager` and RPC generation shared, but do not add a transport wrapper. Refactor `WasmManager` to accept `ConnectionParams` (plain data) and `ConnectionCallbacks` (key-update hooks) instead of storing a mutable credential provider. `LNC` goes back to the post-`WasmManager` shape from commit `44a844c88adb9bb692fa70b46e8f33a74cbd3768`, providing callbacks that write keys into `LncCredentialStore`. `LightningNodeConnect` owns the modern auth/session stack directly, providing callbacks that write keys into `CredentialCache`, and does not expose a public `CredentialStore`.

**Tech Stack:** TypeScript, Vitest, WebAssembly client runtime, `@lightninglabs/lnc-core`

---

## Preconditions

- Work in a dedicated worktree/branch before touching implementation.
- Treat `.ai-docs/plans/2026-03-09-lnc-entrypoint-split.md` as the approved design source.
- Keep the current WASM URL and package version unless a failing test proves the older value is required.
- Do not recreate `CredentialOrchestrator` in another form. If the modern path needs one private helper, keep it modern-only and internal.

### Task 1: Decouple `createRpc` from concrete `LNC`

**Files:**
- Modify: `lib/api/createRpc.ts`
- Modify: `lib/api/createRpc.test.ts`

**Step 1: Write the failing test**

In `lib/api/createRpc.test.ts`, remove the concrete `LNC` typing from the mock and replace it with an inline structural client type:

```typescript
type RpcClient = {
  request: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

const mockClient: RpcClient = {
  request: vi.fn(),
  subscribe: vi.fn()
};
```

Update all assertions to reference `mockClient` instead of `mockLnc`.

**Step 2: Run typecheck to verify it fails**

Run: `yarn typecheck`

Expected: FAIL because `createRpc` still depends on concrete `LNC`, while the updated test uses only a structural client type.

**Step 3: Implement the minimal change**

Update `lib/api/createRpc.ts` to use an inline structural type:

```typescript
type RpcClient = {
  request<TRes>(method: string, request?: object): Promise<TRes>;
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ): void;
};
```

Change the function signature to:

```typescript
export function createRpc<T extends object>(
  packageName: string,
  client: RpcClient
): T
```

Replace all internal references from `lnc` to `client`.

**Step 4: Run verification**

Run:

```bash
yarn typecheck
npx vitest run lib/api/createRpc.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/api/createRpc.ts lib/api/createRpc.test.ts
git commit -m "refactor: decouple createRpc from LNC"
```

---

### Task 2: Split shared, legacy, and modern public types

**Files:**
- Create: `lib/types/baseConnection.ts`
- Create: `lib/types/lightningNodeConnect.ts`
- Modify: `lib/types/lnc.ts`
- Modify: `lib/lnc.ts`
- Modify: `lib/index.ts`
- Modify: `lib/encryption/encryptionService.ts`
- Modify: `lib/encryption/passwordEncryptionService.ts`
- Modify: `lib/encryption/passkeyEncryptionService.ts`
- Modify: `lib/repositories/credentialRepository.ts`
- Modify: `lib/repositories/passwordCredentialRepository.ts`
- Modify: `lib/repositories/passkeyCredentialRepository.ts`
- Modify: `lib/sessions/sessionManager.ts`
- Modify: `lib/sessions/sessionRefreshManager.ts`
- Modify: `lib/stores/authStrategy.ts`
- Modify: `lib/stores/authenticationCoordinator.ts`
- Modify: `lib/stores/passwordStrategy.ts`
- Modify: `lib/stores/passkeyStrategy.ts`
- Modify: `lib/stores/sessionStrategy.ts`
- Modify: `lib/stores/strategyManager.ts`

**Step 1: Write the failing typecheck expectation**

Prepare the type split so the following is the intended shape:

- `lib/types/baseConnection.ts` exports shared connection fields
- `lib/types/lnc.ts` only contains legacy config/store/WASM types
- `lib/types/lightningNodeConnect.ts` contains modern auth/session types and config

No runtime test is required first; use `yarn typecheck` as the failing verification gate after the refactor.

**Step 2: Implement the shared base types**

Create `lib/types/baseConnection.ts` with:

```typescript
export interface BaseConnectionConfig {
  serverHost?: string;
  wasmClientCode?: string;
  namespace?: string;
  pairingPhrase?: string;
}
```

**Step 3: Restore legacy types**

Update `lib/types/lnc.ts` so it contains:

- `WasmGlobal`
- `CredentialStore`
- `LncConfig extends BaseConnectionConfig` with:
  - `password?: string`
  - `credentialStore?: CredentialStore`

Remove these from `lib/types/lnc.ts`:

- `AuthenticationInfo`
- `UnlockMethod`
- `UnlockOptions`
- `SessionConfig`
- `ClearOptions`
- `enableSessions`
- `sessionConfig`
- `allowPasskeys`
- `passkeyDisplayName`

**Step 4: Add modern types**

Create `lib/types/lightningNodeConnect.ts` with:

- `SessionConfig`
- `AuthenticationInfo`
- `UnlockMethod`
- `PasswordUnlockOptions`
- `PasskeyUnlockOptions`
- `SessionUnlockOptions`
- `UnlockOptions`
- `ClearOptions`
- `LightningNodeConnectConfig extends BaseConnectionConfig` with:

```typescript
allowPasskeys?: boolean;
enableSessions?: boolean;
passkeyDisplayName?: string;
session?: SessionConfig;
```

**Step 5: Retarget internal imports**

Update all internal auth/session modules that currently import modern auth types
from `lib/types/lnc.ts` so they import them from
`lib/types/lightningNodeConnect.ts` instead.

This includes the auth strategies, repositories, encryption services, and
session manager codepaths that depend on:

- `UnlockMethod`
- `UnlockOptions`
- `AuthenticationInfo`
- `SessionConfig`
- `ClearOptions`

Legacy-only modules should continue importing `CredentialStore`, `LncConfig`,
and `WasmGlobal` from `lib/types/lnc.ts`.

`lib/lnc.ts` and `lib/index.ts` should temporarily import/re-export modern types
from `lib/types/lightningNodeConnect.ts` until Task 3 removes the modern API
surface from `LNC` and Task 6 rewires the package exports.

**Step 6: Run verification**

Run:

```bash
yarn typecheck
```

Expected: PASS.

**Step 7: Commit**

```bash
git add lib/types/baseConnection.ts lib/types/lnc.ts lib/types/lightningNodeConnect.ts lib/lnc.ts lib/index.ts lib/encryption/encryptionService.ts lib/encryption/passwordEncryptionService.ts lib/encryption/passkeyEncryptionService.ts lib/repositories/credentialRepository.ts lib/repositories/passwordCredentialRepository.ts lib/repositories/passkeyCredentialRepository.ts lib/sessions/sessionManager.ts lib/sessions/sessionRefreshManager.ts lib/stores/authStrategy.ts lib/stores/authenticationCoordinator.ts lib/stores/passwordStrategy.ts lib/stores/passkeyStrategy.ts lib/stores/sessionStrategy.ts lib/stores/strategyManager.ts
git commit -m "refactor: split legacy and modern public types"
```

---

### Task 3: Refactor `WasmManager` and restore legacy `LNC`

**Files:**
- Modify: `lib/wasmManager.ts`
- Modify: `lib/wasmManager.test.ts`
- Modify: `lib/lnc.ts`
- Modify: `lib/lnc.test.ts`
- Modify: `lib/util/credentialStore.ts` (only if needed for typing alignment)

**Step 1: Refactor `WasmManager` to use `ConnectionParams` + `ConnectionCallbacks`**

Replace the `CredentialProvider` interface and mutable-provider pattern with plain data and callbacks:

1. Remove the `CredentialProvider` interface and `setCredentialProvider()` method from `lib/wasmManager.ts`.

2. Add two new types:

```typescript
export interface ConnectionParams {
  pairingPhrase: string;
  serverHost: string;
  localKey?: string;
  remoteKey?: string;
}

export interface ConnectionCallbacks {
  onLocalKeyCreated(keyHex: string): void;
  onRemoteKeyReceived(keyHex: string): void;
}
```

3. Change `run()` to accept callbacks so WASM key callbacks are wired at runtime:

```typescript
async run(callbacks: ConnectionCallbacks): Promise<void>
```

Store `callbacks` on the instance and use them in `setupWasmCallbacks()` instead of mutating a stored provider.

4. Change `connect()` to accept plain params:

```typescript
async connect(params: ConnectionParams): Promise<void>
```

Read `pairingPhrase`, `serverHost`, `localKey`, `remoteKey` from `params` to pass to `wasmClientConnectServer()`.

5. Remove the `pair()` method from `WasmManager` — pairing phrase management is now the caller's responsibility.

6. Remove the password-gated post-connect cleanup from `waitForConnection()` — each entrypoint handles its own post-connect lifecycle.

7. Update `lib/wasmManager.test.ts` to match the new signatures. Replace tests that assert `setCredentialProvider` / `credentialProvider` mutation with tests that verify `ConnectionCallbacks` are invoked and `ConnectionParams` are passed through.

Run: `npx vitest run lib/wasmManager.test.ts && yarn typecheck`

Expected: PASS for `wasmManager.test.ts`, typecheck will FAIL because `LNC` still uses the old API. This is expected and will be fixed in the next step.

**Step 2: Rework the failing tests around the old public contract**

In `lib/lnc.test.ts`:

- remove the modern-auth-specific test blocks that assert `allowPasskeys`, `unlock`, `persistWithPassword`, `persistWithPasskey`, `tryAutoRestore`, `supportsPasskeys`, `getAuthenticationInfo`, or `UnifiedCredentialStore`
- add one regression test that verifies the modern methods are absent:

```typescript
it('does not expose modern authentication helpers', () => {
  const lnc = new LNC();
  for (const key of [
    'pair',
    'unlock',
    'persistWithPassword',
    'persistWithPasskey',
    'tryAutoRestore',
    'getAuthenticationInfo',
    'supportsPasskeys',
    'clear',
    'clearCredentials'
  ]) {
    expect((lnc as any)[key]).toBeUndefined();
  }
  expect((LNC as any).isPasskeySupported).toBeUndefined();
});
```

- add one regression test that verifies WASM key callbacks write into the credential store:

```typescript
it('provides ConnectionCallbacks that write keys into the credential store', () => {
  // trigger the onLocalKeyCreated / onRemoteKeyReceived callbacks
  // and assert that lnc.credentials.localKey / remoteKey are updated
});
```

- add one regression test documenting the legacy pairing replacement path:

```typescript
it('supports pairing through credentials.pairingPhrase plus connect', async () => {
  const lnc = new LNC();
  lnc.credentials.pairingPhrase = 'phrase';
  await lnc.connect();
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run lib/lnc.test.ts`

Expected: FAIL because `LNC` still exposes the modern auth surface and still constructs the orchestrator.

**Step 4: Rebuild `lib/lnc.ts`**

Refactor `lib/lnc.ts` to:

- import `LncCredentialStore` directly
- remove imports of `CredentialOrchestrator`, passkey services, and modern auth types
- restore a concrete `credentials: CredentialStore` field instead of a getter backed by an orchestrator
- construct credentials exactly like commit `44a844c`:
  - use `config.credentialStore` if supplied
  - otherwise instantiate `new LncCredentialStore(config.namespace, config.password)`
  - if not paired, set `serverHost`
  - if `pairingPhrase` exists, set it on the store
- own `WasmManager` directly
- provide `ConnectionCallbacks` that write keys into `this.credentials`:
  - `onLocalKeyCreated: (keyHex) => { this.credentials.localKey = keyHex }`
  - `onRemoteKeyReceived: (keyHex) => { this.credentials.remoteKey = keyHex }`
- build `ConnectionParams` from `this.credentials` when calling `connect()`
- handle legacy post-connect cleanup in `LNC` itself: after connection, if `this.credentials.password` is set, call `this.credentials.clear(true)` to clear in-memory keys (this logic moves out of `WasmManager`)
- keep current default server host and current WASM URL

Do not keep any modern-auth compatibility wrappers on `LNC`.

**Step 5: Run focused verification**

Run:

```bash
npx vitest run lib/lnc.test.ts lib/util/credentialStore.test.ts lib/wasmManager.test.ts
yarn typecheck
```

Expected: PASS.

**Step 6: Commit**

```bash
git add lib/wasmManager.ts lib/wasmManager.test.ts lib/lnc.ts lib/lnc.test.ts lib/util/credentialStore.ts
git commit -m "refactor: replace WasmManager CredentialProvider with ConnectionParams/Callbacks and restore legacy LNC facade"
```

---

### Task 4: Implement the modern `LightningNodeConnect` facade

**Files:**
- Create: `lib/lightningNodeConnect.ts`
- Create: `lib/lightningNodeConnect.test.ts`
- Modify: `lib/stores/authenticationCoordinator.ts`
- Modify: `lib/stores/strategyManager.ts`
- Modify: `lib/stores/sessionCoordinator.ts`
- Modify: `lib/stores/passwordStrategy.ts` (only if required by typing changes)
- Modify: `lib/stores/passkeyStrategy.ts` (only if required by typing changes)
- Modify: `lib/stores/sessionStrategy.ts` (only if required by typing changes)

**Step 1: Write the failing tests for the new class**

Create `lib/lightningNodeConnect.test.ts` with coverage for:

- constructor defaults: password available implicitly, passkeys enabled by default, sessions enabled by default
- opt-out config:

```typescript
new LightningNodeConnect({
  allowPasskeys: false,
  enableSessions: false
})
```

- no public `credentials` property
- `tryAutoRestore()` restores auth state without invoking `WasmManager.connect()`
- `pair()` sets pairing phrase, runs, and connects
- `unlock({ method: 'password' | 'passkey' | 'session' })` delegates through the modern auth stack
- `unlock({ method: 'passkey' })` returns `false` when passkeys are disabled
- `unlock({ method: 'session' })` returns `false` when sessions are disabled or unavailable
- `supportsPasskeys()` returns `false` when passkeys are disabled even if the browser supports them
- `unlock()` authenticates and hydrates in-memory auth state only; it does not persist credentials or create/update sessions
- `persistWithPassword()` and `persistWithPasskey()` first unlock the chosen persistence strategy, then persist the current cache, then create a session when sessions are enabled
- the class provides `ConnectionCallbacks` that write keys into `CredentialCache`, and builds `ConnectionParams` from `CredentialCache` when connecting
- WASM key callbacks (`onLocalKeyCreated`, `onRemoteKeyReceived`) update the same `CredentialCache` used by the auth stack
- RPC services (`lnd`, `loop`, `pool`, `faraday`, `tapd`, `lit`) are wired and route calls through `request()` / `subscribe()`
- status getters (`isReady`, `isConnected`, `status`, `expiry`, `isReadOnly`) delegate to `WasmManager`
- `hasPerms()` delegates to `WasmManager`
- public lifecycle methods (`preload`, `connect`, `disconnect`) delegate to `WasmManager`; `run()` and `waitTilReady()` are private
- `pair()` sets `serverHost` on `CredentialCache` from config defaults when not already populated
- `LightningNodeConnect.isPasskeySupported()` remains available and correctly delegates to passkey capability detection

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/lightningNodeConnect.test.ts`

Expected: FAIL because the file and class do not exist.

**Step 3: Implement `lib/lightningNodeConnect.ts`**

Build `LightningNodeConnect` as the composition root for the modern auth path:

- own `WasmManager` directly
- own the modern auth collaborators directly, or through one modern-only private helper if needed for readability
- do not use `CredentialOrchestrator`
- do not use `UnifiedCredentialStore`

Constructor rules:

- merge the same connection defaults as `LNC`
- derive modern auth defaults as:

```typescript
const authConfig = {
  allowPasskeys: config.allowPasskeys ?? true,
  enableSessions: config.enableSessions ?? true,
  passkeyDisplayName: config.passkeyDisplayName,
  session: config.session
};
```

- always register password support
- only create session infrastructure when `authConfig.enableSessions !== false`
- only register passkey strategy when `authConfig.allowPasskeys !== false`
- reuse the existing `CredentialCache` from `lib/stores/credentialCache.ts` as the single in-memory store for connection state; do not create a duplicate store or adapter
- provide `ConnectionCallbacks` that write keys directly into `CredentialCache`:
  - `onLocalKeyCreated: (keyHex) => { this.credentialCache.set('localKey', keyHex) }`
  - `onRemoteKeyReceived: (keyHex) => { this.credentialCache.set('remoteKey', keyHex) }`
- build `ConnectionParams` from `CredentialCache` when calling `connect()`:
  - `{ pairingPhrase: cache.get('pairingPhrase'), serverHost: cache.get('serverHost'), localKey: cache.get('localKey'), remoteKey: cache.get('remoteKey') }`
- no post-connect credential cleanup is needed; the modern path manages credential lifecycle explicitly through `AuthenticationCoordinator`
- wire all 6 RPC services via `createRpc(packageName, this)`:
  - `this.lnd = new LndApi(createRpc, this)`
  - `this.loop = new LoopApi(createRpc, this)`
  - `this.pool = new PoolApi(createRpc, this)`
  - `this.faraday = new FaradayApi(createRpc, this)`
  - `this.tapd = new TaprootAssetsApi(createRpc, this)`
  - `this.lit = new LitApi(createRpc, this)`
  - this works because `LightningNodeConnect` exposes `request()` and `subscribe()` methods that satisfy the `RpcClient` structural type from Task 1
- expose public lifecycle methods: `preload()`, `connect()`, `disconnect()`, `request()`, `subscribe()`
- keep `run()` and `waitTilReady()` private — `connect()` calls them internally when the WASM client is not yet ready, so consumers never need to call them directly
- expose status getters delegating to `WasmManager`: `isReady`, `isConnected`, `status`, `expiry`, `isReadOnly`, `hasPerms()`

Public method rules:

- `pair(pairingPhrase)` sets the pairing phrase on `CredentialCache`, ensures `serverHost` is set from config defaults if not already populated, then calls the private `run()` and public `connect()`
- `unlock(options)` delegates to `AuthenticationCoordinator.unlock()` which only authenticates and hydrates `CredentialCache` state — no persistence or session creation as a side effect
- `persistWithPassword(password)` obtains the password strategy, unlocks it with the provided password, persists the current `CredentialCache` through `AuthenticationCoordinator.persistCachedCredentials(strategy)`, then creates a session via `AuthenticationCoordinator.createSessionAfterConnection()` if sessions are enabled
- `persistWithPasskey()` obtains the passkey strategy, unlocks it with `{ method: 'passkey', createIfMissing: true }`, persists the current `CredentialCache` through `AuthenticationCoordinator.persistCachedCredentials(strategy)`, then creates a session if sessions are enabled
- `tryAutoRestore()` only restores auth state via `AuthenticationCoordinator.tryAutoRestore()`; it must not call `connect()`
- `clear(options)` clears session data by default and persisted data only when requested
- `supportsPasskeys()` only reports runtime support when passkeys are enabled in config, while the static `isPasskeySupported()` remains a pure capability check
- `static isPasskeySupported()` remains available on the modern class

**Step 4: Adjust the modern coordinators for direct use**

Make the minimum changes needed so `LightningNodeConnect` can use the auth/session stack without `CredentialOrchestrator` or `UnifiedCredentialStore`:

- in `AuthenticationCoordinator.unlock()`, remove the two side-effect calls after `loadCredentialsFromStrategy()`:
  - remove `await this.persistCachedCredentials(strategy)` — persistence is now the caller's responsibility
  - remove `await this.tryCreateSession(strategy)` — session creation is now the caller's responsibility
  - `unlock()` should only: get strategy → call `strategy.unlock()` → set `activeStrategy` → call `loadCredentialsFromStrategy()` → return `true`
- make `persistCachedCredentials(strategy)` public on `AuthenticationCoordinator` so `LightningNodeConnect` can call it explicitly from `persistWithPassword()` / `persistWithPasskey()` after unlocking the chosen strategy; this method should also set `activeStrategy = strategy` so subsequent session creation uses the same non-session strategy
- narrow `createSessionAfterConnection()` so it only creates the session from the current `CredentialCache`; remove its current persisted-credential writes to avoid double persistence
- keep `tryAutoRestore`/session restore explicit via `tryAutoRestore()`
- do not reintroduce any `CredentialStore` dependency into the modern facade
- do not push wiring complexity into every public facade method if a modern-only private helper can encapsulate it cleanly

**Step 5: Run focused verification**

Run:

```bash
npx vitest run lib/lightningNodeConnect.test.ts lib/stores/authenticationCoordinator.test.ts lib/stores/strategyManager.test.ts lib/stores/sessionCoordinator.test.ts
yarn typecheck
```

Expected: PASS.

**Step 6: Commit**

```bash
git add lib/lightningNodeConnect.ts lib/lightningNodeConnect.test.ts lib/stores/authenticationCoordinator.ts lib/stores/strategyManager.ts lib/stores/sessionCoordinator.ts lib/stores/passwordStrategy.ts lib/stores/passkeyStrategy.ts lib/stores/sessionStrategy.ts
git commit -m "feat: add LightningNodeConnect facade"
```

---

### Task 5: Remove the legacy auth bridge

**Files:**
- Delete: `lib/credentialOrchestrator.ts`
- Delete: `lib/credentialOrchestrator.test.ts`
- Delete: `lib/stores/unifiedCredentialStore.ts`
- Delete: `lib/stores/unifiedCredentialStore.test.ts`

**Step 1: Verify the bridge is no longer needed**

Run:

```bash
rg -n "CredentialOrchestrator|UnifiedCredentialStore" lib demos
```

Expected: only references in tests or files being removed remain.

**Step 2: Delete the bridge files**

Remove:

- `lib/credentialOrchestrator.ts`
- `lib/credentialOrchestrator.test.ts`
- `lib/stores/unifiedCredentialStore.ts`
- `lib/stores/unifiedCredentialStore.test.ts`

**Step 3: Run focused verification**

Run:

```bash
yarn typecheck
npx vitest run lib/lnc.test.ts lib/lightningNodeConnect.test.ts
```

Expected: PASS.

**Step 4: Commit**

```bash
git rm lib/credentialOrchestrator.ts lib/credentialOrchestrator.test.ts lib/stores/unifiedCredentialStore.ts lib/stores/unifiedCredentialStore.test.ts
git commit -m "refactor: remove legacy auth bridge"
```

---

### Task 6: Rewire package exports

**Files:**
- Modify: `lib/index.ts`
- Modify: `lib/index.test.ts`

**Step 1: Write the failing export tests**

Update `lib/index.test.ts` to verify:

- default export is `LNC`
- named export `LightningNodeConnect` exists
- `CredentialOrchestrator` is no longer exported
- `LNC.isPasskeySupported` is absent
- `LightningNodeConnect.isPasskeySupported` is present

Add assertions similar to:

```typescript
const mod = await import('./index');
expect(mod.default).toBeDefined();
expect(mod.LightningNodeConnect).toBeDefined();
expect((mod as any).CredentialOrchestrator).toBeUndefined();
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/index.test.ts`

Expected: FAIL because `LightningNodeConnect` is not exported yet and `CredentialOrchestrator` still is.

**Step 3: Rewire the package surface**

Update `lib/index.ts` to:

- import and export `LightningNodeConnect`
- keep `LNC` as the default export
- stop exporting `CredentialOrchestrator`
- export legacy types from `./types/lnc`
- export modern types from `./types/lightningNodeConnect`

**Step 4: Run focused verification**

Run:

```bash
npx vitest run lib/index.test.ts lib/lnc.test.ts lib/lightningNodeConnect.test.ts
yarn typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/index.ts lib/index.test.ts
git commit -m "refactor: rewire entrypoint exports"
```

---

### Task 7: Move the passkeys demo onto `LightningNodeConnect`

**Files:**
- Modify: `demos/passkeys-demo/src/hooks/useLNC.ts`
- Modify: `demos/passkeys-demo/src/App.test.tsx`
- Modify: `demos/passkeys-demo/package.json`
- Modify: `demos/passkeys-demo/yarn.lock`
- Modify: `demos/connect-demo/package.json`
- Modify: `demos/connect-demo/yarn.lock`
- Modify: `demos/passkeys-demo/src/hooks/useAutoConnect.ts` (only if required)
- Modify: `demos/passkeys-demo/src/pages/Connect.tsx` (only if required)
- Modify: `demos/passkeys-demo/src/pages/Login.tsx` (only if required)
- Modify: `README.md`

**Step 1: Write the failing demo seam test**

Update `demos/passkeys-demo/src/App.test.tsx` or add a focused hook test under `demos/passkeys-demo/src/hooks/useLNC.test.ts` that verifies the demo constructs `LightningNodeConnect` rather than `LNC`.

**Step 2: Run test to verify it fails**

Run: `CI=true yarn --cwd demos/passkeys-demo test --watchAll=false`

Expected: FAIL because the demo still imports the legacy entrypoint and still resolves `@lightninglabs/lnc-web` to the published package rather than this checkout.

**Step 3: Update the hook first**

In `demos/passkeys-demo/src/hooks/useLNC.ts`:

- switch the import to `import { AuthenticationInfo, LightningNodeConnect, UnlockOptions } from '@lightninglabs/lnc-web'`
- instantiate:

```typescript
const lnc = new LightningNodeConnect({
  namespace: 'demo',
  allowPasskeys: true,
  enableSessions: true,
  session: { sessionDurationMs: 30 * 60 * 1000 }
});
```

- keep the current UX flow:
  - explicit auth info lookup
  - explicit session restore / session login path
  - explicit `connect()` after auth

Rewire the repo demos to consume the local package under development instead of the published registry version:

- change `demos/passkeys-demo/package.json` and `demos/connect-demo/package.json` so `@lightninglabs/lnc-web` points to `file:../..`
- refresh both demo lockfiles with:

```bash
yarn --cwd demos/passkeys-demo install
yarn --cwd demos/connect-demo install
```

Only modify `useAutoConnect.ts`, `Connect.tsx`, or `Login.tsx` if the new class forces a type or behavior adjustment.

Update `README.md` to add two short examples:

- legacy `LNC` password-only usage
- modern `LightningNodeConnect` usage for passkeys/sessions

Do not add a migration guide in this task.

**Step 4: Run focused verification**

Run:

```bash
yarn build
CI=true yarn --cwd demos/passkeys-demo test --watchAll=false
yarn --cwd demos/passkeys-demo build
yarn --cwd demos/connect-demo build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add demos/passkeys-demo/src/hooks/useLNC.ts demos/passkeys-demo/package.json demos/passkeys-demo/yarn.lock demos/connect-demo/package.json demos/connect-demo/yarn.lock demos/passkeys-demo/src/hooks/useAutoConnect.ts demos/passkeys-demo/src/pages/Connect.tsx demos/passkeys-demo/src/pages/Login.tsx demos/passkeys-demo/src/App.test.tsx README.md
git commit -m "demo: adopt LightningNodeConnect entrypoint"
```

---

### Task 8: Full verification and cleanup

**Files:**
- No new files

**Step 1: Run the full automated suite**

Run:

```bash
yarn test
yarn typecheck
yarn lint
yarn build
CI=true yarn --cwd demos/passkeys-demo test --watchAll=false
yarn --cwd demos/passkeys-demo build
yarn --cwd demos/connect-demo build
```

Expected: PASS for all commands.

**Step 2: Verify the tree only contains intended changes**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the planned entrypoint split files are changed; no accidental demo/build artifacts are present.

**Step 3: Smoke-check entrypoint usage**

Run:

```bash
rg -n "new LNC\\(|new LightningNodeConnect\\(" lib demos README.md
```

Expected:

- `demos/passkeys-demo` uses `LightningNodeConnect`
- legacy examples and compatibility references use `LNC`

**Step 4: Final commit if cleanup was required**

If any final cleanup was needed after verification:

```bash
git add -A
git commit -m "chore: finalize entrypoint split cleanup"
```

If no cleanup was needed, do not create an extra commit.
