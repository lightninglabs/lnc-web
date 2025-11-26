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
