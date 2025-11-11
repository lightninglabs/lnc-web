import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { PasswordStrategy } from './passwordStrategy';
import { PasswordCredentialRepository } from '../repositories/passwordCredentialRepository';

// Mock PasswordCredentialRepository
const mockRepository = {
    unlock: vi.fn(),
    getCredential: vi.fn(),
    setCredential: vi.fn(),
    isUnlocked: vi.fn(),
    hasAnyCredentials: vi.fn(),
    clear: vi.fn()
};

// Mock the constructor to return our mock
vi.mock('../repositories/passwordCredentialRepository', () => ({
    PasswordCredentialRepository: vi.fn().mockImplementation(() => mockRepository)
}));

describe('PasswordStrategy', () => {
    let strategy: PasswordStrategy;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock defaults
        mockRepository.unlock.mockResolvedValue(undefined);
        mockRepository.getCredential.mockResolvedValue('test-value');
        mockRepository.setCredential.mockResolvedValue(undefined);
        mockRepository.isUnlocked.mockReturnValue(false);
        mockRepository.hasAnyCredentials.mockReturnValue(false);

        strategy = new PasswordStrategy('test-namespace');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with namespace', () => {
            expect(strategy).toBeInstanceOf(PasswordStrategy);
            expect(strategy.method).toBe('password');
        });

        it('should initialize repository with namespace', () => {
            expect(PasswordCredentialRepository).toHaveBeenCalledWith('test-namespace', expect.anything());
        });
    });

    describe('isSupported()', () => {
        it('should always return true', () => {
            expect(strategy.isSupported()).toBe(true);
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
        it('should unlock with password method and return true', async () => {
            mockRepository.isUnlocked.mockReturnValue(true); // Simulate successful unlock

            const result = await strategy.unlock({ method: 'password', password: 'test-password' });

            expect(result).toBe(true);
            expect(mockRepository.unlock).toHaveBeenCalledWith({
                method: 'password',
                password: 'test-password'
            });
        });

        it('should return false for non-password method', async () => {
            const result = await strategy.unlock({ method: 'passkey' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).not.toHaveBeenCalled();
        });

        it('should return false when password is not provided', async () => {
            const result = await strategy.unlock({ method: 'password' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).not.toHaveBeenCalled();
        });

        it('should return false when password is empty', async () => {
            const result = await strategy.unlock({ method: 'password', password: '' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).not.toHaveBeenCalled();
        });

        it('should return false when repository unlock fails', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);

            const result = await strategy.unlock({ method: 'password', password: 'test-password' });

            expect(result).toBe(false);
            expect(mockRepository.unlock).toHaveBeenCalled();
        });

        it('should log error when unlock fails', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error');

            await strategy.unlock({ method: 'password', password: 'test-password' });

            expect(consoleSpy).toHaveBeenCalledWith('[PasswordStrategy] Unlock failed:', error);
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
                '[PasswordStrategy] Cannot get credential - not unlocked'
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
                '[PasswordStrategy] Failed to get credential test-key:',
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
                '[PasswordStrategy] Cannot set credential - not unlocked'
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
                '[PasswordStrategy] Failed to set credential test-key:',
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
            const unlockResult = await strategy.unlock({ method: 'password', password: 'test-password' });
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

            // Clear
            strategy.clear();
            expect(mockRepository.clear).toHaveBeenCalled();
        });

        it('should handle unlock failure gracefully', async () => {
            const error = new Error('Unlock failed');
            mockRepository.unlock.mockRejectedValue(error);

            const unlockResult = await strategy.unlock({ method: 'password', password: 'wrong-password' });

            expect(unlockResult).toBe(false);
            expect(strategy.isUnlocked()).toBe(false);
        });

        it('should work with different namespaces', () => {
            const strategy1 = new PasswordStrategy('namespace1');
            const strategy2 = new PasswordStrategy('namespace2');

            expect(strategy1).not.toBe(strategy2);
            expect(PasswordCredentialRepository).toHaveBeenCalledWith('namespace1', expect.anything());
            expect(PasswordCredentialRepository).toHaveBeenCalledWith('namespace2', expect.anything());
        });
    });
});
