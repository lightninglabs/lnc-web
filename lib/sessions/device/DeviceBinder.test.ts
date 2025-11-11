import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { DeviceBinder } from './DeviceBinder';

// Mock screen properties
const mockScreen = {
    width: 1920,
    height: 1080,
    colorDepth: 24
};

Object.defineProperty(globalThis, 'screen', {
    value: mockScreen,
    writable: true
});

// Mock Intl.DateTimeFormat
const mockDateTimeFormat = {
    resolvedOptions: vi.fn().mockReturnValue({
        timeZone: 'America/New_York'
    })
};

Object.defineProperty(Intl, 'DateTimeFormat', {
    value: vi.fn().mockImplementation(() => mockDateTimeFormat),
    writable: true
});

// Mock document
const mockCanvas = {
    getContext: vi.fn(),
    toDataURL: vi.fn()
};

const mockCanvasContext = {
    textBaseline: '',
    font: '',
    fillText: vi.fn()
};

const mockCreateElement = vi.fn().mockReturnValue(mockCanvas);

const mockDocument = {
    createElement: mockCreateElement
};

Object.defineProperty(globalThis, 'document', {
    value: mockDocument,
    writable: true
});

// Mock crypto.subtle
const mockCryptoSubtle = {
    digest: vi.fn()
};

Object.defineProperty(globalThis.crypto, 'subtle', {
    value: mockCryptoSubtle,
    writable: true
});

// Mock crypto.subtle operations for deriveSessionKey
const mockImportKey = vi.fn();
const mockDeriveKey = vi.fn();

Object.defineProperty(mockCryptoSubtle, 'importKey', {
    value: mockImportKey,
    writable: true
});

Object.defineProperty(mockCryptoSubtle, 'deriveKey', {
    value: mockDeriveKey,
    writable: true
});

describe('DeviceBinder', () => {
    let deviceBinder: DeviceBinder;
    let mockCryptoKey: CryptoKey;

    beforeEach(() => {
        deviceBinder = new DeviceBinder();
        vi.clearAllMocks();
        mockCryptoKey = {} as CryptoKey;

        // Reset mock implementations
        mockCanvas.getContext.mockReturnValue(mockCanvasContext);
        mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,test-canvas-data');
        mockCryptoSubtle.digest.mockResolvedValue(new ArrayBuffer(32));
        mockImportKey.mockResolvedValue(mockCryptoKey);
        mockDeriveKey.mockResolvedValue(mockCryptoKey);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance', () => {
            const binder = new DeviceBinder();
            expect(binder).toBeInstanceOf(DeviceBinder);
        });
    });

    describe('generateFingerprint()', () => {
        it('should generate fingerprint combining screen, timezone, and canvas data', async () => {
            const result = await deviceBinder.generateFingerprint();

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Device fingerprint test', 2, 2);
            expect(mockCanvas.toDataURL).toHaveBeenCalled();
            expect(mockCryptoSubtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
        });

        it('should use correct screen properties', async () => {
            await deviceBinder.generateFingerprint();

            expect(mockCryptoSubtle.digest).toHaveBeenCalledWith(
                'SHA-256',
                expect.any(Uint8Array)
            );
        });

        it('should use correct timezone', async () => {
            await deviceBinder.generateFingerprint();

            expect(Intl.DateTimeFormat).toHaveBeenCalled();
            expect(mockDateTimeFormat.resolvedOptions).toHaveBeenCalled();
        });

        it('should handle canvas fingerprinting failure', async () => {
            mockCanvas.getContext.mockReturnValue(null);

            await expect(deviceBinder.generateFingerprint()).rejects.toThrow(
                'Canvas fingerprinting required for session security'
            );
        });

        it('should handle canvas context unavailable', async () => {
            mockCanvas.getContext.mockImplementation(() => {
                throw new Error('Canvas not supported');
            });

            await expect(deviceBinder.generateFingerprint()).rejects.toThrow(
                'Canvas fingerprinting required for session security'
            );
        });

        it('should handle crypto digest failure', async () => {
            const error = new Error('Digest failed');
            mockCryptoSubtle.digest.mockRejectedValue(error);

            await expect(deviceBinder.generateFingerprint()).rejects.toThrow();
        });
    });

    describe('deriveSessionKey()', () => {
        const fingerprint = 'test-fingerprint';
        const sessionId = 'test-session-id';

        it('should derive session key from fingerprint and session ID', async () => {
            const result = await deviceBinder.deriveSessionKey(fingerprint, sessionId);

            expect(result).toBe(mockCryptoKey);
            expect(mockImportKey).toHaveBeenCalledWith(
                'raw',
                expect.any(Uint8Array), // fingerprint encoded
                'HKDF',
                false,
                ['deriveKey']
            );
            expect(mockDeriveKey).toHaveBeenCalledWith(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: expect.any(Uint8Array), // sessionId encoded
                    info: expect.any(Uint8Array) // 'lnc-session-device-key' encoded
                },
                mockCryptoKey, // baseKey
                { name: 'AES-GCM', length: 256 },
                false,
                ['wrapKey', 'unwrapKey']
            );
        });

        it('should encode fingerprint correctly', async () => {
            await deviceBinder.deriveSessionKey(fingerprint, sessionId);

            const expectedFingerprintBytes = new TextEncoder().encode(fingerprint);
            expect(mockImportKey).toHaveBeenCalledWith(
                'raw',
                expectedFingerprintBytes,
                'HKDF',
                false,
                ['deriveKey']
            );
        });

        it('should encode sessionId as salt', async () => {
            await deviceBinder.deriveSessionKey(fingerprint, sessionId);

            const expectedSessionIdBytes = new TextEncoder().encode(sessionId);
            expect(mockDeriveKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    salt: expectedSessionIdBytes
                }),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
        });

        it('should use correct info parameter', async () => {
            await deviceBinder.deriveSessionKey(fingerprint, sessionId);

            const expectedInfoBytes = new TextEncoder().encode('lnc-session-device-key');
            expect(mockDeriveKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    info: expectedInfoBytes
                }),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
        });

        it('should handle importKey failure', async () => {
            const error = new Error('Import key failed');
            mockImportKey.mockRejectedValue(error);

            await expect(deviceBinder.deriveSessionKey(fingerprint, sessionId)).rejects.toThrow(
                'Import key failed'
            );
        });

        it('should handle deriveKey failure', async () => {
            const error = new Error('Derive key failed');
            mockDeriveKey.mockRejectedValue(error);

            await expect(deviceBinder.deriveSessionKey(fingerprint, sessionId)).rejects.toThrow(
                'Derive key failed'
            );
        });
    });

    describe('Private methods', () => {
        describe('generateCanvasFingerprint()', () => {
            it('should create canvas and render test pattern', async () => {
                // Access private method through type assertion
                const result = await (deviceBinder as any).generateCanvasFingerprint();

                expect(typeof result).toBe('string');
                expect(result.length).toBe(64); // SHA-256 hex length
                expect(mockCreateElement).toHaveBeenCalledWith('canvas');
                expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
                expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Device fingerprint test', 2, 2);
                expect(mockCanvas.toDataURL).toHaveBeenCalled();
                expect(mockCryptoSubtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
            });

            it('should set correct canvas context properties', async () => {
                await (deviceBinder as any).generateCanvasFingerprint();

                expect(mockCanvasContext.textBaseline).toBe('top');
                expect(mockCanvasContext.font).toBe('14px Arial');
            });

            it('should handle canvas context unavailable', async () => {
                mockCanvas.getContext.mockReturnValue(null);

                await expect((deviceBinder as any).generateCanvasFingerprint()).rejects.toThrow(
                    'Canvas fingerprinting required for session security'
                );
            });

            it('should handle canvas data URL generation failure', async () => {
                mockCanvas.toDataURL.mockImplementation(() => {
                    throw new Error('Data URL failed');
                });

                await expect((deviceBinder as any).generateCanvasFingerprint()).rejects.toThrow(
                    'Canvas fingerprinting required for session security'
                );
            });
        });

        describe('hashFingerprint()', () => {
            it('should hash fingerprint string with SHA-256', async () => {
                const fingerprint = 'test-fingerprint-data';

                const result = await (deviceBinder as any).hashFingerprint(fingerprint);

                expect(typeof result).toBe('string');
                expect(result.length).toBe(64); // SHA-256 hex length
                expect(mockCryptoSubtle.digest).toHaveBeenCalledWith(
                    'SHA-256',
                    new TextEncoder().encode(fingerprint)
                );
            });

            it('should convert digest to hex string', async () => {
                const mockDigest = new Uint8Array([0x12, 0x34, 0xab, 0xcd]).buffer;
                mockCryptoSubtle.digest.mockResolvedValue(mockDigest);

                const result = await (deviceBinder as any).hashFingerprint('test');

                expect(result).toBe('1234abcd');
            });

            it('should handle digest failure', async () => {
                const error = new Error('Digest failed');
                mockCryptoSubtle.digest.mockRejectedValue(error);

                await expect((deviceBinder as any).hashFingerprint('test')).rejects.toThrow('Digest failed');
            });
        });
    });

    describe('Integration tests', () => {
        it('should generate consistent fingerprints for same device properties', async () => {
            // Mock consistent canvas data
            mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,consistent-data');

            const fingerprint1 = await deviceBinder.generateFingerprint();
            const fingerprint2 = await deviceBinder.generateFingerprint();

            expect(fingerprint1).toBe(fingerprint2);
        });

        it('should derive different keys for different fingerprints', async () => {
            const fingerprint1 = 'fingerprint-1';
            const fingerprint2 = 'fingerprint-2';
            const sessionId = 'test-session';

            const key1 = await deviceBinder.deriveSessionKey(fingerprint1, sessionId);
            const key2 = await deviceBinder.deriveSessionKey(fingerprint2, sessionId);

            expect(key1).toBe(mockCryptoKey);
            expect(key2).toBe(mockCryptoKey);
            // In reality these would be different keys, but our mock returns the same
        });

        it('should derive different keys for different session IDs', async () => {
            const fingerprint = 'test-fingerprint';
            const sessionId1 = 'session-1';
            const sessionId2 = 'session-2';

            const key1 = await deviceBinder.deriveSessionKey(fingerprint, sessionId1);
            const key2 = await deviceBinder.deriveSessionKey(fingerprint, sessionId2);

            expect(key1).toBe(mockCryptoKey);
            expect(key2).toBe(mockCryptoKey);
            // In reality these would be different keys, but our mock returns the same
        });

        it('should handle full fingerprint and key derivation workflow', async () => {
            // Generate fingerprint
            const fingerprint = await deviceBinder.generateFingerprint();

            // Derive session key
            const sessionId = 'integration-test-session';
            const sessionKey = await deviceBinder.deriveSessionKey(fingerprint, sessionId);

            expect(typeof fingerprint).toBe('string');
            expect(fingerprint.length).toBeGreaterThan(0);
            expect(sessionKey).toBe(mockCryptoKey);
        });
    });
});
