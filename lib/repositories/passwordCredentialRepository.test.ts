import { beforeEach, describe, expect, it } from 'vitest';
import { PasswordEncryptionService } from '../encryption/passwordEncryptionService';
import { PasswordCredentialRepository } from './passwordCredentialRepository';

describe('PasswordCredentialRepository', () => {
  let repository: PasswordCredentialRepository;
  let encryptionService: PasswordEncryptionService;

  beforeEach(() => {
    localStorage.clear();
    encryptionService = new PasswordEncryptionService();
    repository = new PasswordCredentialRepository(
      'test-password-repo',
      encryptionService
    );
  });

  describe('unlock', () => {
    it('should unlock with a new password and store salt/cipher', async () => {
      await repository.unlock({ method: 'password', password: 'testPassword' });
      expect(repository.isUnlocked).toBe(true);
      expect(repository.hasCredential('salt')).toBe(true);
      expect(repository.hasCredential('cipher')).toBe(true);
    });

    it('should unlock with existing password and verify cipher', async () => {
      // First unlock to create salt/cipher
      await repository.unlock({ method: 'password', password: 'testPassword' });
      repository.lock();

      // Create new instances to simulate page reload
      const newEncryption = new PasswordEncryptionService();
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        newEncryption
      );

      // Second unlock should verify against stored cipher
      await newRepository.unlock({
        method: 'password',
        password: 'testPassword'
      });
      expect(newRepository.isUnlocked).toBe(true);
    });

    it('should throw error for wrong password with existing cipher', async () => {
      // First unlock to create salt/cipher
      await repository.unlock({
        method: 'password',
        password: 'correctPassword'
      });
      repository.lock();

      // Create new instances to simulate page reload
      const newEncryption = new PasswordEncryptionService();
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        newEncryption
      );

      // Second unlock with wrong password should fail
      await expect(
        newRepository.unlock({ method: 'password', password: 'wrongPassword' })
      ).rejects.toThrow('Invalid password');
    });

    it('should throw error for non-password unlock method', async () => {
      await expect(
        repository.unlock({ method: 'passkey' as 'password', password: 'test' })
      ).rejects.toThrow('Password repository requires password unlock method');
    });
  });

  describe('credential operations', () => {
    beforeEach(async () => {
      await repository.unlock({ method: 'password', password: 'testPassword' });
    });

    it('should encrypt and store credentials', async () => {
      await repository.setCredential('localKey', 'myLocalKeyValue');

      // The stored value should be encrypted
      const stored = localStorage.getItem('lnc-web:test-password-repo');
      const parsed = JSON.parse(stored!);
      expect(parsed.localKey).not.toBe('myLocalKeyValue');
      expect(parsed.localKey).toBeDefined();
    });

    it('should decrypt and retrieve credentials', async () => {
      await repository.setCredential('localKey', 'myLocalKeyValue');
      const retrieved = await repository.getCredential('localKey');
      expect(retrieved).toBe('myLocalKeyValue');
    });

    it('should return undefined for non-existent credentials', async () => {
      const retrieved = await repository.getCredential('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined when decryption fails', async () => {
      // Store an invalid encrypted value
      localStorage.setItem(
        'lnc-web:test-password-repo',
        JSON.stringify({
          salt: 'someSalt',
          cipher: 'someCipher',
          badKey: 'not-valid-encrypted-data'
        })
      );

      const newEncryption = new PasswordEncryptionService();
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        newEncryption
      );

      // Manually unlock the encryption service (bypass cipher check for this test)
      await newEncryption.unlock({
        method: 'password',
        password: 'test'
      });

      const retrieved = await newRepository.getCredential('badKey');
      expect(retrieved).toBeUndefined();
    });

    it('should throw error when setting credential while locked', async () => {
      repository.lock();
      await expect(repository.setCredential('key', 'value')).rejects.toThrow(
        'Repository is locked. Call unlock() first.'
      );
    });
  });

  describe('lock', () => {
    it('should lock the repository', async () => {
      await repository.unlock({ method: 'password', password: 'testPassword' });
      expect(repository.isUnlocked).toBe(true);
      repository.lock();
      expect(repository.isUnlocked).toBe(false);
    });
  });

  describe('hasStoredAuthData', () => {
    it('should return false when no auth data is stored', () => {
      expect(repository.hasStoredAuthData).toBe(false);
    });

    it('should return true when salt and cipher are stored', async () => {
      await repository.unlock({ method: 'password', password: 'testPassword' });
      expect(repository.hasStoredAuthData).toBe(true);
    });

    it('should return false when only salt is stored', () => {
      localStorage.setItem(
        'lnc-web:test-password-repo',
        JSON.stringify({ salt: 'someSalt' })
      );
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        new PasswordEncryptionService()
      );
      expect(newRepository.hasStoredAuthData).toBe(false);
    });

    it('should return false when only cipher is stored', () => {
      localStorage.setItem(
        'lnc-web:test-password-repo',
        JSON.stringify({ cipher: 'someCipher' })
      );
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        new PasswordEncryptionService()
      );
      expect(newRepository.hasStoredAuthData).toBe(false);
    });
  });

  describe('persistence across page reloads', () => {
    it('should persist and retrieve credentials after reload', async () => {
      // Initial setup and store credential
      await repository.unlock({ method: 'password', password: 'testPassword' });
      await repository.setCredential('localKey', 'myLocalKeyValue');
      await repository.setCredential('remoteKey', 'myRemoteKeyValue');

      // Simulate page reload by creating new instances
      const newEncryption = new PasswordEncryptionService();
      const newRepository = new PasswordCredentialRepository(
        'test-password-repo',
        newEncryption
      );

      // Unlock with same password
      await newRepository.unlock({
        method: 'password',
        password: 'testPassword'
      });

      // Should retrieve the same values
      expect(await newRepository.getCredential('localKey')).toBe(
        'myLocalKeyValue'
      );
      expect(await newRepository.getCredential('remoteKey')).toBe(
        'myRemoteKeyValue'
      );
    });
  });

  describe('clear', () => {
    it('should clear all credentials including auth data', async () => {
      await repository.unlock({ method: 'password', password: 'testPassword' });
      await repository.setCredential('localKey', 'myLocalKeyValue');
      expect(repository.hasStoredAuthData).toBe(true);
      expect(repository.hasCredential('localKey')).toBe(true);

      repository.clear();

      expect(repository.hasStoredAuthData).toBe(false);
      expect(repository.hasCredential('localKey')).toBe(false);
    });
  });
});
