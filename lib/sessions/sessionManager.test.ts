import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import {
  CredentialsEncrypter,
  EncryptedCredentials
} from './crypto/CredentialsEncrypter';
import { KeyWrapper } from './crypto/KeyWrapper';
import { DeviceBinder } from './device/DeviceBinder';
import { OriginKeyData, OriginKeyManager } from './origin/OriginKeyManager';
import SessionManager from './sessionManager';
import { SessionCredentials, SessionData } from './types';

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

type SessionManagerInternals = {
  storage: {
    save: (sessionData: SessionData) => void;
    load: () => SessionData | undefined;
    clear: () => void;
  };
  encrypter: CredentialsEncrypter;
  keyWrapper: KeyWrapper;
  deviceBinder: DeviceBinder;
  originKeyManager: OriginKeyManager;
};

describe('SessionManager', () => {
  const namespace = 'test-session';
  const deviceFingerprint = 'device-fingerprint';
  const baseCredentials: SessionCredentials = {
    localKey: 'local',
    remoteKey: 'remote',
    pairingPhrase: 'pair',
    serverHost: 'server'
  };

  let manager: SessionManager;
  let internals: SessionManagerInternals;
  let credentialsKey: CryptoKey;
  let deviceKey: CryptoKey;
  let originKeyData: OriginKeyData;
  let encryptedCredentials: EncryptedCredentials;

  beforeEach(() => {
    manager = new SessionManager(namespace);
    internals = manager as unknown as SessionManagerInternals;

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    sessionStorage.clear();
    vi.clearAllMocks();

    credentialsKey = {} as CryptoKey;
    deviceKey = {} as CryptoKey;
    originKeyData = {
      originKey: {} as CryptoKey,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    encryptedCredentials = {
      credentialsKey,
      ciphertextB64: 'encrypted-payload',
      ivB64: 'credentials-iv'
    };

    vi.spyOn(internals.encrypter, 'encrypt').mockResolvedValue(
      encryptedCredentials
    );
    vi.spyOn(internals.encrypter, 'decrypt').mockResolvedValue(baseCredentials);
    vi.spyOn(internals.deviceBinder, 'generateFingerprint').mockResolvedValue(
      deviceFingerprint
    );
    vi.spyOn(internals.deviceBinder, 'deriveSessionKey').mockResolvedValue(
      deviceKey
    );
    vi.spyOn(internals.keyWrapper, 'wrapCredentialsKey').mockResolvedValue({
      deviceWrap: {
        keyB64: 'wrapped-device-key',
        ivB64: 'wrapped-device-iv'
      },
      originWrap: {
        keyB64: 'wrapped-origin-key',
        ivB64: 'wrapped-origin-iv'
      }
    });
    vi.spyOn(internals.keyWrapper, 'unwrapCredentialsKey').mockResolvedValue(
      credentialsKey
    );
    vi.spyOn(
      internals.originKeyManager,
      'getOrCreateOriginKey'
    ).mockResolvedValue(originKeyData);
    vi.spyOn(internals.originKeyManager, 'loadOriginKey').mockResolvedValue(
      originKeyData
    );
    vi.spyOn(internals.originKeyManager, 'isExpired').mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates and restores sessions', async () => {
    await manager.createSession(baseCredentials);

    const stored = sessionStorage.getItem(`lnc-session:${namespace}`);
    expect(stored).toBeTruthy();
    expect(stored).not.toContain('pairingPhrase');

    const restored = await manager.restoreSession();

    expect(restored).toEqual(baseCredentials);
    expect(internals.deviceBinder.generateFingerprint).toHaveBeenCalledTimes(2);
    expect(internals.deviceBinder.deriveSessionKey).toHaveBeenCalledTimes(2);
    expect(internals.keyWrapper.wrapCredentialsKey).toHaveBeenCalledWith(
      credentialsKey,
      deviceKey,
      originKeyData.originKey
    );
    expect(internals.keyWrapper.unwrapCredentialsKey).toHaveBeenCalledWith(
      {
        deviceWrap: {
          keyB64: 'wrapped-device-key',
          ivB64: 'wrapped-device-iv'
        },
        originWrap: {
          keyB64: 'wrapped-origin-key',
          ivB64: 'wrapped-origin-iv'
        }
      },
      deviceKey,
      originKeyData.originKey
    );
    expect(internals.encrypter.decrypt).toHaveBeenCalledWith({
      credentialsKey,
      ciphertextB64: 'encrypted-payload',
      ivB64: 'credentials-iv'
    });
  });

  it('throws when session creation fails', async () => {
    vi.spyOn(internals.storage, 'save').mockImplementation(() => {
      throw new Error('save failed');
    });

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'save failed'
    );
  });

  it('returns undefined when no session is stored', async () => {
    await expect(manager.restoreSession()).resolves.toBeUndefined();
  });

  it('uses crypto.randomUUID when available', async () => {
    const uuidSpy = vi.fn(() => 'uuid-123');
    const originalRandomUUID = crypto.randomUUID;

    Object.assign(crypto, { randomUUID: uuidSpy });

    await manager.createSession(baseCredentials);

    const stored = sessionStorage.getItem(`lnc-session:${namespace}`);
    expect(stored).toContain('uuid-123');
    expect(uuidSpy).toHaveBeenCalled();

    Object.assign(crypto, { randomUUID: originalRandomUUID });
  });

  it('returns undefined for expired sessions', async () => {
    await manager.createSession(baseCredentials);

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(manager.hasActiveSession).toBe(false);
  });

  it('returns undefined when the device fingerprint does not match', async () => {
    await manager.createSession(baseCredentials);

    // A different fingerprint produces a different device key, which causes
    // the AES-GCM unwrap to fail -- no explicit comparison needed.
    vi.mocked(internals.deviceBinder.generateFingerprint).mockResolvedValue(
      'other-device'
    );
    vi.mocked(internals.keyWrapper.unwrapCredentialsKey).mockRejectedValue(
      new Error('Device key unwrapping failed')
    );

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(manager.hasActiveSession).toBe(false);
  });

  it('returns undefined when origin key is missing', async () => {
    await manager.createSession(baseCredentials);
    vi.mocked(internals.originKeyManager.loadOriginKey).mockResolvedValue(
      undefined
    );

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(manager.hasActiveSession).toBe(false);
  });

  it('returns undefined when origin key is expired', async () => {
    await manager.createSession(baseCredentials);
    vi.mocked(internals.originKeyManager.isExpired).mockReturnValue(true);

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(manager.hasActiveSession).toBe(false);
  });

  it('refreshes sessions with re-encryption and re-wrapping', async () => {
    await manager.createSession(baseCredentials);

    const success = await manager.refreshSession();
    const remaining = manager.sessionTimeRemaining;

    expect(success).toBe(true);
    expect(remaining).toBeGreaterThan(0);
    expect(internals.encrypter.encrypt).toHaveBeenCalledTimes(2);
    expect(internals.keyWrapper.wrapCredentialsKey).toHaveBeenCalledTimes(2);
  });

  it('returns false when refreshing without a session', async () => {
    await expect(manager.refreshSession()).resolves.toBe(false);
  });

  it('returns false when refresh cannot restore session', async () => {
    await manager.createSession(baseCredentials);
    vi.spyOn(internals.originKeyManager, 'loadOriginKey').mockResolvedValue(
      undefined
    );

    await expect(manager.refreshSession()).resolves.toBe(false);
  });

  it('tracks active session status', async () => {
    expect(manager.hasActiveSession).toBe(false);

    await manager.createSession(baseCredentials);

    expect(manager.hasActiveSession).toBe(true);
  });

  it('reports session time remaining', async () => {
    expect(manager.sessionTimeRemaining).toBe(0);

    await manager.createSession(baseCredentials);

    const remaining = manager.sessionTimeRemaining;
    expect(remaining).toBeGreaterThan(0);
  });

  it('clears sessions', async () => {
    await manager.createSession(baseCredentials);

    manager.clearSession();

    expect(manager.hasActiveSession).toBe(false);
  });

  it('checks auto-restore availability', async () => {
    expect(manager.canAutoRestore).toBe(false);

    await manager.createSession(baseCredentials);

    expect(manager.canAutoRestore).toBe(true);
  });

  it('validates session availability', async () => {
    await manager.createSession(baseCredentials);

    await expect(manager.hasValidSession()).resolves.toBe(true);

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    await expect(manager.hasValidSession()).resolves.toBe(false);
  });

  it('clears invalid sessions when restore fails', async () => {
    await manager.createSession(baseCredentials);

    vi.spyOn(manager, 'restoreSession').mockRejectedValue(
      new Error('restore failed')
    );

    await expect(manager.hasValidSession()).resolves.toBe(false);
    expect(manager.hasActiveSession).toBe(false);
  });

  it('handles restore errors gracefully', async () => {
    vi.spyOn(internals.storage, 'load').mockImplementation(() => {
      throw new Error('load failed');
    });

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it('handles refresh errors gracefully', async () => {
    vi.spyOn(internals.storage, 'load').mockImplementation(() => {
      throw new Error('load failed');
    });

    await expect(manager.refreshSession()).resolves.toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('exposes the session namespace', () => {
    expect(manager.getNamespace()).toBe(namespace);
  });

  it('propagates fingerprint generation failure from createSession', async () => {
    vi.mocked(internals.deviceBinder.generateFingerprint).mockRejectedValue(
      new Error('fingerprint failed')
    );

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'fingerprint failed'
    );
  });

  it('propagates encryption failure from createSession', async () => {
    vi.mocked(internals.encrypter.encrypt).mockRejectedValue(
      new Error('encrypt failed')
    );

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'encrypt failed'
    );
  });

  it('propagates key wrapping failure from createSession', async () => {
    vi.mocked(internals.keyWrapper.wrapCredentialsKey).mockRejectedValue(
      new Error('wrap failed')
    );

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'wrap failed'
    );
  });

  it('propagates origin key creation failure from createSession', async () => {
    vi.mocked(
      internals.originKeyManager.getOrCreateOriginKey
    ).mockRejectedValue(new Error('origin key failed'));

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'origin key failed'
    );
  });

  it('returns undefined when key unwrap fails during restore', async () => {
    await manager.createSession(baseCredentials);
    vi.mocked(internals.keyWrapper.unwrapCredentialsKey).mockRejectedValue(
      new Error('unwrap failed')
    );

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it('returns undefined when session key derivation fails during restore', async () => {
    await manager.createSession(baseCredentials);
    vi.mocked(internals.deviceBinder.deriveSessionKey).mockRejectedValue(
      new Error('derive failed')
    );

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it('returns undefined when decrypt fails during restore', async () => {
    await manager.createSession(baseCredentials);
    vi.mocked(internals.encrypter.decrypt).mockRejectedValue(
      new Error('decrypt failed')
    );

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });
});
