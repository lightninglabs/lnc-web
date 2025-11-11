import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { PasswordEncryptionService } from './passwordEncryptionService';
import {
    createTestCipher,
    decrypt,
    encrypt,
    generateSalt,
    verifyTestCipher,
} from '../util/encryption';

// Mock encryption utilities
vi.mock('../util/encryption', () => ({
    createTestCipher: vi.fn(),
    decrypt: vi.fn(),
    encrypt: vi.fn(),
    generateSalt: vi.fn(),
    verifyTestCipher: vi.fn()
}));

describe('PasswordEncryptionService', () => {
    let service: PasswordEncryptionService;
    const testPassword = 'test-password';
    const testSalt = 'test-salt';
    const testCipher = 'test-cipher';
    const testData = 'test-data';
    const encryptedData = 'encrypted-data';
    const decryptedData = 'decrypted-data';

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock defaults
        (createTestCipher as any).mockReturnValue(testCipher);
        (decrypt as any).mockResolvedValue(decryptedData);
        (encrypt as any).mockResolvedValue(encryptedData);
        (generateSalt as any).mockReturnValue(testSalt);
        (verifyTestCipher as any).mockReturnValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create locked service when no password provided', () => {
            service = new PasswordEncryptionService();

            expect(service.isUnlocked()).toBe(false);
            expect(service.getMethod()).toBe('password');
        });

        it('should create unlocked service when password provided', () => {
            (generateSalt as any).mockReturnValue(testSalt);

            service = new PasswordEncryptionService(testPassword);

            expect(service.isUnlocked()).toBe(true);
            expect(service.getMethod()).toBe('password');
            expect(generateSalt).toHaveBeenCalled();
        });
    });

    describe('encrypt()', () => {
        it('should encrypt data when unlocked', async () => {
            service = new PasswordEncryptionService(testPassword);

            const result = await service.encrypt(testData);

            expect(result).toBe(encryptedData);
            expect(encrypt).toHaveBeenCalledWith(testData, testPassword, testSalt);
        });

        it('should throw error when not unlocked', async () => {
            service = new PasswordEncryptionService();

            await expect(service.encrypt(testData)).rejects.toThrow(
                'Encryption service is locked. Call unlock() first.'
            );
            expect(encrypt).not.toHaveBeenCalled();
        });

        it('should throw error when password is cleared', async () => {
            service = new PasswordEncryptionService(testPassword);
            service.lock();

            await expect(service.encrypt(testData)).rejects.toThrow(
                'Encryption service is locked. Call unlock() first.'
            );
        });
    });

    describe('decrypt()', () => {
        it('should decrypt data when unlocked', async () => {
            service = new PasswordEncryptionService(testPassword);

            const result = await service.decrypt(encryptedData);

            expect(result).toBe(decryptedData);
            expect(decrypt).toHaveBeenCalledWith(encryptedData, testPassword, testSalt);
        });

        it('should throw error when not unlocked', async () => {
            service = new PasswordEncryptionService();

            await expect(service.decrypt(encryptedData)).rejects.toThrow(
                'Encryption service is locked. Call unlock() first.'
            );
            expect(decrypt).not.toHaveBeenCalled();
        });

        it('should throw error when password is cleared', async () => {
            service = new PasswordEncryptionService(testPassword);
            service.lock();

            await expect(service.decrypt(encryptedData)).rejects.toThrow(
                'Encryption service is locked. Call unlock() first.'
            );
        });
    });

    describe('unlock()', () => {
        beforeEach(() => {
            service = new PasswordEncryptionService();
        });

        it('should unlock with password when no existing salt/cipher', async () => {
            const options = { method: 'password' as const, password: testPassword };

            await service.unlock(options);

            expect(service.isUnlocked()).toBe(true);
            expect(generateSalt).toHaveBeenCalled();
            expect(service.getSalt()).toBe(testSalt);
        });

        it('should unlock with password and provided salt/cipher', async () => {
            const options = {
                method: 'password' as const,
                password: testPassword,
                salt: testSalt,
                cipher: testCipher
            };

            await service.unlock(options);

            expect(service.isUnlocked()).toBe(true);
            expect(generateSalt).not.toHaveBeenCalled();
            expect(verifyTestCipher).toHaveBeenCalledWith(testCipher, testPassword, testSalt);
            expect(service.getSalt()).toBe(testSalt);
        });

        it('should throw error for non-password method', async () => {
            const options = { method: 'passkey' as const };

            await expect(service.unlock(options)).rejects.toThrow(
                'Password encryption service requires password unlock method'
            );
        });

        it('should throw error when password is not provided', async () => {
            const options = { method: 'password' as const };

            await expect(service.unlock(options)).rejects.toThrow(
                'Password is required for password unlock'
            );
        });

        it('should throw error when password verification fails', async () => {
            (verifyTestCipher as any).mockReturnValue(false);
            const options = {
                method: 'password' as const,
                password: testPassword,
                salt: testSalt,
                cipher: testCipher
            };

            await expect(service.unlock(options)).rejects.toThrow('Invalid password');
        });

        it('should throw error when test cipher verification throws', async () => {
            (verifyTestCipher as any).mockImplementation(() => {
                throw new Error('Verification failed');
            });
            const options = {
                method: 'password' as const,
                password: testPassword,
                salt: testSalt,
                cipher: testCipher
            };

            await expect(service.unlock(options)).rejects.toThrow('Invalid password');
        });
    });

    describe('isUnlocked()', () => {
        it('should return true when unlocked with password and salt', () => {
            service = new PasswordEncryptionService(testPassword);

            expect(service.isUnlocked()).toBe(true);
        });

        it('should return false when not unlocked', () => {
            service = new PasswordEncryptionService();

            expect(service.isUnlocked()).toBe(false);
        });

        it('should return false after lock', () => {
            service = new PasswordEncryptionService(testPassword);
            service.lock();

            expect(service.isUnlocked()).toBe(false);
        });
    });

    describe('lock()', () => {
        it('should clear password and salt', () => {
            service = new PasswordEncryptionService(testPassword);
            expect(service.isUnlocked()).toBe(true);

            service.lock();

            expect(service.isUnlocked()).toBe(false);
            expect(() => service.getSalt()).toThrow('No salt available - unlock first');
        });
    });

    describe('getMethod()', () => {
        it('should return password method', () => {
            service = new PasswordEncryptionService();

            expect(service.getMethod()).toBe('password');
        });
    });

    describe('canHandle()', () => {
        it('should return true for password method', () => {
            service = new PasswordEncryptionService();

            expect(service.canHandle('password')).toBe(true);
        });

        it('should return false for other methods', () => {
            service = new PasswordEncryptionService();

            expect(service.canHandle('passkey')).toBe(false);
            expect(service.canHandle('session')).toBe(false);
        });
    });

    describe('hasStoredData()', () => {
        it('should return false (password service does not store data)', async () => {
            service = new PasswordEncryptionService();

            const result = await service.hasStoredData();

            expect(result).toBe(false);
        });
    });

    describe('getSalt()', () => {
        it('should return salt when available', () => {
            service = new PasswordEncryptionService(testPassword);

            const result = service.getSalt();

            expect(result).toBe(testSalt);
        });

        it('should throw error when no salt available', () => {
            service = new PasswordEncryptionService();

            expect(() => service.getSalt()).toThrow('No salt available - unlock first');
        });
    });

    describe('createTestCipher()', () => {
        it('should create test cipher when unlocked', () => {
            service = new PasswordEncryptionService(testPassword);

            const result = service.createTestCipher();

            expect(result).toBe(testCipher);
            expect(createTestCipher).toHaveBeenCalledWith(testPassword, testSalt);
        });

        it('should throw error when not unlocked', () => {
            service = new PasswordEncryptionService();

            expect(() => service.createTestCipher()).toThrow(
                'No password/salt available - unlock first'
            );
        });
    });

    describe('Integration tests', () => {
        it('should handle full unlock workflow', async () => {
            service = new PasswordEncryptionService();

            // Unlock
            const unlockOptions = { method: 'password' as const, password: testPassword };
            await service.unlock(unlockOptions);

            expect(service.isUnlocked()).toBe(true);

            // Encrypt/decrypt
            const encrypted = await service.encrypt(testData);
            expect(encrypted).toBe(encryptedData);

            const decrypted = await service.decrypt(encryptedData);
            expect(decrypted).toBe(decryptedData);

            // Create test cipher
            const testCipher = service.createTestCipher();
            expect(testCipher).toBe(testCipher);

            // Get salt
            const salt = service.getSalt();
            expect(salt).toBe(testSalt);

            // Lock
            service.lock();
            expect(service.isUnlocked()).toBe(false);

            // Should fail after lock
            await expect(service.encrypt(testData)).rejects.toThrow('locked');
        });

        it('should handle existing user unlock workflow', async () => {
            service = new PasswordEncryptionService();

            // Unlock with existing salt and cipher
            const unlockOptions = {
                method: 'password' as const,
                password: testPassword,
                salt: testSalt,
                cipher: testCipher
            };
            await service.unlock(unlockOptions);

            expect(service.isUnlocked()).toBe(true);
            expect(verifyTestCipher).toHaveBeenCalledWith(testCipher, testPassword, testSalt);

            // Should be able to encrypt/decrypt
            await service.encrypt(testData);
            await service.decrypt(encryptedData);
        });

        it('should handle method checks correctly', () => {
            service = new PasswordEncryptionService();

            expect(service.canHandle('password')).toBe(true);
            expect(service.canHandle('passkey')).toBe(false);
            expect(service.canHandle('session')).toBe(false);
            expect(service.getMethod()).toBe('password');
        });

        it('should maintain state correctly', () => {
            service = new PasswordEncryptionService();

            expect(service.isUnlocked()).toBe(false);

            // Create with password
            service = new PasswordEncryptionService(testPassword);
            expect(service.isUnlocked()).toBe(true);

            // Lock
            service.lock();
            expect(service.isUnlocked()).toBe(false);
        });
    });
});


