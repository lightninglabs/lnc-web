import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the wasm_exec module
vi.mock('../../lib/wasm_exec', () => ({}));

// Mock @lightninglabs/lnc-core to avoid actual imports
vi.mock('@lightninglabs/lnc-core');

describe('Index Module', () => {
  let originalInstantiateStreaming: any;

  beforeEach(() => {
    // Store original values
    originalInstantiateStreaming = globalThis.WebAssembly?.instantiateStreaming;

    // Mock WebAssembly for testing
    globalThis.WebAssembly = {
      instantiateStreaming: vi.fn(),
      instantiate: vi.fn(),
      compile: vi.fn()
    } as any;
  });

  afterEach(() => {
    // Restore original values
    if (originalInstantiateStreaming) {
      globalThis.WebAssembly.instantiateStreaming =
        originalInstantiateStreaming;
    }
    vi.restoreAllMocks();
  });

  describe('WebAssembly Polyfill', () => {
    it('should polyfill WebAssembly.instantiateStreaming when not available', async () => {
      // Remove instantiateStreaming to test polyfill
      delete (globalThis.WebAssembly as any).instantiateStreaming;

      // Import the index module to trigger the polyfill
      await import('./index');

      // Now WebAssembly.instantiateStreaming should exist
      expect(typeof globalThis.WebAssembly?.instantiateStreaming).toBe(
        'function'
      );

      // Call the polyfilled function and ensure it delegates to WebAssembly.instantiate
      const arrayBufferMock = vi.fn().mockResolvedValue(new ArrayBuffer(8));
      const response = Promise.resolve({
        arrayBuffer: arrayBufferMock
      } as unknown as Response);

      const instantiateSpy = vi
        .spyOn(globalThis.WebAssembly, 'instantiate')
        .mockResolvedValue({
          exports: {}
        });

      await globalThis.WebAssembly.instantiateStreaming?.(
        response as any,
        { imports: true } as any
      );

      expect(arrayBufferMock).toHaveBeenCalledTimes(1);
      expect(instantiateSpy).toHaveBeenCalledTimes(1);
    });

    it('should use existing WebAssembly.instantiateStreaming when available', async () => {
      // Set up existing WebAssembly.instantiateStreaming
      const existingInstantiateStreaming = vi.fn().mockResolvedValue({
        module: {},
        instance: {}
      });

      globalThis.WebAssembly = {
        ...globalThis.WebAssembly,
        instantiateStreaming: existingInstantiateStreaming
      };

      // Import the index module
      await import('./index');

      // The existing function should still be there
      expect(globalThis.WebAssembly.instantiateStreaming).toBe(
        existingInstantiateStreaming
      );
    });
  });
});
