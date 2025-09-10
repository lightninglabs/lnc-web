// Vitest setup file
// This file is executed before running tests
// Add any global test setup here

import { beforeEach, vi } from 'vitest';
import { MockLocalStorage } from './mocks/localStorage';

// Create a global MockLocalStorage instance
const localStorageMock = new MockLocalStorage();

// Directly assign localStorage to globalThis for Node test environment
globalThis.localStorage = localStorageMock;

// Mock crypto API
const cryptoMock = {
    getRandomValues: vi.fn((array: Uint8Array) => {
        // Fill array with deterministic values for testing
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    })
};

Object.defineProperty(globalThis, 'crypto', {
    value: cryptoMock,
    writable: true
});

// Mock WebAssembly
const webAssemblyMock = {
    instantiateStreaming: vi.fn().mockResolvedValue({
        module: {},
        instance: { exports: {} }
    }),
    compileStreaming: vi.fn().mockResolvedValue({}),
    instantiate: vi.fn().mockResolvedValue({
        module: {},
        instance: { exports: {} }
    }),
    compile: vi.fn().mockResolvedValue({}),
    validate: vi.fn().mockReturnValue(true),
    Module: vi.fn(),
    Instance: vi.fn(),
    Memory: vi.fn(),
    Table: vi.fn()
};

Object.defineProperty(globalThis, 'WebAssembly', {
    value: webAssemblyMock,
    writable: true
});

// Mock Go constructor (used by WebAssembly)
const GoMock = vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue(undefined),
    importObject: {},
    exited: false
}));

Object.defineProperty(globalThis, 'Go', {
    value: GoMock,
    writable: true
});

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock (clears storage and resets spy history)
    localStorageMock.reset();
    // Clear other mocks
    cryptoMock.getRandomValues.mockClear();
    webAssemblyMock.instantiateStreaming.mockClear();
});
