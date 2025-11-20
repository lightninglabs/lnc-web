import { Mocked, vi } from 'vitest';
import { WasmGlobal } from '../../lib/types/lnc';

/**
 * Mock WebAssembly global object for testing
 */
export const createWasmGlobalMock = (): Mocked<WasmGlobal> => ({
  wasmClientIsReady: vi.fn().mockReturnValue(false),
  wasmClientIsConnected: vi.fn().mockReturnValue(false),
  wasmClientStatus: vi.fn().mockReturnValue('ready'),
  wasmClientGetExpiry: vi.fn().mockReturnValue(Date.now() / 1000),
  wasmClientIsReadOnly: vi.fn().mockReturnValue(false),
  wasmClientHasPerms: vi.fn().mockReturnValue(false),
  wasmClientConnectServer: vi.fn(),
  wasmClientDisconnect: vi.fn(),
  wasmClientInvokeRPC: vi.fn()
});

/**
 * Mock Go instance for WebAssembly execution
 */
export const createGoInstanceMock = () => ({
  run: vi.fn().mockResolvedValue(undefined),
  importObject: {},
  exited: false
});
