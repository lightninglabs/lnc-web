import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../../util/log';
import { SessionData } from '../types';
import { SessionStorage } from './sessionStorage';

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionStorage', () => {
  const namespace = 'test-namespace';
  let storage: SessionStorage;

  const sampleSession: SessionData = {
    sessionId: 'session-123',
    createdAt: 1000,
    expiresAt: 2000,
    refreshCount: 0,
    encryptedCredentials: 'encrypted-credentials',
    credentialsIV: 'credentials-iv',
    device: {
      keyB64: 'device-key-b64',
      ivB64: 'device-iv-b64'
    },
    origin: {
      keyB64: 'origin-key-b64',
      ivB64: 'origin-iv-b64'
    }
  };

  beforeEach(() => {
    storage = new SessionStorage(namespace);
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('saves and loads session data', () => {
    storage.save(sampleSession);

    const loaded = storage.load();

    const details = {
      namespace,
      sessionId: sampleSession.sessionId,
      createdAt: sampleSession.createdAt,
      expiresAt: sampleSession.expiresAt,
      refreshCount: sampleSession.refreshCount
    };

    expect(loaded).toEqual(sampleSession);
    expect(log.info).toHaveBeenCalledWith(
      '[SessionStorage] Session saved to sessionStorage',
      details
    );
    expect(log.info).toHaveBeenCalledWith(
      '[SessionStorage] Session loaded from sessionStorage',
      details
    );
  });

  it('returns undefined when no session data exists', () => {
    const loaded = storage.load();

    expect(loaded).toBeUndefined();
  });

  it('returns undefined when session data is invalid', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(storageKey, JSON.stringify({ invalid: true }));

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when encrypted credentials are missing', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        sessionId: 'session-123',
        createdAt: 1000,
        expiresAt: 2000,
        refreshCount: 0,
        credentialsIV: 'credentials-iv',
        device: {
          keyB64: 'device-key-b64',
          ivB64: 'device-iv-b64'
        },
        origin: {
          keyB64: 'origin-key-b64',
          ivB64: 'origin-iv-b64'
        }
      })
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when wrapped origin key is invalid', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        sessionId: 'session-123',
        createdAt: 1000,
        expiresAt: 2000,
        refreshCount: 0,
        encryptedCredentials: 'encrypted-credentials',
        credentialsIV: 'credentials-iv',
        device: {
          keyB64: 'device-key-b64',
          ivB64: 'device-iv-b64'
        },
        origin: {
          keyB64: 'origin-key-b64'
        }
      })
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when wrapped origin key is null', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        sessionId: 'session-123',
        createdAt: 1000,
        expiresAt: 2000,
        refreshCount: 0,
        encryptedCredentials: 'encrypted-credentials',
        credentialsIV: 'credentials-iv',
        device: {
          keyB64: 'device-key-b64',
          ivB64: 'device-iv-b64'
        },
        origin: null
      })
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when stored data cannot be parsed', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(storageKey, '{not-json');

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when wrapped device key is invalid', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        sessionId: 'session-123',
        createdAt: 1000,
        expiresAt: 2000,
        refreshCount: 0,
        encryptedCredentials: 'encrypted-credentials',
        credentialsIV: 'credentials-iv',
        device: {
          keyB64: 'device-key-b64'
        },
        origin: {
          keyB64: 'origin-key-b64',
          ivB64: 'origin-iv-b64'
        }
      })
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when wrapped device key is null', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        sessionId: 'session-123',
        createdAt: 1000,
        expiresAt: 2000,
        refreshCount: 0,
        encryptedCredentials: 'encrypted-credentials',
        credentialsIV: 'credentials-iv',
        device: null,
        origin: {
          keyB64: 'origin-key-b64',
          ivB64: 'origin-iv-b64'
        }
      })
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(storage.hasData()).toBe(false);
  });

  it('clears session data', () => {
    storage.save(sampleSession);
    storage.clear();

    expect(storage.load()).toBeUndefined();
    expect(storage.hasData()).toBe(false);
  });

  it('reports when session data exists', () => {
    expect(storage.hasData()).toBe(false);

    storage.save(sampleSession);

    expect(storage.hasData()).toBe(true);
  });

  it('throws and logs when save fails', () => {
    const error = new Error('storage error');
    vi.spyOn(globalThis.sessionStorage, 'setItem').mockImplementationOnce(
      () => {
        throw error;
      }
    );

    expect(() => storage.save(sampleSession)).toThrow('storage error');

    expect(log.error).toHaveBeenCalledWith(
      '[SessionStorage] Failed to save session data',
      { namespace, error }
    );
  });

  it('handles error when clear fails', () => {
    const error = new Error('storage error');
    vi.spyOn(globalThis.sessionStorage, 'removeItem').mockImplementationOnce(
      () => {
        throw error;
      }
    );

    storage.clear();

    expect(log.error).toHaveBeenCalledWith(
      '[SessionStorage] Failed to clear session data',
      { namespace, error }
    );
  });

  it('returns false when hasData throws', () => {
    vi.spyOn(globalThis.sessionStorage, 'getItem').mockImplementationOnce(
      () => {
        throw new Error('storage error');
      }
    );

    expect(storage.hasData()).toBe(false);
  });

  it('returns undefined when parse fails and cleanup also fails', () => {
    const storageKey = `lnc-session:${namespace}`;
    sessionStorage.setItem(storageKey, '{not-json');

    vi.spyOn(globalThis.sessionStorage, 'removeItem').mockImplementationOnce(
      () => {
        throw new Error('removeItem error');
      }
    );

    const loaded = storage.load();

    expect(loaded).toBeUndefined();
    expect(log.error).toHaveBeenCalledWith(
      '[SessionStorage] Failed to load session data',
      expect.objectContaining({ namespace })
    );
  });

  describe('when sessionStorage is undefined', () => {
    let original: Storage;

    beforeEach(() => {
      original = globalThis.sessionStorage;
      delete (globalThis as Record<string, unknown>).sessionStorage;
    });

    afterEach(() => {
      globalThis.sessionStorage = original;
    });

    it('save is a no-op', () => {
      expect(() => storage.save(sampleSession)).not.toThrow();
    });

    it('load returns undefined', () => {
      expect(storage.load()).toBeUndefined();
    });

    it('clear is a no-op', () => {
      expect(() => storage.clear()).not.toThrow();
    });

    it('hasData returns false', () => {
      expect(storage.hasData()).toBe(false);
    });
  });
});
