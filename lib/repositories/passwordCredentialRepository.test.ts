import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { PasswordCredentialRepository } from './passwordCredentialRepository';
import { PasswordEncryptionService } from '../encryption/passwordEncryptionService';

// Mock PasswordEncryptionService
const mockEncryptionService = {
    unlock: vi.fn(),
    decrypt: vi.fn(),
    encrypt: vi.fn(),
    isUnlocked: vi.fn(),
    lock: vi.fn(),
    getSalt: vi.fn(),
    createTestCipher: vi.fn()
};

vi.mock('../encryption/passwordEncryptionService', () => ({
    PasswordEncryptionService: vi.fn().mockImplementation(() => mockEncryptionService)
}));

describe('PasswordCredentialRepository', () => {
    let repository: PasswordCredentialRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock defaults
        mockEncryptionService.unlock.mockResolvedValue(undefined);
        mockEncryptionService.decrypt.mockResolvedValue('decrypted-value');
        mockEncryptionService.encrypt.mockResolvedValue('encrypted-value');
        mockEncryptionService.isUnlocked.mockReturnValue(false);
        mockEncryptionService.getSalt.mockReturnValue('test-salt');
        mockEncryptionService.createTestCipher.mockReturnValue('test-cipher');

        repository = new PasswordCredentialRepository('test-namespace', mockEncryptionService as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with namespace and encryption service', () => {
            const repo = new PasswordCredentialRepository('test-ns', mockEncryptionService as any);
            expect(repo).toBeInstanceOf(PasswordCredentialRepository);
        });
    });

    describe('unlock()', () => {
        it('should unlock with password method', async () => {
            const options = { method: 'password' as const, password: 'test-password' };

            await repository.unlock(options);

            expect(mockEncryptionService.unlock).toHaveBeenCalledWith({
                method: 'password',
                password: 'test-password',
                salt: undefined,
                cipher: undefined
            });
        });

        it('should load existing salt and cipher from storage', async () => {
            // Set up existing salt and cipher
            repository['credentials'].set('salt', 'existing-salt');
            repository['credentials'].set('cipher', 'existing-cipher');

            const options = { method: 'password' as const, password: 'test-password' };

            await repository.unlock(options);

            expect(mockEncryptionService.unlock).toHaveBeenCalledWith({
                method: 'password',
                password: 'test-password',
                salt: 'existing-salt',
                cipher: 'existing-cipher'
            });
        });

        it('should store salt and cipher on first unlock', async () => {
            const options = { method: 'password' as const, password: 'test-password' };

            await repository.unlock(options);

            expect(mockEncryptionService.getSalt).toHaveBeenCalled();
            expect(mockEncryptionService.createTestCipher).toHaveBeenCalled();
            expect(repository['credentials'].get('salt')).toBe('test-salt');
            expect(repository['credentials'].get('cipher')).toBe('test-cipher');
        });

        it('should not store salt and cipher when they already exist', async () => {
            repository['credentials'].set('salt', 'existing-salt');
            repository['credentials'].set('cipher', 'existing-cipher');

            const options = { method: 'password' as const, password: 'test-password' };

            await repository.unlock(options);

            expect(mockEncryptionService.getSalt).not.toHaveBeenCalled();
            expect(mockEncryptionService.createTestCipher).not.toHaveBeenCalled();
        });

        it('should throw error for non-password method', async () => {
            const options = { method: 'passkey' as const };

            await expect(repository.unlock(options)).rejects.toThrow(
                'Password repository requires password unlock method'
            );
        });

        it('should propagate encryption service unlock errors', async () => {
            const error = new Error('Unlock failed');
            mockEncryptionService.unlock.mockRejectedValue(error);

            const options = { method: 'password' as const, password: 'test-password' };

            await expect(repository.unlock(options)).rejects.toThrow('Unlock failed');
        });
    });

    describe('getCredential()', () => {
        it('should return undefined when credential does not exist', async () => {
            const result = await repository.getCredential('non-existent-key');

            expect(result).toBeUndefined();
            expect(mockEncryptionService.decrypt).not.toHaveBeenCalled();
        });

        it('should decrypt and return credential value', async () => {
            repository['credentials'].set('test-key', 'encrypted-data');
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            const result = await repository.getCredential('test-key');

            expect(result).toBe('decrypted-value');
            expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data');
        });

        it('should return undefined when decryption fails', async () => {
            repository['credentials'].set('test-key', 'encrypted-data');
            mockEncryptionService.isUnlocked.mockReturnValue(true);
            mockEncryptionService.decrypt.mockRejectedValue(new Error('Decryption failed'));

            const result = await repository.getCredential('test-key');

            expect(result).toBeUndefined();
        });

        it('should handle decryption errors gracefully', async () => {
            repository['credentials'].set('test-key', 'encrypted-data');
            const error = new Error('Decryption error');
            mockEncryptionService.decrypt.mockRejectedValue(error);

            const consoleSpy = vi.spyOn(console, 'error');

            const result = await repository.getCredential('test-key');

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt credential test-key:', error);
        });
    });

    describe('setCredential()', () => {
        it('should encrypt and store credential when unlocked', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            await repository.setCredential('test-key', 'test-value');

            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('test-value');
            expect(repository['credentials'].get('test-key')).toBe('encrypted-value');
        });

        it('should throw error when repository is locked', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(false);

            await expect(repository.setCredential('test-key', 'test-value')).rejects.toThrow(
                'Repository is locked. Call unlock() first.'
            );

            expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();
        });

        it('should propagate encryption errors', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(true);
            const error = new Error('Encryption failed');
            mockEncryptionService.encrypt.mockRejectedValue(error);

            await expect(repository.setCredential('test-key', 'test-value')).rejects.toThrow('Encryption failed');
        });
    });

    describe('isUnlocked()', () => {
        it('should return encryption service unlock status', () => {
            mockEncryptionService.isUnlocked.mockReturnValue(true);
            expect(repository.isUnlocked()).toBe(true);

            mockEncryptionService.isUnlocked.mockReturnValue(false);
            expect(repository.isUnlocked()).toBe(false);
        });
    });

    describe('lock()', () => {
        it('should call encryption service lock', () => {
            repository.lock();

            expect(mockEncryptionService.lock).toHaveBeenCalled();
        });
    });

    describe('hasStoredAuthData()', () => {
        it('should return true when both salt and cipher exist', () => {
            repository['credentials'].set('salt', 'test-salt');
            repository['credentials'].set('cipher', 'test-cipher');

            expect(repository.hasStoredAuthData()).toBe(true);
        });

        it('should return false when salt is missing', () => {
            repository['credentials'].set('cipher', 'test-cipher');

            expect(repository.hasStoredAuthData()).toBe(false);
        });

        it('should return false when cipher is missing', () => {
            repository['credentials'].set('salt', 'test-salt');

            expect(repository.hasStoredAuthData()).toBe(false);
        });

        it('should return false when both are missing', () => {
            expect(repository.hasStoredAuthData()).toBe(false);
        });
    });

    describe('Integration tests', () => {
        it('should support full unlock, set, get, lock workflow', async () => {
            // Initially locked
            expect(repository.isUnlocked()).toBe(false);

            // Unlock with password
            mockEncryptionService.isUnlocked.mockReturnValue(true); // Simulate successful unlock
            await repository.unlock({ method: 'password', password: 'test-password' });
            expect(repository.isUnlocked()).toBe(true);

            // Set credentials
            await repository.setCredential('localKey', 'test-local-key');
            await repository.setCredential('remoteKey', 'test-remote-key');

            // Get credentials
            const localKey = await repository.getCredential('localKey');
            const remoteKey = await repository.getCredential('remoteKey');

            expect(localKey).toBe('decrypted-value');
            expect(remoteKey).toBe('decrypted-value');

            // Check auth data was stored
            expect(repository.hasStoredAuthData()).toBe(true);

            // Lock repository
            mockEncryptionService.isUnlocked.mockReturnValue(false); // Simulate lock
            repository.lock();
            expect(repository.isUnlocked()).toBe(false);
        });

        it('should handle first-time unlock correctly', async () => {
            // First unlock should create salt and cipher
            await repository.unlock({ method: 'password', password: 'first-password' });

            expect(repository['credentials'].has('salt')).toBe(true);
            expect(repository['credentials'].has('cipher')).toBe(true);

            // Second unlock should not recreate them
            repository.lock();
            mockEncryptionService.getSalt.mockClear();
            mockEncryptionService.createTestCipher.mockClear();

            await repository.unlock({ method: 'password', password: 'second-password' });

            expect(mockEncryptionService.getSalt).not.toHaveBeenCalled();
            expect(mockEncryptionService.createTestCipher).not.toHaveBeenCalled();
        });

        it('should work with different namespaces', () => {
            const repo1 = new PasswordCredentialRepository('namespace1', mockEncryptionService as any);
            const repo2 = new PasswordCredentialRepository('namespace2', mockEncryptionService as any);

            expect(repo1).not.toBe(repo2);
            // They should have different storage keys internally
        });
    });
});
