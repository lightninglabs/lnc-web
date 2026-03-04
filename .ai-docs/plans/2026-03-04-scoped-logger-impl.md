# Scoped Logger Factory — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `createLogger` factory function and migrate 16 files from manual `[ClassName]` prefixes (or shared `log` singleton imports) to scoped loggers.

**Architecture:** A single `createLogger(name)` function in `lib/util/log.ts` returns a `Logger` with the class name as its `debug` namespace. Each consuming file replaces `import { log }` with `import { createLogger }` and defines `const log = createLogger('ClassName')` at module scope. All `[ClassName]` string prefixes are removed from log messages.

**Tech Stack:** TypeScript, `debug` npm package, Vitest

---

### Task 1: Add `createLogger` to `lib/util/log.ts`

**Files:**
- Modify: `lib/util/log.ts:95` (after the `Logger` class, before the existing exports)
- Modify: `lib/util/log.test.ts`

**Step 1: Write the failing test**

Add to `lib/util/log.test.ts` inside the top-level `describe('Logging System')` block, after the existing `describe` blocks:

```typescript
describe('createLogger factory', () => {
  it('should create a Logger instance with the given namespace', () => {
    const logger = createLogger('TestClass');
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create independent loggers for different names', () => {
    const logger1 = createLogger('ClassA');
    const logger2 = createLogger('ClassB');
    expect(logger1).not.toBe(logger2);
  });
});
```

Also update the import at the top of the test file to include `createLogger`:

```typescript
import { createLogger, log, Logger, LogLevel, wasmLog } from './log';
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/util/log.test.ts`

Expected: FAIL — `createLogger` is not exported from `./log`.

**Step 3: Write minimal implementation**

Add the following to `lib/util/log.ts`, between the `Logger` class (line 90) and the `log` export (line 95):

```typescript
/**
 * Create a Logger scoped to a specific class or module name.
 * The name becomes the debug namespace, enabling targeted filtering
 * (e.g., DEBUG=SessionManager or DEBUG=Session*).
 */
export function createLogger(name: string): Logger {
  return Logger.fromEnv(name);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/util/log.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add lib/util/log.ts lib/util/log.test.ts
git commit -m "log: add createLogger factory function"
```

---

### Task 2: Migrate `lib/sessions/sessionManager.ts`

**Files:**
- Modify: `lib/sessions/sessionManager.ts`

**Step 1: Update the import**

Replace line 2:

```typescript
import { log } from '../util/log';
```

with:

```typescript
import { createLogger } from '../util/log';

const log = createLogger('SessionManager');
```

**Step 2: Remove all `[SessionManager] ` prefixes from log messages**

Find and replace every occurrence of `'[SessionManager] ` → `'` and `` `[SessionManager] `` → `` ` `` in log calls. The affected lines are:

- Line 142: `log.info('[SessionManager] Session created successfully')` → `log.info('Session created successfully')`
- Line 169: `log.error('[SessionManager] Session restoration failed:', error)` → `log.error('Session restoration failed:', error)`
- Line 187: `'[SessionManager] Refresh already in progress; waiting for result'` → `'Refresh already in progress; waiting for result'`
- Line 210: `'[SessionManager] No session data available for refresh'` → `'No session data available for refresh'`
- Line 217: `'[SessionManager] Maximum refresh count reached'` → `'Maximum refresh count reached'`
- Line 223: `'[SessionManager] Maximum session age exceeded'` → `'Maximum session age exceeded'`
- Line 232: `'[SessionManager] Refresh aborted: session could not be restored'` → `'Refresh aborted: session could not be restored'`
- Line 275: `'[SessionManager] Starting session restoration...'` → `'Starting session restoration...'`
- Line 279: `'[SessionManager] No session data found'` → `'No session data found'`
- Line 284: `'[SessionManager] Session expired'` → `'Session expired'`
- Line 329: `'[SessionManager] Session restoration successful!'` → `'Session restoration successful!'`

**Step 3: Run tests**

Run: `npx vitest run lib/sessions/sessionManager.test.ts`

Expected: PASS (tests mock log at module level, not by import path)

**Step 4: Commit**

```bash
git add lib/sessions/sessionManager.ts
git commit -m "log: migrate SessionManager to createLogger"
```

---

### Task 3: Migrate `lib/sessions/sessionRefreshManager.ts`

**Files:**
- Modify: `lib/sessions/sessionRefreshManager.ts`

**Step 1: Update the import (line 2)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('SessionRefreshManager');
```

**Step 2: Remove all `[SessionRefreshManager] ` prefixes**

All log calls in this file use the `[SessionRefreshManager]` prefix. Remove the prefix from each:

- Line 83: `'[SessionRefreshManager] No document available; '` → `'No document available; '`
- Line 95: `` `[SessionRefreshManager] Session duration `` → `` `Session duration ``
- Line 212: `` `[SessionRefreshManager] Refresh suppressed: user inactive `` → `` `Refresh suppressed: user inactive ``
- Line 224: `'[SessionRefreshManager] Session automatically refreshed'` → `'Session automatically refreshed'`
- Line 230: `'[SessionRefreshManager] Session refresh declined '` → `'Session refresh declined '`
- Line 239: `` `[SessionRefreshManager] Refresh check failed `` → `` `Refresh check failed ``
- Line 252: `'[SessionRefreshManager] Stopping after repeated failures'` → `'Stopping after repeated failures'`
- Line 318: `'[SessionRefreshManager] forceRefreshCheck called while not running'` → `'forceRefreshCheck called while not running'`

**Step 3: Run tests**

Run: `npx vitest run lib/sessions/sessionRefreshManager.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/sessions/sessionRefreshManager.ts
git commit -m "log: migrate SessionRefreshManager to createLogger"
```

---

### Task 4: Migrate `lib/sessions/storage/sessionStorage.ts`

**Files:**
- Modify: `lib/sessions/storage/sessionStorage.ts`

**Step 1: Update the import (line 1)**

Replace:
```typescript
import { log } from '../../util/log';
```

with:
```typescript
import { createLogger } from '../../util/log';

const log = createLogger('SessionStorage');
```

**Step 2: Remove all `[SessionStorage] ` prefixes**

- Line 57: `'[SessionStorage] Session saved to sessionStorage'` → `'Session saved to sessionStorage'`
- Line 65: `'[SessionStorage] Failed to save session data'` → `'Failed to save session data'`
- Line 91: `'[SessionStorage] Invalid session data'` → `'Invalid session data'`
- Line 99: `'[SessionStorage] Session loaded from sessionStorage'` → `'Session loaded from sessionStorage'`
- Line 109: `'[SessionStorage] Failed to load session data'` → `'Failed to load session data'`
- Line 117: `'[SessionStorage] Cleanup failed during error recovery'` → `'Cleanup failed during error recovery'`
- Line 133: `'[SessionStorage] Failed to clear session data'` → `'Failed to clear session data'`

**Step 3: Run tests**

Run: `npx vitest run lib/sessions/storage/sessionStorage.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/sessions/storage/sessionStorage.ts
git commit -m "log: migrate SessionStorage to createLogger"
```

---

### Task 5: Migrate `lib/sessions/origin/OriginKeyManager.ts`

**Files:**
- Modify: `lib/sessions/origin/OriginKeyManager.ts`

**Step 1: Update the import (line 1)**

Replace:
```typescript
import { log } from '../../util/log';
```

with:
```typescript
import { createLogger } from '../../util/log';

const log = createLogger('OriginKeyManager');
```

**Step 2: Remove all `[OriginKeyManager] ` prefixes**

- Line 162: `'[OriginKeyManager] Origin key cleared'` → `'Origin key cleared'`
- Line 170: `'[OriginKeyManager] Failed to clear origin key: ${request.error?.message}'` → `'Failed to clear origin key: ${request.error?.message}'`

Note: Lines 105, 143, and 177 do NOT have the `[OriginKeyManager]` prefix — leave those as-is.

**Step 3: Run tests**

Run: `npx vitest run lib/sessions/origin/OriginKeyManager.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/sessions/origin/OriginKeyManager.ts
git commit -m "log: migrate OriginKeyManager to createLogger"
```

---

### Task 6: Migrate `lib/stores/sessionCoordinator.ts`

**Files:**
- Modify: `lib/stores/sessionCoordinator.ts`

**Step 1: Update the import (line 4)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('SessionCoordinator');
```

**Step 2: Remove all `[SessionCoordinator] ` prefixes**

- Line 70: `'[SessionCoordinator] Session cleared'` → `'Session cleared'`
- Line 110: `'[SessionCoordinator] Session auto-restoration error:'` → `'Session auto-restoration error:'`
- Line 121: `'[SessionCoordinator] No session manager available - skipping session creation'` → `'No session manager available - skipping session creation'`
- Line 130: `'[SessionCoordinator] Failed to create session:'` → `'Failed to create session:'`
- Line 169: `'[SessionCoordinator] Automatic session refresh started'` → `'Automatic session refresh started'`
- Line 179: `'[SessionCoordinator] Automatic session refresh stopped'` → `'Automatic session refresh stopped'`

**Step 3: Run tests**

Run: `npx vitest run lib/stores/sessionCoordinator.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/sessionCoordinator.ts
git commit -m "log: migrate SessionCoordinator to createLogger"
```

---

### Task 7: Migrate `lib/stores/authenticationCoordinator.ts`

**Files:**
- Modify: `lib/stores/authenticationCoordinator.ts`

**Step 1: Update the import (line 6)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('AuthenticationCoordinator');
```

**Step 2: Remove all `[AuthenticationCoordinator] ` prefixes**

- Line 60: `'[AuthenticationCoordinator] Cleared session state'` → `'Cleared session state'`
- Line 71: `` `[AuthenticationCoordinator] Authentication method '${options.method}' not supported` `` → `` `Authentication method '${options.method}' not supported` ``
- Line 79: `` `[AuthenticationCoordinator] Failed to unlock with ${options.method}` `` → `` `Failed to unlock with ${options.method}` ``
- Line 93: `'[AuthenticationCoordinator] Unlock failed:'` → `'Unlock failed:'`
- Line 154: `'[AuthenticationCoordinator] Auto-restore failed:'` → `'Auto-restore failed:'`
- Line 206: `'[AuthenticationCoordinator] Session creation failed after '` → `'Session creation failed after '`
- Line 267: `` `[AuthenticationCoordinator] Failed to persist ${key}:` `` → `` `Failed to persist ${key}:` ``
- Line 294: `` `[AuthenticationCoordinator] Failed to load credential ${key}:` `` → `` `Failed to load credential ${key}:` ``
- Line 316: `` `[AuthenticationCoordinator] Failed to save credential ${key}:` `` → `` `Failed to save credential ${key}:` ``

**Step 3: Run tests**

Run: `npx vitest run lib/stores/authenticationCoordinator.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/authenticationCoordinator.ts
git commit -m "log: migrate AuthenticationCoordinator to createLogger"
```

---

### Task 8: Migrate `lib/stores/strategyManager.ts`

**Files:**
- Modify: `lib/stores/strategyManager.ts`

**Step 1: Update the import (line 3)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('StrategyManager');
```

**Step 2: Remove all `[StrategyManager] ` prefixes**

- Line 81: `'[StrategyManager] Cleared all strategies'` → `'Cleared all strategies'`
- Line 118: `` `[StrategyManager] Registered strategies: ${...}` `` → `` `Registered strategies: ${...}` ``

**Step 3: Run tests**

Run: `npx vitest run lib/stores/strategyManager.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/strategyManager.ts
git commit -m "log: migrate StrategyManager to createLogger"
```

---

### Task 9: Migrate `lib/stores/credentialCache.ts`

**Files:**
- Modify: `lib/stores/credentialCache.ts`

**Step 1: Update the import (line 2)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('CredentialCache');
```

**Step 2: Remove all `[CredentialCache] ` prefixes**

- Line 51: `'[CredentialCache] Cache cleared'` → `'Cache cleared'`
- Line 69: `'[CredentialCache] Hydrated with credentials:'` → `'Hydrated with credentials:'`
- Line 83: `'[CredentialCache] Hydrated from session:'` → `'Hydrated from session:'`

**Step 3: Run tests**

Run: `npx vitest run lib/stores/credentialCache.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/credentialCache.ts
git commit -m "log: migrate CredentialCache to createLogger"
```

---

### Task 10: Migrate `lib/stores/passwordStrategy.ts`

**Files:**
- Modify: `lib/stores/passwordStrategy.ts`

**Step 1: Update the import (line 4)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('PasswordStrategy');
```

**Step 2: Remove all `[PasswordStrategy] ` prefixes**

- Line 52: `'[PasswordStrategy] Password required for unlock'` → `'Password required for unlock'`
- Line 60: `'[PasswordStrategy] Unlock failed:'` → `'Unlock failed:'`
- Line 71: `'[PasswordStrategy] Cannot get credential - not unlocked'` → `'Cannot get credential - not unlocked'`
- Line 78: `` `[PasswordStrategy] Failed to get credential ${key}:` `` → `` `Failed to get credential ${key}:` ``
- Line 89: `'[PasswordStrategy] Cannot set credential - not unlocked'` → `'Cannot set credential - not unlocked'`
- Line 96: `` `[PasswordStrategy] Failed to set credential ${key}:` `` → `` `Failed to set credential ${key}:` ``

**Step 3: Run tests**

Run: `npx vitest run lib/stores/passwordStrategy.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/passwordStrategy.ts
git commit -m "log: migrate PasswordStrategy to createLogger"
```

---

### Task 11: Migrate `lib/stores/passkeyStrategy.ts`

**Files:**
- Modify: `lib/stores/passkeyStrategy.ts`

**Step 1: Update the import (line 4)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('PasskeyStrategy');
```

**Step 2: Remove all `[PasskeyStrategy] ` prefixes**

- Line 55: `'[PasskeyStrategy] Unlock failed:'` → `'Unlock failed:'`
- Line 81: `'[PasskeyStrategy] Cannot get credential - not unlocked'` → `'Cannot get credential - not unlocked'`
- Line 88: `` `[PasskeyStrategy] Failed to get credential ${key}:` `` → `` `Failed to get credential ${key}:` ``
- Line 99: `'[PasskeyStrategy] Cannot set credential - not unlocked'` → `'Cannot set credential - not unlocked'`
- Line 106: `` `[PasskeyStrategy] Failed to set credential ${key}:` `` → `` `Failed to set credential ${key}:` ``

**Step 3: Run tests**

Run: `npx vitest run lib/stores/passkeyStrategy.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/passkeyStrategy.ts
git commit -m "log: migrate PasskeyStrategy to createLogger"
```

---

### Task 12: Migrate `lib/stores/sessionStrategy.ts`

**Files:**
- Modify: `lib/stores/sessionStrategy.ts`

**Step 1: Update the import (line 4)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('SessionStrategy');
```

**Step 2: Remove all `[SessionStrategy] ` prefixes**

- Line 47: `'[SessionStrategy] Session restore failed:'` → `'Session restore failed:'`
- Line 68: `'[SessionStrategy] Cannot get credential - no active session'` → `'Cannot get credential - no active session'`
- Line 79: `` `[SessionStrategy] Failed to get credential ${key}:` `` → `` `Failed to get credential ${key}:` ``
- Line 92: `` `[SessionStrategy] setCredential(${key}) not supported - use createSession() instead` `` → `` `setCredential(${key}) not supported - use createSession() instead` ``

**Step 3: Run tests**

Run: `npx vitest run lib/stores/sessionStrategy.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/sessionStrategy.ts
git commit -m "log: migrate SessionStrategy to createLogger"
```

---

### Task 13: Migrate `lib/stores/unifiedCredentialStore.ts`

**Files:**
- Modify: `lib/stores/unifiedCredentialStore.ts`

**Step 1: Update the import (line 10)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('UnifiedCredentialStore');
```

**Step 2: Remove all `[UnifiedCredentialStore] ` prefixes**

- Line 45: `'[UnifiedCredentialStore] Direct access to password is not supported. Use the unlock method instead.'` → `'Direct access to password is not supported. Use the unlock method instead.'`
- Line 54: `'[UnifiedCredentialStore] Setting password directly is not supported. Use the unlock method instead.'` → `'Setting password directly is not supported. Use the unlock method instead.'`
- Line 173: `'[UnifiedCredentialStore] Cannot create session - not unlocked'` → `'Cannot create session - not unlocked'`

**Step 3: Run tests**

Run: `npx vitest run lib/stores/unifiedCredentialStore.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/stores/unifiedCredentialStore.ts
git commit -m "log: migrate UnifiedCredentialStore to createLogger"
```

---

### Task 14: Migrate `lib/repositories/credentialRepository.ts`

**Files:**
- Modify: `lib/repositories/credentialRepository.ts`

**Step 1: Update the import (line 2)**

Replace:
```typescript
import { log } from '../util/log';
```

with:
```typescript
import { createLogger } from '../util/log';

const log = createLogger('CredentialRepository');
```

**Step 2: Remove all `[CredentialRepository] ` prefixes**

- Line 170: `'[CredentialRepository] saving credentials to localStorage'` → `'saving credentials to localStorage'`
- Line 186: `'[CredentialRepository] loaded credentials from localStorage'` → `'loaded credentials from localStorage'`

**Step 3: Run tests**

Run: `npx vitest run lib/repositories/credentialRepository.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/repositories/credentialRepository.ts
git commit -m "log: migrate CredentialRepository to createLogger"
```

---

### Task 15: Migrate `lib/credentialOrchestrator.ts`

**Files:**
- Modify: `lib/credentialOrchestrator.ts`

**Step 1: Update the import (line 11)**

Replace:
```typescript
import { log } from './util/log';
```

with:
```typescript
import { createLogger } from './util/log';

const log = createLogger('CredentialOrchestrator');
```

**Step 2: Remove all `[CredentialOrchestrator] ` prefixes**

- Line 57: `'[CredentialOrchestrator] Using custom credential store from config'` → `'Using custom credential store from config'`
- Line 98: `'[CredentialOrchestrator] Creating legacy LncCredentialStore'` → `'Creating legacy LncCredentialStore'`
- Line 139: `'[CredentialOrchestrator] clearing session credentials'` → `'clearing session credentials'`
- Line 149: `'[CredentialOrchestrator] clearing persisted credentials'` → `'clearing persisted credentials'`
- Line 192: `'[CredentialOrchestrator] Legacy unlock failed:'` → `'Legacy unlock failed:'`
- Line 196: `'[CredentialOrchestrator] Legacy unlock failed: missing or empty password for method "password".'` → `'Legacy unlock failed: missing or empty password for method "password".'`

**Step 3: Run tests**

Run: `npx vitest run lib/credentialOrchestrator.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add lib/credentialOrchestrator.ts
git commit -m "log: migrate CredentialOrchestrator to createLogger"
```

---

### Task 16: Run full test suite

**Step 1: Run all tests**

Run: `npx vitest run`

Expected: All tests PASS

**Step 2: Verify no remaining `[ClassName]` prefixes**

Run: `grep -rn "\[SessionManager\]\|\[SessionRefreshManager\]\|\[SessionStorage\]\|\[OriginKeyManager\]\|\[SessionCoordinator\]\|\[AuthenticationCoordinator\]\|\[StrategyManager\]\|\[CredentialCache\]\|\[PasswordStrategy\]\|\[PasskeyStrategy\]\|\[SessionStrategy\]\|\[UnifiedCredentialStore\]\|\[CredentialRepository\]\|\[CredentialOrchestrator\]" lib/ --include='*.ts' --exclude='*.test.ts'`

Expected: No matches found (all prefixes removed from source files).

---

## Implementation Deviations

### 1. Test mock overhaul (not anticipated)

The plan assumed tests would continue to pass after migrating source files
("tests mock log at module level, not by import path"). This was wrong.

**Root cause:** Most test files used `vi.spyOn(log, 'info')` on the shared
`log` singleton imported from `../util/log`. After migration, source files
create their own `log` via `createLogger('ClassName')` at module scope — a
different object from the singleton. Spying on the old singleton no longer
intercepts calls made by the source code.

**Fix applied:** 13 test files were updated to mock `createLogger` itself
using `vi.hoisted` + `vi.mock`:

```typescript
const mockLog = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}));

vi.mock('../util/log', () => ({
  createLogger: vi.fn(() => mockLog)
}));
```

All `vi.spyOn(log, ...)` calls and `expect(log.METHOD)` assertions were
replaced with direct references to `mockLog.METHOD`. The `vi.hoisted()`
wrapper is necessary because vitest hoists `vi.mock()` above imports, so the
mock factory must reference a variable that is also hoisted.

**Test files modified:**
- `lib/sessions/sessionManager.test.ts`
- `lib/sessions/sessionRefreshManager.test.ts`
- `lib/sessions/storage/sessionStorage.test.ts`
- `lib/sessions/origin/OriginKeyManager.test.ts`
- `lib/stores/sessionCoordinator.test.ts`
- `lib/stores/authenticationCoordinator.test.ts`
- `lib/stores/strategyManager.test.ts`
- `lib/stores/credentialCache.test.ts`
- `lib/stores/passwordStrategy.test.ts`
- `lib/stores/passkeyStrategy.test.ts`
- `lib/stores/sessionStrategy.test.ts`
- `lib/credentialOrchestrator.test.ts`
- `lib/repositories/passkeyCredentialRepository.test.ts`

### 2. Test assertion prefix removal (partially anticipated)

The plan's Task 16 verification step checked source files for remaining
prefixes but did not account for test files also containing `[ClassName]`
string literals in their assertions. 13 test files needed their expected
log message strings updated to remove the `[ClassName] ` prefix, matching
the source changes.

### 3. Commits batched by layer

The plan specified per-task commits. Instead, commits were batched by
architectural layer: log utility, repositories, sessions, stores, and docs.

### 4. Two additional repository files migrated

`passkeyCredentialRepository.ts` and `passwordCredentialRepository.ts` were
also migrated to `createLogger` despite not being in the original 14-file
task list. They imported the shared `log` singleton without `[ClassName]`
prefixes and benefited from the scoped namespace.
