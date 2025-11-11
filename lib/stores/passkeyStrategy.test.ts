import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasskeyCredentialRepository } from '../repositories/passkeyCredentialRepository';

// Mock PasskeyCredentialRepository
const mockRepository = {
    unlock: vi.fn(),
    getCredential: vi.fn(),
    setCredential: vi.fn(),
    isUnlocked: vi.fn(),
    hasAnyCredentials: vi.fn(),
    hasStoredAuthData: vi.fn(),
    clear: vi.fn()
};

// Mock the constructor to return our mock
vi.mock('../repositories/passkeyCredentialRepository', () => ({
    PasskeyCredentialRepository: vi.fn().mockImplementation(() => mockRepository)
}));

// Mock window for WebAuthn support detection
const mockWindow = {
    PublicKeyCredential: {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn()
    }
};

Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true
});

describe('PasskeyStrategy', () => {
    let strategy: PasskeyStrategy;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock defaults
        mockRepository.unlock.mockResolvedValue(undefined);
        mockRepository.getCredential.mockResolvedValue('test-value');
        mockRepository.setCredential.mockResolvedValue(undefined);
        mockRepository.isUnlocked.mockReturnValue(false);
        mockRepository.hasAnyCredentials.mockReturnValue(false);
        mockRepository.hasStoredAuthData.mockReturnValue(false);

        strategy = new PasskeyStrategy('test-namespace', 'Test App');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with namespace and display name', () => {
            expect(strategy).toBeInstanceOf(PasskeyStrategy);
            expect(strategy.method).toBe('passkey');
        });

        it('should initialize repository with namespace', () => {
            expect(PasskeyCredentialRepository).toHaveBeenCalledWith('test-namespace', expect.anything());
        });
    });

    describe('isSupported()', () => {
        it('should return true when WebAuthn is supported', () => {
            mockWindow.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = vi.fn();

            expect(strategy.isSupported()).toBe(true);
        });

        it('should return false when window is undefined', () => {
            const originalWindow = globalThis.window;
            Object.defineProperty(globalThis, 'window', {
                value: undefined,
                writable: true
            });

            expect(strategy.isSupported()).toBe(false);

            // Restore window
            Object.defineProperty(globalThis, 'window', {
                value: originalWindow,
                writable: true
            });
        });

        it('should return false when PublicKeyCredential is not available', () => {
            const originalWindow = globalThis.window;
            Object.defineProperty(globalThis, 'window', {
                value: {},
                writable: true
            });

            expect(strategy.isSupported()).toBe(false);

            // Restore window
            Object.defineProperty(globalThis, 'window', {
                value: originalWindow,
                writable: true
            });
        });

        it('should return false when isUserVerifyingPlatformAuthenticatorAvailable is not available', () => {
            const originalWindow = globalThis.window;
            Object.defineProperty(globalThis, 'window', {
                value: {
                    PublicKeyCredential: {}
                },
                writable: true
            });

            expect(strategy.isSupported()).toBe(false);

            // Restore window
            Object.defineProperty(globalThis, 'window', {
                value: originalWindow,
                writable: true
            });
        });
    });

    describe('isUnlocked()', () => {
        it('should return repository unlock status', () => {
            mockRepository.isUnlocked.mockReturnValue(true);
            expect(strategy.isUnlocked()).toBe(true);

            mockRepository.isUnlocked.mockReturnValue(false);
            expect(strategy.isUnlocked()).toBe(false);
        });
    });

    describe('unlock()', () => {
        it('should unlock with passkey method and return true', async () => {
            mockRepository.isUnlocked.mockReturnValue(true); // Simulate successful unlock

            const result = await strategy.unlock({ method: 'passkey', createIfMissing: true });

            expect(result).toBe(true);
            expect(mockRepository.unlock).toHaveBeenCalledWith({
                method: 'passkey',
                createIfMissing: true
            });
        });

        it('should return false for non-passkey method', async () => {
            const result = await strategy.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).not.toHaveBeenCalled();
        });

        it('should return false when repository unlock fails', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);

            const result = await strategy.unlock({ method: 'passkey' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).toHaveBeenCalled();
        });

        it('should log error when unlock fails', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            await strategy.unlock({ method: 'passkey' });

            expect(consoleSpy).toHaveBeenCalledWith('[PasskeyStrategy] Unlock failed:', error);
        });
    });

    describe('hasAnyCredentials()', () => {
        it('should return repository credential status', () => {
            mockRepository.hasAnyCredentials.mockReturnValue(true);
            expect(strategy.hasAnyCredentials()).toBe(true);

            mockRepository.hasAnyCredentials.mockReturnValue(false);
            expect(strategy.hasAnyCredentials()).toBe(false);
        });
    });

    describe('hasStoredAuthData()', () => {
        it('should return repository auth data status', () => {
            mockRepository.hasStoredAuthData.mockReturnValue(true);
            expect(strategy.hasStoredAuthData()).toBe(true);

            mockRepository.hasStoredAuthData.mockReturnValue(false);
            expect(strategy.hasStoredAuthData()).toBe(false);
        });
    });

    describe('getCredential()', () => {
        it('should return credential value when unlocked', async () => {
            mockRepository.isUnlocked.mockReturnValue(true);

            const result = await strategy.getCredential('test-key');

            expect(result).toBe('test-value');
            expect(mockRepository.getCredential).toHaveBeenCalledWith('test-key');
        });

        it('should return undefined when not unlocked', async () => {
            mockRepository.isUnlocked.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn');

            const result = await strategy.getCredential('test-key');

            expect(result).toBeUndefined();
            expect(mockRepository.getCredential).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[PasskeyStrategy] Cannot get credential - not unlocked'
            );
        });

        it('should return undefined when repository throws error', async () => {
            const error = new Error('Get credential failed');
            mockRepository.isUnlocked.mockReturnValue(true);
            mockRepository.getCredential.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            const result = await strategy.getCredential('test-key');

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[PasskeyStrategy] Failed to get credential test-key:',
                error
            );
        });
    });

    describe('setCredential()', () => {
        it('should set credential when unlocked', async () => {
            mockRepository.isUnlocked.mockReturnValue(true);

            await strategy.setCredential('test-key', 'test-value');

            expect(mockRepository.setCredential).toHaveBeenCalledWith('test-key', 'test-value');
        });

        it('should not set credential when not unlocked', async () => {
            mockRepository.isUnlocked.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn');

            await strategy.setCredential('test-key', 'test-value');

            expect(mockRepository.setCredential).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                '[PasskeyStrategy] Cannot set credential - not unlocked'
            );
        });

        it('should propagate repository errors', async () => {
            const error = new Error('Set credential failed');
            mockRepository.isUnlocked.mockReturnValue(true);
            mockRepository.setCredential.mockRejectedValue(error);

            await expect(strategy.setCredential('test-key', 'test-value')).rejects.toThrow('Set credential failed');
        });

        it('should log error when set fails', async () => {
            const error = new Error('Set credential failed');
            mockRepository.isUnlocked.mockReturnValue(true);
            mockRepository.setCredential.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            try {
                await strategy.setCredential('test-key', 'test-value');
            } catch {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                '[PasskeyStrategy] Failed to set credential test-key:',
                error
            );
        });
    });

    describe('clear()', () => {
        it('should clear repository', () => {
            strategy.clear();

            expect(mockRepository.clear).toHaveBeenCalled();
        });
    });

    describe('Integration tests', () => {
        it('should support full authentication workflow', async () => {
            // Initially not unlocked
            expect(strategy.isUnlocked()).toBe(false);

            // Unlock
            mockRepository.isUnlocked.mockReturnValue(true);
            const unlockResult = await strategy.unlock({ method: 'passkey', createIfMissing: true });
            expect(unlockResult).toBe(true);
            expect(strategy.isUnlocked()).toBe(true);

            // Set credentials
            await strategy.setCredential('localKey', 'test-local');
            await strategy.setCredential('remoteKey', 'test-remote');

            // Get credentials
            const localKey = await strategy.getCredential('localKey');
            const remoteKey = await strategy.getCredential('remoteKey');

            expect(localKey).toBe('test-value');
            expect(remoteKey).toBe('test-value');

            // Check credentials exist
            mockRepository.hasAnyCredentials.mockReturnValue(true);
            expect(strategy.hasAnyCredentials()).toBe(true);

            // Check auth data
            mockRepository.hasStoredAuthData.mockReturnValue(true);
            expect(strategy.hasStoredAuthData()).toBe(true);

            // Clear
            strategy.clear();
            expect(mockRepository.clear).toHaveBeenCalled();
        });

        it('should handle unlock failure gracefully', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);

            const unlockResult = await strategy.unlock({ method: 'passkey' });

            expect(unlockResult).toBe(false);
            expect(strategy.isUnlocked()).toBe(false);
        });

        it('should work with different namespaces and display names', () => {
            const strategy1 = new PasskeyStrategy('namespace1', 'App 1');
            const strategy2 = new PasskeyStrategy('namespace2', 'App 2');

            expect(strategy1).not.toBe(strategy2);
            expect(PasskeyCredentialRepository).toHaveBeenCalledWith('namespace1', expect.anything());
            expect(PasskeyCredentialRepository).toHaveBeenCalledWith('namespace2', expect.anything());
        });
    });
});
