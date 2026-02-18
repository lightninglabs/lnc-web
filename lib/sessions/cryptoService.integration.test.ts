import { webcrypto } from 'node:crypto';
import { describe, expect, it, beforeAll } from 'vitest';
import CryptoService from './cryptoService';

// Use real Web Crypto API from Node.js for integration testing.
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true
  });
});

describe('CryptoService (real crypto)', () => {
  const cryptoService = new CryptoService();

  it('round-trips encrypt/decrypt with a real key', async () => {
    const key = await cryptoService.generateRandomCredentialsKey();
    const plaintext = JSON.stringify({
      localKey: 'local-123',
      remoteKey: 'remote-456',
      pairingPhrase: 'pair-789',
      serverHost: 'host:443'
    });

    const { ciphertextB64, ivB64 } = await cryptoService.encryptCredentials(
      key,
      plaintext
    );

    const decrypted = await cryptoService.decryptCredentials(
      key,
      ciphertextB64,
      ivB64
    );

    expect(decrypted).toBe(plaintext);
  });

  it('round-trips wrap/unwrap with a real origin key', async () => {
    const credentialsKey = await cryptoService.generateRandomCredentialsKey();

    // Origin key: non-extractable, wrapKey/unwrapKey usage.
    const originKey = (await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    )) as CryptoKey;

    const { keyB64, ivB64 } = await cryptoService.wrapWithOriginKey(
      credentialsKey,
      originKey
    );

    const unwrapped = await cryptoService.unwrapWithOriginKey(
      originKey,
      keyB64,
      ivB64
    );

    // Verify the unwrapped key can decrypt data encrypted by the original.
    const plaintext = 'round-trip-test-payload';
    const encrypted = await cryptoService.encryptCredentials(
      credentialsKey,
      plaintext
    );
    const decrypted = await cryptoService.decryptCredentials(
      unwrapped,
      encrypted.ciphertextB64,
      encrypted.ivB64
    );

    expect(decrypted).toBe(plaintext);
  });

  it('round-trips wrap/unwrap with a real device key', async () => {
    const credentialsKey = await cryptoService.generateRandomCredentialsKey();

    // Device key: non-extractable, wrapKey/unwrapKey usage.
    const deviceKey = (await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    )) as CryptoKey;

    const { keyB64, ivB64 } = await cryptoService.wrapWithDeviceKey(
      credentialsKey,
      deviceKey
    );

    const unwrapped = await cryptoService.unwrapWithDeviceKey(
      deviceKey,
      keyB64,
      ivB64
    );

    // Verify the unwrapped key can decrypt data encrypted by the original.
    const plaintext = 'device-key-round-trip';
    const encrypted = await cryptoService.encryptCredentials(
      credentialsKey,
      plaintext
    );
    const decrypted = await cryptoService.decryptCredentials(
      unwrapped,
      encrypted.ciphertextB64,
      encrypted.ivB64
    );

    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext', async () => {
    const key = await cryptoService.generateRandomCredentialsKey();
    const plaintext = 'same-data';

    const first = await cryptoService.encryptCredentials(key, plaintext);
    const second = await cryptoService.encryptCredentials(key, plaintext);

    // Different random IVs should produce different ciphertexts.
    expect(first.ciphertextB64).not.toBe(second.ciphertextB64);
  });

  it('fails to decrypt with the wrong key', async () => {
    const key1 = await cryptoService.generateRandomCredentialsKey();
    const key2 = await cryptoService.generateRandomCredentialsKey();

    const { ciphertextB64, ivB64 } = await cryptoService.encryptCredentials(
      key1,
      'secret'
    );

    await expect(
      cryptoService.decryptCredentials(key2, ciphertextB64, ivB64)
    ).rejects.toThrow('Credential decryption failed');
  });
});
