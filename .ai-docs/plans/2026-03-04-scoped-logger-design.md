# Scoped Logger Factory

## Problem

Classes manually repeat `[ClassName]` as a string prefix in every log call. This is redundant and error-prone. 14 files use this pattern (plus 2 repository files that import the shared `log` singleton without the prefix):

```typescript
log.info('[SessionManager] Session created successfully');
log.error('[SessionManager] Session restoration failed:', error);
```

## Solution

Add a `createLogger` factory function that creates a `Logger` scoped to a class name using the `debug` library's namespace system.

### API

```typescript
// In lib/util/log.ts
export function createLogger(name: string): Logger {
  return Logger.fromEnv(name);
}
```

### Usage

```typescript
import { createLogger } from '../util/log';

const log = createLogger('SessionManager');

class SessionManager {
  create() {
    log.info('Session created successfully');
    log.error('Session restoration failed:', error);
  }
}
```

### Log Output

Before: `main [info] [SessionManager] Session created successfully`

After: `SessionManager [info] Session created successfully`

### Debug Filtering

In Node.js, use the `DEBUG` environment variable. In browsers, use
`localStorage.setItem('debug', '...')`. Note: the `debug` library controls
namespace visibility, and the `Logger` class has its own level gating
(`debug-level` in localStorage) that must also allow the message through.

- `SessionManager` — single class
- `Session*` — all session-related classes
- `*` — everything

### Existing Exports

The `log` (namespace: `main`) and `wasmLog` (namespace: `wasm`) singletons
remain for code without class-scoped logging. The `grpcLog` and `actionLog`
singletons were removed as unused.

## Scope

### Files to Modify

1. `lib/util/log.ts` — add `createLogger` export
2. 16 files — replace `import { log }` with `import { createLogger }`, add module-level `const log = createLogger('ClassName')`, remove `[ClassName]` prefixes from all log messages

### Files Using `[ClassName]` Pattern

- `lib/sessions/sessionManager.ts` — `[SessionManager]`
- `lib/sessions/sessionRefreshManager.ts` — `[SessionRefreshManager]`
- `lib/sessions/storage/sessionStorage.ts` — `[SessionStorage]`
- `lib/sessions/origin/OriginKeyManager.ts` — `[OriginKeyManager]`
- `lib/stores/sessionCoordinator.ts` — `[SessionCoordinator]`
- `lib/stores/authenticationCoordinator.ts` — `[AuthenticationCoordinator]`
- `lib/stores/strategyManager.ts` — `[StrategyManager]`
- `lib/stores/credentialCache.ts` — `[CredentialCache]`
- `lib/stores/passwordStrategy.ts` — `[PasswordStrategy]`
- `lib/stores/passkeyStrategy.ts` — `[PasskeyStrategy]`
- `lib/stores/sessionStrategy.ts` — `[SessionStrategy]`
- `lib/stores/unifiedCredentialStore.ts` — `[UnifiedCredentialStore]`
- `lib/repositories/credentialRepository.ts` — `[CredentialRepository]`
- `lib/credentialOrchestrator.ts` — `[CredentialOrchestrator]`

## Implementation Deviations

The design was implemented as specified with two unanticipated areas:

1. **Test mock overhaul:** Switching from `vi.spyOn(log, 'method')` to
   `vi.mock` with `createLogger` required updating all 13 test files that
   assert on log calls (see the implementation plan's deviations section).
2. **Scope expanded to 16 files:** Two additional repository files
   (`passkeyCredentialRepository.ts`, `passwordCredentialRepository.ts`)
   were migrated despite not using `[ClassName]` prefixes, since they
   imported the shared `log` singleton and benefited from scoped namespaces.
