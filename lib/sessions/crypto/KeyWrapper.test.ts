import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyWrapper, WrappedKeys } from './KeyWrapper';

describe('KeyWrapper', () => {
  const originalSubtle = globalThis.crypto.subtle;
  const mockCryptoService = {
    wrapWithDeviceKey: vi.fn(),
    wrapWithOriginKey: vi.fn(),
    unwrapWithDeviceKey: vi.fn(),
    unwrapWithOriginKey: vi.fn()
  };

  let keyWrapper: KeyWrapper;
  let credentialsKey: CryptoKey;
  let deviceKey: CryptoKey;
  let originKey: CryptoKey;

  const wrappedKeys: WrappedKeys = {
    deviceWrap: { keyB64: 'device-key', ivB64: 'device-iv' },
    originWrap: { keyB64: 'origin-key', ivB64: 'origin-iv' }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    credentialsKey = {} as CryptoKey;
    deviceKey = {} as CryptoKey;
    originKey = {} as CryptoKey;

    mockCryptoService.wrapWithDeviceKey.mockResolvedValue(
      wrappedKeys.deviceWrap
    );
    mockCryptoService.wrapWithOriginKey.mockResolvedValue(
      wrappedKeys.originWrap
    );
    mockCryptoService.unwrapWithDeviceKey.mockResolvedValue(credentialsKey);
    mockCryptoService.unwrapWithOriginKey.mockResolvedValue(credentialsKey);

    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: {
        encrypt: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer)
      },
      configurable: true
    });

    keyWrapper = new KeyWrapper(mockCryptoService as any);
  });

  afterEach(() => {
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: originalSubtle,
      configurable: true
    });
    vi.restoreAllMocks();
  });

  it('wraps the credentials key with both device and origin keys', async () => {
    const result = await keyWrapper.wrapCredentialsKey(
      credentialsKey,
      deviceKey,
      originKey
    );

    expect(result).toEqual(wrappedKeys);
    expect(mockCryptoService.wrapWithDeviceKey).toHaveBeenCalledWith(
      credentialsKey,
      deviceKey
    );
    expect(mockCryptoService.wrapWithOriginKey).toHaveBeenCalledWith(
      credentialsKey,
      originKey
    );
  });

  it('propagates wrapWithDeviceKey failures', async () => {
    mockCryptoService.wrapWithDeviceKey.mockRejectedValueOnce(
      new Error('device wrap failed')
    );

    await expect(
      keyWrapper.wrapCredentialsKey(credentialsKey, deviceKey, originKey)
    ).rejects.toThrow('device wrap failed');
  });

  it('propagates wrapWithOriginKey failures', async () => {
    mockCryptoService.wrapWithOriginKey.mockRejectedValueOnce(
      new Error('origin wrap failed')
    );

    await expect(
      keyWrapper.wrapCredentialsKey(credentialsKey, deviceKey, originKey)
    ).rejects.toThrow('origin wrap failed');
  });

  it('unwraps and verifies matching keys', async () => {
    const unwrapped = await keyWrapper.unwrapCredentialsKey(
      wrappedKeys,
      deviceKey,
      originKey
    );

    expect(unwrapped).toBe(credentialsKey);
    expect(mockCryptoService.unwrapWithDeviceKey).toHaveBeenCalledWith(
      deviceKey,
      'device-key',
      'device-iv'
    );
    expect(mockCryptoService.unwrapWithOriginKey).toHaveBeenCalledWith(
      originKey,
      'origin-key',
      'origin-iv'
    );
  });

  it('throws when unwrapped keys do not match', async () => {
    vi.mocked(globalThis.crypto.subtle.encrypt)
      .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
      .mockResolvedValueOnce(new Uint8Array([4, 5, 6]).buffer);

    await expect(
      keyWrapper.unwrapCredentialsKey(wrappedKeys, deviceKey, originKey)
    ).rejects.toThrow('Key unwrapping mismatch');
  });

  it('throws when key comparison encryption fails', async () => {
    vi.mocked(globalThis.crypto.subtle.encrypt).mockRejectedValueOnce(
      new Error('encrypt failed')
    );

    await expect(
      keyWrapper.unwrapCredentialsKey(wrappedKeys, deviceKey, originKey)
    ).rejects.toThrow('Key unwrapping mismatch');
  });

  it('propagates unwrap failures', async () => {
    mockCryptoService.unwrapWithDeviceKey.mockRejectedValueOnce(
      new Error('device unwrap failed')
    );

    await expect(
      keyWrapper.unwrapCredentialsKey(wrappedKeys, deviceKey, originKey)
    ).rejects.toThrow('device unwrap failed');
  });

  it('detects key mismatch when ciphertext lengths differ', async () => {
    vi.mocked(globalThis.crypto.subtle.encrypt)
      .mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer)
      .mockResolvedValueOnce(new Uint8Array([1, 2, 3, 4]).buffer);

    await expect(
      keyWrapper.unwrapCredentialsKey(wrappedKeys, deviceKey, originKey)
    ).rejects.toThrow('Key unwrapping mismatch');
  });
});
