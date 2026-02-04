import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../../util/log';
import { SessionData } from '../types';
import { SessionStorage } from './sessionStorage';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock log methods to avoid noise in tests
vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

// Test data factory
const createTestSessionData = (): SessionData => ({
  sessionId: 'test-session-id',
  deviceFingerprint: 'test-fingerprint',
  createdAt: Date.now(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
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
});

const sampleSession: SessionData = {
  sessionId: 'session-123',
  deviceFingerprint: 'test-fingerprint',
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

describe('SessionStorage', () => {
  let storage: SessionStorage;
  const namespace = 'test-namespace';

  beforeEach(() => {
    storage = new SessionStorage(namespace);
    vi.clearAllMocks();
    // Reset mock implementations to default
    mockSessionStorage.getItem.mockImplementation(() => null);
    mockSessionStorage.setItem.mockImplementation(() => {});
    mockSessionStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('saves and loads session data', () => {
    // Wire setItem/getItem so save feeds into load
    let stored: string | null = null;
    mockSessionStorage.setItem.mockImplementation(
      (_key: string, value: string) => {
        stored = value;
      }
    );
    mockSessionStorage.getItem.mockImplementation(() => stored);

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

  describe('Constructor', () => {
    it('should create instance with namespace', () => {
      const testNamespace = 'test-namespace';
      const storage = new SessionStorage(testNamespace);

      expect(storage).toBeInstanceOf(SessionStorage);
    });
  });

  describe('save()', () => {
    it('should save session data to sessionStorage with correct key', () => {
      const sessionData = createTestSessionData();

      storage.save(sessionData);

      const expectedKey = 'lnc-session:test-namespace';
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        expectedKey,
        JSON.stringify(sessionData)
      );
    });

    it('should log session save operation', () => {
      const sessionData = createTestSessionData();
      const spy = vi.spyOn(log, 'info');

      storage.save(sessionData);

      expect(spy).toHaveBeenCalledWith(
        '[SessionStorage] Session saved to sessionStorage',
        {
          namespace,
          sessionId: sessionData.sessionId,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          refreshCount: sessionData.refreshCount
        }
      );
    });

    it('should handle different namespaces correctly', () => {
      const differentNamespace = 'different-namespace';
      const differentStorage = new SessionStorage(differentNamespace);
      const sessionData = createTestSessionData();

      differentStorage.save(sessionData);

      const expectedKey = 'lnc-session:different-namespace';
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        expectedKey,
        JSON.stringify(sessionData)
      );
    });
  });

  describe('load()', () => {
    it('should return undefined when no data exists in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = storage.load();

      expect(result).toBeUndefined();
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
        'lnc-session:test-namespace'
      );
    });

    it('should return undefined when sessionStorage returns empty string', () => {
      mockSessionStorage.getItem.mockReturnValue('');

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when sessionStorage returns undefined', () => {
      mockSessionStorage.getItem.mockReturnValue(undefined);

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should load and return valid session data', () => {
      const sessionData = createTestSessionData();
      const storedJson = JSON.stringify(sessionData);
      mockSessionStorage.getItem.mockReturnValue(storedJson);

      const result = storage.load();

      expect(result).toEqual(sessionData);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
        'lnc-session:test-namespace'
      );
    });

    it('should log session load operation for valid data', () => {
      const sessionData = createTestSessionData();
      const storedJson = JSON.stringify(sessionData);
      mockSessionStorage.getItem.mockReturnValue(storedJson);
      const spy = vi.spyOn(log, 'info');

      storage.load();

      expect(spy).toHaveBeenCalledWith(
        '[SessionStorage] Session loaded from sessionStorage',
        {
          namespace,
          sessionId: sessionData.sessionId,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          refreshCount: sessionData.refreshCount
        }
      );
    });

    it('should return undefined when sessionId is missing', () => {
      const invalidData = { ...createTestSessionData() };
      delete (invalidData as any).sessionId;
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when deviceFingerprint is missing', () => {
      const invalidData = { ...createTestSessionData() };
      delete (invalidData as any).deviceFingerprint;
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when device wrapped key is invalid', () => {
      const invalidData = { ...createTestSessionData(), device: null };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when origin wrapped key is invalid', () => {
      const invalidData = {
        ...createTestSessionData(),
        origin: 'not-an-object'
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when encryptedCredentials is missing', () => {
      const invalidData = { ...createTestSessionData() };
      delete (invalidData as any).encryptedCredentials;
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should return undefined when JSON parsing fails', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json {');

      const result = storage.load();

      expect(result).toBeUndefined();
    });

    it('should handle sessionStorage getItem throwing an error', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('sessionStorage error');
      });

      const result = storage.load();

      expect(result).toBeUndefined();
    });
  });

  describe('clear()', () => {
    it('should remove data from sessionStorage with correct key', () => {
      storage.clear();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'lnc-session:test-namespace'
      );
    });

    it('should handle different namespaces correctly', () => {
      const differentNamespace = 'different-namespace';
      const differentStorage = new SessionStorage(differentNamespace);

      differentStorage.clear();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'lnc-session:different-namespace'
      );
    });

    it('should handle sessionStorage removeItem throwing an error', () => {
      const error = new Error('sessionStorage error');
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw error;
      });
      const spy = vi.spyOn(log, 'error');

      // Should not throw - error is caught and logged
      expect(() => storage.clear()).not.toThrow();
      expect(spy).toHaveBeenCalledWith(
        '[SessionStorage] Failed to clear session data',
        { namespace, error }
      );
    });
  });

  describe('hasData()', () => {
    it('should return true when data exists in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('some-data');

      const result = storage.hasData();

      expect(result).toBe(true);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(
        'lnc-session:test-namespace'
      );
    });

    it('should return false when no data exists in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = storage.hasData();

      expect(result).toBe(false);
    });

    it('should return false when sessionStorage returns empty string', () => {
      mockSessionStorage.getItem.mockReturnValue('');

      const result = storage.hasData();

      expect(result).toBe(true); // Empty string is not null
    });

    it('should return false when sessionStorage returns undefined', () => {
      mockSessionStorage.getItem.mockReturnValue(undefined);

      const result = storage.hasData();

      expect(result).toBe(true); // undefined is not null
    });

    it('should handle sessionStorage getItem throwing an error', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('sessionStorage error');
      });

      // Should not throw - error is caught and returns false
      expect(storage.hasData()).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should save and load data correctly', () => {
      const sessionData = createTestSessionData();

      // Save data
      storage.save(sessionData);

      // Mock the getItem to return the saved data
      const savedJson = JSON.stringify(sessionData);
      mockSessionStorage.getItem.mockReturnValue(savedJson);

      // Load data
      const loadedData = storage.load();

      expect(loadedData).toEqual(sessionData);
    });

    it('should save, check hasData, load, and clear correctly', () => {
      const sessionData = createTestSessionData();

      // Initially no data
      mockSessionStorage.getItem.mockReturnValue(null);
      expect(storage.hasData()).toBe(false);

      // Save data
      storage.save(sessionData);

      // Now has data
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(sessionData));
      expect(storage.hasData()).toBe(true);

      // Load data
      const loadedData = storage.load();
      expect(loadedData).toEqual(sessionData);

      // Clear data
      storage.clear();

      // No longer has data
      mockSessionStorage.getItem.mockReturnValue(null);
      expect(storage.hasData()).toBe(false);
    });
  });

  it('handles error when save fails', () => {
    const error = new Error('storage error');
    vi.spyOn(globalThis.sessionStorage, 'setItem').mockImplementationOnce(
      () => {
        throw error;
      }
    );

    storage.save(sampleSession);

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
