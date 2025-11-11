import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { PasskeyCredentialRepository } from './passkeyCredentialRepository';
import { PasskeyEncryptionService } from '../encryption/passkeyEncryptionService';

// Mock PasskeyEncryptionService
const mockEncryptionService = {
    unlock: vi.fn(),
    decrypt: vi.fn(),
    encrypt: vi.fn(),
    isUnlocked: vi.fn(),
    lock: vi.fn(),
    getCredentialId: vi.fn()
};

vi.mock('../encryption/passkeyEncryptionService', () => ({
    PasskeyEncryptionService: vi.fn().mockImplementation(() => mockEncryptionService)
}));

describe('PasskeyCredentialRepository', () => {
    let repository: PasskeyCredentialRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock defaults
        mockEncryptionService.unlock.mockResolvedValue(undefined);
        mockEncryptionService.decrypt.mockResolvedValue('decrypted-value');
        mockEncryptionService.encrypt.mockResolvedValue('encrypted-value');
        mockEncryptionService.isUnlocked.mockReturnValue(false);
        mockEncryptionService.getCredentialId.mockReturnValue('test-credential-id');

        repository = new PasskeyCredentialRepository('test-namespace', mockEncryptionService as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with namespace and encryption service', () => {
            const repo = new PasskeyCredentialRepository('test-ns', mockEncryptionService as any);
            expect(repo).toBeInstanceOf(PasskeyCredentialRepository);
        });
    });

    describe('unlock()', () => {
        it('should unlock with passkey method', async () => {
            const options = { method: 'passkey' as const, createIfMissing: false };

            await repository.unlock(options);

            expect(mockEncryptionService.unlock).toHaveBeenCalledWith({
                method: 'passkey',
                credentialId: undefined,
                createIfMissing: false
            });
        });

        it('should load existing credential ID from storage', async () => {
            repository['credentials'].set('passkeyCredentialId', 'existing-credential-id');

            const options = { method: 'passkey' as const, createIfMissing: false };

            await repository.unlock(options);

            expect(mockEncryptionService.unlock).toHaveBeenCalledWith({
                method: 'passkey',
                credentialId: 'existing-credential-id',
                createIfMissing: false
            });
        });

        it('should use createIfMissing default when not provided', async () => {
            const options = { method: 'passkey' as const };

            await repository.unlock(options);

            expect(mockEncryptionService.unlock).toHaveBeenCalledWith({
                method: 'passkey',
                credentialId: undefined,
                createIfMissing: false
            });
        });

        it('should store credential ID when created new passkey', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            const options = { method: 'passkey' as const, createIfMissing: true };

            await repository.unlock(options);

            expect(mockEncryptionService.getCredentialId).toHaveBeenCalled();
            expect(repository['credentials'].get('passkeyCredentialId')).toBe('test-credential-id');
        });

        it('should store credential ID when no existing credential and unlocked', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            const options = { method: 'passkey' as const, createIfMissing: false };

            await repository.unlock(options);

            expect(mockEncryptionService.getCredentialId).toHaveBeenCalled();
            expect(repository['credentials'].get('passkeyCredentialId')).toBe('test-credential-id');
        });

        it('should not store credential ID when already exists', async () => {
            repository['credentials'].set('passkeyCredentialId', 'existing-id');
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            const options = { method: 'passkey' as const, createIfMissing: false };

            await repository.unlock(options);

            expect(mockEncryptionService.getCredentialId).not.toHaveBeenCalled();
        });

        it('should not store credential ID when not unlocked', async () => {
            mockEncryptionService.isUnlocked.mockReturnValue(false);

            const options = { method: 'passkey' as const, createIfMissing: true };

            await repository.unlock(options);

            expect(mockEncryptionService.getCredentialId).not.toHaveBeenCalled();
        });

        it('should throw error for non-passkey method', async () => {
            const options = { method: 'password' as const };

            await expect(repository.unlock(options)).rejects.toThrow(
                'Passkey repository requires passkey unlock method'
            );
        });

        it('should propagate encryption service unlock errors', async () => {
            const error = new Error('Unlock failed');
            mockEncryptionService.unlock.mockRejectedValue(error);

            const options = { method: 'passkey' as const };

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

            const result = await repository.getCredential('test-key');

            expect(result).toBe('decrypted-value');
            expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data');
        });

        it('should return undefined when decryption fails', async () => {
            repository['credentials'].set('test-key', 'encrypted-data');
            const error = new Error('Decryption failed');
            mockEncryptionService.decrypt.mockRejectedValue(error);

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
        it('should return true when credential ID exists', () => {
            repository['credentials'].set('passkeyCredentialId', 'test-credential-id');

            expect(repository.hasStoredAuthData()).toBe(true);
        });

        it('should return false when credential ID is missing', () => {
            expect(repository.hasStoredAuthData()).toBe(false);
        });
    });

    describe('Integration tests', () => {
        it('should support full unlock, set, get, lock workflow', async () => {
            // Initially locked
            expect(repository.isUnlocked()).toBe(false);

            // Unlock with passkey
            mockEncryptionService.isUnlocked.mockReturnValue(true); // Simulate successful unlock
            await repository.unlock({ method: 'passkey', createIfMissing: true });
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

        it('should handle passkey creation correctly', async () => {
            // First unlock should create credential ID
            mockEncryptionService.isUnlocked.mockReturnValue(true);

            await repository.unlock({ method: 'passkey', createIfMissing: true });

            expect(repository['credentials'].has('passkeyCredentialId')).toBe(true);

            // Second unlock should not recreate it
            repository.lock();
            mockEncryptionService.getCredentialId.mockClear();

            await repository.unlock({ method: 'passkey', createIfMissing: false });

            expect(mockEncryptionService.getCredentialId).not.toHaveBeenCalled();
        });

        it('should handle existing credential ID correctly', async () => {
            // Set existing credential ID
            repository['credentials'].set('passkeyCredentialId', 'existing-id');

            mockEncryptionService.isUnlocked.mockReturnValue(true);

            await repository.unlock({ method: 'passkey', createIfMissing: false });

            // Should not get new credential ID since one already exists
            expect(mockEncryptionService.getCredentialId).not.toHaveBeenCalled();
        });

        it('should work with different namespaces', () => {
            const repo1 = new PasskeyCredentialRepository('namespace1', mockEncryptionService as any);
            const repo2 = new PasskeyCredentialRepository('namespace2', mockEncryptionService as any);

            expect(repo1).not.toBe(repo2);
            // They should have different storage keys internally
        });
    });
});
