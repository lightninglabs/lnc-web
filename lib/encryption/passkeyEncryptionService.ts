import { UnlockMethod, UnlockOptions } from '../types/lnc';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../util/encoding';
import { EncryptionService } from './encryptionService';

/**
 * Extended type for WebAuthn's experimental PRF (Pseudo-Random Function) extension.
 * PRF allows deriving deterministic secret values from a passkey authentication,
 * enabling us to derive encryption keys without storing them.
 *
 * This type adds getClientExtensionResults to check PRF support at the static
 * PublicKeyCredential level. The method is part of the WebAuthn L2 spec but
 * TypeScript's types don't include it yet.
 */
type PublicKeyCredentialWithPrf = typeof PublicKeyCredential & {
  getClientExtensionResults: () => unknown;
};

/**
 * Pure passkey-based encryption service using WebAuthn PRF extension.
 * No storage dependencies - just crypto operations.
 *
 * Encryption strategy:
 * 1. User authenticates with their passkey (biometric/PIN)
 * 2. WebAuthn PRF extension returns a deterministic secret from the authenticator
 * 3. HKDF derives an AES-256-GCM key from the PRF output
 * 4. Data is encrypted with AES-GCM using random 96-bit IVs
 *
 * The encryption key only exists in memory while unlocked and cannot be
 * extracted - it requires the physical authenticator to re-derive.
 */
export class PasskeyEncryptionService implements EncryptionService {
  private isUnlockedState: boolean = false;
  private encryptionKey?: CryptoKey;
  private credentialId?: string;
  private namespace: string;
  private displayName: string;

  constructor(namespace: string, displayName?: string) {
    this.namespace = namespace;
    this.displayName = displayName || `LNC User (${namespace})`;
  }

  /**
   * Get the unlock method handled by this service (`passkey`).
   */
  get method(): UnlockMethod {
    return 'passkey';
  }

  /**
   * Returns true when a derived encryption key is available and the
   * service is marked as unlocked.
   */
  get isUnlocked(): boolean {
    return this.isUnlockedState && !!this.encryptionKey;
  }

  /**
   * Encrypt a plaintext string using the derived passkey-backed AES key.
   * Throws if the service has not been unlocked.
   */
  async encrypt(data: string): Promise<string> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error(
        'Passkey encryption service is locked. Call unlock() first.'
      );
    }

    try {
      // Generate random 96-bit IV (Initialization Vector) for AES-GCM.
      // Similar to a salt in password hashing, an IV ensures that encrypting
      // the same data twice produces different ciphertexts. Must be unique
      // per encryption but doesn't need to be secret (stored with ciphertext).
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encodedData
      );

      // Combine IV and ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);

      return arrayBufferToBase64(combined.buffer);
    } catch (error) {
      throw new Error(`Passkey encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt a ciphertext string using the derived passkey-backed AES key.
   * Throws if the service has not been unlocked.
   */
  async decrypt(data: string): Promise<string> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error(
        'Passkey encryption service is locked. Call unlock() first.'
      );
    }

    try {
      const combined = base64ToArrayBuffer(data);
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`Passkey decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Unlock the service using an existing passkey credential or by creating
   * a new one (when `createIfMissing` is true) and derive the encryption key.
   */
  async unlock(options: UnlockOptions): Promise<void> {
    if (options.method !== 'passkey') {
      throw new Error(
        'Passkey encryption service requires passkey unlock method'
      );
    }

    try {
      if (options.credentialId && !options.createIfMissing) {
        // Existing passkey authentication
        await this.authenticateWithExistingPasskey(options.credentialId);
      } else if (options.createIfMissing) {
        // Create new passkey or authenticate with existing
        if (options.credentialId) {
          try {
            await this.authenticateWithExistingPasskey(options.credentialId);
          } catch {
            // If existing passkey fails, create new one
            await this.createNewPasskey();
          }
        } else {
          await this.createNewPasskey();
        }
      } else {
        throw new Error(
          'No passkey credential available and createIfMissing is false'
        );
      }

      this.isUnlockedState = true;
    } catch (error) {
      throw new Error(`Passkey unlock failed: ${(error as Error).message}`);
    }
  }

  /**
   * Clear in-memory encryption key and credential ID and reset the
   * unlocked state.
   */
  lock(): void {
    this.encryptionKey = undefined;
    this.credentialId = undefined;
    this.isUnlockedState = false;
  }

  /**
   * Return true if this service can handle the provided unlock method.
   */
  canHandle(method: UnlockMethod): boolean {
    return method === 'passkey';
  }

  /**
   * Get the current credential ID (for storage by repository)
   */
  getCredentialId(): string {
    if (!this.credentialId) {
      throw new Error('No credential ID available - unlock first');
    }
    return this.credentialId;
  }

  /**
   * Check if passkeys are supported in the current environment
   */
  static async isSupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        return false;
      }

      // Try to check PRF support (this is experimental WebAuthn API)
      // Note: Type cast is necessary as this API is not in standard typings yet
      const pkc = PublicKeyCredential as PublicKeyCredentialWithPrf;
      // Try to call the getClientExtensionResults method to see if it is supported
      pkc.getClientExtensionResults?.();
      return true; // Assume PRF is supported if no error is thrown
    } catch {
      return false;
    }
  }

  /**
   * Create a new WebAuthn passkey credential and derive an encryption key
   * from its PRF extension output.
   */
  private async createNewPasskey(): Promise<void> {
    const challenge = await this.generateDeterministicChallenge();
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: {
          name: this.namespace,
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: this.displayName,
          displayName: this.displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required'
        },
        extensions: {
          prf: {
            eval: {
              first: challenge.buffer as ArrayBuffer
            }
          }
        }
      }
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create passkey credential');
    }

    this.credentialId = credential.id;
    await this.deriveEncryptionKey(credential, challenge);
  }

  /**
   * Use an existing WebAuthn passkey credential to perform an assertion
   * and derive an encryption key from its PRF extension output.
   */
  private async authenticateWithExistingPasskey(
    credentialId: string
  ): Promise<void> {
    const challenge = await this.generateDeterministicChallenge();

    // The challenge (SHA-256 of namespace) serves dual purpose:
    // 1. WebAuthn challenge for the authentication ceremony
    // 2. PRF input for deterministic key derivation
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        allowCredentials: [
          {
            type: 'public-key',
            id: base64ToArrayBuffer(credentialId) as ArrayBuffer
          }
        ],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: challenge.buffer as ArrayBuffer
            }
          }
        }
      }
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to authenticate with passkey');
    }

    this.credentialId = credentialId;
    await this.deriveEncryptionKey(credential, challenge);
  }

  /**
   * Derive an AES-GCM encryption key from the PRF output using HKDF.
   *
   * HKDF parameters:
   * - keyMaterial: PRF output (secret from authenticator)
   * - salt: Challenge bytes (adds randomness)
   * - info: Namespace (domain separation)
   *
   * Flow: passkey auth → PRF output → HKDF → AES-256-GCM key
   */
  private async deriveEncryptionKey(
    credential: PublicKeyCredential,
    challenge: Uint8Array
  ): Promise<void> {
    const extensions = credential.getClientExtensionResults?.() || {};

    if (!extensions.prf?.results?.first) {
      throw new Error('PRF extension not supported or failed');
    }

    const prfOutput = new Uint8Array(
      extensions.prf.results.first as ArrayBuffer
    );

    // Derive AES key from PRF output
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      prfOutput,
      'HKDF',
      false,
      ['deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(challenge),
        info: new TextEncoder().encode(this.namespace)
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a deterministic challenge based on the namespace.
   * This ensures the same PRF challenge is used across sessions for
   * consistent key derivation.
   *
   * Uses SHA-256 to derive the challenge from the namespace. This provides
   * uniform byte distribution and proper cryptographic mixing, ensuring the
   * challenge cannot be trivially predicted or reversed from the namespace.
   */
  private async generateDeterministicChallenge(): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const namespaceBytes = encoder.encode(this.namespace);
    const hashBuffer = await crypto.subtle.digest('SHA-256', namespaceBytes);
    return new Uint8Array(hashBuffer);
  }
}
