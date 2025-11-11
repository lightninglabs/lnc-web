import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import CryptoService from './cryptoService';

// Mock Web Crypto API
const mockCryptoKey = {} as CryptoKey;

const mockCryptoSubtle = {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    wrapKey: vi.fn(),
    unwrapKey: vi.fn()
};

const mockCrypto = {
    subtle: mockCryptoSubtle,
    getRandomValues: vi.fn()
};

Object.defineProperty(globalThis, 'crypto', {
    value: mockCrypto,
    writable: true
});

// Mock TextEncoder/TextDecoder
const mockTextEncoder = {
    encode: vi.fn()
};

const mockTextDecoder = {
    decode: vi.fn()
};

Object.defineProperty(globalThis, 'TextEncoder', {
    value: vi.fn().mockImplementation(() => mockTextEncoder),
    writable: true
});

Object.defineProperty(globalThis, 'TextDecoder', {
    value: vi.fn().mockImplementation(() => mockTextDecoder),
    writable: true
});

// Mock btoa/atob
const mockBtoa = vi.fn();
const mockAtob = vi.fn();

Object.defineProperty(globalThis, 'btoa', {
    value: mockBtoa,
    writable: true
});

Object.defineProperty(globalThis, 'atob', {
    value: mockAtob,
    writable: true
});

describe('CryptoService', () => {
    let cryptoService: CryptoService;

    beforeEach(() => {
        cryptoService = new CryptoService();
        vi.clearAllMocks();

        // Reset mocks to default implementations
        mockCryptoSubtle.generateKey.mockResolvedValue(mockCryptoKey);
        mockCryptoSubtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
        mockCryptoSubtle.decrypt.mockResolvedValue(new ArrayBuffer(32));
        mockCryptoSubtle.wrapKey.mockResolvedValue(new ArrayBuffer(32));
        mockCryptoSubtle.unwrapKey.mockResolvedValue(mockCryptoKey);
        mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));

        mockTextEncoder.encode.mockReturnValue(new Uint8Array([1, 2, 3]));
        mockTextDecoder.decode.mockReturnValue('test-decrypted');

        mockBtoa.mockReturnValue('base64-encoded');
        mockAtob.mockReturnValue('binary-data');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('generateRandomCredentialsKey()', () => {
        it('should generate a key with correct parameters', async () => {
            const result = await cryptoService.generateRandomCredentialsKey();

            expect(result).toBe(mockCryptoKey);
            expect(mockCryptoSubtle.generateKey).toHaveBeenCalledWith(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        });

        it('should propagate errors from crypto.subtle.generateKey', async () => {
            const error = new Error('Key generation failed');
            mockCryptoSubtle.generateKey.mockRejectedValue(error);

            await expect(cryptoService.generateRandomCredentialsKey()).rejects.toThrow(
                'Key generation failed'
            );
        });
    });

    describe('encryptCredentials()', () => {
        const credentialsKey = mockCryptoKey;
        const plaintext = 'test-credentials';

        it('should encrypt credentials successfully', async () => {
            const result = await cryptoService.encryptCredentials(credentialsKey, plaintext);

            expect(result).toEqual({
                ciphertextB64: 'base64-encoded',
                ivB64: 'base64-encoded'
            });
            expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(12));
            expect(mockTextEncoder.encode).toHaveBeenCalledWith(plaintext);
            expect(mockCryptoSubtle.encrypt).toHaveBeenCalled();
        });

        it('should call crypto.subtle.encrypt with correct parameters', async () => {
            const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            mockCrypto.getRandomValues.mockReturnValue(iv);

            await cryptoService.encryptCredentials(credentialsKey, plaintext);

            expect(mockCryptoSubtle.encrypt).toHaveBeenCalledWith(
                { name: 'AES-GCM', iv: iv },
                credentialsKey,
                expect.any(Uint8Array)
            );
        });

        it('should convert ciphertext and IV to base64', async () => {
            const ciphertext = new ArrayBuffer(16);
            const iv = new Uint8Array([1, 2, 3]);
            mockCryptoSubtle.encrypt.mockResolvedValue(ciphertext);
            mockCrypto.getRandomValues.mockReturnValue(iv);

            await cryptoService.encryptCredentials(credentialsKey, plaintext);

            expect(mockBtoa).toHaveBeenCalledTimes(2); // Once for ciphertext, once for IV
        });

        it('should throw error when encryption fails', async () => {
            const error = new Error('Encryption failed');
            mockCryptoSubtle.encrypt.mockRejectedValue(error);

            await expect(cryptoService.encryptCredentials(credentialsKey, plaintext)).rejects.toThrow(
                'Credential encryption failed: Encryption failed'
            );
        });
    });

    describe('decryptCredentials()', () => {
        const credentialsKey = mockCryptoKey;
        const ciphertextB64 = 'encrypted-data';
        const ivB64 = 'iv-data';

        it('should decrypt credentials successfully', async () => {
            const result = await cryptoService.decryptCredentials(credentialsKey, ciphertextB64, ivB64);

            expect(result).toBe('test-decrypted');
            expect(mockAtob).toHaveBeenCalledWith(ciphertextB64);
            expect(mockAtob).toHaveBeenCalledWith(ivB64);
            expect(mockCryptoSubtle.decrypt).toHaveBeenCalled();
            expect(mockTextDecoder.decode).toHaveBeenCalled();
        });

        it('should call crypto.subtle.decrypt with correct parameters', async () => {
            await cryptoService.decryptCredentials(credentialsKey, ciphertextB64, ivB64);

            expect(mockCryptoSubtle.decrypt).toHaveBeenCalledWith(
                { name: 'AES-GCM', iv: expect.any(ArrayBuffer) },
                credentialsKey,
                expect.any(ArrayBuffer)
            );
        });

        it('should throw error when decryption fails', async () => {
            const error = new Error('Decryption failed');
            mockCryptoSubtle.decrypt.mockRejectedValue(error);

            await expect(cryptoService.decryptCredentials(credentialsKey, ciphertextB64, ivB64)).rejects.toThrow(
                'Credential decryption failed: Decryption failed'
            );
        });
    });

    describe('wrapWithDeviceKey()', () => {
        const credentialsKey = mockCryptoKey;
        const sessionKey = mockCryptoKey;

        it('should wrap credentials key with device key successfully', async () => {
            const result = await cryptoService.wrapWithDeviceKey(credentialsKey, sessionKey);

            expect(result).toEqual({
                keyB64: 'base64-encoded',
                ivB64: 'base64-encoded'
            });
            expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(12));
            expect(mockCryptoSubtle.wrapKey).toHaveBeenCalled();
        });

        it('should call crypto.subtle.wrapKey with correct parameters', async () => {
            const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            mockCrypto.getRandomValues.mockReturnValue(iv);

            await cryptoService.wrapWithDeviceKey(credentialsKey, sessionKey);

            expect(mockCryptoSubtle.wrapKey).toHaveBeenCalledWith(
                'raw',
                credentialsKey,
                sessionKey,
                { name: 'AES-GCM', iv: iv }
            );
        });

        it('should throw error when wrapping fails', async () => {
            const error = new Error('Wrapping failed');
            mockCryptoSubtle.wrapKey.mockRejectedValue(error);

            await expect(cryptoService.wrapWithDeviceKey(credentialsKey, sessionKey)).rejects.toThrow(
                'Device key wrapping failed: Wrapping failed'
            );
        });
    });

    describe('unwrapWithDeviceKey()', () => {
        const sessionKey = mockCryptoKey;
        const keyB64 = 'wrapped-key-data';
        const ivB64 = 'iv-data';

        it('should unwrap credentials key with device key successfully', async () => {
            const result = await cryptoService.unwrapWithDeviceKey(sessionKey, keyB64, ivB64);

            expect(result).toBe(mockCryptoKey);
            expect(mockAtob).toHaveBeenCalledWith(keyB64);
            expect(mockAtob).toHaveBeenCalledWith(ivB64);
            expect(mockCryptoSubtle.unwrapKey).toHaveBeenCalled();
        });

        it('should call crypto.subtle.unwrapKey with correct parameters', async () => {
            await cryptoService.unwrapWithDeviceKey(sessionKey, keyB64, ivB64);

            expect(mockCryptoSubtle.unwrapKey).toHaveBeenCalledWith(
                'raw',
                expect.any(ArrayBuffer),
                sessionKey,
                { name: 'AES-GCM', iv: expect.any(ArrayBuffer) },
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        });

        it('should throw error when unwrapping fails', async () => {
            const error = new Error('Unwrapping failed');
            mockCryptoSubtle.unwrapKey.mockRejectedValue(error);

            await expect(cryptoService.unwrapWithDeviceKey(sessionKey, keyB64, ivB64)).rejects.toThrow(
                'Device key unwrapping failed: Unwrapping failed'
            );
        });
    });

    describe('wrapWithOriginKey()', () => {
        const credentialsKey = mockCryptoKey;
        const originKey = mockCryptoKey;

        it('should wrap credentials key with origin key successfully', async () => {
            const result = await cryptoService.wrapWithOriginKey(credentialsKey, originKey);

            expect(result).toEqual({
                keyB64: 'base64-encoded',
                ivB64: 'base64-encoded'
            });
            expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(new Uint8Array(12));
            expect(mockCryptoSubtle.wrapKey).toHaveBeenCalled();
        });

        it('should call crypto.subtle.wrapKey with correct parameters', async () => {
            const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            mockCrypto.getRandomValues.mockReturnValue(iv);

            await cryptoService.wrapWithOriginKey(credentialsKey, originKey);

            expect(mockCryptoSubtle.wrapKey).toHaveBeenCalledWith(
                'raw',
                credentialsKey,
                originKey,
                { name: 'AES-GCM', iv: iv }
            );
        });

        it('should throw error when wrapping fails', async () => {
            const error = new Error('Wrapping failed');
            mockCryptoSubtle.wrapKey.mockRejectedValue(error);

            await expect(cryptoService.wrapWithOriginKey(credentialsKey, originKey)).rejects.toThrow(
                'Origin key wrapping failed: Wrapping failed'
            );
        });
    });

    describe('unwrapWithOriginKey()', () => {
        const originKey = mockCryptoKey;
        const keyB64 = 'wrapped-key-data';
        const ivB64 = 'iv-data';

        it('should unwrap credentials key with origin key successfully', async () => {
            const result = await cryptoService.unwrapWithOriginKey(originKey, keyB64, ivB64);

            expect(result).toBe(mockCryptoKey);
            expect(mockAtob).toHaveBeenCalledWith(keyB64);
            expect(mockAtob).toHaveBeenCalledWith(ivB64);
            expect(mockCryptoSubtle.unwrapKey).toHaveBeenCalled();
        });

        it('should call crypto.subtle.unwrapKey with correct parameters', async () => {
            await cryptoService.unwrapWithOriginKey(originKey, keyB64, ivB64);

            expect(mockCryptoSubtle.unwrapKey).toHaveBeenCalledWith(
                'raw',
                expect.any(ArrayBuffer),
                originKey,
                { name: 'AES-GCM', iv: expect.any(ArrayBuffer) },
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        });

        it('should throw error when unwrapping fails', async () => {
            const error = new Error('Unwrapping failed');
            mockCryptoSubtle.unwrapKey.mockRejectedValue(error);

            await expect(cryptoService.unwrapWithOriginKey(originKey, keyB64, ivB64)).rejects.toThrow(
                'Origin key unwrapping failed: Unwrapping failed'
            );
        });
    });

    describe('Integration tests', () => {
        it('should support encrypt/decrypt round-trip', async () => {
            const credentialsKey = mockCryptoKey;
            const originalText = 'test-credentials-data';

            // Encrypt
            const { ciphertextB64, ivB64 } = await cryptoService.encryptCredentials(
                credentialsKey,
                originalText
            );

            // Decrypt
            const decryptedText = await cryptoService.decryptCredentials(
                credentialsKey,
                ciphertextB64,
                ivB64
            );

            expect(decryptedText).toBe('test-decrypted');
        });

        it('should support wrap/unwrap round-trip with device key', async () => {
            const credentialsKey = mockCryptoKey;
            const deviceKey = mockCryptoKey;

            // Wrap
            const { keyB64, ivB64 } = await cryptoService.wrapWithDeviceKey(
                credentialsKey,
                deviceKey
            );

            // Unwrap
            const unwrappedKey = await cryptoService.unwrapWithDeviceKey(
                deviceKey,
                keyB64,
                ivB64
            );

            expect(unwrappedKey).toBe(mockCryptoKey);
        });

        it('should support wrap/unwrap round-trip with origin key', async () => {
            const credentialsKey = mockCryptoKey;
            const originKey = mockCryptoKey;

            // Wrap
            const { keyB64, ivB64 } = await cryptoService.wrapWithOriginKey(
                credentialsKey,
                originKey
            );

            // Unwrap
            const unwrappedKey = await cryptoService.unwrapWithOriginKey(
                originKey,
                keyB64,
                ivB64
            );

            expect(unwrappedKey).toBe(mockCryptoKey);
        });
    });
});
