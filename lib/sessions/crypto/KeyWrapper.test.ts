import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { KeyWrapper, WrappedKeys } from './KeyWrapper';
import CryptoService from '../cryptoService';

// Mock CryptoService
const mockCryptoService = {
    wrapWithDeviceKey: vi.fn(),
    wrapWithOriginKey: vi.fn(),
    unwrapWithDeviceKey: vi.fn(),
    unwrapWithOriginKey: vi.fn()
};

vi.mock('../cryptoService', () => ({
    default: vi.fn().mockImplementation(() => mockCryptoService)
}));

// Mock crypto.subtle for key matching verification
const mockCryptoSubtle = {
    encrypt: vi.fn()
};

Object.defineProperty(globalThis.crypto, 'subtle', {
    value: mockCryptoSubtle,
    writable: true
});

describe('KeyWrapper', () => {
    let keyWrapper: KeyWrapper;
    let mockCredentialsKey: CryptoKey;
    let mockDeviceKey: CryptoKey;
    let mockOriginKey: CryptoKey;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCredentialsKey = {} as CryptoKey;
        mockDeviceKey = {} as CryptoKey;
        mockOriginKey = {} as CryptoKey;

        // Reset mock implementations
        mockCryptoService.wrapWithDeviceKey.mockResolvedValue({
            keyB64: 'device-wrapped-key',
            ivB64: 'device-iv'
        });
        mockCryptoService.wrapWithOriginKey.mockResolvedValue({
            keyB64: 'origin-wrapped-key',
            ivB64: 'origin-iv'
        });
        mockCryptoService.unwrapWithDeviceKey.mockResolvedValue(mockCredentialsKey);
        mockCryptoService.unwrapWithOriginKey.mockResolvedValue(mockCredentialsKey);

        // Mock crypto.subtle.encrypt for key matching
        mockCryptoSubtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

        keyWrapper = new KeyWrapper(mockCryptoService as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with crypto service', () => {
            const newKeyWrapper = new KeyWrapper(mockCryptoService as any);
            expect(newKeyWrapper).toBeInstanceOf(KeyWrapper);
        });
    });

    describe('wrapCredentialsKey()', () => {
        it('should wrap credentials key with both device and origin keys', async () => {
            const result = await keyWrapper.wrapCredentialsKey(
                mockCredentialsKey,
                mockDeviceKey,
                mockOriginKey
            );

            expect(result).toEqual({
                deviceWrap: {
                    keyB64: 'device-wrapped-key',
                    ivB64: 'device-iv'
                },
                originWrap: {
                    keyB64: 'origin-wrapped-key',
                    ivB64: 'origin-iv'
                }
            });

            expect(mockCryptoService.wrapWithDeviceKey).toHaveBeenCalledWith(
                mockCredentialsKey,
                mockDeviceKey
            );
            expect(mockCryptoService.wrapWithOriginKey).toHaveBeenCalledWith(
                mockCredentialsKey,
                mockOriginKey
            );
        });

        it('should propagate errors from device key wrapping', async () => {
            const error = new Error('Device wrapping failed');
            mockCryptoService.wrapWithDeviceKey.mockRejectedValue(error);

            await expect(keyWrapper.wrapCredentialsKey(
                mockCredentialsKey,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Device wrapping failed');
        });

        it('should propagate errors from origin key wrapping', async () => {
            const error = new Error('Origin wrapping failed');
            mockCryptoService.wrapWithOriginKey.mockRejectedValue(error);

            await expect(keyWrapper.wrapCredentialsKey(
                mockCredentialsKey,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Origin wrapping failed');
        });
    });

    describe('unwrapCredentialsKey()', () => {
        const wrappedKeys: WrappedKeys = {
            deviceWrap: {
                keyB64: 'device-wrapped-key',
                ivB64: 'device-iv'
            },
            originWrap: {
                keyB64: 'origin-wrapped-key',
                ivB64: 'origin-iv'
            }
        };

        it('should unwrap credentials key from both sources and verify they match', async () => {
            const result = await keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            );

            expect(result).toBe(mockCredentialsKey);
            expect(mockCryptoService.unwrapWithDeviceKey).toHaveBeenCalledWith(
                mockDeviceKey,
                'device-wrapped-key',
                'device-iv'
            );
            expect(mockCryptoService.unwrapWithOriginKey).toHaveBeenCalledWith(
                mockOriginKey,
                'origin-wrapped-key',
                'origin-iv'
            );
        });

        it('should verify keys match using encryption test', async () => {
            // Mock different keys that should match
            const key1 = { id: 'key1' } as CryptoKey;
            const key2 = { id: 'key2' } as CryptoKey;

            mockCryptoService.unwrapWithDeviceKey.mockResolvedValue(key1);
            mockCryptoService.unwrapWithOriginKey.mockResolvedValue(key2);

            await keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            );

            // Should test encryption with both keys
            expect(mockCryptoSubtle.encrypt).toHaveBeenCalledTimes(2);
        });

        it('should throw error when keys do not match', async () => {
            // Mock keys that don't match (different encryption results)
            mockCryptoSubtle.encrypt
                .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
                .mockResolvedValueOnce(new Uint8Array([4, 5, 6]).buffer);

            await expect(keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Key unwrapping mismatch');
        });

        it('should propagate errors from device key unwrapping', async () => {
            const error = new Error('Device unwrapping failed');
            mockCryptoService.unwrapWithDeviceKey.mockRejectedValue(error);

            await expect(keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Device unwrapping failed');
        });

        it('should propagate errors from origin key unwrapping', async () => {
            const error = new Error('Origin unwrapping failed');
            mockCryptoService.unwrapWithOriginKey.mockRejectedValue(error);

            await expect(keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Origin unwrapping failed');
        });

        it('should handle encryption failure during key verification', async () => {
            const error = new Error('Encryption verification failed');
            mockCryptoSubtle.encrypt.mockRejectedValue(error);

            await expect(keyWrapper.unwrapCredentialsKey(
                wrappedKeys,
                mockDeviceKey,
                mockOriginKey
            )).rejects.toThrow('Key unwrapping mismatch');
        });
    });

    describe('Private methods', () => {
        describe('keysMatch()', () => {
            it('should return true when keys produce identical encryption results', async () => {
                const key1 = {} as CryptoKey;
                const key2 = {} as CryptoKey;
                const testResult = new Uint8Array([1, 2, 3, 4]).buffer;

                mockCryptoSubtle.encrypt
                    .mockResolvedValueOnce(testResult)
                    .mockResolvedValueOnce(testResult);

                // Access private method through type assertion
                const result = await (keyWrapper as any).keysMatch(key1, key2);

                expect(result).toBe(true);
            });

            it('should return false when keys produce different encryption results', async () => {
                const key1 = {} as CryptoKey;
                const key2 = {} as CryptoKey;

                mockCryptoSubtle.encrypt
                    .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
                    .mockResolvedValueOnce(new Uint8Array([4, 5, 6]).buffer);

                const result = await (keyWrapper as any).keysMatch(key1, key2);

                expect(result).toBe(false);
            });

            it('should return false when encryption fails for either key', async () => {
                const key1 = {} as CryptoKey;
                const key2 = {} as CryptoKey;

                mockCryptoSubtle.encrypt
                    .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
                    .mockRejectedValueOnce(new Error('Encryption failed'));

                const result = await (keyWrapper as any).keysMatch(key1, key2);

                expect(result).toBe(false);
            });
        });

        describe('arraysEqual()', () => {
            it('should return true for identical arrays', () => {
                const arr1 = new Uint8Array([1, 2, 3, 4]);
                const arr2 = new Uint8Array([1, 2, 3, 4]);

                const result = (keyWrapper as any).arraysEqual(arr1, arr2);

                expect(result).toBe(true);
            });

            it('should return false for arrays with different lengths', () => {
                const arr1 = new Uint8Array([1, 2, 3]);
                const arr2 = new Uint8Array([1, 2, 3, 4]);

                const result = (keyWrapper as any).arraysEqual(arr1, arr2);

                expect(result).toBe(false);
            });

            it('should return false for arrays with different values', () => {
                const arr1 = new Uint8Array([1, 2, 3, 4]);
                const arr2 = new Uint8Array([1, 2, 4, 4]);

                const result = (keyWrapper as any).arraysEqual(arr1, arr2);

                expect(result).toBe(false);
            });
        });
    });

    describe('Integration tests', () => {
        it('should support wrap/unwrap round-trip with matching keys', async () => {
            // Wrap
            const wrapped = await keyWrapper.wrapCredentialsKey(
                mockCredentialsKey,
                mockDeviceKey,
                mockOriginKey
            );

            // Unwrap
            const unwrapped = await keyWrapper.unwrapCredentialsKey(
                wrapped,
                mockDeviceKey,
                mockOriginKey
            );

            expect(unwrapped).toBe(mockCredentialsKey);
        });

        it('should work with different wrapped key structures', async () => {
            const differentWrappedKeys: WrappedKeys = {
                deviceWrap: {
                    keyB64: 'different-device-key',
                    ivB64: 'different-device-iv'
                },
                originWrap: {
                    keyB64: 'different-origin-key',
                    ivB64: 'different-origin-iv'
                }
            };

            mockCryptoService.unwrapWithDeviceKey.mockResolvedValue(mockCredentialsKey);
            mockCryptoService.unwrapWithOriginKey.mockResolvedValue(mockCredentialsKey);

            const result = await keyWrapper.unwrapCredentialsKey(
                differentWrappedKeys,
                mockDeviceKey,
                mockOriginKey
            );

            expect(result).toBe(mockCredentialsKey);
            expect(mockCryptoService.unwrapWithDeviceKey).toHaveBeenCalledWith(
                mockDeviceKey,
                'different-device-key',
                'different-device-iv'
            );
            expect(mockCryptoService.unwrapWithOriginKey).toHaveBeenCalledWith(
                mockOriginKey,
                'different-origin-key',
                'different-origin-iv'
            );
        });
    });
});
