import { beforeEach, describe, expect, it } from 'vitest';
import { createTestCipher, generateSalt } from '../util/encryption';
import { PasswordEncryptionService } from './passwordEncryptionService';

describe('PasswordEncryptionService', () => {
  let service: PasswordEncryptionService;

  beforeEach(() => {
    service = new PasswordEncryptionService();
  });

  describe('constructor', () => {
    it('should create a locked service when no password is provided', () => {
      expect(service.isUnlocked).toBe(false);
    });
  });

  describe('unlock', () => {
    it('should unlock with a new password (no salt)', async () => {
      await service.unlock({ method: 'password', password: 'testPassword' });
      expect(service.isUnlocked).toBe(true);
    });

    it('should unlock with existing salt and cipher', async () => {
      const password = 'testPassword';
      const salt = generateSalt();
      const cipher = createTestCipher(password, salt);

      await service.unlock({ method: 'password', password, salt, cipher });
      expect(service.isUnlocked).toBe(true);
    });

    it('should throw error for invalid password with existing cipher', async () => {
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const salt = generateSalt();
      const cipher = createTestCipher(correctPassword, salt);

      await expect(
        service.unlock({
          method: 'password',
          password: wrongPassword,
          salt,
          cipher
        })
      ).rejects.toThrow('Invalid password');
    });

    it('should throw error if password is missing', async () => {
      await expect(
        service.unlock({ method: 'password', password: '' })
      ).rejects.toThrow('Password is required for password unlock');
    });

    it('should throw error for non-password unlock method', async () => {
      // Type assertion to test runtime behavior with invalid input
      await expect(
        service.unlock({ method: 'passkey' as 'password', password: 'test' })
      ).rejects.toThrow(
        'Password encryption service requires password unlock method'
      );
    });
  });

  describe('encrypt/decrypt', () => {
    beforeEach(async () => {
      await service.unlock({ method: 'password', password: 'testPassword' });
    });

    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error when encrypting while locked', async () => {
      service.lock();
      await expect(service.encrypt('test')).rejects.toThrow(
        'Encryption service is locked. Call unlock() first.'
      );
    });

    it('should throw error when decrypting while locked', async () => {
      const encrypted = await service.encrypt('test');
      service.lock();
      await expect(service.decrypt(encrypted)).rejects.toThrow(
        'Encryption service is locked. Call unlock() first.'
      );
    });
  });

  describe('lock', () => {
    it('should clear password and salt when locked', async () => {
      await service.unlock({ method: 'password', password: 'testPassword' });
      expect(service.isUnlocked).toBe(true);
      service.lock();
      expect(service.isUnlocked).toBe(false);
    });
  });

  describe('getMethod', () => {
    it('should return password as the method', () => {
      expect(service.method).toBe('password');
    });
  });

  describe('canHandle', () => {
    it('should return true for password method', () => {
      expect(service.canHandle('password')).toBe(true);
    });

    it('should return false for non-password methods', () => {
      // Type assertion to test runtime behavior
      expect(service.canHandle('passkey' as 'password')).toBe(false);
      expect(service.canHandle('session' as 'password')).toBe(false);
    });
  });

  describe('getSalt', () => {
    it('should return the salt when unlocked', async () => {
      await service.unlock({ method: 'password', password: 'testPassword' });
      const salt = service.getSalt();
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32);
    });

    it('should throw error when locked', () => {
      expect(() => service.getSalt()).toThrow(
        'No salt available - unlock first'
      );
    });
  });

  describe('createTestCipher', () => {
    it('should create a test cipher when unlocked', async () => {
      await service.unlock({ method: 'password', password: 'testPassword' });
      const cipher = service.createTestCipher();
      expect(cipher).toBeDefined();
      expect(typeof cipher).toBe('string');
    });

    it('should throw error when locked', () => {
      expect(() => service.createTestCipher()).toThrow(
        'No password/salt available - unlock first'
      );
    });
  });
});
