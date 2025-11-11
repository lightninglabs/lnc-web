import { Mocked } from 'vitest';
import { WasmGlobal } from '../../lib/types/lnc';
import { lncGlobal } from '../../lib/wasmManager';
import { createWasmGlobalMock } from '../mocks/webassembly';

/**
 * Generate random test data
 */
const generateRandomString = (length: number = 10): string => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate a random pairing phrase for testing
 */
const generateRandomPairingPhrase = (): string => {
    return `phrase_${generateRandomString(20)}`;
};

/**
 * Generate a random key for testing
 */
const generateRandomKey = (): string => {
    return `key_${generateRandomString(32)}`;
};

/**
 * Generate a random host for testing
 */
const generateRandomHost = (): string => {
    return `host${Math.floor(Math.random() * 1000)}.example.com:443`;
};

/**
 * Test data factory for common test scenarios
 */
export const testData = {
    password: 'testpassword123', // Fixed password for mock compatibility
    pairingPhrase: generateRandomPairingPhrase(),
    localKey: generateRandomKey(),
    remoteKey: generateRandomKey(),
    serverHost: generateRandomHost(),
    namespace: 'test_namespace'
};

/**
 * Type-safe global access helpers
 */
export const globalAccess = {
    /**
     * Set up a WASM global mock in the specified namespace
     */
    setupWasmGlobal(
        namespace: string = 'default',
        mock?: Mocked<WasmGlobal>
    ): Mocked<WasmGlobal> {
        const wasmMock = mock || createWasmGlobalMock();
        this.setWasmGlobal(namespace, wasmMock);
        return wasmMock;
    },

    /**
     * Set the WASM global for a specific namespace
     */
    setWasmGlobal(namespace: string, value: WasmGlobal): void {
        lncGlobal[namespace] = value;
    },

    /**
     * Get the WASM global for a specific namespace
     */
    getWasmGlobal(namespace: string): Mocked<WasmGlobal> {
        return lncGlobal[namespace] as Mocked<WasmGlobal>;
    },

    /**
     * Clean up a namespace-specific global
     */
    clearWasmGlobal(namespace: string): void {
        delete lncGlobal[namespace];
    },

    /**
     * Get the window object (with proper typing for tests)
     */
    get window(): Window & typeof globalThis {
        return lncGlobal.window || globalThis;
    },

    /**
     * Set the window object for testing
     */
    set window(value: Window & typeof globalThis) {
        lncGlobal.window = value;
    }
};
