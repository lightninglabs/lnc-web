# Migrating from Legacy LNC to LightningNodeConnect

This guide covers migrating from the legacy `LNC` default export to the modern `LightningNodeConnect` named export. The new entrypoint adds passkey authentication, automatic session management, and a safer credential model while keeping the same service APIs (lnd, loop, pool, etc.).

## Import Change

```diff
- import LNC from '@lightninglabs/lnc-web';
+ import { LightningNodeConnect } from '@lightninglabs/lnc-web';
```

## Constructor

The base options (`serverHost`, `wasmClientCode`, `namespace`) are the same. The `password` and `credentialStore` options are removed - credential management is now handled internally through the auth stack.

```diff
- const lnc = new LNC({
-   pairingPhrase,
-   password: 'my-password',
-   namespace: 'my-app',
- });
+ const lnc = new LightningNodeConnect({
+   namespace: 'my-app',
+   allowPasskeys: true,      // enable passkey support (new)
+   enableSessions: true,     // enable session management (new)
+ });
```

| Legacy option     | Modern equivalent                                         |
| ----------------- | --------------------------------------------------------- |
| `pairingPhrase`   | Pass to `pair()` instead of constructor                   |
| `password`        | Pass to `persistWithPassword()` or `login()` instead      |
| `credentialStore` | Removed - credentials are managed internally              |
| `serverHost`      | Same (also available as a setter: `lnc.serverHost = ...`) |
| `wasmClientCode`  | Same                                                      |
| `namespace`       | Same                                                      |

## Pairing (First-Time Connection)

**Legacy:**

```typescript
const lnc = new LNC({});

lnc.credentials.pairingPhrase = phrase;
await lnc.connect();

// verify
await lnc.lnd.lightning.listChannels();

// persist
lnc.credentials.password = password;
```

**Modern (one-step):**

```typescript
const lnc = new LightningNodeConnect({ namespace: 'my-app' });

await lnc.pair(phrase, { method: 'password', password });
```

**Modern (two-step, for verification before persisting):**

```typescript
await lnc.pair(phrase);
await lnc.lnd.lightning.listChannels(); // verify
await lnc.persistWithPassword(password);
// or: await lnc.persistWithPasskey();
```

## Checking Auth State

**Legacy:**

```typescript
// Check if the user has previously paired
const isPaired = lnc.credentials.isPaired;
```

**Modern:**

```typescript
const auth = await lnc.getAuthenticationInfo();

auth.hasStoredCredentials; // replaces isPaired
auth.hasActiveSession; // session available (new)
auth.hasPasskey; // passkey stored (new)
auth.preferredUnlockMethod; // 'session' | 'passkey' | 'password'
```

## Login (Returning Users)

**Legacy:**

```typescript
lnc.credentials.password = password;
await lnc.connect();
```

**Modern:**

```typescript
// Password login
await lnc.login({ method: 'password', password });

// Passkey login (new - triggers biometric prompt)
await lnc.login({ method: 'passkey' });

// Session login (new - no user interaction)
await lnc.login({ method: 'session' });
```

If you need the unlock and connect steps to be separate (e.g., to inspect state between them):

```typescript
const success = await lnc.unlock({ method: 'password', password });
if (success) {
  await lnc.connect();
}
```

## Clearing Credentials

**Legacy:**

```typescript
lnc.credentials.clear(); // clear all credentials
lnc.credentials.clear(true); // clear in-memory only
```

**Modern:**

```typescript
lnc.clear(); // logout (clear session only)
lnc.clear({ persisted: true }); // forget node (clear session + stored credentials)
```

> **Note:** `clear()` only removes stored credentials — it does not tear down the active WASM connection. To fully disconnect, perform a page reload after clearing (e.g. `window.location.reload()`).

## Credential Access

The legacy `LNC` class exposes a public `credentials` object where you directly read and write `pairingPhrase`, `localKey`, `remoteKey`, `password`, etc. The modern `LightningNodeConnect` class does not expose credentials publicly. All credential lifecycle is managed through dedicated methods:

| Legacy (`lnc.credentials.*`) | Modern equivalent                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `.pairingPhrase = phrase`    | `lnc.pair(phrase)`                                                                 |
| `.password = pw`             | `lnc.persistWithPassword(pw)` or `lnc.login({ method: 'password', password: pw })` |
| `.isPaired`                  | `(await lnc.getAuthenticationInfo()).hasStoredCredentials`                         |
| `.localKey`, `.remoteKey`    | Not exposed - managed internally                                                   |
| `.serverHost`                | `lnc.serverHost` (getter/setter)                                                   |
| `.clear()`                   | `lnc.clear({ persisted: true })`                                                   |

## Service Access

Service access is **unchanged**. Both entrypoints expose the same typed service APIs:

```typescript
// Works the same in both legacy and modern
lnc.lnd.lightning.getInfo();
lnc.loop.swapClient.listSwaps();
lnc.pool.trader.initAccount({ ... });
lnc.faraday.faradayServer.channelInsights();
lnc.tapd.taprootAssets.listAssets();
lnc.lit.sessions.listSessions();
```

Subscriptions also work identically:

```typescript
lnc.lnd.lightning.subscribeTransactions(
  {},
  (tx) => console.log(tx),
  (err) => console.error(err)
);
```

## Status Properties

All status getters are the same across both entrypoints:

```typescript
lnc.isReady;
lnc.isConnected;
lnc.status;
lnc.expiry;
lnc.isReadOnly;
lnc.hasPerms('lnrpc.Lightning.SendPaymentSync');
```

## React Hook Migration

**Legacy hook:**

```typescript
const lnc = new LNC({});

const useLNC = () => {
  const connect = useCallback(async (phrase: string, password: string) => {
    lnc.credentials.pairingPhrase = phrase;
    await lnc.connect();
    await lnc.lnd.lightning.listChannels();
    lnc.credentials.password = password;
  }, []);

  const login = useCallback(async (password: string) => {
    lnc.credentials.password = password;
    await lnc.connect();
  }, []);

  return { lnc, connect, login };
};
```

**Modern hook:**

```typescript
const lnc = new LightningNodeConnect({
  namespace: 'my-app',
  allowPasskeys: true,
  enableSessions: true
});

const useLNC = () => {
  const [auth, setAuth] = useState<AuthenticationInfo | null>(null);

  useEffect(() => {
    lnc.getAuthenticationInfo().then(setAuth);
  }, []);

  const pair = useCallback(async (phrase: string, options: PersistOptions) => {
    await lnc.pair(phrase);
    await lnc.lnd.lightning.listChannels();

    if (options.method === 'password') {
      await lnc.persistWithPassword(options.password);
    } else if (options.method === 'passkey') {
      await lnc.persistWithPasskey();
    }
  }, []);

  const login = useCallback(async (options: UnlockOptions) => {
    await lnc.login(options);
  }, []);

  const logout = useCallback(() => {
    lnc.clear();
    window.location.reload();
  }, []);

  return { lnc, pair, login, logout, auth };
};
```

Key differences in the hook:

- **`auth` state** - the modern hook exposes `AuthenticationInfo` for routing decisions.
- **`pair()` takes `PersistOptions`** - supports both password and passkey persistence.
- **`login()` takes `UnlockOptions`** - supports password, passkey, and session methods.
- **`logout()`** - new; calls `lnc.clear()` to end the session.

## Storage Model

| What                | Legacy                      | Modern                                             |
| ------------------- | --------------------------- | -------------------------------------------------- |
| Encrypted keys      | `localStorage`              | `localStorage` (password) or `IndexedDB` (passkey) |
| Session credentials | Not supported               | `sessionStorage` (auto-expiring)                   |
| In-memory cache     | Public `credentials` object | Private `CredentialCache` (not exposed)            |

## Full Example

See the [passkeys-demo](demos/passkeys-demo/) app for a complete working example using the modern API with React, including auto-connect via sessions and passkey support.
