import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionCredentials } from '../types';
import { CredentialsEncrypter } from './CredentialsEncrypter';

// Mock CryptoService
const mockCryptoService = {
  generateRandomCredentialsKey: vi.fn(),
  encryptCredentials: vi.fn(),
  decryptCredentials: vi.fn()
};

vi.mock('../cryptoService', () => ({
  default: vi.fn().mockImplementation(() => mockCryptoService)
}));

describe('CredentialsEncrypter', () => {
  let encrypter: CredentialsEncrypter;
  let mockCredentialsKey: CryptoKey;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCredentialsKey = {} as CryptoKey;

    // Reset mock implementations
    mockCryptoService.generateRandomCredentialsKey.mockResolvedValue(
      mockCredentialsKey
    );
    mockCryptoService.encryptCredentials.mockResolvedValue({
      ciphertextB64: 'encrypted-data',
      ivB64: 'iv-data'
    });
    mockCryptoService.decryptCredentials.mockResolvedValue('decrypted-json');

    encrypter = new CredentialsEncrypter(mockCryptoService as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with crypto service', () => {
      const newEncrypter = new CredentialsEncrypter(mockCryptoService as any);
      expect(newEncrypter).toBeInstanceOf(CredentialsEncrypter);
    });
  });

  describe('encrypt()', () => {
    it('should encrypt credentials successfully', async () => {
      const credentials: SessionCredentials = {
        localKey: 'test-local-key',
        remoteKey: 'test-remote-key',
        pairingPhrase: 'test-pairing-phrase',
        serverHost: 'test-host:443'
      };

      const result = await encrypter.encrypt(credentials);

      expect(result).toEqual({
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      });
      expect(mockCryptoService.generateRandomCredentialsKey).toHaveBeenCalled();
      expect(mockCryptoService.encryptCredentials).toHaveBeenCalledWith(
        mockCredentialsKey,
        JSON.stringify(credentials)
      );
    });

    it('should handle different credential structures', async () => {
      const credentials: SessionCredentials = {
        localKey: 'different-local-key',
        remoteKey: 'different-remote-key',
        pairingPhrase: 'different-phrase',
        serverHost: 'different-host:8080'
      };

      await encrypter.encrypt(credentials);

      expect(mockCryptoService.encryptCredentials).toHaveBeenCalledWith(
        mockCredentialsKey,
        JSON.stringify(credentials)
      );
    });

    it('should propagate errors from key generation', async () => {
      const error = new Error('Key generation failed');
      mockCryptoService.generateRandomCredentialsKey.mockRejectedValue(error);

      const credentials: SessionCredentials = {
        localKey: 'test',
        remoteKey: 'test',
        pairingPhrase: 'test',
        serverHost: 'test:443'
      };

      await expect(encrypter.encrypt(credentials)).rejects.toThrow(
        'Key generation failed'
      );
    });

    it('should propagate errors from encryption', async () => {
      const error = new Error('Encryption failed');
      mockCryptoService.encryptCredentials.mockRejectedValue(error);

      const credentials: SessionCredentials = {
        localKey: 'test',
        remoteKey: 'test',
        pairingPhrase: 'test',
        serverHost: 'test:443'
      };

      await expect(encrypter.encrypt(credentials)).rejects.toThrow(
        'Encryption failed'
      );
    });
  });

  describe('decrypt()', () => {
    it('should decrypt credentials successfully', async () => {
      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      const expectedCredentials: SessionCredentials = {
        localKey: 'decrypted-local-key',
        remoteKey: 'decrypted-remote-key',
        pairingPhrase: 'decrypted-pairing-phrase',
        serverHost: 'decrypted-host:443'
      };

      // Mock JSON.parse to return expected credentials
      const jsonString = JSON.stringify(expectedCredentials);
      mockCryptoService.decryptCredentials.mockResolvedValue(jsonString);

      const result = await encrypter.decrypt(encrypted);

      expect(result).toEqual(expectedCredentials);
      expect(mockCryptoService.decryptCredentials).toHaveBeenCalledWith(
        mockCredentialsKey,
        'encrypted-data',
        'iv-data'
      );
    });

    it('should handle different encrypted data', async () => {
      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'different-encrypted-data',
        ivB64: 'different-iv-data'
      };

      const differentCredentials: SessionCredentials = {
        localKey: 'different-local',
        remoteKey: 'different-remote',
        pairingPhrase: 'different-phrase',
        serverHost: 'different-host:8080'
      };

      const jsonString = JSON.stringify(differentCredentials);
      mockCryptoService.decryptCredentials.mockResolvedValue(jsonString);

      const result = await encrypter.decrypt(encrypted);

      expect(result).toEqual(differentCredentials);
      expect(mockCryptoService.decryptCredentials).toHaveBeenCalledWith(
        mockCredentialsKey,
        'different-encrypted-data',
        'different-iv-data'
      );
    });

    it('should propagate errors from decryption', async () => {
      const error = new Error('Decryption failed');
      mockCryptoService.decryptCredentials.mockRejectedValue(error);

      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      await expect(encrypter.decrypt(encrypted)).rejects.toThrow(
        'Decryption failed'
      );
    });

    it('should handle invalid JSON in decrypted data', async () => {
      mockCryptoService.decryptCredentials.mockResolvedValue('invalid json {');

      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      await expect(encrypter.decrypt(encrypted)).rejects.toThrow();
    });

    it('should reject decrypted data that is null', async () => {
      mockCryptoService.decryptCredentials.mockResolvedValue('null');

      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      await expect(encrypter.decrypt(encrypted)).rejects.toThrow(
        'Decrypted credentials have an invalid shape'
      );
    });

    it('should reject decrypted data with missing fields', async () => {
      mockCryptoService.decryptCredentials.mockResolvedValue(
        JSON.stringify({ localKey: 'only-one-field' })
      );

      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      await expect(encrypter.decrypt(encrypted)).rejects.toThrow(
        'Decrypted credentials have an invalid shape'
      );
    });

    it('should reject decrypted data with wrong field types', async () => {
      mockCryptoService.decryptCredentials.mockResolvedValue(
        JSON.stringify({
          localKey: 123,
          remoteKey: 'ok',
          pairingPhrase: 'ok',
          serverHost: 'ok'
        })
      );

      const encrypted = {
        credentialsKey: mockCredentialsKey,
        ciphertextB64: 'encrypted-data',
        ivB64: 'iv-data'
      };

      await expect(encrypter.decrypt(encrypted)).rejects.toThrow(
        'Decrypted credentials have an invalid shape'
      );
    });
  });

  describe('Integration tests', () => {
    it('should support encrypt/decrypt round-trip', async () => {
      const originalCredentials: SessionCredentials = {
        localKey: 'original-local-key',
        remoteKey: 'original-remote-key',
        pairingPhrase: 'original-pairing-phrase',
        serverHost: 'original-host:443'
      };

      // Encrypt
      const encrypted = await encrypter.encrypt(originalCredentials);

      // Mock decryption to return the original JSON
      const jsonString = JSON.stringify(originalCredentials);
      mockCryptoService.decryptCredentials.mockResolvedValue(jsonString);

      // Decrypt
      const decrypted = await encrypter.decrypt(encrypted);

      expect(decrypted).toEqual(originalCredentials);
    });

    it('should work with different crypto service instances', async () => {
      const differentCryptoService = {
        generateRandomCredentialsKey: vi
          .fn()
          .mockResolvedValue({} as CryptoKey),
        encryptCredentials: vi.fn().mockResolvedValue({
          ciphertextB64: 'different-encrypted',
          ivB64: 'different-iv'
        }),
        decryptCredentials: vi.fn().mockResolvedValue('{"test": "data"}')
      };

      const differentEncrypter = new CredentialsEncrypter(
        differentCryptoService as any
      );

      const credentials: SessionCredentials = {
        localKey: 'test',
        remoteKey: 'test',
        pairingPhrase: 'test',
        serverHost: 'test:443'
      };

      const encrypted = await differentEncrypter.encrypt(credentials);
      expect(encrypted.ciphertextB64).toBe('different-encrypted');
      expect(encrypted.ivB64).toBe('different-iv');
    });
  });
});
