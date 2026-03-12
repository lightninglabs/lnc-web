import { Mock } from 'vitest';
import LightningNodeConnect from '../../lib/lightningNodeConnect';
import { WasmGlobal } from '../../lib/types/lnc';
import {
  createGoInstanceMock,
  createWasmGlobalMock
} from '../../test/mocks/webassembly';
import { MockLocalStorage } from '../mocks/localStorage';
import { globalAccess } from './test-helpers';

/**
 * Factory for creating comprehensive test setups
 */

export interface MockSetup {
  localStorage: MockLocalStorage;
  wasmGlobal: WasmGlobal | null;
  goInstance: ReturnType<typeof createGoInstanceMock>;
  namespace: string;
  cleanup: () => void;
}

/**
 * Typed mock accessors extracted from a LightningNodeConnect instance.
 * The modern class keeps its collaborators private, so tests access them
 * through this typed helper instead of raw `as any` casts.
 */
export interface ModernMockSetup {
  wasmManager: {
    isReady: boolean;
    isConnected: boolean;
    status: string;
    expiry: Date;
    isReadOnly: boolean;
    hasPerms: Mock;
    preload: Mock;
    run: Mock;
    waitTilReady: Mock;
    connect: Mock;
    disconnect: Mock;
    request: Mock;
    subscribe: Mock;
    callbacks: {
      onLocalKeyCreated: (keyHex: string) => void;
      onRemoteKeyReceived: (keyHex: string) => void;
    };
  };
  credentialCache: {
    get: Mock;
    set: Mock;
    has: Mock;
    clear: Mock;
    hasAny: Mock;
  };
  authCoordinator: {
    unlock: Mock;
    tryAutoRestore: Mock;
    getAuthenticationInfo: Mock;
    clearSession: Mock;
    persistCachedCredentials: Mock;
    createSessionAfterConnection: Mock;
    waitForSessionRestoration: Mock;
    isUnlocked: boolean;
  };
  strategyManager: {
    getStrategy: Mock;
    hasAnyCredentials: boolean;
    preferredMethod: string;
    supportedMethods: string[];
    clearAll: Mock;
  };
  config: Record<string, unknown>;
}

/**
 * Extract typed mock accessors from a LightningNodeConnect instance.
 * Requires that vi.mock() calls have already been set up for all
 * dependencies (WasmManager, AuthenticationCoordinator, etc.).
 */
export const createModernMockSetup = (
  lnc: LightningNodeConnect
): ModernMockSetup => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = lnc as any;
  return {
    wasmManager: instance._wasmManager,
    credentialCache: instance._credentialCache,
    authCoordinator: instance._authCoordinator,
    strategyManager: instance._strategyManager,
    config: instance._config
  };
};

/**
 * Create a complete mock setup for LNC testing which mocks localStorage, Go, and
 * the WASM global functions
 */
export const createMockSetup = (
  namespace: string = 'default',
  includeWasmGlobal: boolean = true
): MockSetup => {
  // Create mocks
  const localStorage = new MockLocalStorage();
  const wasmGlobal = includeWasmGlobal ? createWasmGlobalMock() : null;
  const goInstance = createGoInstanceMock();

  // Store original values
  const originalLocalStorage = globalThis.localStorage;
  const originalNamespaceValue = globalAccess.getWasmGlobal(namespace);

  // Setup mocks
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    writable: true
  });

  // Cleanup function
  const cleanup = () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });

    if (originalNamespaceValue !== undefined) {
      globalAccess.setWasmGlobal(namespace, originalNamespaceValue);
    } else {
      globalAccess.clearWasmGlobal(namespace);
    }
  };

  return {
    localStorage,
    wasmGlobal,
    goInstance,
    namespace,
    cleanup
  };
};
