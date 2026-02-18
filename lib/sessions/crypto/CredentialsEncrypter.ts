import CryptoService from '../cryptoService';
import { SessionCredentials } from '../types';

export interface EncryptedCredentials {
  credentialsKey: CryptoKey;
  ciphertextB64: string;
  ivB64: string;
}

const isValidCredentials = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  return (
    'localKey' in data &&
    typeof data.localKey === 'string' &&
    'remoteKey' in data &&
    typeof data.remoteKey === 'string' &&
    'pairingPhrase' in data &&
    typeof data.pairingPhrase === 'string' &&
    'serverHost' in data &&
    typeof data.serverHost === 'string'
  );
};

/**
 * Handles encryption and decryption of session credentials.
 * Single responsibility: credentials encryption/decryption operations.
 */
export class CredentialsEncrypter {
  private cryptoService: CryptoService;

  /**
   * Keep crypto operations delegated so this class only handles credential payload flow.
   */
  constructor(cryptoService: CryptoService) {
    this.cryptoService = cryptoService;
  }

  /**
   * Encrypt credentials with a one-time key that can be wrapped by higher layers.
   */
  async encrypt(
    credentials: SessionCredentials
  ): Promise<EncryptedCredentials> {
    // Generate a unique data-encryption key for this credential payload.
    const credentialsKey =
      await this.cryptoService.generateRandomCredentialsKey();

    // Persist credentials as JSON so the exact structure survives round-trips.
    const { ciphertextB64, ivB64 } =
      await this.cryptoService.encryptCredentials(
        credentialsKey,
        JSON.stringify(credentials)
      );

    return { credentialsKey, ciphertextB64, ivB64 };
  }

  /**
   * Decrypt previously encrypted credentials and restore the structured object.
   */
  async decrypt(encrypted: EncryptedCredentials): Promise<SessionCredentials> {
    const { credentialsKey, ciphertextB64, ivB64 } = encrypted;

    // Decryption stays delegated to keep algorithm concerns in CryptoService.
    const json = await this.cryptoService.decryptCredentials(
      credentialsKey,
      ciphertextB64,
      ivB64
    );

    // Convert back to typed credentials and validate the shape survived the round-trip.
    const parsed: unknown = JSON.parse(json);

    if (!isValidCredentials(parsed)) {
      throw new Error('Decrypted credentials have an invalid shape');
    }

    return parsed as SessionCredentials;
  }
}
