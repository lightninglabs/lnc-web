import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceBinder } from './DeviceBinder';

describe('DeviceBinder', () => {
  let binder: DeviceBinder;
  const hadScreen = 'screen' in globalThis;
  const hadDocument = 'document' in globalThis;
  const originalScreen = globalThis.screen;
  const originalDocument = (globalThis as Record<string, unknown>).document;
  const originalDateTimeFormat = Intl.DateTimeFormat;

  const mockCanvasContext = {
    textBaseline: '',
    font: '',
    fillText: vi.fn()
  };

  const mockCanvas = {
    getContext: vi.fn(() => mockCanvasContext),
    toDataURL: vi.fn(() => 'data:image/png;base64,canvas-data')
  };

  beforeEach(() => {
    binder = new DeviceBinder();
    vi.clearAllMocks();

    Object.defineProperty(globalThis, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        colorDepth: 24
      },
      configurable: true
    });

    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    } as Intl.DateTimeFormat);

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: vi.fn((tagName: string) => {
          if (tagName !== 'canvas') {
            throw new Error(`Unexpected element: ${tagName}`);
          }

          return mockCanvas;
        })
      },
      configurable: true
    });

    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        importKey: vi.fn().mockResolvedValue({} as CryptoKey),
        deriveKey: vi.fn().mockResolvedValue({} as CryptoKey)
      },
      configurable: true
    });
  });

  afterEach(() => {
    if (hadScreen) {
      Object.defineProperty(globalThis, 'screen', {
        value: originalScreen,
        configurable: true
      });
    } else {
      delete (globalThis as Record<string, unknown>).screen;
    }

    if (hadDocument) {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        configurable: true
      });
    } else {
      delete (globalThis as Record<string, unknown>).document;
    }

    Object.defineProperty(Intl, 'DateTimeFormat', {
      value: originalDateTimeFormat,
      configurable: true
    });
    vi.restoreAllMocks();
  });

  it('generates a fingerprint from screen, timezone, and canvas data', async () => {
    const fingerprint = await binder.generateFingerprint();

    expect(fingerprint.length).toBe(64);
    expect(globalThis.document.createElement).toHaveBeenCalledWith('canvas');
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
      'Device fingerprint test',
      2,
      2
    );
    expect(globalThis.crypto.subtle.digest).toHaveBeenCalledTimes(2);
  });

  it('produces the same fingerprint for the same environment', async () => {
    const first = await binder.generateFingerprint();
    const second = await binder.generateFingerprint();

    expect(first).toBe(second);
  });

  it('throws when the canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null as any);

    await expect(binder.generateFingerprint()).rejects.toThrow(
      'Canvas fingerprinting required for session security'
    );
  });

  it('throws when screen is unavailable', async () => {
    Object.defineProperty(globalThis, 'screen', {
      value: undefined,
      configurable: true
    });

    await expect(binder.generateFingerprint()).rejects.toThrow(
      'Device fingerprinting requires a browser environment with screen access'
    );
  });

  it('throws when canvas data extraction fails', async () => {
    mockCanvas.toDataURL.mockImplementationOnce(() => {
      throw new Error('toDataURL failed');
    });

    await expect(binder.generateFingerprint()).rejects.toThrow(
      'Canvas fingerprinting required for session security'
    );
  });

  it('propagates digest failures from the final fingerprint hash', async () => {
    vi.mocked(globalThis.crypto.subtle.digest)
      .mockResolvedValueOnce(new ArrayBuffer(32))
      .mockRejectedValueOnce(new Error('digest failed'));

    await expect(binder.generateFingerprint()).rejects.toThrow('digest failed');
  });

  it('derives a session key from fingerprint and session id', async () => {
    const derivedKey = {} as CryptoKey;
    vi.mocked(globalThis.crypto.subtle.importKey).mockResolvedValueOnce(
      {} as CryptoKey
    );
    vi.mocked(globalThis.crypto.subtle.deriveKey).mockResolvedValueOnce(
      derivedKey
    );

    const result = await binder.deriveSessionKey('fingerprint', 'session-id');

    expect(result).toBe(derivedKey);
    expect(globalThis.crypto.subtle.importKey).toHaveBeenCalledWith(
      'raw',
      new TextEncoder().encode('fingerprint'),
      'HKDF',
      false,
      ['deriveKey']
    );
    expect(globalThis.crypto.subtle.deriveKey).toHaveBeenCalledWith(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode('session-id'),
        info: new TextEncoder().encode('lnc-session-device-key')
      },
      expect.anything(),
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );
  });

  it('propagates importKey failures', async () => {
    vi.mocked(globalThis.crypto.subtle.importKey).mockRejectedValueOnce(
      new Error('import failed')
    );

    await expect(
      binder.deriveSessionKey('fingerprint', 'session-id')
    ).rejects.toThrow('import failed');
  });

  it('propagates deriveKey failures', async () => {
    vi.mocked(globalThis.crypto.subtle.deriveKey).mockRejectedValueOnce(
      new Error('derive failed')
    );

    await expect(
      binder.deriveSessionKey('fingerprint', 'session-id')
    ).rejects.toThrow('derive failed');
  });
});
