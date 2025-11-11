import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialsEncrypter } from './crypto/CredentialsEncrypter';
import { KeyWrapper } from './crypto/KeyWrapper';
import CryptoService from './cryptoService';
import { DeviceBinder } from './device/DeviceBinder';
import { OriginKeyManager } from './origin/OriginKeyManager';
import SessionManager from './sessionManager';
import { SessionStorage } from './storage/SessionStorage';

// Mock all dependencies
const mockCredentialsEncrypter = {
    encrypt: vi.fn(),
    decrypt: vi.fn()
};

const mockKeyWrapper = {
    wrapCredentialsKey: vi.fn(),
    unwrapCredentialsKey: vi.fn()
};

const mockCryptoService = {
    generateRandomCredentialsKey: vi.fn(),
    encryptCredentials: vi.fn(),
    decryptCredentials: vi.fn(),
    wrapWithDeviceKey: vi.fn(),
    unwrapWithDeviceKey: vi.fn(),
    wrapWithOriginKey: vi.fn(),
    unwrapWithOriginKey: vi.fn()
};

const mockDeviceBinder = {
    generateFingerprint: vi.fn(),
    deriveSessionKey: vi.fn()
};

const mockOriginKeyManager = {
    getOrCreateOriginKey: vi.fn(),
    loadOriginKey: vi.fn(),
    isExpired: vi.fn()
};

const mockSessionStorage = {
    save: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
    hasData: vi.fn()
};

// Mock constructors
vi.mock('./crypto/CredentialsEncrypter', () => ({
    CredentialsEncrypter: vi
        .fn()
        .mockImplementation(() => mockCredentialsEncrypter)
}));

vi.mock('./crypto/KeyWrapper', () => ({
    KeyWrapper: vi.fn().mockImplementation(() => mockKeyWrapper)
}));

vi.mock('./cryptoService', () => ({
    default: vi.fn().mockImplementation(() => mockCryptoService)
}));

vi.mock('./device/DeviceBinder', () => ({
    DeviceBinder: vi.fn().mockImplementation(() => mockDeviceBinder)
}));

vi.mock('./origin/OriginKeyManager', () => ({
    OriginKeyManager: vi.fn().mockImplementation(() => mockOriginKeyManager)
}));

vi.mock('./storage/SessionStorage', () => ({
    SessionStorage: vi.fn().mockImplementation(() => mockSessionStorage)
}));

// Mock crypto.randomUUID and crypto.getRandomValues
const mockRandomUUID = vi.fn();
const mockGetRandomValues = vi.fn();
Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: mockRandomUUID,
    writable: true
});
Object.defineProperty(globalThis.crypto, 'getRandomValues', {
    value: mockGetRandomValues,
    writable: true
});

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('SessionManager', () => {
    let sessionManager: SessionManager;
    let mockCredentials: any;
    let mockSessionData: any;
    let mockOriginKeyData: any;
    let mockEncryptedCredentials: any;
    let mockWrappedKeys: any;
    let storedSessionData: any;

    beforeEach(() => {
        vi.clearAllMocks();
        storedSessionData = null;

        mockCredentials = {
            localKey: 'test-local-key',
            remoteKey: 'test-remote-key',
            pairingPhrase: 'test-pairing-phrase',
            serverHost: 'test-server:443',
            expiresAt: Date.now() + 3600000
        };

        mockSessionData = {
            sessionId: 'test-session-id',
            deviceFingerprint: 'test-fingerprint',
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
            refreshCount: 0,
            encryptedCredentials: 'encrypted-creds-b64',
            credentialsIV: 'credentials-iv-b64',
            device: {
                keyB64: 'device-key-b64',
                ivB64: 'device-iv-b64'
            },
            origin: {
                keyB64: 'origin-key-b64',
                ivB64: 'origin-iv-b64'
            }
        };

        mockOriginKeyData = {
            originKey: new Uint8Array(32),
            expiresAt: Date.now() + 86400000
        };

        mockEncryptedCredentials = {
            ciphertextB64: 'encrypted-creds',
            ivB64: 'iv',
            credentialsKey: new Uint8Array(32)
        };

        mockWrappedKeys = {
            deviceWrap: {
                keyB64: 'device-wrap-key',
                ivB64: 'device-wrap-iv'
            },
            originWrap: {
                keyB64: 'origin-wrap-key',
                ivB64: 'origin-wrap-iv'
            }
        };

        // Reset mock defaults
        mockDeviceBinder.generateFingerprint.mockResolvedValue(
            'test-fingerprint'
        );
        mockDeviceBinder.deriveSessionKey.mockResolvedValue(new Uint8Array(32));
        mockOriginKeyManager.getOrCreateOriginKey.mockResolvedValue(
            mockOriginKeyData
        );
        mockOriginKeyManager.loadOriginKey.mockResolvedValue(mockOriginKeyData);
        mockOriginKeyManager.isExpired.mockReturnValue(false);
        mockCredentialsEncrypter.encrypt.mockResolvedValue(
            mockEncryptedCredentials
        );
        mockCredentialsEncrypter.decrypt.mockResolvedValue(mockCredentials);
        mockKeyWrapper.wrapCredentialsKey.mockResolvedValue(mockWrappedKeys);
        mockKeyWrapper.unwrapCredentialsKey.mockResolvedValue(
            new Uint8Array(32)
        );
        mockSessionStorage.save.mockImplementation((data) => {
            storedSessionData = data;
            return undefined;
        });
        mockSessionStorage.load.mockImplementation(() => storedSessionData);
        mockSessionStorage.clear.mockImplementation(() => {
            storedSessionData = null;
            return undefined;
        });
        mockSessionStorage.hasData.mockImplementation(
            () => storedSessionData != null
        );

        mockRandomUUID.mockReturnValue('test-session-id');
        mockGetRandomValues.mockImplementation((array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = i % 256;
            }
        });

        sessionManager = new SessionManager('test-namespace');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with default config', () => {
            expect(sessionManager.config.sessionDuration).toBe(
                24 * 60 * 60 * 1000
            );
            expect(sessionManager.config.enableActivityRefresh).toBe(true);
            expect(sessionManager.config.maxRefreshes).toBe(10);
        });

        it('should merge provided config with defaults', () => {
            const customConfig = { sessionDuration: 3600000, maxRefreshes: 5 };
            const manager = new SessionManager('test', customConfig);

            expect(manager.config.sessionDuration).toBe(3600000);
            expect(manager.config.maxRefreshes).toBe(5);
            expect(manager.config.enableActivityRefresh).toBe(true); // default preserved
        });

        it('should initialize all services with namespace', () => {
            expect(CredentialsEncrypter).toHaveBeenCalledWith(
                mockCryptoService
            );
            expect(KeyWrapper).toHaveBeenCalledWith(mockCryptoService);
            expect(DeviceBinder).toHaveBeenCalled();
            expect(OriginKeyManager).toHaveBeenCalledWith('test-namespace');
            expect(SessionStorage).toHaveBeenCalledWith('test-namespace');
        });
    });

    describe('createSession()', () => {
        it('should create session successfully', async () => {
            await sessionManager.createSession(mockCredentials);

            expect(mockDeviceBinder.generateFingerprint).toHaveBeenCalled();
            expect(mockCredentialsEncrypter.encrypt).toHaveBeenCalledWith(
                mockCredentials
            );
            expect(mockDeviceBinder.deriveSessionKey).toHaveBeenCalledWith(
                'test-fingerprint',
                'test-session-id'
            );
            expect(
                mockOriginKeyManager.getOrCreateOriginKey
            ).toHaveBeenCalled();
            expect(mockKeyWrapper.wrapCredentialsKey).toHaveBeenCalledWith(
                mockEncryptedCredentials.credentialsKey,
                expect.any(Uint8Array),
                mockOriginKeyData.originKey
            );
            expect(mockSessionStorage.save).toHaveBeenCalled();
        });

        it('should generate secure session ID using crypto.randomUUID when available', async () => {
            mockRandomUUID.mockReturnValue('uuid-session-id');

            await sessionManager.createSession(mockCredentials);

            expect(mockDeviceBinder.deriveSessionKey).toHaveBeenCalledWith(
                'test-fingerprint',
                'uuid-session-id'
            );
        });

        it('should generate secure session ID using crypto.getRandomValues as fallback', async () => {
            // Mock randomUUID to be undefined to trigger fallback
            const originalRandomUUID = crypto.randomUUID;
            (crypto as any).randomUUID = undefined;

            await sessionManager.createSession(mockCredentials);

            expect(mockGetRandomValues).toHaveBeenCalled();
            const getRandomValuesArg = mockGetRandomValues.mock.calls[0][0];
            expect(getRandomValuesArg).toBeInstanceOf(Uint8Array);
            expect(getRandomValuesArg.length).toBe(16);
            expect(mockDeviceBinder.deriveSessionKey).toHaveBeenCalledWith(
                'test-fingerprint',
                '000102030405060708090a0b0c0d0e0f'
            );

            // Restore
            (crypto as any).randomUUID = originalRandomUUID;
        });

        it('should throw error when session creation fails', async () => {
            mockDeviceBinder.generateFingerprint.mockRejectedValue(
                new Error('Fingerprint error')
            );

            await expect(
                sessionManager.createSession(mockCredentials)
            ).rejects.toThrow('Session creation failed: Fingerprint error');
        });

        it('should log success message', async () => {
            const consoleSpy = vi.spyOn(console, 'log');

            await sessionManager.createSession(mockCredentials);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionManager] ✅ Session created successfully!'
            );
        });
    });

    describe('canAutoRestore()', () => {
        it('should always return true', () => {
            expect(sessionManager.canAutoRestore()).toBe(true);
        });
    });

    describe('tryRestore()', () => {
        it('should delegate to restoreSession', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockSessionStorage.clear.mockImplementation(() => {
                storedSessionData = null;
                return Promise.resolve(undefined);
            });

            const result = await sessionManager.tryRestore();

            expect(result).toBe(mockCredentials);
        });
    });

    describe('restoreSession()', () => {
        it('should return undefined when no session data', async () => {
            mockSessionStorage.load.mockReturnValue(null);

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
        });

        it('should return undefined when session is expired', async () => {
            const expiredSessionData = {
                ...mockSessionData,
                expiresAt: Date.now() - 1000
            };
            mockSessionStorage.load.mockReturnValue(expiredSessionData);

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should return undefined when device fingerprint mismatch', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockDeviceBinder.generateFingerprint.mockResolvedValue(
                'different-fingerprint'
            );

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should return undefined when origin key is missing', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockOriginKeyManager.loadOriginKey.mockResolvedValue(null);

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should return undefined when origin key is expired', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockOriginKeyManager.isExpired.mockReturnValue(true);

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should successfully restore session', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);

            const result = await sessionManager.restoreSession();

            expect(result).toBe(mockCredentials);
            expect(mockDeviceBinder.generateFingerprint).toHaveBeenCalled();
            expect(mockDeviceBinder.deriveSessionKey).toHaveBeenCalledWith(
                'test-fingerprint',
                'test-session-id'
            );
            expect(mockOriginKeyManager.loadOriginKey).toHaveBeenCalled();
            expect(mockKeyWrapper.unwrapCredentialsKey).toHaveBeenCalled();
            expect(mockCredentialsEncrypter.decrypt).toHaveBeenCalled();
        });

        it('should clear session and return undefined on any error', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockDeviceBinder.generateFingerprint.mockRejectedValue(
                new Error('Fingerprint error')
            );

            const result = await sessionManager.restoreSession();

            expect(result).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should log restoration steps', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            const consoleSpy = vi.spyOn(console, 'log');

            await sessionManager.restoreSession();

            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionManager] Starting session restoration...'
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                '[SessionManager] Session restoration successful!'
            );
        });
    });

    describe('refreshSession()', () => {
        it('should return false when no session data', async () => {
            mockSessionStorage.load.mockReturnValue(null);

            const result = await sessionManager.refreshSession();

            expect(result).toBe(false);
        });

        it('should return false when max refreshes reached', async () => {
            const maxRefreshSession = { ...mockSessionData, refreshCount: 10 };
            mockSessionStorage.load.mockReturnValue(maxRefreshSession);

            const result = await sessionManager.refreshSession();

            expect(result).toBe(false);
        });

        it('should return false when session too old', async () => {
            const oldSession = {
                ...mockSessionData,
                createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000
            }; // 8 days old
            mockSessionStorage.load.mockReturnValue(oldSession);

            const result = await sessionManager.refreshSession();

            expect(result).toBe(false);
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should successfully refresh session', async () => {
            // Use fake timers to control time
            vi.useFakeTimers();
            const now = Date.now();
            vi.setSystemTime(now);

            // Set expiry in the past to ensure refresh extends it
            const sessionToRefresh = {
                ...mockSessionData,
                expiresAt: now - 1000, // 1 second ago
                createdAt: now - 3600000 // 1 hour ago
            };
            mockSessionStorage.load.mockReturnValue(sessionToRefresh);
            const originalExpiresAt = sessionToRefresh.expiresAt;

            // Advance time by 1ms to ensure the new expiry is different
            vi.advanceTimersByTime(1);

            const result = await sessionManager.refreshSession();

            expect(result).toBe(true);
            expect(mockSessionStorage.save).toHaveBeenCalled();
            expect(mockSessionStorage.save.mock.calls[0][0].refreshCount).toBe(
                1
            );
            expect(
                mockSessionStorage.save.mock.calls[0][0].expiresAt
            ).toBeGreaterThan(originalExpiresAt);

            vi.useRealTimers();
        });

        it('should clear session when origin key expires during refresh', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockOriginKeyManager.isExpired.mockReturnValue(true);

            const result = await sessionManager.refreshSession();

            expect(result).toBe(true); // Still returns true since session was extended
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should return false on error', async () => {
            mockSessionStorage.load.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const result = await sessionManager.refreshSession();

            expect(result).toBe(false);
        });
    });

    describe('getSessionTimeRemaining()', () => {
        it('should return 0 when no session data', () => {
            mockSessionStorage.load.mockReturnValue(null);

            const result = sessionManager.getSessionTimeRemaining();

            expect(result).toBe(0);
        });

        it('should return time remaining when session exists', () => {
            const futureExpiry = Date.now() + 3600000; // 1 hour
            mockSessionStorage.load.mockReturnValue({
                ...mockSessionData,
                expiresAt: futureExpiry
            });

            const result = sessionManager.getSessionTimeRemaining();

            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThanOrEqual(3600000);
        });

        it('should return 0 when session is expired', () => {
            const pastExpiry = Date.now() - 1000;
            mockSessionStorage.load.mockReturnValue({
                ...mockSessionData,
                expiresAt: pastExpiry
            });

            const result = sessionManager.getSessionTimeRemaining();

            expect(result).toBe(0);
        });
    });

    describe('getTimeUntilExpiry()', () => {
        it('should delegate to getSessionTimeRemaining', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);

            const result = await sessionManager.getTimeUntilExpiry();

            expect(result).toBe(sessionManager.getSessionTimeRemaining());
        });
    });

    describe('hasActiveSession()', () => {
        it('should return false when no session data', () => {
            mockSessionStorage.load.mockReturnValue(null);

            expect(sessionManager.hasActiveSession()).toBe(false);
        });

        it('should return false when session is expired', () => {
            const expiredSession = {
                ...mockSessionData,
                expiresAt: Date.now() - 1000
            };
            mockSessionStorage.load.mockReturnValue(expiredSession);

            expect(sessionManager.hasActiveSession()).toBe(false);
        });

        it('should return true when session exists and not expired', () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);

            expect(sessionManager.hasActiveSession()).toBe(true);
        });
    });

    describe('hasValidSession()', () => {
        it('should return false when no active session', async () => {
            mockSessionStorage.load.mockReturnValue(null);

            const result = await sessionManager.hasValidSession();

            expect(result).toBe(false);
        });

        it('should return true when session can be restored', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);

            const result = await sessionManager.hasValidSession();

            expect(result).toBe(true);
        });

        it('should return false and clear session when restoration fails', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            mockDeviceBinder.generateFingerprint.mockRejectedValue(
                new Error('Fingerprint error')
            );

            const result = await sessionManager.hasValidSession();

            expect(result).toBe(false);
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });

        it('should clear session when restoreSession throws an error', async () => {
            mockSessionStorage.load.mockReturnValue(mockSessionData);
            const restoreSpy = vi
                .spyOn(sessionManager, 'restoreSession')
                .mockRejectedValue(new Error('Restore failure'));

            const result = await sessionManager.hasValidSession();

            expect(result).toBe(false);
            expect(mockSessionStorage.clear).toHaveBeenCalled();

            restoreSpy.mockRestore();
        });
    });

    describe('clearSession()', () => {
        it('should clear session storage', () => {
            sessionManager.clearSession();

            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });
    });

    describe('getNamespace()', () => {
        it('should return the namespace', () => {
            expect(sessionManager.getNamespace()).toBe('test-namespace');
        });
    });

    describe('Private methods', () => {
        describe('generateSecureSessionId()', () => {
            it('should use crypto.randomUUID when available', () => {
                mockRandomUUID.mockReturnValue('test-uuid');

                const result = (
                    sessionManager as any
                ).generateSecureSessionId();

                expect(result).toBe('test-uuid');
                expect(mockRandomUUID).toHaveBeenCalled();
            });

            it('should use crypto.getRandomValues as fallback', () => {
                // Mock randomUUID to be undefined to trigger fallback
                const originalRandomUUID = crypto.randomUUID;
                (crypto as any).randomUUID = undefined;

                const result = (
                    sessionManager as any
                ).generateSecureSessionId();

                expect(result).toBe('000102030405060708090a0b0c0d0e0f');
                expect(mockGetRandomValues).toHaveBeenCalled();
                const getRandomValuesArg = mockGetRandomValues.mock.calls[0][0];
                expect(getRandomValuesArg).toBeInstanceOf(Uint8Array);
                expect(getRandomValuesArg.length).toBe(16);

                // Restore
                (crypto as any).randomUUID = originalRandomUUID;
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle full session lifecycle', async () => {
            // Create session
            await sessionManager.createSession(mockCredentials);
            expect(mockSessionStorage.save).toHaveBeenCalled();

            // Check active session
            expect(sessionManager.hasActiveSession()).toBe(true);

            // Validate session
            const isValid = await sessionManager.hasValidSession();
            expect(isValid).toBe(true);

            // Get time remaining
            const timeRemaining = sessionManager.getSessionTimeRemaining();
            expect(timeRemaining).toBeGreaterThan(0);

            // Refresh session
            const refreshResult = await sessionManager.refreshSession();
            expect(refreshResult).toBe(true);

            // Restore session
            const restoredCredentials = await sessionManager.restoreSession();
            expect(restoredCredentials).toEqual(mockCredentials);

            // Clear session
            sessionManager.clearSession();
            expect(mockSessionStorage.clear).toHaveBeenCalled();

            // Check no active session
            expect(sessionManager.hasActiveSession()).toBe(false);
        });

        it('should handle session expiry', async () => {
            // Create session
            await sessionManager.createSession(mockCredentials);

            // Simulate expiry by manipulating time
            const expiredSession = {
                ...mockSessionStorage.save.mock.calls[0][0],
                expiresAt: Date.now() - 1000
            };
            mockSessionStorage.load.mockReturnValue(expiredSession);

            // Check expired state
            expect(sessionManager.hasActiveSession()).toBe(false);
            expect(sessionManager.getSessionTimeRemaining()).toBe(0);

            // Try to restore expired session
            const restored = await sessionManager.restoreSession();
            expect(restored).toBeUndefined();
            expect(mockSessionStorage.clear).toHaveBeenCalled();
        });
    });
});
